using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using SkiaSharp;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls(Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://127.0.0.1:8001");
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 11 * 1024 * 1024);
// Keep form data in memory; no temporary image files.
builder.Services.Configure<FormOptions>(o => { o.MultipartBodyLengthLimit = 11 * 1024 * 1024; o.MemoryBufferThreshold = 11 * 1024 * 1024; o.ValueCountLimit = 5; });
builder.Services.AddRateLimiter(o => { o.RejectionStatusCode = 429; o.AddConcurrencyLimiter("images", x => { x.PermitLimit = 2; x.QueueLimit = 0; x.QueueProcessingOrder = QueueProcessingOrder.OldestFirst; }); });
builder.Services.AddSingleton<DefectModel>();
var app = builder.Build(); app.UseRateLimiter();
app.Use(async (ctx, next) => { ctx.Response.Headers.CacheControl = "no-store"; ctx.Response.Headers.XContentTypeOptions = "nosniff"; try { await next(); } catch (BadHttpRequestException e) { ctx.Response.StatusCode = e.StatusCode; await ctx.Response.WriteAsJsonAsync(new { error = "Request is too large or invalid." }); } catch (InvalidDataException) { ctx.Response.StatusCode = 400; await ctx.Response.WriteAsJsonAsync(new { error = "Invalid multipart image upload." }); } });
app.MapGet("/api/health", () => Results.Ok(new { status = "ok", service = "visual-inspection-desk" }));
app.MapPost("/api/inspection/quality", async (HttpRequest request, DefectModel model) =>
{
    if (!request.HasFormContentType) return Results.BadRequest(new { error = "Upload a multipart form with an image field." });
    var form = await request.ReadFormAsync(); var file = form.Files.GetFile("image");
    if (file is null || file.Length == 0 || file.Length > 10 * 1024 * 1024 || form.Files.Count != 1) return Results.BadRequest(new { error = "Upload one image up to 10 MB." });
    using var stream = new MemoryStream(); await file.CopyToAsync(stream); stream.Position = 0;
    using var codec = SKCodec.Create(stream); if (codec is null || !(codec.EncodedFormat is SKEncodedImageFormat.Jpeg or SKEncodedImageFormat.Png or SKEncodedImageFormat.Webp)) return Results.BadRequest(new { error = "The file must be a valid JPEG, PNG or WebP image." });
    var info = codec.Info;
    if (info.Width < 3 || info.Height < 3 || (long)info.Width * info.Height > 20_000_000 || info.Width > 12000 || info.Height > 12000) return Results.BadRequest(new { error = "Choose an image between 3 and 12000 pixels per side and under 20 megapixels." });
    using var bitmap = new SKBitmap(info.Width, info.Height, SKColorType.Rgba8888, SKAlphaType.Opaque);
    var decoded = codec.GetPixels(bitmap.Info, bitmap.GetPixels()); if (decoded != SKCodecResult.Success) return Results.BadRequest(new { error = "The image is incomplete or corrupt." });
    double scale = Math.Min(1.0, 512.0 / Math.Max(info.Width, info.Height)); int w = Math.Max(3, (int)(info.Width * scale)), h = Math.Max(3, (int)(info.Height * scale));
    using var small = bitmap.Resize(new SKImageInfo(w, h), new SKSamplingOptions(SKFilterMode.Linear)); if (small is null) return Results.BadRequest(new { error = "The image could not be resized." });
    byte[] rgb = new byte[w * h * 3]; for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) { var color = small.GetPixel(x, y); int i = (y * w + x) * 3; rgb[i] = color.Red; rgb[i + 1] = color.Green; rgb[i + 2] = color.Blue; }
    QualityMetrics metrics;
    try { if (NativeQuality.Measure(rgb, w, h, rgb.Length, out metrics) != 0) return Results.Problem("Image measurement failed.", statusCode: 503); }
    catch (DllNotFoundException) { return Results.Json(new { error = "The native image engine is not installed. Build the C++ library first." }, statusCode: 503); }
    bool resolution = info.Width >= 640 && info.Height >= 480, exposure = metrics.Brightness >= .15 && metrics.Brightness <= .9, detail = metrics.Sharpness >= 35;
    var checks = new[] { new { label = "Resolution", passed = resolution, detail = $"{info.Width} Ã— {info.Height} pixels. Suggested minimum is 640 Ã— 480." }, new { label = "Exposure", passed = exposure, detail = $"Mean luminance {metrics.Brightness:P0}. Suggested range is 15% to 90%." }, new { label = "Edge detail", passed = detail, detail = $"Laplacian variance {metrics.Sharpness:F1} at up to 512 pixels. Low texture can also produce a low value." } };
    var prediction = model.Predict(bitmap, resolution && exposure && detail, codec.EncodedOrigin == SKEncodedOrigin.TopLeft);
    return Results.Ok(new { width = info.Width, height = info.Height, brightness = metrics.Brightness, sharpness = metrics.Sharpness, checks, prediction, disclaimer = "Image readiness heuristics are not defect detection. A human must review the photograph and any model suggestion." });
}).RequireRateLimiting("images").DisableAntiforgery();
app.Run();

