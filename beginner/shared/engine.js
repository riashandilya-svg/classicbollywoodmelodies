// ═══════════════════════════════════════════════════════════════
//  Piano Riyaaz — Shared Engine
//  Each lesson page defines a LESSON object before loading this:
//
//  window.LESSON = {
//    title:    "Introduction to C D E",
//    subtitle: "Listen · Learn · Play",
//    midiUrl:  "../midi/cde.mid",
//    svgUrl:   "../svg/cde.svg",
//    videoUrl: "",          // YouTube embed src, or "" for none
//    nextUrl:  "",          // href for "Go to Next Lecture" button, or "" to hide
//  };
// ═══════════════════════════════════════════════════════════════

import { Midi } from 'https://esm.sh/@tonejs/midi@2.0.28';

/* ── Apply lesson metadata to the DOM ─────────────────────── */
const L = window.LESSON || {};
if (L.title)    document.querySelector('h1').textContent          = L.title;
if (L.subtitle) document.getElementById('subtitle').textContent   = L.subtitle;
if (L.title)    document.getElementById('videoModalTitle').textContent = '🎬 Watch First — ' + L.title;
if (L.nextUrl)  { document.getElementById('btnNextLecture').href = L.nextUrl; }
else            { document.getElementById('btnNextLecture').style.display = 'none'; }

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */
const START_MIDI = 48;   // C3
const END_MIDI   = 72;   // C5
const TREBLE = 'treble';
const BASS   = 'bass';

const NOTE_COLORS = {
  0:'#FF6B9D', 1:'#C77DFF', 2:'#FF9A3C', 3:'#FFD93D',
  4:'#6BCB77', 5:'#4D96FF', 6:'#FF6060', 7:'#00C9A7',
  8:'#A78BFA', 9:'#FFA552', 10:'#F472B6', 11:'#34D399',
};
const TREBLE_GRAD = ['#D4B0E8', '#7B2FBE'];
const BASS_GRAD   = ['#FFE066', '#B45309'];

const WHITE_KEY_COLOR  = '#F5F0E8';
const BLACK_KEY_COLOR  = '#1A1025';
const KEYBOARD_HEIGHT  = 145;
const FALL_ZONE_HEIGHT = 210;
const NOTE_GAP         = 0.025;
const FALL_SPEED       = 180;  // px/sec at 1×

/* ══════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════ */
let allNotes = [], practiceNotes = [], synth = null;
let secondsPerBeat = 0.5, secondsPerMeasure = 2.0;
let totalMeasures = 1, originalBPM = 120;
let speedMult = 1.0, speedIdx = 4;
let loopEnabled = false, freeMode = false;
let trainingActive = false, trainingIdx = 0;
let waitingForInput = false;
let expectedMidis = new Set(), pressedMidis = new Set();
let fallingRects = [], animFrame = null;
let previewPhase = false, practiceTimeouts = [];
let previewGroups = [];
let svgNoteEls = [], svgHighlighted = [];
let currentSongIdx = -1;

const SPEED_STEPS = [0.25, 0.5, 0.6, 0.75, 1.0, 1.25, 1.5, 2.0];

/* ══════════════════════════════════════════════════════
   CANVAS REFS
══════════════════════════════════════════════════════ */
const fallingCanvas = document.getElementById('fallingCanvas');
const kbdCanvas     = document.getElementById('keyboardCanvas');
const fctx = fallingCanvas.getContext('2d');
const kctx = kbdCanvas.getContext('2d');

/* ══════════════════════════════════════════════════════
   KEYBOARD LAYOUT
══════════════════════════════════════════════════════ */
function isBlack(midi) { return [1,3,6,8,10].includes(midi % 12); }
const WHITE_KEYS = [];
for (let m = START_MIDI; m <= END_MIDI; m++) if (!isBlack(m)) WHITE_KEYS.push(m);
const TOTAL_WHITE = WHITE_KEYS.length;

function getNoteName(midi) {
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  return names[midi % 12] + Math.floor(midi / 12 - 1);
}

function ww()    { return fallingCanvas.width / TOTAL_WHITE; }
function wwKbd() { return kbdCanvas.width / TOTAL_WHITE; }

function noteToX(midi) {
  let whiteIndex = 0;
  for (let m = START_MIDI; m < midi; m++) {
    if (!isBlack(m)) whiteIndex++;
  }
  let x = whiteIndex * ww();
  if (isBlack(midi)) x -= ww() * 0.35;
  return x;
}
function noteRectWidth(midi) {
  return isBlack(midi) ? ww() * 0.55 : ww() * 0.88;
}

/* ══════════════════════════════════════════════════════
   CANVAS RESIZE
══════════════════════════════════════════════════════ */
function resizeCanvases() {
  const W = document.getElementById('canvasWrap').clientWidth;

  const headingEl = document.querySelector('h1');
  const subtitleEl = document.getElementById('subtitle');
  const headingH = (headingEl ? headingEl.offsetHeight : 36) +
                   (subtitleEl ? subtitleEl.offsetHeight : 20) + 12;
  const available = window.innerHeight - 60 - 8 - headingH - 8;

  const kbdH  = Math.max(KEYBOARD_HEIGHT, Math.round(available * 0.20));
  const scoreEl = document.getElementById('scoreZone');
  const scoreH  = scoreEl ? scoreEl.offsetHeight : 0;
  const fallH = Math.max(60, available - kbdH - scoreH);

  fallingCanvas.width  = W;
  fallingCanvas.height = fallH;
  document.getElementById('canvasWrap').style.height = fallH + 'px';
  kbdCanvas.width  = W;
  kbdCanvas.height = kbdH;
  document.getElementById('keyboardWrap').style.height = kbdH + 'px';
  document.getElementById('hitLine').style.top = (fallH - 4) + 'px';
  drawKeyboard();
}

