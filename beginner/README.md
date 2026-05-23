# 🎹 Piano Riyaaz

An interactive piano learning app for kids — falling notes, sheet music highlighting, and a virtual keyboard.

## Structure

```
piano-riyaaz/
├── index.html              ← Course home page (pick a lesson)
├── shared/
│   ├── style.css           ← All styles (shared by every lesson)
│   └── engine.js           ← Piano engine (shared by every lesson)
├── beginner/
│   ├── cde.html            ← Lesson 1: Introduction to C D E
│   ├── midi/
│   │   └── cde.mid
│   └── svg/
│       └── cde.svg
└── README.md
```

## Adding a New Lesson

1. Export your MIDI file and SVG sheet music from MuseScore (or similar).
2. Put the files in `beginner/midi/` and `beginner/svg/`.
3. Copy `beginner/cde.html` → `beginner/lesson2.html`.
4. Edit the `window.LESSON` block at the top of the new file:

```js
window.LESSON = {
  title:    "F G A — The Next Three Notes",
  subtitle: "Listen · Learn · Play",
  midiUrl:  "midi/lesson2.mid",
  svgUrl:   "svg/lesson2.svg",
  videoUrl: "https://www.youtube.com/embed/YOUR_VIDEO_ID",
  nextUrl:  "lesson3.html",   // or "" to hide the button
};
```

5. Add a card for the new lesson in `index.html`.

## GitHub Pages

Enable under **Settings → Pages → Branch: main / (root)**.  
Your site will be live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

## Tech

- [Tone.js](https://tonejs.github.io/) — audio synthesis
- [@tonejs/midi](https://github.com/Tonejs/Midi) — MIDI parsing
- Google Fonts (Inter + Cormorant Garamond)
- Piano samples from [Salamander Grand Piano](https://tonejs.github.io/audio/salamander/)
