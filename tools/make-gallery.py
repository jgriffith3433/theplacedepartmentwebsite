#!/usr/bin/env python3
"""Rebuild assets/shots (gallery) and assets/og-*.jpg from breakingthrough cutscene stills.
No GPU: ffmpeg only. Usage:
  python3 tools/make-gallery.py [path-to-breakingthrough]
If the Unity clone is missing, stills are fetched from GitHub raw (main)."""
import os, subprocess, sys, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SHOTS = os.path.join(ROOT, "assets", "shots")
ASSETS = os.path.join(ROOT, "assets")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT2 = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
RAW = "https://raw.githubusercontent.com/jgriffith3433/breakingthrough/main/Assets/Resources/Cinematics/Art"

# Hub, Ch1-6 worlds, boss (Courier), cast (Wallit filed)
EXHIBITS = [
    "ending_open_3_back.jpg",  # hub: three case-file doors
    "ch1_open_1.jpg",          # Ch.1 stamp over the circle
    "ch2_open_1.jpg",          # Ch.2 lantern road
    "ch3_open_1.jpg",          # Ch.3 clearing floor lamps
    "ch4_close_1.jpg",         # Ch.4 process server with paper
    "ch5_close_1.jpg",         # Ch.5 Registrar / ledger shelves
    "ch6_close_1.jpg",         # Ch.6 Order at the filed door
    "boss_courier_1.jpg",      # boss: The Courier
    "ending_received_3.jpg",   # cast: Wallit, return to sender
]


def run(*a):
    r = subprocess.run(a, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if r.returncode:
        sys.exit(r.stderr[-1500:])


def still(name, bt):
    if bt:
        p = os.path.join(bt, "Assets/Resources/Cinematics/Art", name)
        if os.path.isfile(p):
            return p
    dest = os.path.join("/tmp", "tpd-gallery-src", name)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if not os.path.isfile(dest):
        urllib.request.urlretrieve(f"{RAW}/{name}", dest)
    return dest


def scale(src, w, h, out, q=3):
    run(
        "ffmpeg", "-y", "-i", src,
        "-vf", f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}",
        "-frames:v", "1", "-q:v", str(q), out,
    )


def og(src, out, lines, stamp):
    # lines: list of (text, size, y); stamp text in red box
    box_h = 60 + 40 * len(lines)
    dt = [
        f"drawbox=x=36:y=36:w=620:h={box_h}:color=0x1a1410@0.55:t=fill",
        f"drawbox=x=36:y=36:w=620:h={box_h}:color=0xe7d3b0@0.85:t=2",
    ]
    for text, size, y, bold in lines:
        font = FONT if bold else FONT2
        safe = text.replace(":", "\\:").replace("'", "\\'")
        dt.append(f"drawtext=fontfile={font}:text='{safe}':fontcolor=0xe7d3b0:fontsize={size}:x=56:y={y}")
    dt += [
        "drawbox=x=980:y=48:w=160:h=56:color=0x8a2b22@0.92:t=fill",
        f"drawtext=fontfile={FONT}:text='{stamp}':fontcolor=0xe7d3b0:fontsize=28:x=1010:y=62",
    ]
    run(
        "ffmpeg", "-y", "-i", src,
        "-vf", f"scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630,eq=brightness=-0.08,{','.join(dt)}",
        "-frames:v", "1", "-q:v", "3", out,
    )


def main():
    bt = sys.argv[1] if len(sys.argv) > 1 else ""
    os.makedirs(SHOTS, exist_ok=True)
    for i, name in enumerate(EXHIBITS, 1):
        src = still(name, bt)
        scale(src, 1280, 720, os.path.join(SHOTS, f"shot-{i}.jpg"), 3)
        scale(src, 640, 360, os.path.join(SHOTS, f"shot-{i}-640.jpg"), 4)
        print(f"shot-{i} <- {name}")

    og(
        still("ch1_open_1.jpg", bt),
        os.path.join(ASSETS, "og-card.jpg"),
        [
            ("THE PLACE DEPARTMENT", 42, 70, True),
            ("Where things that should not exist", 22, 140, False),
            ("are given an address.", 22, 172, False),
            ("theplacedepartment.com", 18, 250, False),
            ("WALLIT  No refunds.", 16, 290, False),
        ],
        "FILED",
    )
    og(
        still("ch5_open_1.jpg", bt),
        os.path.join(ASSETS, "og-lore.jpg"),
        [
            ("LORE LOG", 48, 70, True),
            ("What the files say.", 24, 140, False),
            ("The Place Department", 18, 220, False),
        ],
        "FILED",
    )
    og(
        still("boss_courier_1.jpg", bt),
        os.path.join(ASSETS, "og-game.jpg"),
        [
            ("PLAY", 56, 70, True),
            ("The Place Department", 26, 150, False),
            ("Tap in. Hold the circle.", 20, 210, False),
        ],
        "OPEN",
    )
    print("og-card.jpg og-lore.jpg og-game.jpg")


if __name__ == "__main__":
    main()