/* ══════════════════════════════════════════════════════
   DRAW KEYBOARD
══════════════════════════════════════════════════════ */
function drawKeyboard(highlightSet = new Set(), pressedSet = new Set()) {
  const W = kbdCanvas.width, H = kbdCanvas.height;
  const w = W / TOTAL_WHITE;
  const blackKeyWidth  = w * 0.6;
  const blackKeyHeight = H * 0.62;

  kctx.clearRect(0, 0, W, H);

  let whiteIndex = 0;
  for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
    if (isBlack(midi)) continue;
    const x   = whiteIndex * w;
    const lit = highlightSet.has(midi) || pressedSet.has(midi);

    const wGrad = kctx.createLinearGradient(x, 0, x, H);
    if (lit) {
      wGrad.addColorStop(0, '#E8C8E8');
      wGrad.addColorStop(1, '#7B1F5A');
    } else {
      wGrad.addColorStop(0, '#ffffff');
      wGrad.addColorStop(0.7, '#f5f5f5');
      wGrad.addColorStop(1, '#e8e8e8');
    }
    kctx.fillStyle = wGrad;
    kctx.fillRect(x, 0, w, H);

    kctx.strokeStyle = 'rgba(0,0,0,0.18)';
    kctx.lineWidth = 0.8;
    kctx.strokeRect(x + 0.4, 0, w - 0.8, H);

    const innerGrad = kctx.createLinearGradient(x, 0, x, 14);
    innerGrad.addColorStop(0, 'rgba(0,0,0,0.08)');
    innerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    kctx.fillStyle = innerGrad;
    kctx.fillRect(x, 0, w, 14);

    if (lit) {
      kctx.shadowColor = '#C060A0';
      kctx.shadowBlur  = 18;
      kctx.fillStyle   = 'rgba(160,40,120,0.18)';
      kctx.fillRect(x, 0, w, H);
      kctx.shadowBlur  = 0;
    }

    kctx.fillStyle    = lit ? '#F5D0F0' : '#555';
    kctx.font         = `bold ${Math.max(9, Math.min(12, w * 0.55))}px Inter, Arial`;
    kctx.textAlign    = 'center';
    kctx.textBaseline = 'bottom';
    kctx.fillText(getNoteName(midi), x + w / 2, H - 5);

    whiteIndex++;
  }

  whiteIndex = 0;
  for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
    if (!isBlack(midi)) { whiteIndex++; continue; }

    const x   = (whiteIndex - 1) * w + w * 0.7;
    const lit = highlightSet.has(midi) || pressedSet.has(midi);

    const bGrad = kctx.createLinearGradient(x, 0, x, blackKeyHeight);
    if (lit) {
      bGrad.addColorStop(0, '#E8C8E8');
      bGrad.addColorStop(1, '#7B1F5A');
    } else {
      bGrad.addColorStop(0, '#333');
      bGrad.addColorStop(0.5, '#111');
      bGrad.addColorStop(1, '#000');
    }

    kctx.shadowColor   = 'rgba(0,0,0,0.45)';
    kctx.shadowBlur    = 8;
    kctx.shadowOffsetY = 4;
    kctx.fillStyle     = bGrad;
    kctx.fillRect(x, 0, blackKeyWidth, blackKeyHeight);
    kctx.shadowBlur    = 0;
    kctx.shadowOffsetY = 0;

    if (lit) {
      kctx.shadowColor = '#C060A0';
      kctx.shadowBlur  = 20;
      kctx.fillStyle   = 'rgba(160,40,120,0.45)';
      kctx.fillRect(x, 0, blackKeyWidth, blackKeyHeight);
      kctx.shadowBlur  = 0;
    }

    const glossGrad = kctx.createLinearGradient(x, 0, x + blackKeyWidth, blackKeyHeight * 0.4);
    glossGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
    glossGrad.addColorStop(1, 'rgba(255,255,255,0)');
    kctx.fillStyle = glossGrad;
    kctx.fillRect(x + blackKeyWidth * 0.1, 0, blackKeyWidth * 0.8, blackKeyHeight * 0.35);

    kctx.fillStyle    = lit ? '#fff' : 'rgba(255,255,255,0.55)';
    kctx.font         = `bold ${Math.max(8, Math.min(10, blackKeyWidth * 0.55))}px Inter, Arial`;
    kctx.textAlign    = 'center';
    kctx.textBaseline = 'bottom';
    kctx.fillText(getNoteName(midi), x + blackKeyWidth / 2, blackKeyHeight - 3);
  }
}

/* ══════════════════════════════════════════════════════
   FALLING NOTES
══════════════════════════════════════════════════════ */
function spawnFalling(midi, durationSec, spawnTime_ms, track) {
  const x      = noteToX(midi);
  const width  = ww() * 0.86;
  const height = Math.max(14, durationSec * FALL_SPEED * speedMult - 4);

  const TOP_GAP = 10;
  const startY  = -height - TOP_GAP;
  const endY    = FALL_ZONE_HEIGHT - height;

  const bodyGrad = fctx.createLinearGradient(0, 0, 0, height);
  if (track === TREBLE) {
    bodyGrad.addColorStop(0.00, 'rgba(220,180,220,0.92)');
    bodyGrad.addColorStop(0.25, 'rgba(168,100,160,0.88)');
    bodyGrad.addColorStop(0.65, 'rgba(120,30,90,0.90)');
    bodyGrad.addColorStop(1.00, 'rgba(80,10,50,0.94)');
  } else {
    bodyGrad.addColorStop(0.00, 'rgba(255,251,150,0.92)');
    bodyGrad.addColorStop(0.25, 'rgba(255,236,50,0.88)');
    bodyGrad.addColorStop(0.65, 'rgba(250,204,21,0.90)');
    bodyGrad.addColorStop(1.00, 'rgba(202,138,4,0.94)');
  }

  const gloss = fctx.createLinearGradient(x, 0, x + width, 0);
  gloss.addColorStop(0.0, 'rgba(255,255,255,0.05)');
  gloss.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  gloss.addColorStop(0.6, 'rgba(255,255,255,0.35)');
  gloss.addColorStop(1.0, 'rgba(255,255,255,0.05)');

  const shimmerGrad = fctx.createLinearGradient(0, -20, 0, 20);
  shimmerGrad.addColorStop(0,   'rgba(255,255,255,0)');
  shimmerGrad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
  shimmerGrad.addColorStop(1,   'rgba(255,255,255,0)');

  fallingRects.push({
    midi, track,
    noteName: getNoteName(midi),
    x, width, height,
    y: startY, startY, endY,
    bodyGrad, gloss, shimmerGrad,
    spawnMs: spawnTime_ms,
    landed: false,
  });
}

