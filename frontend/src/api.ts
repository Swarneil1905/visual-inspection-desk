export async function api<T>(path: string, data?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (data instanceof FormData) {
    body = data;
  } else if (data !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  }
  const csrf = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrftoken="))
    ?.split("=")[1];
  if (csrf) headers["X-CSRFToken"] = csrf;
  const response = await fetch("/api/" + path, {
    method: data === undefined ? "GET" : "POST",
    headers,
    body,
    credentials: "same-origin",
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The API returned an invalid response. Check that the local backend is running.",
    );
  }
  if (!response.ok)
    throw new Error(result.error || "The request could not be completed.");
  return result as T;
}
