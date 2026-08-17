"""Train an original small CNN. Requires consented, representative product photographs.
No pretrained weights or synthetic quality scores are used.
Data layout: data/{train,validation,test}/{damaged,intact}/*.jpg
Splits must be disjoint by physical item, not just by photograph.
"""

import argparse, json, hashlib, random
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps
import torch
from torch import nn
from torch.utils.data import Dataset, DataLoader

LABELS = ["damaged", "intact"]


class Images(Dataset):
    def __init__(self, root):
        self.samples = [
            (p, i)
            for i, label in enumerate(LABELS)
            for p in sorted((Path(root) / label).glob("*"))
            if p.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp"]
        ]
        if not self.samples:
            raise ValueError(f"No labeled images in {root}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):
        path, label = self.samples[index]
        with Image.open(path) as image:
            image = (
                ImageOps.exif_transpose(image)
                .convert("RGB")
                .resize((224, 224), Image.Resampling.BILINEAR)
            )
            tensor = torch.from_numpy(
                np.array(image, dtype=np.float32).transpose(2, 0, 1).copy() / 255
            )
        return tensor, label


class DefectNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Conv2d(3, 16, 3, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(16, 32, 3, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 64, 3, stride=2, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(64, 2),
        )

    def forward(self, x):
        return self.layers(x)


def verify_disjoint(datasets):
    seen = set()
    for dataset in datasets:
        current = set()
        for path, _ in dataset.samples:
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            if digest in seen:
                raise ValueError("Identical image bytes appear across data splits")
            current.add(digest)
        seen.update(current)


def metrics(model, loader, threshold=0.8):
    matrix = np.zeros((2, 2), dtype=int)
    accepted = np.zeros((2, 2), dtype=int)
    model.eval()
    with torch.no_grad():
        for images, labels in loader:
            probabilities = model(images).softmax(1)
            scores, predictions = probabilities.max(1)
            for truth, pred, score in zip(
                labels.tolist(), predictions.tolist(), scores.tolist()
            ):
                matrix[truth, pred] += 1
                if score >= threshold:
                    accepted[truth, pred] += 1
    precision = [float(accepted[i, i] / max(1, accepted[:, i].sum())) for i in range(2)]
    return {
        "confusion_matrix": matrix.tolist(),
        "accepted_confusion_matrix": accepted.tolist(),
        "precision_at_threshold": precision,
        "support": matrix.sum(1).tolist(),
        "coverage": float(accepted.sum() / max(1, matrix.sum())),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("models"))
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    if not 1 <= args.epochs <= 200:
        parser.error("epochs must be 1 to 200")
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    torch.set_num_threads(2)
    datasets = [Images(args.data / split) for split in ["train", "validation", "test"]]
    verify_disjoint(datasets)
    for ds in datasets:
        if set(label for _, label in ds.samples) != {0, 1}:
            raise ValueError("Each split needs both classes")
    loaders = [
        DataLoader(ds, batch_size=16, shuffle=i == 0) for i, ds in enumerate(datasets)
    ]
    model = DefectNet()
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.001)
    best = -1
    state = None
    for epoch in range(args.epochs):
        model.train()
        for images, labels in loaders[0]:
            optimizer.zero_grad()
            loss = nn.functional.cross_entropy(model(images), labels)
            loss.backward()
            optimizer.step()
        report = metrics(model, loaders[1])
        matrix = np.array(report["confusion_matrix"])
        accuracy = float(matrix.trace() / matrix.sum())
        print(
            json.dumps({"epoch": epoch + 1, "validation_accuracy": accuracy}),
            flush=True,
        )
        if accuracy > best:
            best = accuracy
            state = {k: v.detach().clone() for k, v in model.state_dict().items()}
    model.load_state_dict(state)
    model.eval()
    report = metrics(model, loaders[2])
    args.output.mkdir(parents=True, exist_ok=True)
    path = args.output / "defect.onnx"
    torch.onnx.export(
        model,
        torch.zeros(1, 3, 224, 224),
        str(path),
        input_names=["image"],
        output_names=["logits"],
        opset_version=17,
        dynamo=False,
    )
    # Compare exported inference against PyTorch before declaring the artifact usable.
    import onnxruntime as ort

    sample = torch.rand(1, 3, 224, 224)
    expected = model(sample).detach().numpy()
    actual = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"]).run(
        None, {"image": sample.numpy()}
    )[0]
    if not np.allclose(expected, actual, atol=1e-5):
        raise ValueError("ONNX parity check failed")
    validated = (
        min(report["support"]) >= 20
        and min(report["precision_at_threshold"]) >= 0.9
        and report["coverage"] >= 0.5
    )
    manifest = {
        "schema_version": 1,
        "labels": LABELS,
        "input_size": 224,
        "normalization": "RGB float 0 to 1; bilinear resize",
        "threshold": 0.8,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "validated": validated,
        "seed": args.seed,
        "test_metrics": report,
        "limitations": "Dataset-specific binary classifier, not defect localization. Domain review still required. Physical item splits must be reviewed manually.",
    }
    path.with_suffix(".json").write_text(json.dumps(manifest, indent=2))
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