function drawFalling(nowMs) {
  fctx.clearRect(0, 0, fallingCanvas.width, FALL_ZONE_HEIGHT);

  fctx.strokeStyle = 'rgba(180,130,220,0.06)';
  fctx.lineWidth   = 1;
  for (let i = 0; i <= TOTAL_WHITE; i++) {
    const x = i * ww();
    fctx.beginPath(); fctx.moveTo(x, 0); fctx.lineTo(x, FALL_ZONE_HEIGHT); fctx.stroke();
  }

  const fallDurationMs = (FALL_ZONE_HEIGHT / (FALL_SPEED * speedMult)) * 1000;

  fallingRects = fallingRects.filter(r => {
    const elapsed  = nowMs - r.spawnMs;
    const progress = elapsed / fallDurationMs;
    r.y = r.startY + progress * (r.endY - r.startY);

    if (!r.landed && r.y >= r.endY) r.landed = true;
    if (r.y > FALL_ZONE_HEIGHT + 20) return false;

    fctx.save();
    fctx.translate(0, r.y);

    if (r.track === TREBLE) {
      fctx.shadowColor = 'rgba(160,40,120,0.60)';
      fctx.shadowBlur  = 18;
    } else {
      fctx.shadowColor = 'rgba(245,158,11,0.4)';
      fctx.shadowBlur  = 10;
    }

    const rad = 12;
    fctx.fillStyle = r.bodyGrad;
    fctx.beginPath();
    fctx.moveTo(r.x + rad,             0);
    fctx.lineTo(r.x + r.width - rad,   0);
    fctx.quadraticCurveTo(r.x + r.width, 0,          r.x + r.width, rad);
    fctx.lineTo(r.x + r.width,          r.height - rad);
    fctx.quadraticCurveTo(r.x + r.width, r.height,   r.x + r.width - rad, r.height);
    fctx.lineTo(r.x + rad,              r.height);
    fctx.quadraticCurveTo(r.x,          r.height,    r.x, r.height - rad);
    fctx.lineTo(r.x,                    rad);
    fctx.quadraticCurveTo(r.x,          0,            r.x + rad, 0);
    fctx.closePath();
    fctx.fill();
    fctx.shadowBlur = 0;

    fctx.save();
    fctx.globalCompositeOperation = 'screen';
    fctx.globalAlpha = 0.22;
    fctx.fillStyle   = r.gloss;
    fctx.fillRect(r.x, 0, r.width, r.height);
    fctx.restore();

    const shimmerSpeed = 0.0015 * speedMult;
    const shimmerPhase = (nowMs * shimmerSpeed) % 1;
    const shimmerLocalY = shimmerPhase * r.height;
    fctx.save();
    fctx.globalAlpha = 0.18;
    fctx.globalCompositeOperation = 'lighter';
    fctx.translate(0, shimmerLocalY);
    fctx.fillStyle = r.shimmerGrad;
    fctx.fillRect(r.x, -20, r.width, 40);
    fctx.restore();

    if (r.height > 24 && r.noteName) {
      fctx.fillStyle    = r.track === TREBLE ? 'rgba(255,220,255,0.95)' : 'rgba(255,255,255,0.95)';
      fctx.shadowColor  = 'rgba(0,0,0,0.5)';
      fctx.shadowBlur   = 2;
      fctx.font         = 'bold 15px Arial';
      fctx.textAlign    = 'center';
      fctx.textBaseline = 'middle';
      fctx.fillText(r.noteName, r.x + r.width / 2, r.height / 2);
      fctx.shadowBlur   = 0;
    }

    fctx.restore();
    return true;
  });

  if (previewPhase) {
    let activeSet = null;
    for (const grp of previewGroups) {
      if (nowMs >= grp.landMs && nowMs < grp.litUntilMs) {
        if (!grp.fired) {
          grp.fired = true;
          grp.cleared = false;
          highlightSvgNote(grp.notes[0]);
        }
        activeSet = new Set(grp.notes.map(n => n.midi));
        break;
      } else if (grp.fired && !grp.cleared && nowMs >= grp.litUntilMs) {
        grp.cleared = true;
        clearSvgHighlight();
      }
    }
    drawKeyboard(activeSet ?? new Set(), pressedMidis);
  } else {
    drawKeyboard(expectedMidis, pressedMidis);
  }
}

/* ══════════════════════════════════════════════════════
   ANIMATION LOOP
══════════════════════════════════════════════════════ */
function runAnimLoop() {
  if (animFrame) cancelAnimationFrame(animFrame);
  function tick() { drawFalling(performance.now()); animFrame = requestAnimationFrame(tick); }
  tick();
}

/* ══════════════════════════════════════════════════════
   SYNTH
══════════════════════════════════════════════════════ */
function ensureSynth() {
  if (synth) return;
  synth = new Tone.Sampler({
    urls: {
      "C3":"C3.mp3","D#3":"Ds3.mp3","F#3":"Fs3.mp3","A3":"A3.mp3",
      "C4":"C4.mp3","D#4":"Ds4.mp3","F#4":"Fs4.mp3","A4":"A4.mp3",
      "C5":"C5.mp3","D#5":"Ds5.mp3","F#5":"Fs5.mp3","A5":"A5.mp3",
    },
    release: 1,
    baseUrl: "https://tonejs.github.io/audio/salamander/"
  }).toDestination();
}

/* ══════════════════════════════════════════════════════
   LOAD MIDI FROM URL
══════════════════════════════════════════════════════ */
function splitRepeated(notes) {
  const result = [];
  for (const n of notes) {
    const prev = result[result.length - 1];
    if (prev && prev.midi === n.midi && prev.track === n.track &&
        Math.abs((prev.time + prev.duration) - n.time) < 0.002) {
      prev.duration = Math.max(0, prev.duration - NOTE_GAP);
      result.push({ ...n, time: n.time + NOTE_GAP });
    } else { result.push({ ...n }); }
  }
  return result;
}

async function loadMidiBuffer(buf) {
  try {
    const midi = new Midi(buf);
    allNotes = [];
    midi.tracks.forEach((track, ti) => {
      const clef = ti === 0 ? TREBLE : BASS;
      track.notes.forEach(n => {
        if (n.midi < START_MIDI || n.midi > END_MIDI) return;
        allNotes.push({ midi: n.midi, time: n.time, duration: n.duration, track: clef });
      });
    });
    allNotes.sort((a,b) => a.time - b.time);
    allNotes = splitRepeated(allNotes);
    const bpm = midi.header.tempos.length ? midi.header.tempos[0].bpm : 120;
    secondsPerBeat    = 60 / bpm;
    secondsPerMeasure = secondsPerBeat * 4;
    originalBPM = Math.round(bpm);
    totalMeasures = Math.ceil(allNotes[allNotes.length - 1]?.time / secondsPerMeasure) + 1 || 4;
    document.getElementById('btnStart').disabled = false;
    document.getElementById('btnFree').disabled  = false;
    ensureSynth();
    showFeedback(`🎵 ${allNotes.length} notes · ${Math.round(bpm)} BPM`, 'info');
    buildProgressDots();
  } catch(err) {
    showFeedback('❌ Could not load MIDI', 'wrong');
    console.error(err);
  }
}

/* ══════════════════════════════════════════════════════
   SONG SELECTOR UI (unused in single-lesson mode)
══════════════════════════════════════════════════════ */
function buildSongList() { /* single lesson per page */ }

/* ══════════════════════════════════════════════════════
   SVG SCORE
══════════════════════════════════════════════════════ */
const scoreZone   = document.getElementById('scoreZone');
const svgWrapper  = document.getElementById('svgScrollWrapper');
const placeholder = document.getElementById('scorePlaceholder');

function parseSvgBounds(svgText) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const ySet = {};
  const polyRe = /points="([^"]+)"/g;
  let m;
  while ((m = polyRe.exec(svgText)) !== null) {
    const nums = m[1].trim().split(/[\s,]+/).map(Number);
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = nums[i], y = nums[i+1];
      if (isFinite(x) && isFinite(y)) {
        minX = Math.min(minX,x); maxX = Math.max(maxX,x);
        minY = Math.min(minY,y); maxY = Math.max(maxY,y);
        ySet[Math.round(y/5)*5] = true;
      }
    }
  }
  const pathRe = /d="([^"]+)"/g;
  while ((m = pathRe.exec(svgText)) !== null) {
    const d = m[1];
    const mlRe = /[ML]\s*([\d.]+)[,\s]+([\d.]+)/g;
    let cm;
    while ((cm = mlRe.exec(d)) !== null) {
      const x = parseFloat(cm[1]), y = parseFloat(cm[2]);
      if (x > 200 && x < 4000 && y > 200 && y < 2000) {
        minX = Math.min(minX,x); maxX = Math.max(maxX,x);
        minY = Math.min(minY,y); maxY = Math.max(maxY,y);
        ySet[Math.round(y/5)*5] = true;
      }
    }
  }
  return { minX, maxX, minY, maxY, yMids: Object.keys(ySet).map(Number).sort((a,b)=>a-b) };
}