[StructLayout(LayoutKind.Sequential)] public struct QualityMetrics { public double Brightness; public double Sharpness; }
public static class NativeQuality { [DllImport("image_quality", EntryPoint = "image_quality", CallingConvention = CallingConvention.Cdecl)] public static extern int Measure(byte[] rgb, int width, int height, int length, out QualityMetrics result); }
public sealed class DefectModel : IDisposable
{
    private readonly InferenceSession? session; private readonly string[] labels = []; private readonly double threshold = .8; private readonly string status = "unavailable";
    public DefectModel(ILogger<DefectModel> logger)
    {
        string? path = Environment.GetEnvironmentVariable("DEFECT_MODEL_PATH"); if (string.IsNullOrWhiteSpace(path)) return;
        try
        {
            using var manifest = JsonDocument.Parse(File.ReadAllText(Path.ChangeExtension(path, "json"))); var root = manifest.RootElement;
            string hash = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(path))).ToLowerInvariant();
            if (!root.GetProperty("validated").GetBoolean() || root.GetProperty("sha256").GetString() != hash || root.GetProperty("input_size").GetInt32() != 224) throw new InvalidDataException("Unvalidated model");
            labels = root.GetProperty("labels").EnumerateArray().Select(x => x.GetString()!).ToArray(); threshold = root.GetProperty("threshold").GetDouble();
            if (labels.Length != 2 || labels[0] != "damaged" || labels[1] != "intact" || threshold < .8 || threshold > 1) throw new InvalidDataException("Invalid model contract");
            using var options = new Microsoft.ML.OnnxRuntime.SessionOptions { IntraOpNumThreads = 1, InterOpNumThreads = 1 }; session = new InferenceSession(path, options); status = "ready";
        }
        catch (Exception e) { status = "invalid"; logger.LogWarning("Defect model disabled: {Reason}", e.GetType().Name); }
    }
    public object Predict(SKBitmap image, bool qualityReady, bool upright)
    {
        if (session is null) return new { status, detail = "No validated defect model is loaded. Record your own observations." };
        if (!upright) return new { status = "abstained", detail = "Rotate the image upright and export it without an orientation tag before model review." };
        if (!qualityReady) return new { status = "abstained", detail = "Image readiness checks need attention before model review." };
        try
        {
            using var resized = image.Resize(new SKImageInfo(224, 224), new SKSamplingOptions(SKFilterMode.Linear)); if (resized is null) throw new InvalidDataException();
            var tensor = new DenseTensor<float>(new[] { 1, 3, 224, 224 }); for (int y = 0; y < 224; y++) for (int x = 0; x < 224; x++) { var c = resized.GetPixel(x, y); tensor[0, 0, y, x] = c.Red / 255f; tensor[0, 1, y, x] = c.Green / 255f; tensor[0, 2, y, x] = c.Blue / 255f; }
            using var result = session.Run(new[] { NamedOnnxValue.CreateFromTensor("image", tensor) }); float[] logits = result.First().AsEnumerable<float>().ToArray(); if (logits.Length != 2 || logits.Any(x => !float.IsFinite(x))) throw new InvalidDataException();
            double max = logits.Max(); double[] scores = logits.Select(x => Math.Exp(x - max)).ToArray(); double total = scores.Sum(); int index = scores[0] >= scores[1] ? 0 : 1; double score = scores[index] / total;
            if (score < threshold) return new { status = "abstained", detail = "Model score is below the configured review threshold." };
            return new { status = "suggestion", label = labels[index], score, detail = "Model suggestion only. Softmax score is not a calibrated probability. Human review is required." };
        }
        catch { return new { status = "unavailable", detail = "Model inference failed. Continue with human review." }; }
    }
    public void Dispose() => session?.Dispose();
}
