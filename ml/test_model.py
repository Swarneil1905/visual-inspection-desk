import torch
from train import DefectNet, metrics, verify_disjoint
from torch.utils.data import DataLoader, TensorDataset
import pytest


def test_model_contract():
    model = DefectNet().eval()
    assert tuple(model(torch.zeros(1, 3, 224, 224)).shape) == (1, 2)


def test_low_confidence_abstains():
    class Zero(torch.nn.Module):
        def forward(self, x):
            return torch.zeros(len(x), 2)

    result = metrics(
        Zero(),
        DataLoader(TensorDataset(torch.zeros(2, 3, 224, 224), torch.tensor([0, 1]))),
    )
    assert result["coverage"] == 0 and result["precision_at_threshold"] == [0, 0]


def test_duplicate_splits_rejected(tmp_path):
    p = tmp_path / "same.png"
    p.write_bytes(b"same")
    dataset = type("Data", (), {"samples": [(p, 0)]})()
    with pytest.raises(ValueError):
        verify_disjoint([dataset, dataset])


def test_onnx_matches_pytorch(tmp_path):
    import numpy as np
    import onnxruntime as ort

    torch.manual_seed(7)
    model = DefectNet().eval()
    sample = torch.rand(1, 3, 224, 224)
    path = tmp_path / "smoke.onnx"
    torch.onnx.export(
        model,
        sample,
        str(path),
        input_names=["image"],
        output_names=["logits"],
        opset_version=17,
        dynamo=False,
    )
    actual = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"]).run(
        None, {"image": sample.numpy()}
    )[0]
    assert np.allclose(model(sample).detach().numpy(), actual, atol=1e-5)
