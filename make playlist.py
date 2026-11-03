#!/usr/bin/env python3
"""Escanea la carpeta audio/ y crea js/playlist.js con todas las canciones.
Uso: ponlo junto a tu index.html y ejecuta:  python make-playlist.py
(vuelve a ejecutarlo cada vez que añadas o quites canciones)"""
import json, pathlib

base = pathlib.Path(__file__).resolve().parent
exts = {'.mp3', '.ogg', '.wav', '.m4a'}
files = sorted('audio/' + p.name for p in (base / 'audio').iterdir() if p.suffix.lower() in exts)

out = base / 'js' / 'playlist.js'
out.parent.mkdir(exist_ok=True)
out.write_text('window.AUDIO_FILES = ' + json.dumps(files, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
print(f'{len(files)} canciones guardadas en {out}')
