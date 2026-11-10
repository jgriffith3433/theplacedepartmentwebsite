#!/usr/bin/env python3
"""Builds site/trailer.mp4 + site/trailer-poster.jpg with ffmpeg from the game repo's painted cutscene stills,
Resources/Voice lines, Resources/Sfx and StreamingAssets/Music (the animated clips were never committed).
Usage: python3 tools/make-trailer.py <path-to-breakingthrough>"""
import subprocess, sys, os, tempfile

BT = sys.argv[1]
ART = f"{BT}/Assets/Resources/Cinematics/Art"
VOX = f"{BT}/Assets/Resources/Voice"
MUS = f"{BT}/Assets/StreamingAssets/Music"
SFX = f"{BT}/Assets/Resources/Sfx"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
W, H, FPS = 1280, 720, 25

SHOTS = [
    ("boss_courier_1", 3.2, True),
    ("boss_courier_2", 3.0, True),
    ("ch1_open_2", 4.0, True),
    ("ch1_open_4", 4.0, False),
    ("ch2_open_1", 3.6, True),
    ("ch3_open_1", 3.6, False),
    ("ch4_open_1", 3.6, True),
    ("ch5_open_1", 3.6, False),
    ("boss_foreman_1", 3.6, True),
    ("boss_order_1", 3.4, True),
    ("boss_foreman_2", 3.2, True),
    ("boss_foreman_3", 3.6, False),
    ("ending_open_3_back", 6.4, True),
]
TITLE_S, CTA_S = 4.0, 4.0

VOICE = [
    ("courier_special_delivery_notice_of_striking", 0.15, "Special delivery! Notice of striking!"),
    ("wallit_return_to_sender", 3.45, "Return to sender."),
    ("slice_you_have_an_address_the_circle", 6.5, "You have an address. The circle."),
    ("wallit_cover_me_slice_i_m_collecting_a_refund", 10.4, "Cover me, Slice. I'm collecting a refund."),
    ("slice_hold_the_circle_nobody_signs_it", 15.4, "Hold the circle. Nobody signs it."),
    ("yobot_return_to_sender_return_to_sender", 21.0, "Return to sender. Return to sender."),
    ("slice_big_one_next_be_ready", 25.6, "Big one next. Be ready."),
    ("slice_the_courier_it_reads_the_order_out_then_it_lands", 28.4, "The Courier. It reads the order out, then it lands."),
    ("slice_tch_plated", 34.1, "Tch. Plated."),
    ("slice_not_this_time_received", 37.2, "Not this time. Received."),
    ("slice_slice_this_is_the_circle_the_one_address_in_the_hollow_that_s_filed_inside_it_things_exist", 41.3,
     "Inside it, things exist."),
]
HITS = [(3.3, "door_open"), (34.0, "batsmash"), (37.1, "batcrack")]


def run(*a):
    r = subprocess.run(a, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if r.returncode:
        sys.exit(r.stderr[-1500:])


def ts(t):
    return f"{int(t//3600)}:{int(t%3600//60):02d}:{t%60:05.2f}"


tmp = tempfile.mkdtemp()
clips = []
for i, (img, d, zin) in enumerate(SHOTS):
    n = int(d * FPS)
    z = "min(zoom+0.0009,1.18)" if zin else "if(eq(on,0),1.18,max(zoom-0.0009,1.0))"
    c = f"{tmp}/s{i}.mp4"
    run("ffmpeg", "-y", "-loop", "1", "-i", f"{ART}/{img}.jpg", "-vf",
        f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
        f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS},format=yuv420p",
        "-frames:v", str(n), "-c:v", "libx264", "-preset", "fast", "-crf", "24", c)
    clips.append(c)

for name, d, lines in (
        ("title", TITLE_S, [("THE PLACE DEPARTMENT", 78, 280), ("Where things that should not exist are given an address.", 30, 400)]),
        ("cta", CTA_S, [("PLAY", 120, 230), ("theplacedepartment.com", 34, 420)])):
    n = int(d * FPS)
    c = f"{tmp}/{name}.mp4"
    dt = ",".join(
        f"drawtext=text='{t}':fontcolor=0xe7d3b0:fontsize={s}:x=(w-text_w)/2:y={y}:alpha='min(t/0.6,1)'"
        for t, s, y in lines)
    run("ffmpeg", "-y", "-loop", "1", "-i", f"{ART}/hollow_back.png", "-vf",
        f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},eq=brightness=-0.25,{dt},format=yuv420p",
        "-frames:v", str(n), "-c:v", "libx264", "-preset", "fast", "-crf", "24", c)
    clips.append(c)

lst = f"{tmp}/list.txt"
open(lst, "w").write("".join(f"file '{c}'\n" for c in clips))
silent = f"{tmp}/v.mp4"
run("ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent)
total = sum(d for _, d, _ in SHOTS) + TITLE_S + CTA_S

ass = f"{tmp}/subs.ass"
ev = ""
for f, st, text in VOICE:
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{VOX}/{f}.mp3"]))
    ev += f"Dialogue: 0,{ts(st)},{ts(st+dur+0.35)},S,,0,0,0,,{text}\n"
open(ass, "w").write(f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: S,DejaVu Sans,34,&H00F0E6D2,&H00F0E6D2,&H99000000,&H99000000,1,0,0,0,100,100,0,0,3,8,0,2,60,60,46,1
[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
{ev}""")

inputs = ["-i", f"{MUS}/boss_courier.mp3", "-i", f"{MUS}/theme_slice.mp3"]
for f, st, _ in VOICE:
    inputs += ["-i", f"{VOX}/{f}.mp3"]
for _, s in HITS:
    inputs += ["-i", f"{SFX}/{s}.mp3"]
fc = ["[1:a][2:a]acrossfade=d=3[m0]",
      f"[m0]atrim=0:{total},afade=t=in:d=0.4,afade=t=out:st={total-2.5}:d=2.5,volume=0.55[mus]"]
labels = []
for i, (_, st, _) in enumerate(VOICE):
    fc.append(f"[{i+3}:a]adelay={int(st*1000)}|{int(st*1000)},volume=1.6[v{i}]")
    labels.append(f"[v{i}]")
base = 3 + len(VOICE)
for j, (st, _) in enumerate(HITS):
    fc.append(f"[{base+j}:a]adelay={int(st*1000)}|{int(st*1000)},volume=0.9[h{j}]")
    labels.append(f"[h{j}]")
fc.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=longest[fx]")
fc.append("[fx]asplit=2[fx1][fx2]")
fc.append("[mus][fx1]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=400[duck]")
fc.append("[duck][fx2]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]")

out = os.path.join(OUT, "trailer.mp4")
run("ffmpeg", "-y", "-i", silent, *inputs, "-filter_complex", ";".join(fc),
    "-vf", f"subtitles={ass}", "-map", "0:v", "-map", "[a]", "-t", str(total),
    "-c:v", "libx264", "-preset", "slow", "-b:v", "1000k", "-maxrate", "1300k", "-bufsize", "2600k",
    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out)
run("ffmpeg", "-y", "-ss", "0.9", "-i", out, "-frames:v", "1", "-q:v", "4", os.path.join(OUT, "trailer-poster.jpg"))
print(total, os.path.getsize(out) / 1e6, "MB")