function loadSvgScore(svgText) {
  placeholder.style.display = 'none';
  svgWrapper.style.display  = 'block';
  svgWrapper.innerHTML = svgText;
  const svgEl = svgWrapper.querySelector('svg');
  if (!svgEl) return;

  svgEl.removeAttribute('width');
  svgEl.removeAttribute('height');
  svgEl.querySelectorAll('title').forEach(t => t.remove());

  const { minX, maxX, minY, maxY, yMids } = parseSvgBounds(svgText);
  const [vbX, vbY, vbW, vbH] = (svgEl.getAttribute('viewBox') || '0 0 2977.23 2098.77').split(/\s+/).map(Number);

  let cropX = vbX, cropY = vbY, cropW = vbW, cropH = vbH;
  if (isFinite(minX) && maxX > minX && maxY > minY) {
    const pad = 60;
    cropX = Math.max(vbX, minX - pad);
    cropY = Math.max(vbY, minY - pad);
    cropW = Math.min(vbW, maxX + pad) - cropX;
    let bigGap = 0, gapMid = (minY + maxY) / 2;
    for (let i = 1; i < yMids.length; i++) {
      const g = yMids[i] - yMids[i-1];
      if (g > bigGap) { bigGap = g; gapMid = (yMids[i-1] + yMids[i]) / 2; }
    }
    const firstRowMaxY = bigGap > 80 ? gapMid : maxY;
    cropH = Math.min(vbH, firstRowMaxY + pad) - cropY;
    svgEl._fullVbY = cropY;
    svgEl._fullVbH = Math.min(vbH, maxY + pad) - cropY;
  }

  svgEl.setAttribute('viewBox', `${cropX} ${cropY} ${cropW} ${cropH}`);
  svgEl._vbW = cropW;
  svgEl._vbH = cropH;
  svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  const containerW = scoreZone.clientWidth || 860;
  const naturalH = Math.round(containerW * cropH / cropW);
  svgEl.style.width  = '100%';
  svgEl.style.height = naturalH + 'px';
  svgEl.style.display = 'block';

  initSvgScore(svgEl);
}

// ── SVG ↔ MIDI SYNC ──────────────────────────────────────────
// NOTE: These are runtime-computed per SVG — see _initSvgCoords()
let _svgStaffRows  = [];   // sorted list of { centerY, bottomY, halfH } per staff row
let _STEP_PX       = 12.401;
const _TREBLE_DIATONIC_UP   = [64,65,67,69,71,72,74,76,77,79,81,83,84];
const _TREBLE_DIATONIC_DOWN = [64,62,60,59,57,55,53,52,50,48,47,45,43];
const _BASS_DIATONIC_UP     = [43,45,47,48,50,52,53,55,57,59,60,62,64];
const _BASS_DIATONIC_DOWN   = [43,41,40,38,36,35,33,31,29,28,26,24];

