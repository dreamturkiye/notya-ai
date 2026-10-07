#!/usr/bin/env python3
"""
NOTYA-SES-PROFILI-01 — convert Resemblyzer's GE2E speaker encoder (Apache-2.0) to the browser format.

Input : resemblyzer/pretrained.pt from the PyPI wheel Resemblyzer==0.1.4
        (pip download resemblyzer==0.1.4 --no-deps; unzip the wheel).
Output: public/ses-profili/ge2e-v1.bin — 'NSP1' + uint32 header length + JSON header + float16 weights (LE).
Only the inference weights are kept (3-layer LSTM 40->256, linear 256->256); optimizer state is dropped.
No torch needed: the legacy (non-zip) torch pickle is read directly.

Usage: python3 scripts/ses-profili/ge2e-donustur.py path/to/pretrained.pt public/ses-profili/ge2e-v1.bin
"""
import collections
import json
import pickle
import struct
import sys

import numpy as np

DT = {'FloatStorage': np.float32, 'LongStorage': np.int64, 'IntStorage': np.int32, 'DoubleStorage': np.float64}
SIRA = [
    'lstm.weight_ih_l0', 'lstm.weight_hh_l0', 'lstm.bias_ih_l0', 'lstm.bias_hh_l0',
    'lstm.weight_ih_l1', 'lstm.weight_hh_l1', 'lstm.bias_ih_l1', 'lstm.bias_hh_l1',
    'lstm.weight_ih_l2', 'lstm.weight_hh_l2', 'lstm.bias_ih_l2', 'lstm.bias_hh_l2',
    'linear.weight', 'linear.bias',
]


class _Depo:
    def __init__(self, dtype):
        self.dtype, self.veri = dtype, None


class _Tensor:
    def __init__(self, depo, ofset, boyut, adim):
        self.depo, self.ofset, self.boyut, self.adim = depo, ofset, tuple(boyut), tuple(adim)

    def dizi(self):
        a = self.depo.veri
        return np.lib.stride_tricks.as_strided(a[self.ofset:], shape=self.boyut, strides=[s * a.itemsize for s in self.adim]).copy()


def yukle(yol):
    f = open(yol, 'rb')
    depolar = {}

    class Acici(pickle.Unpickler):
        def find_class(self, mod, ad):
            if mod == 'torch._utils' and ad in ('_rebuild_tensor_v2', '_rebuild_tensor'):
                return lambda depo, ofset, boyut, adim, *a: _Tensor(depo, ofset, boyut, adim)
            if mod == 'torch' and ad in DT:
                return ad
            if mod == 'collections' and ad == 'OrderedDict':
                return collections.OrderedDict
            return lambda *a, **k: None

        def persistent_load(self, pid):
            _, tur, anahtar, _, _ = pid[:5]
            if anahtar not in depolar:
                depolar[anahtar] = _Depo(DT[tur])
            return depolar[anahtar]

    for _ in range(3):
        pickle.load(f)  # magic, protocol, sys info
    nesne = Acici(f).load()
    for anahtar in pickle.load(f):
        n = struct.unpack('<q', f.read(8))[0]
        d = depolar[anahtar]
        d.veri = np.frombuffer(f.read(n * np.dtype(d.dtype).itemsize), dtype=d.dtype)
    return {k: v.dizi() for k, v in nesne['model_state'].items() if isinstance(v, _Tensor)}


def main():
    giris, cikis = sys.argv[1], sys.argv[2]
    agirlik = yukle(giris)
    tensorler, parcalar, ofset = [], [], 0
    for ad in SIRA:
        a = agirlik[ad].astype(np.float16)
        tensorler.append({'ad': ad, 'sekil': list(a.shape), 'ofset': ofset})
        parcalar.append(a.tobytes())
        ofset += a.size
    baslik = json.dumps({
        'model': 'resemblyzer-ge2e', 'surum': 'ge2e-v1', 'tur': 'f16', 'lisans': 'Apache-2.0',
        'kaynak': 'https://pypi.org/project/Resemblyzer/0.1.4/ (resemblyzer/pretrained.pt)', 'tensorler': tensorler,
    }, separators=(',', ':')).encode('utf-8')
    baslik += b' ' * ((-len(baslik)) % 2)
    with open(cikis, 'wb') as o:
        o.write(b'NSP1')
        o.write(struct.pack('<I', len(baslik)))
        o.write(baslik)
        for p in parcalar:
            o.write(p)
    print(cikis, 'tensor', len(tensorler), 'agirlik', ofset)


if __name__ == '__main__':
    main()
