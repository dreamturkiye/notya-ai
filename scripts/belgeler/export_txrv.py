#!/usr/bin/env python3
"""NOTYA-BELGE-02 — export torchxrayvision densenet121-res224-all to ONNX for the browser (Tier B).
Usage: /tmp/txrv-venv/bin/python scripts/belgeler/export_txrv.py /tmp/txrv-out
Writes: txrv-densenet121-all-<sha12>.onnx, txrv.meta.json (pathologies order, sha256, size, parity check)."""
import sys, os, json, hashlib
import numpy as np, torch, torchxrayvision as xrv, onnx

out_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(out_dir, exist_ok=True)
base = xrv.models.DenseNet(weights='densenet121-res224-all')
base.eval()

class Sarmal(torch.nn.Module):
    """Static-shape export path: features → classifier → sigmoid → op_norm (torchxrayvision's operating-point
    normalisation, re-implemented with torch.where so the graph has no batch-dependent reshape)."""
    def __init__(self, m):
        super().__init__()
        self.m = m
        self.register_buffer('t', m.op_threshs.detach().clone().float())
    def forward(self, x):
        f = self.m.features(x)
        f = torch.nn.functional.relu(f, inplace=False)
        f = torch.nn.functional.adaptive_avg_pool2d(f, (1, 1))
        f = torch.flatten(f, 1)
        p = torch.sigmoid(self.m.classifier(f))
        t = self.t.unsqueeze(0)
        return torch.where(p < t, p / (t * 2), 1 - ((1 - p) / ((1 - t) * 2)))

model = Sarmal(base)
model.eval()
paths = list(base.pathologies)
op = base.op_threshs.detach().cpu().numpy().tolist()
x = torch.zeros(1, 1, 224, 224)
onnx_path = os.path.join(out_dir, 'txrv-densenet121-all.onnx')
torch.onnx.export(model, x, onnx_path, opset_version=17, input_names=['image'], output_names=['probs'], dynamic_axes=None, do_constant_folding=True, dynamo=False)
onnx.checker.check_model(onnx.load(onnx_path))
import onnxruntime as ort
rng = np.random.default_rng(0)
xin = ((rng.random((1, 1, 224, 224), dtype=np.float32) * 2 - 1) * 1024).astype(np.float32)
with torch.no_grad():
    ref = model(torch.from_numpy(xin)).numpy()
    ref_base = base(torch.from_numpy(xin)).numpy()  # parity against the stock forward too
sess = ort.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
got = sess.run(None, {'image': xin})[0]
mask = np.isfinite(ref)
maxdiff = float(np.max(np.abs(ref[mask] - got[mask]))) if mask.any() else float('nan')
maxdiff_stock = float(np.max(np.abs(ref[mask] - ref_base[mask]))) if mask.any() else float('nan')
sha = hashlib.sha256(open(onnx_path, 'rb').read()).hexdigest()
size = os.path.getsize(onnx_path)
final = os.path.join(out_dir, f'txrv-densenet121-all-{sha[:12]}.onnx')
os.replace(onnx_path, final)
meta = {'motor': 'txrv-densenet121', 'surum': f'xrv{xrv.__version__}-all', 'pathologies': paths, 'op_threshs': op, 'sha256': sha, 'bytes': size,
        'dosya': os.path.basename(final), 'parity_maxdiff': maxdiff, 'parity_vs_stock_forward': maxdiff_stock, 'untrained_nan': [p for p, v in zip(paths, ref[0].tolist()) if not np.isfinite(v)],
        'license': 'Apache-2.0 (torchxrayvision, Cohen et al. 2022)', 'export': 'torch.onnx.export opset 17, input [1,1,224,224] float32 in [-1024,1024], output op-normalised probs'}
json.dump(meta, open(os.path.join(out_dir, 'txrv.meta.json'), 'w'), indent=2)
print(json.dumps({k: meta[k] for k in ('surum', 'sha256', 'bytes', 'dosya', 'parity_maxdiff', 'parity_vs_stock_forward', 'untrained_nan')}))
print('pathologies:', paths)