// Auto-detect staff rows from barlines — works for any SVG coordinate system
function _initSvgCoords(svgEl) {
  const ySet = new Set();
  svgEl.querySelectorAll('polyline.BarLine').forEach(bl => {
    const pts = (bl.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
    if (pts.length >= 4) {
      // each barline has two Y values — use their midpoint as row center
      ySet.add(Math.round((pts[1] + pts[3]) / 2));
    }
  });
  // Cluster Y midpoints that are within 150px of each other into staff rows
  const ys = [...ySet].sort((a, b) => a - b);
  const clusters = [];
  for (const y of ys) {
    const last = clusters[clusters.length - 1];
    if (last && y - last[last.length - 1] < 150) last.push(y);
    else clusters.push([y]);
  }
  _svgStaffRows = clusters.map(cl => {
    const centerY = cl.reduce((a, b) => a + b, 0) / cl.length;
    return { centerY, halfH: 200 };  // ±200px around center covers the staff notes
  });

  // Auto-detect step size from StaffLines if available
  const staffLineYs = [];
  svgEl.querySelectorAll('polyline.StaffLines').forEach(sl => {
    const pts = (sl.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
    if (pts.length >= 2) staffLineYs.push(pts[1]);
  });
  if (staffLineYs.length >= 2) {
    const sorted = [...new Set(staffLineYs.map(y => Math.round(y)))].sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < sorted.length && i < 6; i++) {
      const g = sorted[i] - sorted[i - 1];
      if (g > 5 && g < 50) gaps.push(g);
    }
    if (gaps.length) _STEP_PX = gaps.reduce((a, b) => a + b) / gaps.length / 2;
  }
}

function _pitchFromTy(ty) {
  // Find which staff row this note belongs to
  let row = _svgStaffRows.find(r => Math.abs(ty - r.centerY) < r.halfH);
  if (!row && _svgStaffRows.length) {
    // fallback: nearest row
    row = _svgStaffRows.reduce((best, r) =>
      Math.abs(ty - r.centerY) < Math.abs(ty - best.centerY) ? r : best
    );
  }
  const bottomTy = row ? row.centerY + _STEP_PX * 2 : ty;
  const step = Math.round((ty - bottomTy) / _STEP_PX);
  if (step <= 0) return _TREBLE_DIATONIC_UP[Math.min(-step, _TREBLE_DIATONIC_UP.length - 1)];
  return _TREBLE_DIATONIC_DOWN[Math.min(step, _TREBLE_DIATONIC_DOWN.length - 1)];
}

let _svgBuckets      = {};
let _svgMeasureCount = 0;
let _svgHighlightEls = [];

function initSvgScore(svgEl) {
  _svgBuckets      = {};
  _svgMeasureCount = 0;
  _svgHighlightEls = [];
  svgNoteEls       = [];

  let defs = svgEl.querySelector('defs');
  if (!defs) { defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); svgEl.prepend(defs); }
  if (!defs.querySelector('#kidsGlow')) {
    defs.innerHTML += `<filter id="kidsGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur"/>
      <feFlood flood-color="#FFC107" flood-opacity="1" result="col"/>
      <feComposite in="col" in2="blur" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
  }

  // Auto-detect staff coordinate system from this SVG
  _initSvgCoords(svgEl);

  // Build per-row barline X dividers using auto-detected staff rows
  function internalDividers(xs) {
    const sorted = [...new Set(xs)].sort((a, b) => a - b);
    if (sorted.length === 0) return [];
    while (sorted.length >= 2 && sorted[sorted.length-1] - sorted[sorted.length-2] < 40) {
      sorted.pop();
    }
    sorted.pop();
    return sorted;
  }

  // Group barlines by which staff row they belong to
  const rowBarlineXs = _svgStaffRows.map(() => []);
  svgEl.querySelectorAll('polyline.BarLine').forEach(bl => {
    const pts = (bl.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
    if (pts.length < 2) return;
    const x = pts[0], y = pts[1];
    let bestRowIdx = 0, bestDist = Infinity;
    _svgStaffRows.forEach((row, i) => {
      const d = Math.abs(y - row.centerY);
      if (d < bestDist) { bestDist = d; bestRowIdx = i; }
    });
    rowBarlineXs[bestRowIdx].push(x);
  });
  const rowDividers = rowBarlineXs.map(xs => internalDividers(xs));

  // Count total measures per row so we can give each note a global measure number
  const rowMeasureCounts = rowDividers.map(d => d.length + 1);
  const rowMeasureOffsets = [0];
  for (let i = 0; i < rowMeasureCounts.length - 1; i++) {
    rowMeasureOffsets.push(rowMeasureOffsets[i] + rowMeasureCounts[i]);
  }

  svgEl.querySelectorAll('path.Note').forEach(el => {
    const tf = el.getAttribute('transform') || '';
    const mm = tf.match(/matrix\(\s*([\d.eE+\-]+)[,\s]+([\d.eE+\-]+)[,\s]+([\d.eE+\-]+)[,\s]+([\d.eE+\-]+)[,\s]+([\d.eE+\-]+)[,\s]+([\d.eE+\-]+)\s*\)/);
    if (!mm) return;
    const tx = parseFloat(mm[5]);
    const ty = parseFloat(mm[6]);

    // Find which row this note belongs to
    let rowIdx = -1, bestDist = Infinity;
    _svgStaffRows.forEach((row, i) => {
      const d = Math.abs(ty - row.centerY);
      if (d < row.halfH && d < bestDist) { bestDist = d; rowIdx = i; }
    });
    if (rowIdx < 0) return;

    // Local measure within row
    const dividers = rowDividers[rowIdx] || [];
    let local = 1;
    for (const bx of dividers) { if (tx > bx) local++; }
    const svgMeasure = rowMeasureOffsets[rowIdx] + local;

    const pitch = _pitchFromTy(ty);
    if (!_svgBuckets[svgMeasure]) _svgBuckets[svgMeasure] = { treble: [], bass: [] };
    _svgBuckets[svgMeasure].treble.push({ el, tx, ty, pitch, origFill: el.getAttribute('fill') || 'black' });
  });

  for (const m of Object.keys(_svgBuckets)) {
    for (const c of ['treble', 'bass']) {
      _svgBuckets[m][c].sort((a, b) => a.tx - b.tx);
    }
  }

  _svgMeasureCount = Math.max(...Object.keys(_svgBuckets).map(Number), 0);

  const stemTips = [];
  svgEl.querySelectorAll('polyline.Stem').forEach(st => {
    const pts = (st.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
    if (pts.length < 4) return;
    const x1 = pts[0], y1 = pts[1], y2 = pts[3];
    stemTips.push({ x: x1, tipY: Math.min(y1, y2), baseY: Math.max(y1, y2) });
  });
  for (const m of Object.keys(_svgBuckets)) {
    for (const entry of _svgBuckets[m].treble) {
      let best = null, bestDist = Infinity;
      for (const s of stemTips) {
        const dist = Math.abs(s.x - (entry.tx + 16));
        if (dist < bestDist) { bestDist = dist; best = s; }
      }
      entry.stemTipY = (best && bestDist < 40) ? best.tipY : null;
    }
  }

  const vb = (svgEl.getAttribute('viewBox') || '0 0 2977 2099').split(/\s+/).map(Number);
  svgEl._vbW = vb[2] || 2977;
  svgEl._vbH = vb[3] || 2099;
}

function _svgNoteheadFor(noteObj) {
  if (!_svgMeasureCount) return null;
  const midiMeasure = secondsPerMeasure > 0
    ? Math.floor(noteObj.time / secondsPerMeasure) + 1 : 1;
  const svgMeasure  = ((midiMeasure - 1) % _svgMeasureCount) + 1;

  const mStart = (midiMeasure - 1) * secondsPerMeasure;
  const mEnd   =  midiMeasure      * secondsPerMeasure;
  const sameInMidiMeasure = practiceNotes
    .filter(n => n.time >= mStart && n.time < mEnd && n.midi === noteObj.midi)
    .sort((a, b) => a.time - b.time);
  const occurrenceIdx = Math.max(0, sameInMidiMeasure.findIndex(n => Math.abs(n.time - noteObj.time) < 0.001));

  const bucket = _svgBuckets[svgMeasure]?.treble || [];
  const pitchMatches = bucket.filter(n => n.pitch === noteObj.midi);
  if (pitchMatches.length > 0) {
    return pitchMatches[Math.min(occurrenceIdx, pitchMatches.length - 1)];
  }

  let best = null, bestDist = Infinity;
  for (const n of bucket) {
    const d = Math.abs(n.pitch - noteObj.midi);
    if (d < bestDist) { bestDist = d; best = n; }
  }
  return best;
}

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function _noteName(midi) { return NOTE_NAMES[midi % 12] + Math.floor(midi/12 - 1); }

function highlightSvgNote(noteObj) {
  clearSvgHighlight();
  if (!_svgMeasureCount) return;

  const simultaneousNotes = practiceNotes.filter(n =>
    Math.abs(n.playTime - noteObj.playTime) < 0.015
  );

  const toHighlight = new Set();
  for (const n of (simultaneousNotes.length ? simultaneousNotes : [noteObj])) {
    const nh = _svgNoteheadFor(n);
    if (nh) toHighlight.add(nh);
  }

  const hlColours = ['#FF6B9D','#FFD93D','#6BCB77','#4D96FF','#FF9A3C','#C77DFF','#00C9A7'];
  let colIdx = 0;

  toHighlight.forEach(nh => {
    const svgEl = nh.el.closest('svg');
    if (!svgEl) { _svgHighlightEls.push(nh); return; }

    const colour = hlColours[colIdx % hlColours.length];
    colIdx++;

    const noteW = 32 * 0.992126;
    const noteH = 27 * 0.992126;
    const padX  = 18, padBottom = 16;

    const noteheadCentreY = nh.ty + noteH / 2 - 4;
    const stemTopY  = (nh.stemTipY != null) ? nh.stemTipY - 6 : noteheadCentreY - 90;
    const rectTop   = stemTopY;
    const rectBot   = noteheadCentreY + noteH / 2 + padBottom;
    const rectH     = rectBot - rectTop;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x',      (nh.tx - padX).toString());
    rect.setAttribute('y',      rectTop.toString());
    rect.setAttribute('width',  (noteW + padX * 2).toString());
    rect.setAttribute('height', rectH.toString());
    rect.setAttribute('rx',     '20');
    rect.setAttribute('ry',     '20');
    rect.setAttribute('fill',   colour);
    rect.setAttribute('opacity','0.45');
    rect.setAttribute('pointer-events', 'none');
    rect.classList.add('svg-note-highlight');

    nh.el.parentNode.insertBefore(rect, nh.el);
    nh._hlRect = rect;
    _svgHighlightEls.push(nh);
  });

  if (_svgHighlightEls.length) _scrollToSvgNote(_svgHighlightEls[0]);
}

function _scrollToSvgNote(item) { /* score stays static */ }

function clearSvgHighlight() {
  _svgHighlightEls.forEach(nh => {
    if (nh._hlRect && nh._hlRect.parentNode) {
      nh._hlRect.parentNode.removeChild(nh._hlRect);
      delete nh._hlRect;
    }
    nh.el.removeAttribute('filter');
    nh.el.setAttribute('fill', nh.origFill || 'black');
  });
  _svgHighlightEls = [];
  svgHighlighted   = [];
}

/* ══════════════════════════════════════════════════════
   PRACTICE MODE
══════════════════════════════════════════════════════ */
function buildPracticeNotes() {
  practiceNotes = allNotes.map(n => ({ ...n, playTime: n.time }));
  practiceNotes.sort((a,b) => a.playTime - b.playTime);
}

function buildProgressDots() {
  const pd = document.getElementById('progressDots');
  pd.innerHTML = '';
  practiceNotes.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'pdot'; d.id = 'pdot' + i;
    pd.appendChild(d);
  });
}

function updateProgressDot(idx, state) {
  document.querySelectorAll('.pdot').forEach(p => p.classList.remove('active','done'));
  for (let i = 0; i < idx; i++) { document.getElementById('pdot' + i)?.classList.add('done'); }
  document.getElementById('pdot' + idx)?.classList.add(state === 'active' ? 'active' : 'done');
}

function startPractice() {
  if (!allNotes.length) return;
  stopPractice(false);
  buildPracticeNotes();
  buildProgressDots();
  if (!practiceNotes.length) { showFeedback('No notes in that range!', 'wrong'); return; }
  trainingActive = true;
  trainingIdx = 0;
  waitingForInput = false;
  fallingRects = [];
  expectedMidis.clear();
  previewPhase = true;
  startPreview();
}

function startPreview() {
  ensureSynth();
  const prerollMs = (FALL_ZONE_HEIGHT / (FALL_SPEED * speedMult)) * 1000;
  const nowMs = performance.now();

  const groups = [];
  practiceNotes.forEach(n => {
    const last = groups[groups.length - 1];
    if (last && Math.abs(n.playTime - last.playTime) < 0.015) {
      last.notes.push(n);
      last.endTime = Math.max(last.endTime, n.playTime + n.duration);
    } else {
      groups.push({ playTime: n.playTime, notes: [n], endTime: n.playTime + n.duration });
    }
  });

  practiceNotes.forEach(n => {
    const visualSpawnMs = nowMs + (n.playTime * 1000 / speedMult);
    const audioDelayMs  = prerollMs + (n.playTime * 1000 / speedMult);
    spawnFalling(n.midi, n.duration, visualSpawnMs, n.track);
    const t = setTimeout(() => {
      if (!previewPhase) return;
      synth.triggerAttackRelease(getNoteName(n.midi), n.duration / speedMult);
    }, audioDelayMs);
    practiceTimeouts.push(t);
  });

  previewGroups = groups.map((grp, gi) => {
    const nextGrpTime = groups[gi + 1]?.playTime ?? grp.endTime;
    const litDurMs = Math.min(
      (grp.endTime - grp.playTime) * 1000 / speedMult,
      (nextGrpTime  - grp.playTime) * 1000 / speedMult - 40
    );
    return {
      notes: grp.notes,
      landMs: nowMs + (grp.playTime * 1000 / speedMult) + prerollMs,
      litUntilMs: nowMs + (grp.playTime * 1000 / speedMult) + prerollMs + Math.max(litDurMs, 80),
      fired: false,
      cleared: false,
    };
  });

  const lastNote = practiceNotes[practiceNotes.length - 1];
  const endDelay = prerollMs + (lastNote.playTime + lastNote.duration) * 1000 / speedMult + 600;
  practiceTimeouts.push(setTimeout(() => {
    if (!previewPhase) return;
    previewPhase = false;
    showFeedback('🎹 Your turn!', 'info');
    spawnNextNote();
  }, endDelay));
  runAnimLoop();
  showFeedback('👂 Listen first…', 'info');
}

function spawnNextNote() {
  if (!trainingActive) return;
  if (trainingIdx >= practiceNotes.length) { finishPractice(); return; }
  waitingForHold = false;
  holdPressTime  = {};
  clearTimeout(holdCheckTimer);
  stopHoldAnimation();
  const noteObj = practiceNotes[trainingIdx];
  expectedMidis.clear();
  for (let i = trainingIdx; i < practiceNotes.length; i++) {
    if (Math.abs(practiceNotes[i].playTime - noteObj.playTime) < 0.015) expectedMidis.add(practiceNotes[i].midi);
    else break;
  }
  const now = performance.now();
  expectedMidis.forEach(midi => {
    const dur = practiceNotes.find(n => n.midi === midi && Math.abs(n.playTime - noteObj.playTime) < 0.015)?.duration || 0.3;
    spawnFalling(midi, dur, now, practiceNotes.find(n => n.midi === midi && Math.abs(n.playTime - noteObj.playTime) < 0.015)?.track || TREBLE);
  });
  waitingForInput = true;
  updateProgressDot(trainingIdx, 'active');
  const names = [...expectedMidis].map(getNoteName).join(' + ');
  const badge = document.getElementById('noteBadge');
  badge.textContent = '🎵 ' + names;
  badge.classList.add('show');
  highlightSvgNote(noteObj);
  drawKeyboard(expectedMidis, pressedMidis);
}

/* ══════════════════════════════════════════════════════
   HOLD DETECTION
══════════════════════════════════════════════════════ */
const HOLD_FRACTION   = 0.82;
const HOLD_MIN_MS     = 120;

let holdPressTime    = {};
let holdRequired     = 0;
let holdCheckTimer   = null;
let holdAnimFrame    = null;

function drawHoldRings(progress) {
  const W = kbdCanvas.width, H = kbdCanvas.height;
  const w = W / TOTAL_WHITE;

  expectedMidis.forEach(midi => {
    const x = noteToX(midi);
    const bw  = noteRectWidth(midi);
    const isB = isBlack(midi);
    const cx  = x + bw / 2;
    const cy  = isB ? H * 0.58 : H * 0.82;
    const r   = isB ? Math.min(bw * 0.38, 10) : Math.min(w * 0.30, 16);

    kctx.beginPath();
    kctx.arc(cx, cy, r, 0, Math.PI * 2);
    kctx.strokeStyle = 'rgba(255,255,255,0.25)';
    kctx.lineWidth   = Math.max(2, r * 0.38);
    kctx.stroke();

    const endAngle = -Math.PI / 2 + progress * Math.PI * 2;
    kctx.beginPath();
    kctx.arc(cx, cy, r, -Math.PI / 2, endAngle);
    const col = progress >= 1 ? '#22C55E' : '#FFD93D';
    kctx.strokeStyle = col;
    kctx.lineWidth   = Math.max(2, r * 0.38);
    kctx.stroke();
  });
}

function startHoldAnimation() {
  const startTime = performance.now();
  function frame(now) {
    if (!waitingForHold) return;
    const progress = Math.min(1, (now - startTime) / holdRequired);
    drawKeyboard(expectedMidis, pressedMidis);
    drawHoldRings(progress);
    holdAnimFrame = requestAnimationFrame(frame);
  }
  holdAnimFrame = requestAnimationFrame(frame);
}

function stopHoldAnimation() {
  if (holdAnimFrame) { cancelAnimationFrame(holdAnimFrame); holdAnimFrame = null; }
}

let waitingForHold = false;

function advanceAfterHold() {
  if (!waitingForHold) return;
  waitingForHold = false;
  waitingForInput = false;
  stopHoldAnimation();
  showFeedback('⭐ Brilliant!', 'correct');
  burstStars();
  fallingRects = fallingRects.filter(r => !expectedMidis.has(r.midi));
  clearSvgHighlight();
  pressedMidis.forEach(m => { if (synth) synth.triggerRelease(getNoteName(m)); });
  let adv = trainingIdx;
  while (adv < practiceNotes.length &&
         Math.abs(practiceNotes[adv].playTime - practiceNotes[trainingIdx].playTime) < 0.015) adv++;
  trainingIdx = adv;
  updateProgressDot(trainingIdx - 1, 'done');
  setTimeout(() => { pressedMidis.clear(); holdPressTime = {}; drawKeyboard(); spawnNextNote(); }, 400);
}

/* ══════════════════════════════════════════════════════
   TEACHER HINT
══════════════════════════════════════════════════════ */
function getTeacherHint(playedMidi, expectedSet) {
  const played   = getNoteName(playedMidi);
  const expected = [...expectedSet].map(getNoteName);
  const targetMidi = [...expectedSet][0];
  const diff = playedMidi - targetMidi;

  const directionHint = diff > 0
    ? `Go lower → try ${expected.join(' + ')}`
    : `Go higher → try ${expected.join(' + ')}`;

  const semitones = Math.abs(diff);

  const playedLetter   = played.replace(/\d/g, '');
  const expectedLetter = expected[0].replace(/\d/g, '');
  if (playedLetter === expectedLetter && semitones !== 0) {
    const oct = diff > 0 ? 'lower' : 'higher';
    return `Almost! That's ${played}... you need the ${oct} ${expectedLetter}. ${expected.join(' + ')}`;
  }

  if (semitones === 1) return `One key ${diff > 0 ? 'down' : 'up'}! You played ${played}, need ${expected.join(' + ')}`;
  if (semitones === 2) return `Close! Shift ${diff > 0 ? 'left' : 'right'} 2 keys → ${expected.join(' + ')}`;

  if (isBlack(playedMidi) && !isBlack(targetMidi)) return `That's a sharp/flat key! Find the white key ${expected.join(' + ')} 🎹`;
  if (!isBlack(playedMidi) && isBlack(targetMidi)) return `Need the black key ${expected.join(' + ')}! Look for the dark key 🖤`;

  if (expectedSet.size > 1) {
    const missing = [...expectedSet].filter(m => !pressedMidis.has(m)).map(getNoteName);
    return `You need both ${expected.join(' and ')}! Still need: ${missing.join(', ')}`;
  }

  return `That was ${played}. ${directionHint}`;
}

