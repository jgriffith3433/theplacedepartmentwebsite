#!/usr/bin/env python3
"""Rebuild assets/cast portraits + voice clips from breakingthrough Resources.
No GPU: ffmpeg only. Usage:
  python3 tools/make-cast-voice.py [path-to-breakingthrough]
If the Unity clone is missing, files are fetched from GitHub raw (main)."""
import os, subprocess, sys, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
CAST = os.path.join(ROOT, "assets", "cast")
VOICE = os.path.join(CAST, "voice")
RAW = "https://raw.githubusercontent.com/jgriffith3433/breakingthrough/main/Assets/Resources"

# id -> (portrait relative path, voice stem, caption kept in index.html data-line)
LINES = [
    ("wallit", "Portraits/wallit.png", "Voice/wallit_return_to_sender.mp3"),
    ("slice", "Portraits/slice.png", "Voice/slice_noted.mp3"),
    ("yobot", "Portraits/yobot.png", "Voice/yobot_hello_uploading_victory.mp3"),
    # Spider Bot uses the Server portrait (first Spider Bot / process server); no standalone spider portrait.
    ("spider", "Portraits/server.png", "Voice/server_delivery_is_to_the_named_address.mp3"),
    ("courier", "Portraits/courier.png", "Voice/courier_special_delivery_notice_of_striking.mp3"),
]


def run(*a):
    r = subprocess.run(a, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if r.returncode:
        sys.exit(r.stderr[-1500:])


def fetch(rel, bt):
    if bt:
        p = os.path.join(bt, "Assets/Resources", rel)
        if os.path.isfile(p):
            return p
    dest = os.path.join("/tmp", "tpd-cast-src", os.path.basename(rel))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if not os.path.isfile(dest):
        urllib.request.urlretrieve(f"{RAW}/{rel}", dest)
    return dest


def main():
    bt = sys.argv[1] if len(sys.argv) > 1 else ""
    os.makedirs(VOICE, exist_ok=True)
    for cid, portrait, voice in LINES:
        src_p = fetch(portrait, bt)
        src_v = fetch(voice, bt)
        out_jpg = os.path.join(CAST, f"{cid}.jpg")
        run(
            "ffmpeg", "-y", "-i", src_p,
            "-vf", "scale=640:800:force_original_aspect_ratio=increase,crop=640:800",
            "-frames:v", "1", "-q:v", "4", out_jpg,
        )
        run(
            "ffmpeg", "-y", "-i", src_v,
            "-ac", "1", "-ar", "22050", "-b:a", "48k",
            os.path.join(VOICE, f"{cid}.mp3"),
        )
        run(
            "ffmpeg", "-y", "-i", src_v,
            "-ac", "1", "-ar", "22050", "-c:a", "libvorbis", "-q:a", "2",
            os.path.join(VOICE, f"{cid}.ogg"),
        )
        print(cid, "ok")


if __name__ == "__main__":
    main()
