#!/usr/bin/env python3
"""
Song page generator.
Usage: python3 generate_song_page.py
Reads jaanekahan4.html as template, outputs one HTML per song in SONGS list.
"""

import re, shutil, os

TEMPLATE = "jaanekahan4.html"   # your master file

# ─── ADD ONE DICT PER SONG ────────────────────────────────────────────────────
SONGS = [
    {
        "id":            "jaanekahan",
        "title":         "Jaane Kahan Mera Jigaar Gaya Ji",
        "measures":      40,
        "time_sig":      [4, 4],
        "pickup_beats":  0,
        "repeats":       [],
        "youtube_id":    "FaJh5yr51iw",
        "out_file":      "jaanekahan4.html",   # keep original name or rename
    },
    # ── copy-paste block below for every new song ──
    # {
    #     "id":            "merekhwabonmein",
    #     "title":         "Mere Khwabon Mein Jo Aaye",
    #     "measures":      32,
    #     "time_sig":      [4, 4],
    #     "pickup_beats":  0,
    #     "repeats":       [],
    #     "youtube_id":    "YOUR_VIDEO_ID",
    #     "out_file":      "merekhwabonmein4.html",
    # },
]
# ─────────────────────────────────────────────────────────────────────────────

def generate(template_path, song, output_dir="."):
    with open(template_path, "r", encoding="utf-8") as f:
        html = f.read()

    s   = song
    sid = s["id"]
    stitle = s["title"]
    ts  = s["time_sig"]
    ts_str = f"[{ts[0]}, {ts[1]}]"

    replacements = [
        # (old_exact_string,  new_string)

        # 1. <title>
        (
            f"<title>Jaane Kahan Mera Jigaar Gaya Ji</title>",
            f"<title>{stitle}</title>"
        ),

        # 2. <h1>
        (
            "<h1>Jaane Kahan Mera Jigaar Gaya Ji</h1>",
            f"<h1>{stitle}</h1>"
        ),

        # 3. SONG_CONFIG.id
        (
            'id: "jaanekahan",',
            f'id: "{sid}",'
        ),

        # 4. SONG_CONFIG.title
        (
            'title: "Jaane Kahan Mera Jigaar Gaya Ji",',
            f'title: "{stitle}",'
        ),

        # 5. SONG_CONFIG.timeSignature
        (
            "timeSignature: [4, 4], // 4/4",
            f"timeSignature: {ts_str}, // {ts[0]}/{ts[1]}"
        ),

        # 6. SONG_CONFIG.measures
        (
            "measures: 40,",
            f"measures: {s['measures']},"
        ),

        # 7. SONG_CONFIG.pickupBeats
        (
            "pickupBeats: 0",
            f"pickupBeats: {s['pickup_beats']}"
        ),

        # 8. .mid fetch path
        (
            'response = await fetch("jaanekahan.mid");',
            f'response = await fetch("{sid}.mid");'
        ),

        # 9. .mid error message
        (
            'for "jaanekahan.mid"',
            f'for "{sid}.mid"'
        ),

        # 10. SVG path prefix
        (
            "svg/jaanekahan-",
            f"svg/{sid}-"
        ),

        # 11. paywall productId
        (
            'productId: "song:jaanekahan"',
            f'productId: "song:{sid}"'
        ),

        # 12. YouTube link
        (
            "https://www.youtube.com/watch?v=FaJh5yr51iw",
            f"https://www.youtube.com/watch?v={s['youtube_id']}"
        ),
    ]

    for old, new in replacements:
        count = html.count(old)
        if count == 0:
            print(f"  ⚠️  NOT FOUND: {repr(old[:60])}")
        elif count > 1:
            print(f"  ⚠️  MULTIPLE ({count}x): {repr(old[:60])} — replacing all")
        html = html.replace(old, new)

    out_path = os.path.join(output_dir, s["out_file"])
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  ✅  Written → {out_path}")


if __name__ == "__main__":
    for song in SONGS:
        print(f"\n🎵  Generating: {song['title']}")
        generate(TEMPLATE, song, output_dir=".")
    print("\nDone.")