/* ══════════════════════════════════════════════════════
   NOTE INPUT
══════════════════════════════════════════════════════ */
function processNoteOn(midi) {
  if (freeMode) {
    pressedMidis.add(midi);
    ensureSynth();
    synth.triggerAttack(getNoteName(midi));
    drawKeyboard(new Set(), pressedMidis);
    return;
  }
  if (!trainingActive || (!waitingForInput && !waitingForHold)) return;

  if (!expectedMidis.has(midi)) {
    if (waitingForHold) {
      waitingForHold = false;
      waitingForInput = true;
      stopHoldAnimation();
      clearTimeout(holdCheckTimer);
      pressedMidis.forEach(m => { if (synth) synth.triggerRelease(getNoteName(m)); });
      pressedMidis.clear();
      holdPressTime = {};
    }
    showFeedback(getTeacherHint(midi, expectedMidis), 'wrong');
    pressedMidis.add(midi);
    drawKeyboard(expectedMidis, pressedMidis);
    ensureSynth();
    synth.triggerAttackRelease(getNoteName(midi), 0.2);
    setTimeout(() => { pressedMidis.delete(midi); drawKeyboard(expectedMidis, pressedMidis); }, 300);
    return;
  }

  if (!waitingForInput) return;

  pressedMidis.add(midi);
  holdPressTime[midi] = performance.now();
  ensureSynth();
  synth.triggerAttack(getNoteName(midi));
  drawKeyboard(expectedMidis, pressedMidis);

  if ([...expectedMidis].every(m => pressedMidis.has(m))) {
    waitingForInput = false;
    waitingForHold  = true;

    const noteObj = practiceNotes[trainingIdx];
    const noteDurMs = (noteObj.duration / speedMult) * 1000;
    holdRequired = Math.max(HOLD_MIN_MS, noteDurMs * HOLD_FRACTION);

    const beats = noteObj.duration / secondsPerBeat;
    let hint = '🎵 Hold…';
    if (beats >= 3.5)      hint = '𝅝 Hold... whole note!';
    else if (beats >= 1.5) hint = '𝅗𝅥 Hold... minim!';
    else                   hint = '♩ Hold... crotchet!';
    showFeedback(hint, 'info');

    startHoldAnimation();
    holdCheckTimer = setTimeout(advanceAfterHold, holdRequired);
  }
}

