#!/usr/bin/env python3
"""Gera a máscara (peça × fundo) de cada foto da peça: frente, costas e lado.

O site usa a máscara para trocar a cor da peça na foto quando o cliente escolhe
outra cor. Peças brancas têm a mesma cor do fundo, então a separação usa as
bordas (Canny + contorno) refinadas com GrabCut, não só a cor.

Uso: python3 scripts/generate-masks.py [--only=slug,...] [--force]
Saída: public/images/products/masks/<foto>.png (tons de cinza, 1024x1024)
"""
import sys, os, glob, re
import cv2
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DIR = os.path.join(ROOT, "public", "images", "products")
OUT = os.path.join(DIR, "masks")
args = sys.argv[1:]
FORCE = "--force" in args
ONLY = next((a.split("=", 1)[1].split(",") for a in args if a.startswith("--only=")), None)


def mask_for(path):
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    border = np.concatenate([img[:6].reshape(-1, 3), img[-6:].reshape(-1, 3), img[:, :6].reshape(-1, 3), img[:, -6:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    dist = np.abs(img.astype(int) - bg).max(-1)

    # bordas da peça (funciona mesmo quando a peça tem a cor do fundo)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(cv2.GaussianBlur(gray, (3, 3), 0), 6, 18)
    raw = cv2.Canny(cv2.GaussianBlur(gray, (3, 3), 0), 6, 18)
    color = ((dist > 28) * 255).astype(np.uint8)

    def fill(k):
        edges = cv2.morphologyEx(raw, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
        # moldura de 1px de fundo: o preenchimento contorna a foto toda, por qualquer lado
        ff = cv2.copyMakeBorder(color | edges, 1, 1, 1, 1, cv2.BORDER_CONSTANT, value=0)
        cv2.floodFill(ff, np.zeros((h + 4, w + 4), np.uint8), (0, 0), 128)
        filled = np.where(ff[1:-1, 1:-1] == 128, 0, 255).astype(np.uint8)
        # só os pedaços grandes (descarta poeira)
        n, lab, stats, _ = cv2.connectedComponentsWithStats(filled)
        out = np.zeros_like(filled)
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] > h * w * 0.004:
                out[lab == i] = 255
        return out

    # contorno com falhas (peça branca) vaza no preenchimento: usa o menor fechamento
    # que já preenche quase tudo o que o maior preenche
    tries = [(k, fill(k)) for k in (9, 13, 17, 23, 31, 41)]
    full = (tries[-1][1] > 0).sum()
    keep = next(m for k, m in tries if (m > 0).sum() >= 0.93 * full)

    # GrabCut refina o contorno a partir desse palpite
    gc = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    gc[keep > 0] = cv2.GC_PR_FGD
    gc[cv2.erode(keep, np.ones((15, 15), np.uint8)) > 0] = cv2.GC_FGD
    gc[cv2.dilate(keep, np.ones((25, 25), np.uint8)) == 0] = cv2.GC_BGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(img, gc, None, bgd, fgd, 3, cv2.GC_INIT_WITH_MASK)
        m = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    except cv2.error:
        m = keep
    # fecha furos e suaviza 1px de borda
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    ff = cv2.copyMakeBorder(m, 1, 1, 1, 1, cv2.BORDER_CONSTANT, value=0)
    cv2.floodFill(ff, np.zeros((h + 4, w + 4), np.uint8), (0, 0), 128)
    m[ff[1:-1, 1:-1] != 128] = 255
    return cv2.GaussianBlur(m, (3, 3), 0)


os.makedirs(OUT, exist_ok=True)
files = sorted(f for f in glob.glob(os.path.join(DIR, "*.webp")) if not re.search(r"-modelo-\d\.webp$", f))
if ONLY:
    files = [f for f in files if re.sub(r"-(costas|lado)$", "", os.path.basename(f)[:-5]) in ONLY]
for f in files:
    out = os.path.join(OUT, os.path.basename(f)[:-5] + ".png")
    if not FORCE and os.path.exists(out):
        continue
    cv2.imwrite(out, mask_for(f), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print("✓", os.path.basename(out))
