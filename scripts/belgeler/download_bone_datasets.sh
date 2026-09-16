#!/bin/bash
# NOTYA-BELGE-02 — dataset downloads for the bone engines (both CC BY 4.0, public on figshare).
# Runs in the background; log: ~/notya-datasets/download.log. Resumable (curl -C -).
set -u
D="$HOME/notya-datasets"; mkdir -p "$D/grazpedwri" "$D/fracatlas"; cd "$D"
get() { local url="$1" out="$2"; if [ -f "$out.done" ]; then echo "skip $out"; return; fi; curl -L -C - --retry 5 --retry-delay 10 -o "$out" "$url" && touch "$out.done" && echo "ok $out $(du -h "$out" | cut -f1)"; }
echo "start $(date)"
get https://ndownloader.figshare.com/files/65518038 fracatlas/FracAtlas.zip
get https://ndownloader.figshare.com/files/35026432 grazpedwri/dataset.csv
get https://ndownloader.figshare.com/files/34268819 grazpedwri/folder_structure.zip
get https://ndownloader.figshare.com/files/34268828 grazpedwri/images_part1.zip
get https://ndownloader.figshare.com/files/34268849 grazpedwri/images_part2.zip
get https://ndownloader.figshare.com/files/34268864 grazpedwri/images_part3.zip
get https://ndownloader.figshare.com/files/34268891 grazpedwri/images_part4.zip
echo "done $(date)"