function processNoteOff(midi) {
  if (waitingForHold && expectedMidis.has(midi)) {
    const elapsed = performance.now() - (holdPressTime[midi] || performance.now());
    if (elapsed < holdRequired * 0.92) {
      waitingForHold = false;
      waitingForInput = true;
      stopHoldAnimation();
      clearTimeout(holdCheckTimer);
      pressedMidis.forEach(m => { if (synth) synth.triggerRelease(getNoteName(m)); });
      pressedMidis.clear();
      holdPressTime = {};
      showFeedback('⏳ Keep holding! Don\'t let go yet! Feel the full note length', 'wrong');
      drawKeyboard(expectedMidis, pressedMidis);
      return;
    }
  }

  pressedMidis.delete(midi);
  if (freeMode && synth) synth.triggerRelease(getNoteName(midi));
  drawKeyboard(freeMode ? new Set() : expectedMidis, pressedMidis);
}

function finishPractice() {
  trainingActive = false; waitingForInput = false;
  document.getElementById('noteBadge').classList.remove('show');
  showFeedback('🌟 Amazing! You did it!', 'correct');
  document.querySelectorAll('.pdot').forEach(p => p.classList.add('done'));
  clearSvgHighlight(); drawKeyboard();
  if (loopEnabled) setTimeout(() => { if (loopEnabled) startPractice(); }, 1200);
}

function stopPractice(resetVis = true) {
  previewPhase = false; trainingActive = false; waitingForInput = false;
  waitingForHold = false;
  stopHoldAnimation();
  clearTimeout(holdCheckTimer);
  holdPressTime = {};
  practiceTimeouts.forEach(t => clearTimeout(t)); practiceTimeouts = [];
  previewGroups = [];
  expectedMidis.clear(); pressedMidis.clear();
  if (resetVis) {
    fallingRects = []; clearSvgHighlight(); drawKeyboard();
    document.getElementById('noteBadge').classList.remove('show');
    document.getElementById('feedbackBubble').classList.remove('show');
  }
}

/* ══════════════════════════════════════════════════════
   KEYBOARD POINTER HIT TEST
══════════════════════════════════════════════════════ */
function hitTestKeyboard(x, y) {
  const W = kbdCanvas.width, H = kbdCanvas.height;
  const w = W / TOTAL_WHITE;
  const bw = w * 0.58, bh = H * 0.62;
  for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
    if (!isBlack(midi)) continue;
    const belowIdx = WHITE_KEYS.indexOf(midi - 1);
    if (belowIdx < 0) continue;
    const bx = belowIdx * w + w - bw / 2;
    if (x >= bx && x <= bx + bw && y >= 0 && y <= bh) return midi;
  }
  const wIdx = Math.floor(x / w);
  if (wIdx >= 0 && wIdx < WHITE_KEYS.length) return WHITE_KEYS[wIdx];
  return null;
}

function getCanvasPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}
function getTouchCanvasPos(touch, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
}

kbdCanvas.addEventListener('mousedown', async e => {
  await Tone.start();
  const { x, y } = getCanvasPos(e, kbdCanvas);
  const midi = hitTestKeyboard(x, y);
  if (midi !== null) processNoteOn(midi);
});
kbdCanvas.addEventListener('mouseup', e => {
  const { x, y } = getCanvasPos(e, kbdCanvas);
  const midi = hitTestKeyboard(x, y);
  if (midi !== null) processNoteOff(midi);
});
kbdCanvas.addEventListener('mouseleave', () => {
  pressedMidis.forEach(m => processNoteOff(m));
});
kbdCanvas.addEventListener('touchstart', async e => {
  e.preventDefault(); await Tone.start();
  for (const t of e.changedTouches) {
    const { x, y } = getTouchCanvasPos(t, kbdCanvas);
    const midi = hitTestKeyboard(x, y);
    if (midi !== null) processNoteOn(midi);
  }
}, { passive: false });
kbdCanvas.addEventListener('touchend', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const { x, y } = getTouchCanvasPos(t, kbdCanvas);
    const midi = hitTestKeyboard(x, y);
    if (midi !== null) processNoteOff(midi);
  }
}, { passive: false });

/* ══════════════════════════════════════════════════════
   FEEDBACK & STARS
══════════════════════════════════════════════════════ */
function showFeedback(msg, type = 'correct') {
  const el = document.getElementById('feedbackBubble');
  el.textContent = msg;
  el.className = 'show ' + type;
  clearTimeout(el._t);
  const duration = type === 'wrong' ? 3200 : 2200;
  el._t = setTimeout(() => el.classList.remove('show'), duration);
}

function burstStars() {
  const cont = document.getElementById('starsContainer');
  const emojis = ['⭐','🌟','✨','💛','🎉','🎵'];
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('div');
    s.className = 'star'; s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    s.style.left = (20 + Math.random() * 60) + '%';
    s.style.top  = (20 + Math.random() * 60) + '%';
    s.style.setProperty('--dx', ((Math.random() - 0.5) * 120) + 'px');
    s.style.setProperty('--dy', (-(40 + Math.random() * 80)) + 'px');
    cont.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

/* ══════════════════════════════════════════════════════
   BUTTON WIRING
══════════════════════════════════════════════════════ */
document.getElementById('btnStart').addEventListener('click', async () => {
  await Tone.start();
  document.getElementById('btnStop').disabled = false;
  startPractice(); runAnimLoop();
});
document.getElementById('btnStop').addEventListener('click', () => {
  stopPractice(true);
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  drawFalling(performance.now()); drawKeyboard();
  showFeedback('Stopped 👋', 'info');
});
document.getElementById('btnReset').addEventListener('click', () => {
  stopPractice(true); trainingIdx = 0;
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  freeMode = false;
  document.getElementById('btnFree').classList.remove('active');
  document.getElementById('btnFree').textContent = '🎹 Free Play';
  document.getElementById('progressDots').innerHTML = '';
  drawFalling(performance.now()); drawKeyboard();
  showFeedback('Reset! 🔄', 'info');
});
document.getElementById('btnSpeedDown').addEventListener('click', () => {
  if (speedIdx > 0) speedIdx--;
  speedMult = SPEED_STEPS[speedIdx];
  document.getElementById('speedDisplay').textContent = speedMult.toFixed(2) + '×';
});
document.getElementById('btnSpeedUp').addEventListener('click', () => {
  if (speedIdx < SPEED_STEPS.length - 1) speedIdx++;
  speedMult = SPEED_STEPS[speedIdx];
  document.getElementById('speedDisplay').textContent = speedMult.toFixed(2) + '×';
});
document.getElementById('btnFree').addEventListener('click', async () => {
  await Tone.start(); ensureSynth();
  freeMode = !freeMode;
  stopPractice(false); trainingActive = false; fallingRects = [];
  expectedMidis.clear(); pressedMidis.clear(); clearSvgHighlight();
  document.getElementById('noteBadge').classList.remove('show');
  const btn = document.getElementById('btnFree');
  if (freeMode) {
    btn.classList.add('active'); btn.textContent = '✋ Exit Free Play';
    showFeedback('🎹 Play any note!', 'info'); runAnimLoop();
  } else {
    btn.classList.remove('active'); btn.textContent = '🎹 Free Play';
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
    drawKeyboard();
  }
});
document.getElementById('btnLoop').addEventListener('click', () => {
  loopEnabled = !loopEnabled;
  const btn = document.getElementById('btnLoop');
  btn.classList.toggle('active', loopEnabled);
  btn.textContent = loopEnabled ? '🔁 Loop ON' : '🔁 Loop';
});

/* ══════════════════════════════════════════════════════
   DARK MODE
══════════════════════════════════════════════════════ */
const dmBtn = document.getElementById('darkModeToggle');
dmBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  dmBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

/* ══════════════════════════════════════════════════════
   VIDEO MODAL
══════════════════════════════════════════════════════ */
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;

function openVideoModal() {
  const modal = document.getElementById('videoModal');
  const iframe = document.getElementById('lessonVideo');
  const placeholder = document.getElementById('videoPlaceholder');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Set video src from LESSON config if not already set
  if (L.videoUrl && !iframe.src) iframe.src = L.videoUrl;
  const hasSrc = iframe.src && iframe.src !== '' && iframe.src !== window.location.href;
  placeholder.style.display = hasSrc ? 'none' : 'flex';
  iframe.style.display = hasSrc ? 'block' : 'none';
}

function closeVideoModal() {
  const modal = document.getElementById('videoModal');
  const iframe = document.getElementById('lessonVideo');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  const saved = iframe.src;
  iframe.src = '';
  setTimeout(() => { iframe.src = saved; }, 50);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeVideoModal();
});

window.addEventListener('resize', resizeCanvases);

/* ══════════════════════════════════════════════════════
   INIT — fetch MIDI + SVG from lesson URLs
══════════════════════════════════════════════════════ */
buildSongList();
resizeCanvases();
runAnimLoop();
drawKeyboard();

// Auto-open video modal after short delay
window.addEventListener('load', () => {
  setTimeout(openVideoModal, 800);
});

(async () => {
  try {
    // Load MIDI
    const midiRes = await fetch(L.midiUrl);
    if (!midiRes.ok) throw new Error('MIDI fetch failed: ' + midiRes.status);
    const buf = await midiRes.arrayBuffer();
    await loadMidiBuffer(buf);

    // Load SVG
    if (L.svgUrl) {
      const svgRes = await fetch(L.svgUrl);
      if (svgRes.ok) {
        const svgText = await svgRes.text();
        loadSvgScore(svgText);
        resizeCanvases();
      }
    }
  } catch(e) {
    console.error('Lesson load failed:', e);
    showFeedback('❌ Could not load lesson files', 'wrong');
  }
})();
