// ── ENGINE BOOT: wire SONG_CONFIG values into the DOM ──────────────────────
(function bootDom() {
  const cfg = window.SONG_CONFIG;

  // Page title & h1
  document.title = cfg.title || "Song";
  const h1 = document.getElementById("songTitle");
  if (h1) h1.textContent = cfg.title || "";

  // Brand link
  const bl = document.getElementById("brandLink");
  if (bl) {
    bl.href = cfg.brandUrl || "#";
    const bn = document.getElementById("brandName");
    if (bn) bn.textContent = cfg.brandName || "";
  }

  // YouTube button
  const yt = document.getElementById("youtubeBtn");
  if (yt) {
    if (cfg.youtubeUrl) {
      yt.href = cfg.youtubeUrl;
      yt.style.display = "";
      const lbl = document.getElementById("youtubeBtnLabel");
      if (lbl && cfg.youtubeLabel) lbl.textContent = cfg.youtubeLabel;
    } else {
      yt.style.display = "none";
    }
  }

  // Section shortcuts
  const sel = document.getElementById("sectionShortcut");
  if (sel && cfg.sections && cfg.sections.length) {
    // Remove any existing non-placeholder options
    while (sel.options.length > 1) sel.remove(1);
    cfg.sections.forEach(sec => {
      const opt = document.createElement("option");
      opt.value = `${sec.start}-${sec.end}`;
      opt.textContent = `${sec.label} (${sec.start} – ${sec.end})`;
      sel.appendChild(opt);
    });
  }
})();
// ────────────────────────────────────────────────────────────────────────────
import { Midi } from 'https://esm.sh/@tonejs/midi@2.0.28';
// ================================
// SONG CONFIG — loaded from window.SONG_CONFIG (set by each song's HTML)
// ================================
if (!window.SONG_CONFIG) throw new Error("[engine] window.SONG_CONFIG is not defined. Each song HTML must set it before loading engine.js.");
const SONG_CONFIG = window.SONG_CONFIG;

// ============================================================
// THEME — driven by SONG_CONFIG.
// Three tiers, checked in order:
//   1. SONG_CONFIG.themeOverride — full hand-crafted object, used as-is
//   2. SONG_CONFIG.accentPrimary — one hex drives derivation of all slots
//   3. No config — exact original purple/gold defaults
// ============================================================
(function buildTheme() {
  // Tier 1: full override supplied by song
  if (SONG_CONFIG.themeOverride) {
    window.ENGINE_THEME = SONG_CONFIG.themeOverride;
    return;
  }
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba([r,g,b], a) { return `rgba(${r},${g},${b},${a})`; }
  function lighten([r,g,b], t) {
    return [Math.round(r+(255-r)*t), Math.round(g+(255-g)*t), Math.round(b+(255-b)*t)];
  }
  function darken([r,g,b], t) {
    return [Math.round(r*(1-t)), Math.round(g*(1-t)), Math.round(b*(1-t))];
  }
  function toHex([r,g,b]) { return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join(''); }

  const hasAccent    = !!SONG_CONFIG.accentPrimary;
  const hasBassAccent = !!SONG_CONFIG.accentBass;

  if (!hasAccent) {
    // ── No accent supplied: use the exact original hand-crafted purple/gold values ──
    window.ENGINE_THEME = {
      trebleNote:        '#9B2C6E',
      bassNote:          '#B45309',
      trebleFallTop:     'rgba(220,180,220,0.92)',
      trebleFallMid1:    'rgba(168,100,160,0.88)',
      trebleFallMid2:    'rgba(120,30,90,0.90)',
      trebleFallBot:     'rgba(80,10,50,0.94)',
      trebleFallShadow:  'rgba(160,40,120,0.60)',
      bassFallTop:       'rgba(255,251,150,0.92)',
      bassFallMid1:      'rgba(255,236,50,0.88)',
      bassFallMid2:      'rgba(250,204,21,0.90)',
      bassFallBot:       'rgba(202,138,4,0.94)',
      bassFallShadow:    'rgba(245,158,11,0.4)',
      whiteKeyTrebleTop: '#E8C8E8',
      whiteKeyTrebleBot: '#7B1F5A',
      whiteKeyBassTop:   '#FFECB3',
      whiteKeyBassBot:   '#FFB300',
      blackKeyTrebleTop: '#E8C8E8',
      blackKeyTrebleBot: '#7B1F5A',
      blackKeyBassTop:   '#FEF9C3',
      blackKeyBassBot:   '#CA8A04',
      keyTrebleGlowShadow: '#C060A0',
      keyTrebleGlowFillW:  'rgba(160,40,120,0.18)',
      keyTrebleGlowFillB:  'rgba(160,40,120,0.45)',
      keyBassGlowShadow:   '#FDE047',
      keyBassGlowFillW:    'rgba(253,224,71,0.15)',
      keyLabelTreble:      '#F5D0F0',
      keyLabelBass:        '#78350F',
      fallingLabelTreble:  'rgba(255,220,255,0.95)',
      fallingLabelBass:    'rgba(255,255,255,0.95)',
      bpmFocusBorder:  'rgba(255,193,7,0.6)',
      bpmFocusShadow:  'rgba(255,193,7,0.15)',
      bpmBlurBorder:   'rgba(255,193,7,0.25)',
    };
    return;
  }

  // ── Accent supplied: derive all colors from it ──
  const tRaw = hexToRgb(SONG_CONFIG.accentPrimary);
  const bRaw = hasBassAccent ? hexToRgb(SONG_CONFIG.accentBass) : [180, 83, 9];

  const tL1 = lighten(tRaw, 0.55);
  const tL2 = lighten(tRaw, 0.30);
  const tD1 = darken(tRaw,  0.20);
  const tD2 = darken(tRaw,  0.45);
  const bL1 = lighten(bRaw, 0.80);
  const bL2 = lighten(bRaw, 0.55);
  const bD1 = darken(bRaw,  0.10);
  const bD2 = darken(bRaw,  0.40);

  window.ENGINE_THEME = {
    trebleNote:        toHex(tRaw),
    bassNote:          toHex(bRaw),
    trebleFallTop:     rgba(tL1, 0.92),
    trebleFallMid1:    rgba(tL2, 0.88),
    trebleFallMid2:    rgba(tRaw, 0.90),
    trebleFallBot:     rgba(tD2, 0.94),
    trebleFallShadow:  rgba(tD1, 0.60),
    bassFallTop:       rgba(bL1, 0.92),
    bassFallMid1:      rgba(bL2, 0.88),
    bassFallMid2:      rgba(bRaw, 0.90),
    bassFallBot:       rgba(bD2, 0.94),
    bassFallShadow:    rgba(bD1, 0.40),
    whiteKeyTrebleTop: toHex(lighten(tRaw, 0.60)),
    whiteKeyTrebleBot: toHex(darken(tRaw, 0.30)),
    whiteKeyBassTop:   toHex(lighten(bRaw, 0.70)),
    whiteKeyBassBot:   toHex(bRaw),
    blackKeyTrebleTop: toHex(lighten(tRaw, 0.60)),
    blackKeyTrebleBot: toHex(darken(tRaw, 0.30)),
    blackKeyBassTop:   toHex(lighten(bRaw, 0.80)),
    blackKeyBassBot:   toHex(darken(bRaw, 0.25)),
    keyTrebleGlowShadow: toHex(tL2),
    keyTrebleGlowFillW:  rgba(tRaw, 0.18),
    keyTrebleGlowFillB:  rgba(tRaw, 0.45),
    keyBassGlowShadow:   toHex(bL1),
    keyBassGlowFillW:    rgba(bRaw, 0.15),
    keyLabelTreble:      toHex(lighten(tRaw, 0.65)),
    keyLabelBass:        toHex(darken(bRaw, 0.45)),
    fallingLabelTreble:  rgba(lighten(tRaw, 0.70), 0.95),
    fallingLabelBass:    'rgba(255,255,255,0.95)',
    bpmFocusBorder:  rgba(tRaw, 0.6),
    bpmFocusShadow:  rgba(tRaw, 0.15),
    bpmBlurBorder:   rgba(tRaw, 0.25),
  };
})();
const THEME = window.ENGINE_THEME;

// Repeat map — songs with no repeats use identity mapping
const REPEAT_START = SONG_CONFIG.repeatStart || 0;
const REPEAT_END   = SONG_CONFIG.repeatEnd   || 0;
const REPEAT_LEN   = SONG_CONFIG.repeatLen   || 0;
const REPEAT_PHYSICAL_OFFSET = SONG_CONFIG.repeatPhysicalOffset || 0;
function buildPhysicalToLogicalMap(config) {
  const map = [];
  if (config.buildPhysicalToLogical) {
    return config.buildPhysicalToLogical(map);
  }
  // Default: no repeats — physical === logical
  for (let p = 1; p <= config.measures; p++) {
    map[p] = p;
  }
  return map;
}
const PHYSICAL_TO_LOGICAL = buildPhysicalToLogicalMap(SONG_CONFIG);

let MAX_LOGICAL_MEASURE = 0;
for (let p = 1; p <= SONG_CONFIG.measures; p++) {
  MAX_LOGICAL_MEASURE = Math.max(MAX_LOGICAL_MEASURE, PHYSICAL_TO_LOGICAL[p] || 0);
}


// Displays a visible error banner and disables all controls when the MIDI
// file cannot be loaded. Provides a Retry button so the user doesn't need
// to reload the page manually.
function showMidiLoadError(message) {
    setControlsEnabled(false);
    const banner = document.getElementById('midiLoadError');
    if (!banner) return;
    banner.innerHTML =
        `⚠️ Could not load the song file: <em>${message}</em>` +
        `<button onclick="window._retryMidiLoad()">Retry</button>`;
    banner.classList.add('visible');
}

// Exposed on window so the Retry button's inline onclick can reach it
// (the main script runs as type="module" — module scope is not global).
window._retryMidiLoad = async function() {
    try {
        await loadSongMidi();
    } catch (err) {
        showMidiLoadError(err.message || String(err));
    }
};

async function loadSongMidi() {
    // Hide any previous error
    const errorBanner = document.getElementById('midiLoadError');
    if (errorBanner) errorBanner.classList.remove('visible');

    let response;
    try {
        response = await fetch(SONG_CONFIG.midiFile);
    } catch (networkErr) {
        throw new Error(`Network error — ${networkErr.message}`);
    }

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for "${SONG_CONFIG.midiFile}" — check the file path`);
    }

    const arrayBuffer = await response.arrayBuffer();

    currentMidi = new Midi(arrayBuffer);

    allMidiNotes = [];

    currentMidi.tracks.forEach((track, trackIndex) => {
        // Track 0 = TREBLE (right hand), Track 1 = BASS (left hand)
        const clef = trackIndex === 0 ? TREBLE : BASS;
        track.notes.forEach(note => {
            allMidiNotes.push({
                midi: note.midi,
                time: note.time,
                duration: note.duration,
                track: clef
            });
        });
    });

    allMidiNotes.sort((a, b) => a.time - b.time);
    allMidiNotes = splitRepeatedNotes(allMidiNotes);

    const bpm = currentMidi.header.tempos.length
        ? currentMidi.header.tempos[0].bpm
        : 120;

    // For 2/2 cut time (timeSignature[1] === 2), MuseScore encodes the MIDI at the
    // quarter-note BPM, but each score beat is a half note (= 2 quarter notes).
    // Multiply secondsPerBeat by 2 so that MIDI measure boundaries align with the
    // visual barlines in the SVG.
    if (SONG_CONFIG.timeSignature[1] === 2) {
        secondsPerBeat = (60 / bpm) * 2;
    } else {
        secondsPerBeat = 60 / bpm;
    }
    secondsPerMeasure = secondsPerBeat * SONG_CONFIG.timeSignature[0];
    if (typeof SONG_CONFIG.buildMeasureTimeMap === 'function') {
        MEASURE_TIME_MAP = SONG_CONFIG.buildMeasureTimeMap(SONG_CONFIG, currentMidi.header.tempos, secondsPerBeat);
    } else {
        MEASURE_TIME_MAP = buildMeasureTimeMap(SONG_CONFIG, secondsPerBeat);
    }

    setControlsEnabled(true);

    // Clamp panel measure inputs to the actual song length now that we know it.
    const _psm = document.getElementById('panelStartMeasure');
    const _pem = document.getElementById('panelEndMeasure');
    if (_psm) _psm.max = MAX_LOGICAL_MEASURE;
    if (_pem) _pem.max = MAX_LOGICAL_MEASURE;

    showTrainingProgress();
    buildMeasureTimeline(SONG_CONFIG.measures);
    const bpmEl = document.getElementById('statBPM');
    if (bpmEl) bpmEl.textContent = Math.round(60 / secondsPerBeat);
    const pBpm = document.getElementById('panelStatBPM');
    if (pBpm) pBpm.textContent = Math.round(60 / secondsPerBeat);
    originalBPM = Math.round(60 / secondsPerBeat);
    const bpmInput = document.getElementById('bpmInput');
    if (bpmInput) bpmInput.value = originalBPM;

    console.log("🎵 Song loaded", allMidiNotes.length, "notes");
}

// ==================================
// MEASURE → TIME MAPPING
// ==================================
function buildMeasureTimeMap(config, secondsPerBeat) {
    // Support mid-song time signature changes via config.timeSignatureChanges:
    // e.g. [{ measure: 53, beats: 2 }, { measure: 69, beats: 4 }]
    // Each entry overrides the beat count from that measure onwards.
    const changes = (config.timeSignatureChanges || [])
        .slice()
        .sort((a, b) => a.measure - b.measure);

    function beatsForMeasure(m) {
        let beats = config.timeSignature[0];
        for (const ch of changes) {
            if (m >= ch.measure) beats = ch.beats;
            else break;
        }
        return beats;
    }

    const map = {};
    let currentTime = 0;

    for (let measure = 1; measure <= config.measures; measure++) {
        const beats = beatsForMeasure(measure);
        const dur = beats * secondsPerBeat;
        map[measure] = {
            start: currentTime,
            end: currentTime + dur
        };
        currentTime += dur;
    }

    return map;
}
// ================================
// TIME → MEASURE LOOKUP
// ================================
function getMeasureFromTime(timeSeconds) {
    const EPS = 1e-6;
    const t = timeSeconds + EPS;
    // Binary search through MEASURE_TIME_MAP (handles non-uniform measure durations)
    let lo = 1, hi = SONG_CONFIG.measures;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const entry = MEASURE_TIME_MAP[mid];
        if (!entry) { hi = mid - 1; continue; }
        if (t < entry.start)      hi = mid - 1;
        else if (t >= entry.end)  lo = mid + 1;
        else                      return mid;
    }
    // Guard: clamp to last measure if time is at or past its end
    const lastEntry = MEASURE_TIME_MAP[SONG_CONFIG.measures];
    if (lastEntry && t >= lastEntry.start && t <= lastEntry.end + EPS) {
        return SONG_CONFIG.measures;
    }
    return null;
}


function getLogicalSheetMeasureFromTime(timeSeconds) {
  const physicalMeasure = getMeasureFromTime(timeSeconds);
  if (physicalMeasure === null) return null;
  return PHYSICAL_TO_LOGICAL[physicalMeasure] ?? null;
}

// ================================
// PRACTICE SEQUENCE BUILDER (PHYSICAL MEASURES)
// ================================

// Repeat mapping — falls back to identity (no repeats) if not provided by song config
function logicalToPhysicalFirst(logical) {
  return SONG_CONFIG.logicalToPhysicalFirst ? SONG_CONFIG.logicalToPhysicalFirst(logical) : logical;
}
function logicalToPhysicalSecond(logical) {
  return SONG_CONFIG.logicalToPhysicalSecond ? SONG_CONFIG.logicalToPhysicalSecond(logical) : null;
}

function buildPhysicalPracticeMeasureSequence(startLogical, endLogical, skipRepeats) {
  // Songs can override the sequencing strategy (e.g. block repeats vs per-measure repeats).
  if (typeof SONG_CONFIG.buildPhysicalPracticeMeasureSequence === 'function') {
    return SONG_CONFIG.buildPhysicalPracticeMeasureSequence(
      startLogical, endLogical, skipRepeats,
      { logicalToPhysicalFirst, logicalToPhysicalSecond, MAX_LOGICAL_MEASURE, SONG_CONFIG }
    );
  }
  if (startLogical > endLogical) return null;
  const seq = [];
  const logicalSeq = [];
  for (let l = startLogical; l <= endLogical; l++) {
    if (l > MAX_LOGICAL_MEASURE) return null;
    const p1 = logicalToPhysicalFirst(l);
    if (p1 > SONG_CONFIG.measures) return null;
    seq.push(p1);
    logicalSeq.push(l);
    if (!skipRepeats) {
      const p2 = logicalToPhysicalSecond(l);
      if (p2 !== null && p2 <= SONG_CONFIG.measures) {
        seq.push(p2);
        logicalSeq.push(l);
      }
    }
  }
  return { seq, logicalSeq };
}


// ================================
// CLEF DEFINITIONS (TRACK-BASED)
// ================================

const TREBLE = "treble";
const BASS = "bass";
const notesDisplay = document.getElementById('notesDisplay');
const noteList = document.getElementById('noteList');
const playbackControls = document.getElementById('playbackControls');

  function setControlsEnabled(enabled) {
    const controls = playbackControls.querySelectorAll(
        'button, select, input[type="number"], input[type="checkbox"]'
    );

    controls.forEach(el => {
        if (el.id === 'freeModeButton') return;
        el.disabled = !enabled;
    });

    // Panel speed buttons live outside #playbackControls — handle them explicitly
    const panelDown = document.getElementById('panelSpeedDown');
    const panelUp   = document.getElementById('panelSpeedUp');
    if (panelDown) panelDown.disabled = !enabled;
    if (panelUp)   panelUp.disabled   = !enabled;
}

const startMeasureInput = document.getElementById('startMeasureInput');
const endMeasureInput = document.getElementById('endMeasureInput');
const startPracticeButton = document.getElementById('startPracticeButton');
const stopButton = document.getElementById('stopButton');
stopButton.addEventListener('click', () => {
    stopPlayback(true);
});

const toggleNamesButton = document.getElementById('toggleNamesButton');
const speedDownButton = document.getElementById('speedDown');
const speedUpButton = document.getElementById('speedUp');
const speedDisplay = document.getElementById('speedDisplay');
const resetButton = document.getElementById('resetButton');
resetButton.addEventListener('click', () => {
    resetAll();
});

const playSongButton = document.getElementById('playSongButton');
const loopCheckbox = document.getElementById('loopCheckbox');
const freeModeButton = document.getElementById('freeModeButton');
freeModeButton.classList.add('side-floating');
// Controls stay disabled until loadSongMidi() finishes successfully.
// (loadSongMidi calls setControlsEnabled(true) at the end on success.)
setControlsEnabled(false);
(async () => {
    try {
        await loadSongMidi();
    } catch (err) {
        console.error('[FATAL] loadSongMidi failed:', err);
        showMidiLoadError(err.message || String(err));
    }
})();


function updateSpeed(delta) {
    if (visualsPlaying || previewMode || speedLocked) return;

    speedMultiplier = Math.min(
        2.0,
        Math.max(0.25, +(speedMultiplier + delta).toFixed(2))
    );

    speedDisplay.textContent = speedMultiplier.toFixed(2) + "×";

    // Sync BPM input and stat display to reflect new effective BPM
    syncBpmDisplay();

    if (metronomeRunning) {
        startMetronome();
    }
}


speedDownButton.addEventListener('click', () => updateSpeed(-0.25));
speedUpButton.addEventListener('click', () => updateSpeed(+0.25));
// Note: speedDown/speedUp enabled state is managed entirely by setControlsEnabled()
// and setSpeedButtonsEnabled(). Do NOT add unconditional .disabled = false here.

// ====== BPM INPUT ======
function syncBpmDisplay() {
    const effectiveBPM = Math.round(originalBPM * speedMultiplier);
    const bpmInput = document.getElementById('bpmInput');
    if (bpmInput) bpmInput.value = effectiveBPM;
    const pBpm = document.getElementById('panelStatBPM');
    if (pBpm) pBpm.textContent = effectiveBPM;
    const sBpm = document.getElementById('statBPM');
    if (sBpm) sBpm.textContent = effectiveBPM;
}

function applyBpmInput() {
    if (visualsPlaying || previewMode || speedLocked) return;
    const bpmInput = document.getElementById('bpmInput');
    if (!bpmInput || !originalBPM) return;
    const target = parseFloat(bpmInput.value);
    if (!target || target < 20 || target > 300) return;
    speedMultiplier = Math.min(2.0, Math.max(0.1, +(target / originalBPM).toFixed(4)));
    speedDisplay.textContent = speedMultiplier.toFixed(2) + "×";
    syncBpmDisplay();
    if (metronomeRunning) startMetronome();
}

(function() {
    const bpmInput   = document.getElementById('bpmInput');
    const setBtn     = document.getElementById('bpmSetBtn');
    const resetBtn   = document.getElementById('bpmResetBtn');
    if (!bpmInput || !setBtn || !resetBtn) return;

    setBtn.addEventListener('click', applyBpmInput);

    resetBtn.addEventListener('click', () => {
        if (visualsPlaying || previewMode || speedLocked) return;
        speedMultiplier = 1.0;
        speedDisplay.textContent = '1.0×';
        syncBpmDisplay();
        if (metronomeRunning) startMetronome();
    });

    bpmInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') applyBpmInput();
    });

    // Style feedback on input focus
    bpmInput.addEventListener('focus', () => {
        bpmInput.style.borderColor = THEME.bpmFocusBorder;
        bpmInput.style.boxShadow   = `0 0 0 3px ${THEME.bpmFocusShadow}`;
    });
    bpmInput.addEventListener('blur', () => {
        bpmInput.style.borderColor = THEME.bpmBlurBorder;
        bpmInput.style.boxShadow   = 'none';
    });
})();



let showNoteNames = true;

let repeatEnabled = true;
let loopEnabled = false; 
let skipSheetRepeats = false;
let freeMode = false;
const skipRepeatsCheckbox = document.getElementById('skipRepeatsCheckbox');
// ================================
// METRONOME STATE (ISOLATED)
// ================================
let metroInterval = null;
let metroBeat = 0;
let metroSynth = null;
let beatEnabled = false;
let countEnabled = false;
let metronomeRunning = false;
let transportStartTime = null;
let countdownActive = false;
let countdownTimeoutId = null;

// ── SpeechSynthesis kept ONLY as last-resort fallback ──────────────────────
const speechSynth = window.speechSynthesis;

let countMode = "normal";
let subdivisionEnabled = false;
let countLanguage = "en";

// ── Web Audio counting engine ───────────────────────────────────────────────
// Uses AudioContext.currentTime-based lookahead scheduling for sample-accurate,
// Chrome-reliable playback. Falls back to SpeechSynthesis for any word whose
// audio file hasn't loaded yet (e.g. before you drop the .mp3 files in).
let _countAudioCtx    = null;
let _countBuffers     = {};      // key → AudioBuffer
let _countSources     = [];      // live nodes, kept for cancellation
let _countSchedTimer  = null;
let _lastScheduledStep = -1;

// These are set at the moment the scheduler actually starts running,
// anchored to real wall-clock / ctx time — NOT to transportStartTime
// (which may be a future timestamp used by the note-fall animation).
let _schedWallMs  = 0;   // performance.now() at scheduler-start
let _schedCtxSec  = 0;   // audioCtx.currentTime at scheduler-start

const SCHEDULE_LOOKAHEAD_SEC = 0.30;  // schedule this far ahead
const SCHEDULE_INTERVAL_MS   = 100;   // re-run scheduler every 100ms

// ↓ Edit these paths to wherever you put the .mp3 files on your server.
const COUNT_AUDIO_PATHS = {
    'one':   '/audio/count_one.mp3',
    'two':   '/audio/count_two.mp3',
    'three': '/audio/count_three.mp3',
    'four':  '/audio/count_four.mp3',
    'e':     '/audio/count_e.mp3',
    'and':   '/audio/count_and.mp3',
    'a':     '/audio/count_a.mp3',
};

async function _ensureCountAudioCtx() {
    if (!_countAudioCtx) {
        _countAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_countAudioCtx.state === 'suspended') {
        await _countAudioCtx.resume();
    }
    return _countAudioCtx;
}

// Call once on the first user gesture that enables counting.
// Returns a promise that resolves when all buffers are loaded.
function _loadCountBuffers() {
    if (!window.__countBuffersPromise) {
        window.__countBuffersPromise = _ensureCountAudioCtx().then(ctx =>
            Promise.allSettled(
                Object.entries(COUNT_AUDIO_PATHS).map(async ([key, url]) => {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`${res.status} ${url}`);
                    const ab  = await res.arrayBuffer();
                    const buf = await ctx.decodeAudioData(ab);
                    _countBuffers[key] = buf;
                })
            ).then(() => {
                const loaded  = Object.keys(_countBuffers);
                const missing = Object.keys(COUNT_AUDIO_PATHS).filter(k => !_countBuffers[k]);
                if (loaded.length)  console.log('[Count Audio] Loaded:', loaded.join(', '));
                if (missing.length) console.warn('[Count Audio] Missing (will use SpeechSynthesis fallback):', missing.join(', '));
            })
        );
    }
    return window.__countBuffersPromise;
}

// Schedule one word at a precise AudioContext time. Returns true if done via WebAudio.
function _webAudioPlayAt(word, ctxTime, isMainBeat) {
    if (!_countAudioCtx || !_countBuffers[word]) return false;
    const src  = _countAudioCtx.createBufferSource();
    src.buffer = _countBuffers[word];
    const gain = _countAudioCtx.createGain();
    gain.gain.value = isMainBeat ? 1.0 : 0.65;
    src.connect(gain);
    gain.connect(_countAudioCtx.destination);
    // Never schedule in the past — clamp to at least 5 ms from now
    src.start(Math.max(ctxTime, _countAudioCtx.currentTime + 0.005));
    _countSources.push(src);
    return true;
}

// Stop all scheduled Web Audio nodes and clear the re-schedule timer.
function _cancelCountAudio() {
    if (_countSchedTimer) { clearTimeout(_countSchedTimer); _countSchedTimer = null; }
    _countSources.forEach(src => { try { src.stop(0); } catch(e) {} });
    _countSources     = [];
    _lastScheduledStep = -1;
    _schedWallMs      = 0;
    _schedCtxSec      = 0;
}

// The lookahead scheduler: called every SCHEDULE_INTERVAL_MS.
// Schedules every syllable whose fire-time falls in [now, now + LOOKAHEAD].
// _schedWallMs / _schedCtxSec are the real-time anchors captured at start —
// completely independent of transportStartTime (which may be in the future).
function _runCountScheduler(bpm) {
    if (!metronomeRunning || !countEnabled || !_countAudioCtx) return;

    const stepSec    = (60 / bpm) / 4;   // 16th-note duration in seconds
    // How many seconds of counting have elapsed since beat-1 fired
    const elapsedSec = (performance.now() - _schedWallMs) / 1000;
    // Corresponding AudioContext time for elapsedSec = 0
    const ctxBase    = _schedCtxSec;

    const fromStep = Math.max(Math.floor(elapsedSec / stepSec), _lastScheduledStep + 1);
    const toStep   = Math.ceil((elapsedSec + SCHEDULE_LOOKAHEAD_SEC) / stepSec);

    for (let step = fromStep; step <= toStep; step++) {
        const slotInBeat = step % 4;
        const beatIndex  = Math.floor(step / 4);
        const isMainBeat = slotInBeat === 0;
        const shouldPlay = subdivisionEnabled || isMainBeat;
        if (!shouldPlay) continue;

        const word = getCountWord(beatIndex, slotInBeat);
        if (!word) continue;

        const fireAtSec = step * stepSec;
        const ctxFireAt = ctxBase + fireAtSec;

        if (!_webAudioPlayAt(word, ctxFireAt, isMainBeat)) {
            // Fallback: SpeechSynthesis with a matching setTimeout
            const delayMs = Math.max(0, (fireAtSec - elapsedSec) * 1000);
            setTimeout(() => {
                if (!metronomeRunning || !countEnabled) return;
                if (isMainBeat && speechSynth.speaking) speechSynth.cancel();
                const u = new SpeechSynthesisUtterance(word);
                u.volume = isMainBeat ? 1 : 0.65;
                u.rate   = 1.6;
                u.pitch  = 1;
                if (window.__preferredVoice) u.voice = window.__preferredVoice;
                speechSynth.speak(u);
            }, delayMs);
        }

        _lastScheduledStep = step;
    }

    // Prune finished sources to avoid unbounded array growth
    _countSources = _countSources.filter(s => {
        try { return s.playbackState !== undefined ? s.playbackState < 3 : true; }
        catch(e) { return false; }
    });

    _countSchedTimer = setTimeout(() => _runCountScheduler(bpm), SCHEDULE_INTERVAL_MS);
}

function stopMetronome() {
    if (metroInterval) {
        cancelAnimationFrame(metroInterval);
        metroInterval = null;
    }

    metroBeat = 0;
    _cancelCountAudio();

    if (speechSynth) speechSynth.cancel();

    if (window._speechKeepAlive) {
        clearInterval(window._speechKeepAlive);
        window._speechKeepAlive = null;
    }

    metronomeRunning = false;
}

const beatToggle = document.getElementById('beatToggle');
const countToggle = document.getElementById('countToggle');
const languageToggle = document.getElementById('languageToggle');
const subdivisionToggle = document.getElementById('subdivisionToggle');
languageToggle.addEventListener('click', () => {
    countLanguage = countLanguage === "en" ? "it" : "en";
    languageToggle.textContent = countLanguage.toUpperCase();
});

beatToggle.addEventListener('click', () => {
    beatEnabled = !beatEnabled;
    beatToggle.textContent = beatEnabled ? "Beat ✓" : "Beat";

    if (beatEnabled && !metronomeRunning) {
        startMetronome();
    } else if (!beatEnabled && !countEnabled && !subdivisionEnabled) {
        stopMetronome();
    }
});

countToggle.addEventListener('click', () => {

countEnabled = !countEnabled;
countToggle.textContent = countEnabled ? "Counting ✓" : "Counting";

if (countEnabled) {
    // On first enable: initialise AudioContext (must happen on a user gesture)
    // and kick off buffer loading (de-duped — safe to call multiple times).
    _loadCountBuffers();

    if (!window.__chromeSpeechUnlocked) {
        const tryUnlock = () => {
            const voices = speechSynthesis.getVoices();
            const preferred = voices.find(v => v.localService && v.lang.startsWith('en'))
                           || voices.find(v => v.lang.startsWith('en'))
                           || voices[0];
            const u = new SpeechSynthesisUtterance("");
            if (preferred) u.voice = preferred;
            u.volume = 0;
            speechSynthesis.speak(u);
            window.__chromeSpeechUnlocked = true;
            window.__preferredVoice = preferred || null;
        };
        if (speechSynthesis.getVoices().length > 0) {
            tryUnlock();
        } else {
            speechSynthesis.addEventListener('voiceschanged', tryUnlock, { once: true });
        }
    }

    if (!metronomeRunning) {
        startMetronome();
    }
} else {
    // Count turned off — if neither beat nor subdivision needs the metronome, stop it
    if (!beatEnabled && !subdivisionEnabled) {
        stopMetronome();
    }
    // Also sync subdivisionEnabled off if counting is turned off
    if (subdivisionEnabled) {
        subdivisionEnabled = false;
        countMode = "normal";
        subdivisionToggle.textContent = "1 & 2 &";
        document.getElementById('subdivBtn')?.classList.remove('active');
    }
}
});

subdivisionToggle.addEventListener('click', () => {
    subdivisionEnabled = !subdivisionEnabled;

    countMode = subdivisionEnabled ? "subdivision" : "normal";

    subdivisionToggle.textContent =
        subdivisionEnabled ? "1 & 2 & ✓" : "1 & 2 &";

    if (subdivisionEnabled) {
        countEnabled = true;
        countToggle.textContent = "Counting ✓";
        startMetronome(transportStartTime);
    } else {
        // Turning off subdivision also turns off counting (subdivision auto-enabled it)
        countEnabled = false;
        countToggle.textContent = "Counting";
        if (!beatEnabled) {
            stopMetronome();
        } else {
            // Beat still on — restart without subdivision
            startMetronome(transportStartTime);
        }
    }
});



// ── Panel button helpers (exposed to window so inline onclick can reach module scope) ──

// Sync hand-select dropdown → Left/Both/Right button active states
window.syncHandBtns = function() {
    const val = document.getElementById('handSelect').value;
    document.getElementById('handLeftBtn') ?.classList.toggle('active', val === 'bass');
    document.getElementById('handBothBtn') ?.classList.toggle('active', val === 'both');
    document.getElementById('handRightBtn')?.classList.toggle('active', val === 'treble');
};
document.getElementById('handSelect').addEventListener('change', window.syncHandBtns);
window.syncHandBtns(); // set initial state

// Mirror pressed/correct note circles into the score-mode panel card
window.syncPanelNoteCircles = function() {
    const src = document.getElementById('pressedNoteCircle');
    const dst = document.getElementById('panelPressedCircle');
    if (src && dst) {
        dst.textContent = src.textContent;
        dst.className   = src.className.replace('note-circle', 'panel-note-circle');
    }
    const srcC = document.getElementById('correctNoteCircle');
    const dstC = document.getElementById('panelCorrectCircle');
    if (srcC && dstC) dstC.textContent = srcC.textContent;
};
(function() {
    const obs = new MutationObserver(window.syncPanelNoteCircles);
    const cfg = { childList: true, characterData: true, subtree: true, attributes: true };
    const p = document.getElementById('pressedNoteCircle');
    const c = document.getElementById('correctNoteCircle');
    if (p) obs.observe(p, cfg);
    if (c) obs.observe(c, cfg);
})();

// Mirror speed display into panel
(function() {
    const src = document.getElementById('speedDisplay');
    const dst = document.getElementById('panelSpeedDisplay');
    if (!src || !dst) return;
    const obs = new MutationObserver(() => { dst.textContent = src.textContent; });
    obs.observe(src, { childList: true, characterData: true, subtree: true });
    dst.textContent = src.textContent;
})();

// Mirror #feedback into #panelFeedbackBubble (score mode)
(function() {
    const src = document.getElementById('feedback');
    const dst = document.getElementById('panelFeedbackBubble');
    if (!src || !dst) return;
    function syncFeedback() {
        dst.innerHTML = src.innerHTML;
        dst.className = src.className.replace('show', '').trim();
        requestAnimationFrame(() => {
            if (src.classList.contains('show')) dst.classList.add('show');
        });
    }
    const obs = new MutationObserver(syncFeedback);
    obs.observe(src, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
})();

window._panelBeatClick = function(btn) {
    beatToggle.click();   // toggles beatEnabled inside module scope
    btn.classList.toggle('active', beatEnabled);
    if (!beatEnabled && !countEnabled && !subdivisionEnabled) {
        stopMetronome();
    }
};

window._panelCountClick = function(btn) {
    countToggle.click();          // toggles countEnabled inside module scope
    // After the click, countEnabled reflects the NEW state
    btn.classList.toggle('active', countEnabled);
    if (!countEnabled) {
        // Counting turned off — also deactivate subdivision
        subdivisionEnabled = false;
        countMode = "normal";
        subdivisionToggle.textContent = "1 & 2 &";
        document.getElementById('subdivBtn').classList.remove('active');
        stopMetronome();
    }
};

window._panelSubdivClick = function(btn) {
    subdivisionToggle.click();    // toggles subdivisionEnabled inside module scope
    // After the click, subdivisionEnabled reflects the NEW state
    btn.classList.toggle('active', subdivisionEnabled);
    const countBtn = document.getElementById('countBtn');
    if (subdivisionEnabled) {
        // Subdivision requires counting — highlight Counting button too
        countBtn.classList.add('active');
    } else {
        // Subdivision off — remove both highlights, stop metronome if nothing else needs it
        countBtn.classList.remove('active');
        if (!beatEnabled) stopMetronome();
    }
};


skipRepeatsCheckbox.addEventListener('change', () => {
    skipSheetRepeats = skipRepeatsCheckbox.checked;
});

toggleNamesButton.addEventListener('click', () => {
    showNoteNames = !showNoteNames;
    toggleNamesButton.textContent = showNoteNames
        ? 'Hide Note Names'
        : 'Show Note Names';
});

loopCheckbox.addEventListener('change', () => {
    loopEnabled = loopCheckbox.checked;
});
freeModeButton.addEventListener('click', async () => {
    await Tone.start();
    
    if (midiInputs.length === 0) {
        await initMIDI();
    }

    freeMode = !freeMode;

    freeModeButton.textContent =
        freeMode ? "Exit Free Mode" : "Free Mode";

    stopPlayback();

    trainingActive = false;
    previewMode = false;
    visualsPlaying = false;
    waitingForInput = false;

    fallingRectangles = [];
    expectedMidiNote = null;
    currentTrainingNote = null;

    document.getElementById('feedback').textContent =
        freeMode ? "Free Play — play any note 🎹" : "";
});
let currentMidi = null;
let synth = null;
let freeModeSynth = null;
function ensureSynth() {
    if (!synth) {
        synth = new Tone.Sampler({
            urls: {
                "A0": "A0.mp3",
                "C1": "C1.mp3",
                "D#1": "Ds1.mp3",
                "F#1": "Fs1.mp3",
                "A1": "A1.mp3",
                "C2": "C2.mp3",
                "D#2": "Ds2.mp3",
                "F#2": "Fs2.mp3",
                "A2": "A2.mp3",
                "C3": "C3.mp3",
                "D#3": "Ds3.mp3",
                "F#3": "Fs3.mp3",
                "A3": "A3.mp3",
                "C4": "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                "A4": "A4.mp3",
                "C5": "C5.mp3",
                "D#5": "Ds5.mp3",
                "F#5": "Fs5.mp3",
                "A5": "A5.mp3",
                "C6": "C6.mp3",
                "D#6": "Ds6.mp3",
                "F#6": "Fs6.mp3",
                "A6": "A6.mp3",
                "C7": "C7.mp3",
                "D#7": "Ds7.mp3",
                "F#7": "Fs7.mp3",
                "A7": "A7.mp3",
                "C8": "C8.mp3"
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/"
        }).toDestination();
    }

    freeModeSynth = synth;
}

let secondsPerBeat = 0.5;
let MEASURE_TIME_MAP = {};

let playbackTimeouts = [];
let isPlaying = false;
let midiInputs = [];
let pressedNotes = [];
let targetNote = null;
// 🎯 Training Progress Helpers
function showTrainingProgress() {
    document.getElementById('trainingProgress').style.display = 'block';
    updateTrainingProgress();
}

function hideTrainingProgress() {
    document.getElementById('trainingProgress').style.display = 'none';
}

function updateTrainingProgress() {
    if (!practiceNotes || practiceNotes.length === 0) return;

    const percent = Math.min(
        100,
        Math.round((trainingIndex / practiceNotes.length) * 100)
    );

    document.getElementById('trainingProgressFill').style.width =
        percent + "%";

    document.getElementById('trainingProgressText').textContent =
        percent + "%";

    // Mirror into the score-mode stats card
    const pFill = document.getElementById('panelProgressFill');
    const pText = document.getElementById('panelProgressText');
    if (pFill) pFill.style.width = percent + "%";
    if (pText) pText.textContent = percent + "%";
}
let trainingActive = false;
let trainingIndex = 0;
let waitingForInput = false;
let previewMode = false;
let previewTimeouts = [];
let retryTimeout = null; 
let fullSongPlaying = false;

let currentTrainingNote = null;
let noteHoldStartTime = null;
let _bgCountdownStartMs = null;  // set on first correct press in a beat group, for stats countdown
let holdEvaluated = false;   // guards against double-advance from simultaneous mouseup + MIDI noteOff
let expectedHoldDuration = 0;
let activeMidiNote = null;
let expectedMidiNote = null;

// ====== BEAT GROUP (both-hands mode) ======
// In both-hands mode, notes interleave between hands. A "beat group" spans from
// the current note's start to the furthest note-end reachable within that window.
// Example: bass crotchet (0.000s, dur 0.437s) + treble quaver (0.000s, dur 0.218s)
//          + treble quaver (0.231s, dur 0.218s): all fall within 0.437s, so the
//          full group lasts 0.449s. "Good" fires only after the full group.
let _beatGroupNotes   = [];   // [{note, idx}] all practiceNotes in this group
let _beatGroupEndSec  = 0;    // MIDI-time when last note in group ends
let _beatGroupIndex   = 0;    // trainingIndex of currently active sub-note slot
let _beatGroupCurrentPlayTime = null; // MIDI-time of the currently active slot (explicit, avoids ambiguity with carried-across notes)
let _beatGroupTimer   = null; // setTimeout handle for group completion
let _beatGroupPressed = new Set(); // midi numbers pressed so far in this group
let _beatGroupStartMs = null; // performance.now() when first press occurred
// Saved copy of noteHoldStartTime captured just before evaluateHoldOnRelease clears it.
// spawnTrainingNote's carry-forward block reads this instead of noteHoldStartTime, because
// by the time spawnNextValidNote() fires (via setTimeout), noteHoldStartTime is already null.
let _lastHoldStartTime = null;

// ====== SUSTAINED NOTES (both-hands mode) ======
// Maps midi → { startTime (ms), requiredDurationMs, track, noteObj }
// A note lives here while it's still within its required hold window.
// Sustained notes from one hand remain active while the other hand changes steps.
const sustainedNotes = new Map();

function sustainedNoteExpired(midi) {
    const s = sustainedNotes.get(midi);
    if (!s) return true;
    return (performance.now() - s.startTime) >= s.requiredDurationMs;
}

function cleanExpiredSustainedNotes() {
    for (const [midi] of sustainedNotes) {
        if (sustainedNoteExpired(midi)) {
            sustainedNotes.delete(midi);
            // Remove from keyboard highlights if no longer expected
            expectedMidiTreble.delete(midi);
            expectedMidiBass.delete(midi);
        }
    }
}

// Re-builds expectedMidiTreble/Bass from currentChordNotes + active sustainedNotes
function rebuildKeyboardHighlights() {
    expectedMidiTreble.clear();
    expectedMidiBass.clear();
    // Current step notes
    if (spawnTrainingNote._noteTrackMap) {
        currentChordNotes.forEach(midi => {
            const track = spawnTrainingNote._noteTrackMap.get(midi);
            if (track === TREBLE) expectedMidiTreble.add(midi);
            else if (track === BASS) expectedMidiBass.add(midi);
        });
    }
    // Sustained notes from other hand
    for (const [midi, s] of sustainedNotes) {
        if (!sustainedNoteExpired(midi)) {
            if (s.track === TREBLE) expectedMidiTreble.add(midi);
            else if (s.track === BASS) expectedMidiBass.add(midi);
        }
    }
}

// ====== HOLD COUNTDOWN ======
(function startHoldCountdownLoop() {
    const el  = document.getElementById('statHold');
    const pel = document.getElementById('panelStatHold');

    // Find the label spans next to the stat values so we can swap "Hold for" ↔ "Notes left"
    // #statsBar uses a plain <span> (no class); #panelStatsCard uses .ctrl-stat-label
    const labelEl  = el  ? (el.parentElement.querySelector('span:last-child'))  : null;
    const labelPel = pel ? (pel.parentElement.querySelector('.ctrl-stat-label') || pel.parentElement.querySelector('span:last-child')) : null;

    setInterval(() => {
        let val, color, label;

        if (noteHoldStartTime !== null && expectedHoldDuration > 0) {
            // ── Active hold phase: count down remaining time ──
            // noteHoldStartTime is set the moment the correct note is pressed.
            const remaining = Math.max(0,
                (expectedHoldDuration - (performance.now() - noteHoldStartTime)) / 1000
            );
            val   = remaining.toFixed(1) + 's';
            color = remaining < 0.3 ? '#22c55e' : '';
            label = 'Hold for';

        } else if (clefMode === 'both' && _bgCountdownStartMs !== null && _beatGroupNotes.length > 0) {
            // ── Both-hands sub-note traversal: show slots-remaining progress ──
            // Use _beatGroupCurrentPlayTime (the slot-advance tracker) to count done slots.
            // Do NOT use _beatGroupPressed — the same midi number can appear at multiple
            // time slots (e.g. G5 at t=0.000 and t=0.231), so pressing it at slot 2 would
            // incorrectly mark slot 1 as done, causing the count to jump around.
            const allSlots = [...new Set(
                _beatGroupNotes.map(({ note: n }) => (n.playTime ?? n.time).toFixed(4))
            )].sort();
            const totalSlots = allSlots.length;
            const curKey = _beatGroupCurrentPlayTime !== null
                ? _beatGroupCurrentPlayTime.toFixed(4) : allSlots[0];
            const curIdx    = allSlots.indexOf(curKey);
            const doneSlots = Math.max(0, curIdx);
            const leftSlots = totalSlots - doneSlots;
            val   = leftSlots + '/' + totalSlots;
            color = leftSlots <= 1 ? '#22c55e' : '#FFC107';
            label = 'Notes left';

        } else if (expectedHoldDuration > 0 && (trainingActive || waitingForInput)) {
            // ── Waiting for first press: show full required duration as a static hint ──
            val   = (expectedHoldDuration / 1000).toFixed(1) + 's';
            color = '#aaa';
            label = 'Hold for';

        } else {
            val   = '—';
            color = '';
            label = 'Hold for';
        }

        if (el)  { el.textContent  = val; el.style.color  = color; }
        if (pel) { pel.textContent = val; pel.style.color = color; }
        if (labelEl  && labelEl.textContent  !== label) labelEl.textContent  = label;
        if (labelPel && labelPel.textContent !== label) labelPel.textContent = label;
    }, 50);
})();

let expectedMidiTreble = new Set();
let expectedMidiBass   = new Set();
let currentChordNotes = new Set();
let midiPressedNotes = new Set();
let chordNotesCompleted = new Set();
let freeModeActiveNote = null;
let mouseDown = false;
let freeModeReleaseTimer = null;
let lastMouseMidi = null;
let touchActive = false;
let activeTouches = new Map();

// ====== MOUSE CLICK-TO-LATCH SYSTEM ======
// Lets users click notes one-by-one to build up chords with a single mouse.
// Each clicked note stays "latched" (sustained) for the entire beat.
// All latches are cleared automatically when advancing to the next beat.
const mouseLatchedNotes = new Set();

function mouseReleaseLatch(midi) {
    if (!mouseLatchedNotes.has(midi)) return;
    mouseLatchedNotes.delete(midi);
    midiPressedNotes.delete(midi);
    if (synth) synth.triggerRelease(getNoteName(midi));
}

function mouseClearAllLatches() {
    for (const midi of mouseLatchedNotes) {
        midiPressedNotes.delete(midi);
        if (synth) synth.triggerRelease(getNoteName(midi));
    }
    mouseLatchedNotes.clear();
}

function mouseToggleLatch(midiNote) {
    // If already latched, unlatch (toggle off)
    if (mouseLatchedNotes.has(midiNote)) {
        mouseReleaseLatch(midiNote);
        return;
    }
    // Latch the note: treat it as physically held for the whole beat
    mouseLatchedNotes.add(midiNote);
}

function isMouseInputActive() {
    // Returns true if input came from mouse (not touch/MIDI)
    return !touchActive;
}
    
function hardStopUserNote() {
    if (!synth) return;

    if (activeMidiNote !== null) {
        synth.triggerRelease(getNoteName(activeMidiNote));
    }

    synth.releaseAll();

    activeMidiNote = null;
    noteHoldStartTime = null;
    sustainedNotes.clear();
    mouseLatchedNotes.clear();
}
let failureCount = 0;
let autoSlowed = false;
let showBlackKeyArrow = false;
let arrowTargetGroup = null;
let explanationLocked = false;

// ====== PREMIUM STATS ======
let statsCombo = 0;
let statsPerfect = 0;
let statsTotalAttempts = 0;
let statsWrong = 0;

function updateStatsBar() {
    const accuracy = statsTotalAttempts > 0
        ? Math.round((statsPerfect / statsTotalAttempts) * 100)
        : 0;
    const accEl = document.getElementById('statAccuracy');
    const comboEl = document.getElementById('statCombo');
    const perfEl = document.getElementById('statPerfect');
    if (accEl) accEl.textContent = statsTotalAttempts > 0 ? accuracy + '%' : '—';
    if (comboEl) comboEl.textContent = '×' + statsCombo;
    if (perfEl) perfEl.textContent = statsPerfect;

    // Mirror into panel stats card
    const pAcc = document.getElementById('panelStatAccuracy');
    const pCombo = document.getElementById('panelStatCombo');
    const pPerf = document.getElementById('panelStatPerfect');
    if (pAcc)   pAcc.textContent   = statsTotalAttempts > 0 ? accuracy + '%' : '—';
    if (pCombo) pCombo.textContent = '×' + statsCombo;
    if (pPerf)  pPerf.textContent  = statsPerfect;
}

let statsMeasure = '—';

// Build measure timeline pips
function buildMeasureTimeline(totalMeasures) {
    const tl = document.getElementById('measureTimeline');
    if (!tl) return;
    tl.innerHTML = '';
    for (let i = 0; i < Math.min(totalMeasures, 80); i++) {
        const pip = document.createElement('div');
        pip.className = 'measure-pip';
        pip.dataset.m = i + 1;
        tl.appendChild(pip);
    }
}

function updateTimelinePip(measureNum) {
    const pips = document.querySelectorAll('.measure-pip');
    pips.forEach(p => {
        const m = +p.dataset.m;
        p.classList.remove('active');
        if (m < measureNum) p.classList.add('done');
        else if (m === measureNum) p.classList.add('active');
        else { p.classList.remove('done'); }
    });
}

let clefMode = 'treble';
let sectionStartTime = 0;
let sectionEndTime = 0;
let secondsPerMeasure = 2;

// Canvas setup
const START_NOTE = 36; // C2
const END_NOTE = 96;   // C7
const TOTAL_NOTES = END_NOTE - START_NOTE + 1;
const KEYBOARD_HEIGHT = 130;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ---- Score mode state ----
let scoreModeActive = false;
let scoreNoteOffset = 0;
let scoreCurrentPage = 1;
const SCORE_TOTAL_PAGES = SONG_CONFIG.scorePages || 2;
const scoreCanvases = {};
let pdfjsLib = null;
let pdfDoc = null;
// ---------------------------------------------------------------

function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth - 20, 1400);
    canvas.width = maxWidth;

    if (scoreModeActive) {
        canvas.height = KEYBOARD_HEIGHT;
        drawKeyboard();
    } else {
        const NOTE_AREA_HEIGHT = 260;
        canvas.height = NOTE_AREA_HEIGHT + KEYBOARD_HEIGHT;
    }
}

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 800);
let fallingRectangles = [];
  let _tiedNoteKeys = new Set();
let midiFallingNotes = [];
let songStartTime = null;
let visualClockStart = null;
let allMidiNotes = [];
let practiceNotes = [];
let visualsPlaying = false;
let scoreKeysPlaying = false; // true while listen-first key highlights are active in score mode
let speedMultiplier = 1.0;
let speedLocked = false;
let originalBPM = 100; // updated after MIDI loads

function getFallTimeMs() {
    return 2000 / speedMultiplier;
}
const BLACK_KEYS = [1, 3, 6, 8, 10];
const NOTE_GAP_PX = 4;
const NOTE_GAP_TIME = 0.02;

function isBlackMidi(midi) {
    return BLACK_KEYS.includes(midi % 12);
}

function countWhiteKeys(start, end) {
    let count = 0;
    for (let m = start; m <= end; m++) {
        if (!isBlackMidi(m)) count++;
    }
    return count;
}

const TOTAL_WHITE_KEYS = countWhiteKeys(START_NOTE, END_NOTE);
function getWhiteKeyWidth() {
    return canvas.width / TOTAL_WHITE_KEYS;
}
function xToMidi(x) {
    let whiteKeyIndex = Math.floor(x / getWhiteKeyWidth());
    let count = 0;

    for (let midi = START_NOTE; midi <= END_NOTE; midi++) {
        if (!isBlackMidi(midi)) {
            if (count === whiteKeyIndex) return midi;
            count++;
        }
    }
    return null;
}
function noteToX(midi) {

    let whiteIndex = 0;

    for (let m = START_NOTE; m < midi; m++) {
        if (!isBlackMidi(m)) {
            whiteIndex++;
        }
    }

    let x = whiteIndex * getWhiteKeyWidth();

    if (isBlackMidi(midi)) {
        x -= getWhiteKeyWidth() * 0.35;
    }

    return x;
}

// ================================
// RHYTHM → MUSICAL NOTE NAME
// ================================
function beatsToNoteName(beats) {
    const values = [
    { beats: 4, name: "○" },
{ beats: 3, name: "d." },
{ beats: 2, name: "d" },
{ beats: 1.5, name: "♩." },
{ beats: 1, name: "♩" },
{ beats: 0.75, name: "♪." },
{ beats: 0.5, name: "♪" },
{ beats: 0.25, name: "♬" }
    ];

    let closest = values[0];
    let smallestDiff = Math.abs(beats - values[0].beats);

    for (const v of values) {
        const diff = Math.abs(beats - v.beats);
        if (diff < smallestDiff) {
            smallestDiff = diff;
            closest = v;
        }
    }

    return closest.name;
}

function getNoteName(midiNote) {

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const note = noteNames[midiNote % 12];
    const octave = Math.floor(midiNote / 12) - 1;
    return note + octave;
}
function explainWrongNote(playedMidi, expectedMidi) {
    const playedName = getNoteName(playedMidi);
    const expectedName = getNoteName(expectedMidi);

    const playedPitch = playedMidi % 12;
    const expectedPitch = expectedMidi % 12;

    if (playedPitch === expectedPitch) {
        const octaveDiff =
            Math.round((playedMidi - expectedMidi) / 12);

        if (octaveDiff > 0) {
            return `You played the correct note (${playedName[0]}),
but it should be ${Math.abs(octaveDiff)} octave lower.`;
        } else if (octaveDiff < 0) {
            return `You played the correct note (${playedName[0]}),
but it should be ${Math.abs(octaveDiff)} octave higher.`;
        }
    }

    return `Almost There! Let's try again 😊`;
}
function drawKeyboard() {
    const keyHeight = KEYBOARD_HEIGHT;
    const keyboardTop = scoreModeActive ? 0 : canvas.height - KEYBOARD_HEIGHT;

    // ---- WHITE KEYS ----
    let whiteIndex = 0;

    for (let midi = START_NOTE; midi <= END_NOTE; midi++) {
        if (isBlackMidi(midi)) continue;

        const x = whiteIndex * getWhiteKeyWidth();
        const isTreble = expectedMidiTreble.has(midi);
        const isBass   = expectedMidiBass.has(midi);
        const isLatched = mouseLatchedNotes.has(midi);
        const _sustainedCarried = getSustainedCarriedMidis();
        const isSustainedHold = _sustainedCarried.has(midi);

        // Premium gradient white key
        const wGrad = ctx.createLinearGradient(x, keyboardTop, x, keyboardTop + keyHeight);
        if (isSustainedHold) {
            wGrad.addColorStop(0, '#D1FAE5');
            wGrad.addColorStop(1, '#34D399');
        } else if (isLatched) {
            wGrad.addColorStop(0, '#D1FAE5');
            wGrad.addColorStop(1, '#6EE7B7');
        } else if (isTreble) {
            wGrad.addColorStop(0, THEME.whiteKeyTrebleTop);
            wGrad.addColorStop(1, THEME.whiteKeyTrebleBot);
        } else if (isBass) {
            wGrad.addColorStop(0, THEME.whiteKeyBassTop);
            wGrad.addColorStop(1, THEME.whiteKeyBassBot);
        } else {
            wGrad.addColorStop(0, '#ffffff');
            wGrad.addColorStop(0.7, '#f5f5f5');
            wGrad.addColorStop(1, '#e8e8e8');
        }
        ctx.fillStyle = wGrad;
        ctx.fillRect(x, keyboardTop, getWhiteKeyWidth(), keyHeight);

        // Key borders
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x + 0.4, keyboardTop, getWhiteKeyWidth() - 0.8, keyHeight);

        // Inner shadow at top
        const innerGrad = ctx.createLinearGradient(x, keyboardTop, x, keyboardTop + 14);
        innerGrad.addColorStop(0, 'rgba(0,0,0,0.08)');
        innerGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = innerGrad;
        ctx.fillRect(x, keyboardTop, getWhiteKeyWidth(), 14);

        // Glow for sustained-hold (green) key
        if (isSustainedHold) {
            ctx.shadowColor = '#10B981';
            ctx.shadowBlur = 22;
            ctx.fillStyle = 'rgba(16,185,129,0.22)';
            ctx.fillRect(x, keyboardTop, getWhiteKeyWidth(), keyHeight);
            ctx.shadowBlur = 0;
        }

        // Glow for latched (mouse-clicked) key
        if (isLatched && !isSustainedHold) {
            ctx.shadowColor = '#10B981';
            ctx.shadowBlur = 18;
            ctx.fillStyle = 'rgba(16,185,129,0.18)';
            ctx.fillRect(x, keyboardTop, getWhiteKeyWidth(), keyHeight);
            ctx.shadowBlur = 0;
        }

        // Glow for active treble key
        if (isTreble && !isSustainedHold) {
            ctx.shadowColor = THEME.keyTrebleGlowShadow;
            ctx.shadowBlur = 18;
            ctx.fillStyle = THEME.keyTrebleGlowFillW;
            ctx.fillRect(x, keyboardTop, getWhiteKeyWidth(), keyHeight);
            ctx.shadowBlur = 0;
        }

        // Glow for active bass key
        if (isBass && !isSustainedHold) {
            ctx.shadowColor = THEME.keyBassGlowShadow;
            ctx.shadowBlur = 18;
            ctx.fillStyle = THEME.keyBassGlowFillW;
            ctx.fillRect(x, keyboardTop, getWhiteKeyWidth(), keyHeight);
            ctx.shadowBlur = 0;
        }

        if (showNoteNames) {
            ctx.fillStyle = isBass ? THEME.keyLabelBass : (isTreble ? THEME.keyLabelTreble : '#555');
            ctx.font = `bold ${Math.max(9, Math.min(12, getWhiteKeyWidth() * 0.55))}px Inter, Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(
                getNoteName(midi),
                x + getWhiteKeyWidth() / 2,
                keyboardTop + keyHeight - 5
            );
        }

        whiteIndex++;
    }

   // ---- BLACK KEYS ----
    whiteIndex = 0;

    for (let midi = START_NOTE; midi <= END_NOTE; midi++) {
        if (!isBlackMidi(midi)) {
            whiteIndex++;
            continue;
        }

        const blackKeyWidth  = getWhiteKeyWidth() * 0.6;
        const blackKeyHeight = keyHeight * 0.62;
        const x = (whiteIndex - 1) * getWhiteKeyWidth() + getWhiteKeyWidth() * 0.7;

        const isTreble = expectedMidiTreble.has(midi);
        const isBass   = expectedMidiBass.has(midi);
        const isLatched = mouseLatchedNotes.has(midi);
        const isSustainedHold = getSustainedCarriedMidis().has(midi);

        // Premium gradient black key
        const bGrad = ctx.createLinearGradient(x, keyboardTop, x, keyboardTop + blackKeyHeight);
        if (isSustainedHold) {
            bGrad.addColorStop(0, '#A7F3D0');
            bGrad.addColorStop(1, '#059669');
        } else if (isLatched) {
            bGrad.addColorStop(0, '#A7F3D0');
            bGrad.addColorStop(1, '#059669');
        } else if (isTreble) {
            bGrad.addColorStop(0, THEME.blackKeyTrebleTop);
            bGrad.addColorStop(1, THEME.blackKeyTrebleBot);
        } else if (isBass) {
            bGrad.addColorStop(0, THEME.blackKeyBassTop);
            bGrad.addColorStop(1, THEME.blackKeyBassBot);
        } else {
            bGrad.addColorStop(0, '#333');
            bGrad.addColorStop(0.5, '#111');
            bGrad.addColorStop(1, '#000');
        }

        // Shadow under black key
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = bGrad;
        ctx.fillRect(x, keyboardTop, blackKeyWidth, blackKeyHeight);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Glow for sustained-hold (green) key
        if (isSustainedHold) {
            ctx.shadowColor = '#10B981';
            ctx.shadowBlur = 22;
            ctx.fillStyle = 'rgba(16,185,129,0.5)';
            ctx.fillRect(x, keyboardTop, blackKeyWidth, blackKeyHeight);
            ctx.shadowBlur = 0;
        }

        // Glow for latched (mouse-clicked) key
        if (isLatched && !isSustainedHold) {
            ctx.shadowColor = '#10B981';
            ctx.shadowBlur = 20;
            ctx.fillStyle = 'rgba(16,185,129,0.45)';
            ctx.fillRect(x, keyboardTop, blackKeyWidth, blackKeyHeight);
            ctx.shadowBlur = 0;
        }

        // Glow for active treble
        if (isTreble && !isSustainedHold) {
            ctx.shadowColor = THEME.keyTrebleGlowShadow;
            ctx.shadowBlur = 20;
            ctx.fillStyle = THEME.keyTrebleGlowFillB;
            ctx.fillRect(x, keyboardTop, blackKeyWidth, blackKeyHeight);
            ctx.shadowBlur = 0;
        }

        // Glossy highlight on top of black key
        const glossGrad = ctx.createLinearGradient(x, keyboardTop, x + blackKeyWidth, keyboardTop + blackKeyHeight * 0.4);
        glossGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
        glossGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glossGrad;
        ctx.fillRect(x + blackKeyWidth * 0.1, keyboardTop, blackKeyWidth * 0.8, blackKeyHeight * 0.35);

        if (showNoteNames) {
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(8, Math.min(10, blackKeyWidth * 0.55))}px Inter, Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(
                getNoteName(midi),
                x + blackKeyWidth / 2,
                keyboardTop + blackKeyHeight - 3
            );
        }
    }
}

function describeNoteByBlackKeys(midiNote) {
    const noteInOctave = midiNote % 12;

    const descriptions = {
        0: "the white key just before a group of 2 black keys (C)",
        1: "the first black key in a group of 2 (C#)",
        2: "the white key between the 2 black keys (D)",
        3: "the second black key in a group of 2 (D#)",
        4: "the white key just after the group of 2 black keys (E)",
        5: "the white key just before a group of 3 black keys (F)",
        6: "the first black key in a group of 3 (F#)",
        7: "the white key between the first and second black keys (G)",
        8: "the second black key in a group of 3 (G#)",
        9: "the white key between the second and third black keys (A)",
        10:"the third black key in a group of 3 (A#)",
        11:"the white key just after the group of 3 black keys (B)"
    };

    return descriptions[noteInOctave] || "";
}
function blackKeyGroupForMidi(midi) {
    const pitch = midi % 12;

    if (pitch === 1 || pitch === 3) return "2";

    if (pitch === 6 || pitch === 8 || pitch === 10) return "3";

    return null;
}

// =======================================
// SHARED USER NOTE HANDLER (MIDI + MOUSE)
// =======================================
// ===== MOUSE DEBUG HELPERS =====
let _dbgClicks = 0;
let _dbgSwallowed = 0;
const _dbgEventLog = [];
function _dbgLog(msg) {
    const ts = performance.now().toFixed(0);
    const entry = `[${ts}ms] ${msg}`;
    _dbgEventLog.unshift(entry);
    if (_dbgEventLog.length > 6) _dbgEventLog.pop();
    console.log('[MouseDebug]', entry);
}
function _dbgUpdate() {
    const panel = document.getElementById('mouseDebug');
    if (!panel || panel.style.display === 'none') return;
    document.getElementById('dbg-click-count').textContent  = `Clicks registered: ${_dbgClicks}`;
    document.getElementById('dbg-swallowed').textContent    = `Swallowed (guard fired): ${_dbgSwallowed}`;
    document.getElementById('dbg-latch-state').textContent  = `Latched: [${[...mouseLatchedNotes].map(m=>getNoteName(m)).join(', ')||'—'}]`;
    document.getElementById('dbg-pressed-state').textContent= `midiPressed: [${[...midiPressedNotes].map(m=>getNoteName(m)).join(', ')||'—'}]`;
    document.getElementById('dbg-last-event').textContent   = `Log: ${_dbgEventLog[0]||'—'}`;
    document.getElementById('dbg-hold-state').textContent   = `holdEvaluated: ${holdEvaluated} | holdRunning: ${noteHoldStartTime !== null}`;
    document.getElementById('dbg-training-state').textContent = `trainingActive: ${trainingActive} | waitingForInput: ${waitingForInput}`;
}
// Poll to keep the panel live while visible
setInterval(() => { if (document.getElementById('mouseDebug')?.style.display !== 'none') _dbgUpdate(); }, 100);
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        const panel = document.getElementById('mouseDebug');
        if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
});
// ================================

function processUserNoteOn(midiNote) {

// Guard: ignore repeated noteOn for a note that's already held.
// MIDI keyboards send repeated noteOn while a key is held; without this,
// hardStopUserNote() below resets noteHoldStartTime on every repeat,
// making the hold timer restart and causing multiple spawnTrainingNote calls.
if (!freeMode && midiPressedNotes.has(midiNote)) {
    _dbgSwallowed++;
    _dbgLog(`SWALLOWED midi=${midiNote} — already in midiPressedNotes | latched=${[...mouseLatchedNotes].join(',')} | holdEval=${holdEvaluated} | holdTime=${noteHoldStartTime !== null}`);
    _dbgUpdate();
    return;
}

if (previewMode) return;


if (freeMode) {
    ensureSynth();

    // Guard: if this exact note is already sounding, don't retrigger — prevents
    // audio pops from touchpad jitter or repeated mousedown events on the same key.
    if (midiNote === freeModeActiveNote) return;

    // Release previous note cleanly before attacking the new one (key glide)
    if (freeModeActiveNote !== null) {
        freeModeSynth.triggerRelease(getNoteName(freeModeActiveNote));
    }

    freeModeSynth.triggerAttack(getNoteName(midiNote));
    freeModeActiveNote = midiNote;
    expectedMidiTreble.clear();
    expectedMidiBass.clear();
    expectedMidiTreble.add(midiNote);

    document.getElementById('pressedNoteCircle').textContent =
        getNoteName(midiNote);

    document.getElementById('pressedNoteCircle').className =
        'note-circle';

    document.getElementById('correctNoteCircle').textContent = '';

    expectedMidiNote = midiNote;
    return;
}

if (!trainingActive) return;

const noteName = getNoteName(midiNote);
const feedback = document.getElementById('feedback');

// Check if this is a sustained note being re-pressed (after early release)
const isSustainedNote = sustainedNotes.has(midiNote) && !sustainedNoteExpired(midiNote);
// In both-hands mode: also allow re-press of a note still in the hold registry
const isBgHeldRepress = clefMode === 'both' && _bgHeldNotes.has(midiNote);

// ---------- WRONG NOTE ----------
if (!currentChordNotes.has(midiNote) && !isSustainedNote && !isBgHeldRepress) {

const expectedMidi = allMidiNotes[trainingIndex].midi;
const explanation = explainWrongNote(midiNote, expectedMidi);

feedback.textContent = explanation;
feedback.classList.remove('correct', 'wrong', 'show');
void feedback.offsetWidth;
feedback.classList.add('wrong', 'show');

failureCount++;
statsWrong++;
statsTotalAttempts++;
statsCombo = 0;
updateStatsBar();
expectedMidiNote = expectedMidi;
document.getElementById('pressedNoteCircle').textContent =
    getNoteName(midiNote);

document.getElementById('pressedNoteCircle')
    .className = 'note-circle wrong';

document.getElementById('correctNoteCircle').textContent =
    currentTrainingNote;

// Restart the current beat after a short pause so the user replays it from the top
trainingActive = false;
waitingForInput = false;
if (_beatGroupTimer) { clearTimeout(_beatGroupTimer); _beatGroupTimer = null; }
_bgCountdownStartMs = null;

// Keep holdInfo showing the correct note + hold duration during the error pause
{
    const _wrongNoteObj = practiceNotes[trainingIndex];
    if (_wrongNoteObj) {
        const _wrongGroupDurSec = _beatGroupEndSec
            ? _beatGroupEndSec - (_wrongNoteObj.playTime ?? _wrongNoteObj.time)
            : _wrongNoteObj.duration;
        const _wrongGroupBeats = _wrongGroupDurSec / secondsPerBeat;
        const _wrongGroupLabel = beatsToNoteName(_wrongGroupBeats);
        const _wrongChordNames = Array.from(currentChordNotes).map(m => getNoteName(m)).join(' + ');
        const holdEl = document.getElementById('holdInfo');
        holdEl.innerHTML = `Play <strong>${_wrongChordNames}</strong> and hold for <span class="music-symbol">${_wrongGroupLabel}</span>`;
    }
}

setTimeout(() => {
    if (practiceNotes[trainingIndex]) {
        spawnTrainingNote(practiceNotes[trainingIndex]);
    }
}, 900);

return;
}

// ---------- RE-PRESSING A SUSTAINED NOTE ----------
if (isSustainedNote && !currentChordNotes.has(midiNote)) {
    // User re-pressed a note they released too early — acknowledge it
    midiPressedNotes.add(midiNote);
    ensureSynth();
    synth.triggerAttack(noteName);
    feedback.textContent = 'Good — keep holding!';
    feedback.classList.remove('correct', 'wrong', 'show');
    void feedback.offsetWidth;
    feedback.classList.add('correct', 'show');
    rebuildKeyboardHighlights();
    return;
}

// ---------- CORRECT NOTE ----------
document.getElementById('pressedNoteCircle').textContent =
    getNoteName(midiNote);

document.getElementById('pressedNoteCircle')
    .className = 'note-circle correct';

document.getElementById('correctNoteCircle').textContent =
    currentTrainingNote;
explanationLocked = false;
showBlackKeyArrow = false;
arrowTargetGroup = null;
failureCount = 0;
statsPerfect++;
statsTotalAttempts++;
statsCombo++;
updateStatsBar();

midiPressedNotes.add(midiNote);
activeMidiNote = midiNote;
ensureSynth();
synth.triggerAttack(noteName);

if (clefMode === 'both') {
    // ── Beat Group: note pressed ───────────────────────────────────────────
    _beatGroupPressed.add(midiNote);

    // If this note is in the must-hold registry (re-press after early release),
    // restart the group timer and wait for the hold to complete.
    if (_bgRestartHoldTimer(midiNote)) {
        console.log('🔁 _bgRestartHoldTimer fired for', getNoteName(midiNote), '— returning early. bgHeld:', [..._bgHeldNotes.keys()].map(getNoteName));
        return;
    }

    // Determine which currentChordNotes are "new" (must be pressed) vs "sustained"
    // (were pressed in a previous sub-slot and must still be physically held).
    // Sustained notes are those already in _bgHeldNotes — they were carried across.
    const sustainedRequired = Array.from(currentChordNotes).filter(m => _bgHeldNotes.has(m));
    const newRequired       = Array.from(currentChordNotes).filter(m => !_bgHeldNotes.has(m));

    // All new notes must be in _beatGroupPressed, AND all sustained notes must
    // still be physically down (in midiPressedNotes).
    const allNewPressed       = newRequired.every(m => _beatGroupPressed.has(m));
    const allSustainedStillOn = sustainedRequired.every(m => midiPressedNotes.has(m));
    const allCurrentPressed   = allNewPressed && allSustainedStillOn;

    console.log('🎹 noteOn', getNoteName(midiNote), '| chord:', [...currentChordNotes].map(getNoteName), '| bgHeld:', [..._bgHeldNotes.keys()].map(getNoteName), '| bgPressed:', [..._beatGroupPressed].map(getNoteName), '| midiPressed:', [...midiPressedNotes].map(getNoteName), '| sustReq:', sustainedRequired.map(getNoteName), '| newReq:', newRequired.map(getNoteName), '| allNewPressed:', allNewPressed, '| allSustOn:', allSustainedStillOn, '| willAdvance:', allCurrentPressed);

    if (allCurrentPressed) {
        // Start the stats countdown from the very first correct press so the
        // stat bar counts down for the entire beat group, not just the final hold.
        if (_bgCountdownStartMs === null) _bgCountdownStartMs = performance.now();
        // The hold timer is started inside _advanceBeatGroupSubNote once all
        // sub-notes have been played (nextIdx === null). Do NOT start it here —
        // the group musical window (e.g. 437ms) is far too short for a learner
        // to navigate D4 → D3 → G4 sequentially.
        _advanceBeatGroupSubNote();
    } else {
        const missingNew       = newRequired.filter(m => !_beatGroupPressed.has(m));
        const missingSustained = sustainedRequired.filter(m => !midiPressedNotes.has(m));
        if (missingSustained.length > 0) {
            feedback.innerHTML = `🟢 KEEP holding the green note${missingSustained.length > 1 ? 's' : ''}: <strong style="color:#10B981">${missingSustained.map(m => getNoteName(m)).join(' + ')}</strong>`;
        } else {
            feedback.textContent = `Also play: ${missingNew.map(m => getNoteName(m)).join(' + ')}`;
        }
        feedback.classList.remove('correct', 'wrong', 'show');
        void feedback.offsetWidth;
        feedback.classList.add('wrong', 'show');
    }

} else {
    // ── Single-hand mode: hold-timer logic ────────────────────────────────
    const allCurrentPressed = Array.from(currentChordNotes).every(midi => midiPressedNotes.has(midi));
    const allSustainedHeld = [...sustainedNotes.keys()]
        .filter(m => !sustainedNoteExpired(m))
        .every(m => midiPressedNotes.has(m));
    const startHold = (allCurrentPressed && allSustainedHeld) || scoreModeActive;

    if (startHold && noteHoldStartTime === null) {
        hardStopUserNote();
        // hardStopUserNote() clears mouseLatchedNotes — re-latch this note so the
        // auto-evaluate setTimeout (below) and the "re-click to advance" branch in
        // the mousedown handler can both find it.
        mouseLatchedNotes.add(midiNote);
        midiPressedNotes.add(midiNote);
        const isChord = currentChordNotes.size > 1;
        feedback.textContent = isChord ? 'Hold this chord' : 'Hold this note';
        noteHoldStartTime = performance.now();

        // Mouse latch: auto-evaluate the hold after expectedHoldDuration elapses,
        // since mouseup no longer fires an evaluation for latched notes.
        // Use the captured midiNote directly — mouseLatchedNotes may be cleared
        // again before the timeout fires (e.g. on a wrong-note reset).
        if (isMouseInputActive() && !touchActive) {
            const holdDur = expectedHoldDuration;
            const capturedNote = midiNote;
            const capturedHoldStart = noteHoldStartTime;
            setTimeout(() => {
                // Only fire if we're still on the same hold session
                if (noteHoldStartTime !== null && noteHoldStartTime === capturedHoldStart && !holdEvaluated) {
                    evaluateHoldOnRelease(capturedNote);
                }
            }, holdDur + 50);
        }
    } else if (!startHold) {
        const missingCurrent = Array.from(currentChordNotes).filter(m => !midiPressedNotes.has(m));
        const missingSustained = [...sustainedNotes.keys()]
            .filter(m => !sustainedNoteExpired(m) && !midiPressedNotes.has(m));
        const allMissing = [...missingCurrent, ...missingSustained];
        if (allMissing.length > 0) {
            feedback.textContent = allMissing.length === missingCurrent.length
                ? `Keep holding, add: ${allMissing.map(m => getNoteName(m)).join(' + ')}`
                : `Keep holding all: ${allMissing.map(m => getNoteName(m)).join(' + ')}`;
        }
    }

    feedback.classList.remove('correct', 'wrong', 'show');
    void feedback.offsetWidth;
    feedback.classList.add('show');
}
}

// ── Beat Group sustained-hold registry ───────────────────────────────────────
// Maps midi → { requiredUntilMs } for notes that must be held for their full
// beat-group duration. Populated when a note is pressed; checked on every release.
const _bgHeldNotes = new Map();

// Register a note as "must hold until requiredUntilMs".
function _bgRegisterHold(midi, requiredUntilMs) {
    _bgHeldNotes.set(midi, { requiredUntilMs });
}

// Returns the Set of midi notes that are currently being SUSTAINED (carried across
// from a previous sub-slot) — i.e. in _bgHeldNotes but NOT in the "new" notes of
// the current slot. These are shown in GREEN on the keyboard to signal "keep holding".
function getSustainedCarriedMidis() {
    if (!_beatGroupNotes.length || _beatGroupCurrentPlayTime === null) return new Set();
    const currentSlot = _beatGroupCurrentPlayTime;
    const newAtSlot = new Set();
    for (const { note: n } of _beatGroupNotes) {
        const t = n.playTime ?? n.time;
        if (Math.abs(t - currentSlot) < 0.01) newAtSlot.add(n.midi);
    }
    const sustained = new Set();
    for (const [midi] of _bgHeldNotes) {
        if (!newAtSlot.has(midi)) sustained.add(midi);
    }
    return sustained;
}

// Called on every note-off in both-hands mode.
// Returns true if this was an early-release violation (caller must stop).
function _bgCheckEarlyRelease(releasedMidi) {
    const held = _bgHeldNotes.get(releasedMidi);
    if (!held) return false;

    const now = performance.now();
    if (now >= held.requiredUntilMs) {
        _bgHeldNotes.delete(releasedMidi);
        // The hold for this note is now complete. If all other held notes are also done
        // and the beat-group timer was previously cancelled (e.g. by an earlier early-
        // release), attempt to restart completion so the group isn't stuck.
        if (_beatGroupTimer === null) {
            const allSubNotesDone = !_beatGroupNotes.some(({ note: n }) => {
                const t = n.playTime ?? n.time;
                return t > (_beatGroupCurrentPlayTime ?? -1) + 0.001;
            });
            const holdPhaseStarted = noteHoldStartTime !== null && noteHoldStartTime >= (_beatGroupStartMs ?? 0);
            const allHoldsComplete = [..._bgHeldNotes.values()].every(h => performance.now() >= h.requiredUntilMs);
            if (allSubNotesDone && holdPhaseStarted && allHoldsComplete) {
                _beatGroupTimer = setTimeout(() => {
                    _beatGroupTimer = null;
                    _onBeatGroupComplete();
                }, 50);
            }
        }
        return false;  // hold completed — not a violation
    }

    // Released too early
    const remainingSec = ((held.requiredUntilMs - now) / 1000).toFixed(1);

    // Cancel the beat-group completion timer so the group cannot auto-advance
    if (_beatGroupTimer) { clearTimeout(_beatGroupTimer); _beatGroupTimer = null; }

    const feedback = document.getElementById('feedback');
    feedback.innerHTML = `🟢 KEEP holding the green note <strong>${getNoteName(releasedMidi)}</strong>! ${remainingSec}s left`;
    feedback.classList.remove('correct', 'wrong', 'show');
    void feedback.offsetWidth;
    feedback.classList.add('wrong', 'show');

    rebuildKeyboardHighlights();
    return true;  // early release — caller should not proceed
}

// Called when the user re-presses a note they released too early.
// Restarts the beat-group timer for the remaining hold duration.
function _bgRestartHoldTimer(midi) {
    const held = _bgHeldNotes.get(midi);
    if (!held) return false;

    const now = performance.now();
    const remainingMs = Math.max(300, held.requiredUntilMs - now);

    // Only restart the completion timer if ALL sub-notes in the group have
    // already been played. If there are still sub-notes pending (i.e. a later
    // playTime exists in the group), do NOT start _onBeatGroupComplete — the
    // user just re-pressed a carried bass note early; they still need to play
    // the remaining treble sub-notes. Starting the timer here would skip them.
    const allSubNotesDone = !_beatGroupNotes.some(({ note: n }) => {
        const t = n.playTime ?? n.time;
        return t > (_beatGroupCurrentPlayTime ?? -1) + 0.001;
    });

    // Additional guard: the hold timer must only fire after _advanceBeatGroupSubNote
    // has already started it (i.e. noteHoldStartTime is set for the current group).
    // If noteHoldStartTime is null or predates the current group, the hold phase has
    // not officially started yet — a re-press here is a carried note replayed during
    // sub-note traversal, not a valid hold restart.
    const holdPhaseStarted = noteHoldStartTime !== null && noteHoldStartTime >= (_beatGroupStartMs ?? 0);

    if (_beatGroupTimer === null && allSubNotesDone && holdPhaseStarted) {
        _beatGroupTimer = setTimeout(() => {
            _beatGroupTimer = null;
            _onBeatGroupComplete();
        }, remainingMs);

        const feedback = document.getElementById('feedback');
        feedback.textContent = 'Hold...';
        feedback.classList.remove('correct', 'wrong', 'show');
        void feedback.offsetWidth;
        feedback.classList.add('correct', 'show');
    }
    return true;
}

// ── Beat Group helpers ────────────────────────────────────────────────────────

// Called after all notes in the current simultaneous slot have been pressed.
// Finds the next distinct playTime in the group and updates currentChordNotes.
function _advanceBeatGroupSubNote() {
    if (!_beatGroupNotes.length) return;

    // Use the explicitly-tracked current slot playTime.
    // We cannot derive it from currentChordNotes because carried-across bass notes
    // appear in both the old and new slot — looking them up always returns the
    // original (earlier) slot time, causing _advanceBeatGroupSubNote to find the
    // same "next" slot repeatedly instead of advancing (the double-input bug).
    const currentPlayTime = _beatGroupCurrentPlayTime;
    if (currentPlayTime === null || currentPlayTime === undefined) return;

    // Find the next distinct playTime within the group
    let nextPlayTime = null;
    let nextIdx = null;
    for (const { note: n, idx: i } of _beatGroupNotes) {
        const t = n.playTime ?? n.time;
        if (t > currentPlayTime + 0.001) {
            if (nextPlayTime === null || t < nextPlayTime) {
                nextPlayTime = t;
                nextIdx = i;
            }
        }
    }

    if (nextIdx === null) {
        // All sub-notes played — NOW start the hold timer for the last note's duration.
        console.log('⏱ All sub-notes done. Starting hold timer. bgHeld before register:', [..._bgHeldNotes.keys()].map(getNoteName), 'bgPressed:', [..._beatGroupPressed].map(getNoteName));
        // The last note in the group has playTime == currentPlayTime; hold it for
        // (_beatGroupEndSec - currentPlayTime). This is the only correct place to
        // start the timer — doing it earlier (at spawn or first chord) gave the user
        // only ~437ms to play all sub-notes sequentially, which is far too short.
        if (_beatGroupTimer) clearTimeout(_beatGroupTimer);
        _beatGroupStartMs = performance.now();
        const holdDurMs = Math.max((_beatGroupEndSec - currentPlayTime) * 1000 / speedMultiplier, 300);
        // Hook into the stat-bar countdown (it watches noteHoldStartTime + expectedHoldDuration)
        noteHoldStartTime = _beatGroupStartMs;
        expectedHoldDuration = holdDurMs;
        _beatGroupTimer = setTimeout(() => {
            _beatGroupTimer = null;
            _onBeatGroupComplete();
        }, holdDurMs);

        // Register notes that must be held through the final hold phase.
        // IMPORTANT: only register notes still active at the final slot (i.e. in
        // currentChordNotes). Registering ALL _beatGroupPressed notes would include
        // notes from earlier sub-slots that have already completed (e.g. a treble
        // quaver played at slot 1 when the final slot is slot 2). Those stale notes
        // would appear in getSustainedCarriedMidis() — which returns _bgHeldNotes
        // entries NOT at the current slot — and get rendered GREEN on the keyboard,
        // creating a spurious green flash immediately after the final input press.
        // _bgCheckEarlyRelease() will cancel the timer if any held note is released early.
        const requiredUntilMs = performance.now() + holdDurMs;
        _beatGroupPressed.forEach(midi => {
            if (currentChordNotes.has(midi)) _bgRegisterHold(midi, requiredUntilMs);
        });

        const feedback = document.getElementById('feedback');
        feedback.textContent = 'Hold...';
        feedback.classList.remove('correct', 'wrong', 'show');
        void feedback.offsetWidth;
        feedback.classList.add('correct', 'show');
        return;
    }

    _beatGroupIndex = nextIdx;
    _beatGroupCurrentPlayTime = nextPlayTime; // advance the explicit slot tracker

    // Rebuild currentChordNotes for the next simultaneous slot.
    console.log('➡ Advancing to slot at nextPlayTime=', nextPlayTime?.toFixed(4), 'nextIdx=', nextIdx);
    // IMPORTANT: also include any notes from earlier slots whose duration
    // extends into this slot — those must still be physically held.
    currentChordNotes.clear();
    if (!spawnTrainingNote._noteTrackMap) spawnTrainingNote._noteTrackMap = new Map();
    const noteTrackMap = spawnTrainingNote._noteTrackMap;

    for (const { note: n } of _beatGroupNotes) {
        const t = n.playTime ?? n.time;
        const tEnd = t + n.duration;
        // New notes AT this slot
        const isAtSlot = Math.abs(t - nextPlayTime) < 0.01;
        // Earlier notes whose duration spans past this slot's start time
        const isHeldAcross = t < nextPlayTime - 0.001 && tEnd > nextPlayTime + 0.05;
        if (isAtSlot || isHeldAcross) {
            currentChordNotes.add(n.midi);
            noteTrackMap.set(n.midi, n.track);
        }
    }

    // For sustained notes that carry across, pre-populate _beatGroupPressed so
    // they aren't treated as "missing" — they only need to stay held, not re-pressed.
    // (They were already pressed in an earlier slot.)
    // Also register them in _bgHeldNotes so any release is caught immediately.
    //
    // IMPORTANT: first, clear _bgHeldNotes for any notes that do NOT carry across
    // into this slot. Without this, notes registered in the previous slot's completion
    // (e.g. short treble quavers) stay in _bgHeldNotes, causing _bgRestartHoldTimer
    // to fire when the user presses the next note — blocking _advanceBeatGroupSubNote
    // and requiring a second press to advance (the "double input" bug).
    const carriedAcrossMidis = new Set();
    for (const { note: n } of _beatGroupNotes) {
        const t = n.playTime ?? n.time;
        const tEnd = t + n.duration;
        const isHeldAcross = t < nextPlayTime - 0.001 && tEnd > nextPlayTime + 0.05;
        if (isHeldAcross) carriedAcrossMidis.add(n.midi);
    }
    for (const midi of [..._bgHeldNotes.keys()]) {
        if (!carriedAcrossMidis.has(midi)) _bgHeldNotes.delete(midi);
    }

    // Remove NEW notes (not carried across) from _beatGroupPressed AND midiPressedNotes
    // so that midi numbers reused across slots (e.g. A4 at slot 0.0000 AND slot 0.3462)
    // must be physically re-pressed in the new slot.
    //
    // Without removing from _beatGroupPressed: allNewPressed evaluates true immediately
    // (from the earlier press) and the slot auto-advances without user input.
    //
    // Without removing from midiPressedNotes: the guard at the top of processUserNoteOn
    // ("if midiPressedNotes.has(midiNote) return") fires and silently swallows the user's
    // press — they have to physically release and re-press the key (the "double press" bug
    // on semiquaver clusters where the same note appears in consecutive slots).
    for (const { note: n } of _beatGroupNotes) {
        const t = n.playTime ?? n.time;
        if (Math.abs(t - nextPlayTime) < 0.01 && !carriedAcrossMidis.has(n.midi)) {
            _beatGroupPressed.delete(n.midi);
            midiPressedNotes.delete(n.midi);
            mouseLatchedNotes.delete(n.midi); // Fix: prevent stale latch from causing double-click
        }
    }

    for (const { note: n } of _beatGroupNotes) {
        const t = n.playTime ?? n.time;
        const tEnd = t + n.duration;
        const isHeldAcross = t < nextPlayTime - 0.001 && tEnd > nextPlayTime + 0.05;
        if (isHeldAcross) {
            _beatGroupPressed.add(n.midi);
            // Register hold until the end of this note's duration (or beat group end)
            const holdUntilSec = Math.min(tEnd, _beatGroupEndSec);
            const holdUntilMs = performance.now() + (holdUntilSec - nextPlayTime) * 1000 / speedMultiplier;
            _bgRegisterHold(n.midi, holdUntilMs);
        }
    }

    console.log('🔗 After slot advance: currentChord:', [...currentChordNotes].map(getNoteName), '| bgHeld:', [..._bgHeldNotes.keys()].map(getNoteName), '| bgPressed:', [..._beatGroupPressed].map(getNoteName));

    // Update target display
    const firstNote = practiceNotes[nextIdx];
    currentTrainingNote = getNoteName(firstNote.midi);
    setTargetNote(currentTrainingNote);

    // Build separate lists: notes to press new vs notes already held that must continue
    const newNotes = [];
    const heldNotes = [];
    for (const { note: n } of _beatGroupNotes) {
        const t = n.playTime ?? n.time;
        const tEnd = t + n.duration;
        if (Math.abs(t - nextPlayTime) < 0.01) {
            newNotes.push(n.midi);
        } else if (t < nextPlayTime - 0.001 && tEnd > nextPlayTime + 0.05) {
            heldNotes.push(n.midi);
        }
    }

    // Also recurse immediately when newNotes.length === 0: this slot has no
    // genuinely-new notes to press — only carried-across sustains. Rendering it
    // would call rebuildKeyboardHighlights() (green keyboard flash) and then
    // _applyHighlight([]) (blank score), producing a visible green flash with no
    // score highlight before the next real slot is shown. Skip it entirely.
    //
    // NOTE: We intentionally do NOT skip when newRequired notes happen to already
    // be in _beatGroupPressed. The press that triggered _advanceBeatGroupSubNote
    // was added to _beatGroupPressed (line ~3452) BEFORE this function ran, so
    // it would falsely satisfy the next slot immediately — causing the double-press
    // bug on semiquavers (sixteenth notes). Each new slot must always wait for a
    // fresh physical press by the user.
    if (newNotes.length === 0) {
        console.log('⏭ Slot at', nextPlayTime?.toFixed(4), '— no new notes, only carry-across — skipping visual, recursing');
        _advanceBeatGroupSubNote();
        return;
    }

    const feedback = document.getElementById('feedback');
    if (heldNotes.length > 0) {
        const holdStr = heldNotes.map(m => getNoteName(m)).join(' + ');
        const newStr  = newNotes.map(m => getNoteName(m)).join(' + ');
        feedback.innerHTML = `🟢 KEEP holding <strong style="color:#10B981">${holdStr}</strong> &amp; play <strong>${newStr}</strong>`;
    } else {
        const nextNames = newNotes.map(m => getNoteName(m)).join(' + ');
        feedback.textContent = `Now: ${nextNames}`;
    }
    document.getElementById('holdInfo').textContent = '';
    feedback.classList.remove('correct', 'wrong', 'show');
    void feedback.offsetWidth;
    feedback.classList.add('correct', 'show');

    rebuildKeyboardHighlights();
    if (scoreModeActive) {
        const allNames = Array.from(currentChordNotes).map(m => getNoteName(m)).join(' + ');
        document.getElementById('scoreKeyboardLabel').textContent =
            currentChordNotes.size > 1 ? `Play: ${allNames}` : `Play: ${currentTrainingNote}`;

        // Update SVG score highlight to the new sub-slot.
        // onTrainingNoteSpawned only fires once at beat-group spawn (for the first sub-slot),
        // so sub-slot advances here never update the score highlight — this fixes that.
        const seen = new Set();
        const allIndices = [];
        const colorMap = new Map();

        // New sub-slot notes → purple/gold (default clef color, no entry in colorMap needed)
        for (const { note: n } of _beatGroupNotes) {
            const t = n.playTime ?? n.time;
            if (Math.abs(t - nextPlayTime) >= 0.01) continue; // only notes AT this new slot
            const k = `${n.time.toFixed(4)}|${n.midi}|${n.track}`;
            if (seen.has(k)) continue;
            seen.add(k);
            allIndices.push(..._svgIndicesForMidiNote(n, 'both'));
        }

        // Sustained carry-across notes are already indicated by green keyboard keys.
        // Do NOT re-highlight them on the score at their old position — that causes
        // stray green highlights on notes that are no longer the "current" chord.

        if (allIndices.length > 0) _applyHighlight(allIndices, colorMap);
    }
}

// Called when the group timer fires — all notes have completed their full duration.
function _onBeatGroupComplete() {
    if (!trainingActive && !waitingForInput) return;

    const feedback = document.getElementById('feedback');
    feedback.textContent = 'Good!';
    feedback.classList.remove('correct', 'wrong', 'show');
    void feedback.offsetWidth;
    feedback.classList.add('correct', 'show');

    explanationLocked = false;
    waitingForInput   = false;
    expectedMidiNote  = null;

    // Advance trainingIndex past the entire beat group
    if (_beatGroupNotes.length > 0) {
        trainingIndex = _beatGroupNotes[_beatGroupNotes.length - 1].idx + 1;
    } else {
        advanceChordIndex();
    }

    _beatGroupNotes   = [];
    _beatGroupPressed = new Set();
    _beatGroupStartMs = null;
    _bgCountdownStartMs = null;
    _beatGroupCurrentPlayTime = null;
    _bgHeldNotes.clear();
    sustainedNotes.clear();
    mouseClearAllLatches();
    expectedMidiTreble.clear();
    expectedMidiBass.clear();
    noteHoldStartTime = null;
    activeMidiNote    = null;
    holdEvaluated     = true;

    updateTrainingProgress();
    document.getElementById('holdInfo').textContent = '';
    setTimeout(() => spawnNextValidNote(), 300);
}

function isBlackKey(noteName) { return noteName.includes("#"); }

function addMidiFallingRectangle(midiNumber, duration, track, noteStartTime) {
    const x = noteToX(midiNumber);

    const height = Math.max(14, duration * 150 - NOTE_GAP_PX);
    const TOP_GAP = 10;
    const startY = -height - TOP_GAP;
    const endY = canvas.height - KEYBOARD_HEIGHT - height;

    fallingRectangles.push({
        midi: midiNumber,
        noteName: getNoteName(midiNumber),
        track,
        isMidi: true,

        x,
        y: startY,
        startY,
        endY,
        width: getWhiteKeyWidth() * 0.86,
        height,

        gradient: null, // recomputed per-frame at actual rect.y so colours show correctly
        startTime: noteStartTime,
        landed: false,
    });
}


function spawnTrainingNote(noteObj) {
    // Clear any mouse-latched notes from the previous beat
    mouseClearAllLatches();

    if (!noteObj) {
        // trainingIndex walked off the end — treat as section complete
        // But only if there are no active sustained notes still requiring hold
        cleanExpiredSustainedNotes();
        if (sustainedNotes.size > 0) {
            // Other hand still has notes to hold — just wait, don't end yet
            waitingForInput = true;
            rebuildKeyboardHighlights();
            const holdEl = document.getElementById('holdInfo');
            const remaining = [];
            for (const [midi, s] of sustainedNotes) {
                if (!sustainedNoteExpired(midi)) remaining.push(getNoteName(midi));
            }
            holdEl.textContent = remaining.length
                ? `Keep holding: ${remaining.join(' + ')}`
                : '';
            return;
        }
        trainingActive = false;
        setSpeedButtonsEnabled(true);
        startPracticeButton.disabled = false;
        stopButton.disabled = true;
        stopMetronome();
        hideTrainingProgress();
        const feedback = document.getElementById('feedback');
        feedback.textContent = 'Excellent work! 🌟';
        feedback.classList.remove('wrong');
        feedback.classList.add('correct', 'show');
        sustainedNotes.clear();
        return;
    }

    // ── Both-hands: clear old sustain state (beat group model replaces it) ──
    sustainedNotes.clear();
    if (clefMode === 'both' && _beatGroupTimer) {
        clearTimeout(_beatGroupTimer);
        _beatGroupTimer = null;
    }

    // ── Standard setup ──────────────────────────────────────────────────────────
    if (clefMode === 'both') {
        activeMidiNote = null;
        noteHoldStartTime = null;
        _bgCountdownStartMs = null;
    } else {
        hardStopUserNote();
    }
    midiPressedNotes.clear();

    trainingActive = true;
    visualsPlaying = !scoreModeActive;
    fallingRectangles = [];

    previewTimeouts.forEach(t => clearTimeout(t));
    previewTimeouts = [];

    const noteName = getNoteName(noteObj.midi);
    const beats = noteObj.duration / secondsPerBeat;
    const beatLabel = beatsToNoteName(beats);

    currentTrainingNote = noteName;
    autoSlowed = false;
    waitingForInput = true;
    failureCount = 0;

    expectedHoldDuration = (noteObj.duration * 1000) / speedMultiplier;

    currentChordNotes.clear();
    chordNotesCompleted.clear();

    if (!spawnTrainingNote._noteTrackMap) spawnTrainingNote._noteTrackMap = new Map();
    const noteTrackMap = spawnTrainingNote._noteTrackMap;
    noteTrackMap.clear();

    currentChordNotes.add(noteObj.midi);
    noteTrackMap.set(noteObj.midi, noteObj.track);

    if (clefMode === 'both') {
        // ── Beat Group Model ─────────────────────────────────────────────────────
        // Build the complete beat group: all notes (both hands) that must be played
        // before "Good" fires. The group spans from this note's start to the furthest
        // note-end reachable by walking ahead through interleaved notes.
        //
        // Example: bass crotchet (0-0.437s) + treble quaver (0-0.218s)
        //          + treble quaver (0.231-0.449s) => window=0.449s, all three grouped.

        _beatGroupNotes   = [];
        _beatGroupPressed = new Set();
        _bgHeldNotes.clear();  // clear stale hold registry so retried chords require all notes fresh
        _beatGroupStartMs = null;
        _beatGroupIndex   = trainingIndex;
        _beatGroupCurrentPlayTime = noteObj.playTime ?? noteObj.time; // initialize to first slot's time

        const groupStartSec = noteObj.playTime ?? noteObj.time;

        // Step 1: compute windowEndSec from the FIRST simultaneous chord only.
        // Only notes at groupStartSec (within 10ms) set the window boundary.
        // Sub-notes that arrive later within the window do NOT expand it further —
        // that would cause a cascade where e.g. a crotchet at beat 2 pulls in all
        // of beat 3's notes and so on, making the whole bar one giant group.
        let windowEndSec = groupStartSec + noteObj.duration;
        for (let i = trainingIndex + 1; i < practiceNotes.length; i++) {
            const n = practiceNotes[i];
            const nStart = n.playTime ?? n.time;
            if (Math.abs(nStart - groupStartSec) >= 0.01) break; // past first chord
            const nEnd = nStart + n.duration;
            if (nEnd > windowEndSec) windowEndSec = nEnd;
        }

        // Step 2: collect all notes whose START falls within the window.
        // Their own duration does NOT expand the window (see above).
        for (let i = trainingIndex; i < practiceNotes.length; i++) {
            const n = practiceNotes[i];
            const nStart = n.playTime ?? n.time;
            if (nStart >= windowEndSec - 0.001) break;
            _beatGroupNotes.push({ note: n, idx: i });
        }

        _beatGroupEndSec = windowEndSec;

        // Seed currentChordNotes with notes simultaneous to noteObj (first time slot)
        for (let i = trainingIndex + 1; i < practiceNotes.length; i++) {
            const nextNote = practiceNotes[i];
            const nextPlayTime = nextNote.playTime ?? nextNote.time;
            if (Math.abs(nextPlayTime - groupStartSec) < 0.01) {
                currentChordNotes.add(nextNote.midi);
                noteTrackMap.set(nextNote.midi, nextNote.track);
            } else {
                break;
            }
        }

        const isChord = currentChordNotes.size > 1;
        const totalGroupNotes = _beatGroupNotes.length;
        const groupDurSec = _beatGroupEndSec - groupStartSec;
        const groupBeats  = groupDurSec / secondsPerBeat;
        const groupLabel  = beatsToNoteName(groupBeats);

        const holdEl = document.getElementById('holdInfo');
        holdEl.innerHTML = totalGroupNotes > currentChordNotes.size
            ? `Play all notes across both hands (group: <span class="music-symbol">${groupLabel}</span>)`
            : isChord
                ? `Click each note: ${Array.from(currentChordNotes).map(m => getNoteName(m)).join(' + ')} &nbsp;<span style="opacity:0.6;font-size:0.85em">(clicks latch for the beat)</span>`
                : `Hold for <span class="music-symbol">${groupLabel}</span>`;

        noteHoldStartTime = null;
        holdEvaluated     = false;
        expectedHoldDuration = (groupDurSec * 1000) / speedMultiplier;

        setTargetNote(noteName);

        if (scoreModeActive) {
            rebuildKeyboardHighlights();
            document.getElementById('scoreKeyboardLabel').textContent =
                currentChordNotes.size > 1
                    ? `Play: ${Array.from(currentChordNotes).map(m => getNoteName(m)).join(' + ')}`
                    : `Play: ${noteName}`;
        } else {
            _beatGroupNotes.forEach(({ note: n }) => {
                addMidiFallingRectangle(n.midi, n.duration, n.track, performance.now());
            });
            rebuildKeyboardHighlights();
        }

    } else {
        // ── Single-hand mode: original logic ────────────────────────────────────
        for (let i = trainingIndex + 1; i < practiceNotes.length; i++) {
            const nextNote = practiceNotes[i];
            const currentPlayTime = noteObj.playTime ?? noteObj.time;
            const nextPlayTime = nextNote.playTime ?? nextNote.time;
            if (Math.abs(nextPlayTime - currentPlayTime) < 0.01) {
                currentChordNotes.add(nextNote.midi);
                noteTrackMap.set(nextNote.midi, nextNote.track);
            } else {
                break;
            }
        }

        const isChord = currentChordNotes.size > 1;
        const holdEl = document.getElementById('holdInfo');
        const sustainedActive = [...sustainedNotes.keys()].filter(m => !sustainedNoteExpired(m));
        if (sustainedActive.length > 0) {
            const newNoteNames = Array.from(currentChordNotes).map(m => getNoteName(m)).join(' + ');
            const sustainNames = sustainedActive.map(m => getNoteName(m)).join(' + ');
            holdEl.innerHTML = `Keep holding <strong>${sustainNames}</strong> + play ${newNoteNames} (hold <span class="music-symbol">${beatLabel}</span>)`;
        } else if (isChord) {
            holdEl.innerHTML = `Click each note: ${Array.from(currentChordNotes).map(m => getNoteName(m)).join(' + ')} &nbsp;<span style="opacity:0.6;font-size:0.85em">(clicks latch for the beat)</span>`;
        } else {
            holdEl.innerHTML = `Hold for <span class="music-symbol">${beatLabel}</span>`;
        }

        noteHoldStartTime = null;
        holdEvaluated = false;
        setTargetNote(noteName);

        if (scoreModeActive) {
            rebuildKeyboardHighlights();
            document.getElementById('scoreKeyboardLabel').textContent =
                isChord
                    ? `Play: ${Array.from(currentChordNotes).map(m => getNoteName(m)).join(' + ')}`
                    : `Play: ${noteName}`;
        } else {
            currentChordNotes.forEach(midi => {
                addMidiFallingRectangle(midi, noteObj.duration, noteTrackMap.get(midi) ?? noteObj.track, performance.now());
            });
            rebuildKeyboardHighlights();
        }
    }

    console.log('🎯 spawnTrainingNote: index=' + trainingIndex + ' midi=' + noteObj.midi + ' track=' + noteObj.track + ' playTime=' + (noteObj.playTime??noteObj.time).toFixed(4) + ' chord=' + JSON.stringify([...currentChordNotes]) + ' sustained=' + JSON.stringify([...sustainedNotes.keys()]));
    if (typeof onTrainingNoteSpawned === 'function') {
        onTrainingNoteSpawned(noteObj);
    }
}

// Enables or disables all speed controls (hidden originals + visible panel mirrors).
// Called at preview start/end so buttons grey out while the preview is playing.
function setSpeedButtonsEnabled(enabled) {
    speedDownButton.disabled = !enabled;
    speedUpButton.disabled   = !enabled;
    const panelDown = document.getElementById('panelSpeedDown');
    const panelUp   = document.getElementById('panelSpeedUp');
    if (panelDown) panelDown.disabled = !enabled;
    if (panelUp)   panelUp.disabled   = !enabled;

    // Beat, Counting, 1&2&, BPM — locked for the exact same period as speed
    const ids = ['beatToggle','countToggle','subdivisionToggle',
                 'beatBtn','countBtn','subdivBtn',
                 'bpmInput','bpmSetBtn','bpmResetBtn'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !enabled;
    });
}

function playMeasurePreview(startTime, clef) {
    speedLocked = true;
    setSpeedButtonsEnabled(false); // grey out speed buttons for the duration of the preview
    ensureSynth();
    hardStopUserNote();

trainingActive = false;
visualsPlaying = !scoreModeActive;  // no falling notes to animate in score mode
fallingRectangles = [];
previewMode = true;

// Single authoritative timestamp — metronome anchor and visual clock
// must share the same origin so counting stays in sync with the notes.
const previewStart   = performance.now();
const visualPreroll  = getFallTimeMs();
visualClockStart     = previewStart + visualPreroll;

// Start counting/beat during preview so user hears the rhythm with the notes
if (beatEnabled || countEnabled) {
    startMetronome(previewStart + visualPreroll);
}

const feedback = document.getElementById('feedback');

// ── Listen-first countdown ──────────────────────────────────────────
// Show a live "Your turn in Xs" ticker so users know the site isn't frozen
// at slow speeds. Ticks every second until the preview ends.
let _listenCountdownTimer = null;

function _startListenCountdown(totalMs) {
    // Cancel any leftover ticker from a previous preview
    if (_listenCountdownTimer) { clearInterval(_listenCountdownTimer); _listenCountdownTimer = null; }

    const slowMsg = speedMultiplier < 1.0
        ? ` · slow speed (${speedMultiplier.toFixed(2)}×)`
        : '';

    const deadline = performance.now() + totalMs;

    function _tick() {
        if (!previewMode) {
            clearInterval(_listenCountdownTimer);
            _listenCountdownTimer = null;
            return;
        }
        const secsLeft = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
        feedback.textContent = secsLeft > 0
            ? `Listen first… your turn in ${secsLeft}s${slowMsg}`
            : 'Listen first…';
    }

    _tick();                                      // show immediately
    _listenCountdownTimer = setInterval(_tick, 500); // refresh every 0.5 s for smooth rounding
    previewTimeouts.push({ _isFakeTimeout: true, _clear: () => { clearInterval(_listenCountdownTimer); _listenCountdownTimer = null; } });
}

// Total ms the user waits before it becomes their turn:
//   visualPreroll  = time before first note sounds
//   previewLength  = computed later, but we can approximate via all note end times
//   + 400 ms tail buffer
// We'll start the ticker now with a rough estimate; the exact value doesn't need
// to be pixel-perfect — it just needs to reassure the user.
const _approxPreviewLength =
    (() => {
        const sn = practiceNotes.filter(note => {
            if (clef === 'both') return true;
            if (clef === 'treble') return note.track === TREBLE;
            if (clef === 'bass')   return note.track === BASS;
            return false;
        });
        if (!sn.length) return 0;
        const lastEnd = Math.max(...sn.map(n => (n.playTime ?? n.time) + n.duration));
        return ((lastEnd - startTime) * 1000) / speedMultiplier;
    })();

_startListenCountdown(visualPreroll + _approxPreviewLength + 400);
// ────────────────────────────────────────────────────────────────────

feedback.classList.remove('correct', 'wrong', 'show');
void feedback.offsetWidth;
feedback.classList.add('show');

const sectionNotes = practiceNotes.filter(note => {
    const isTreble = note.track === TREBLE;
    const isBass   = note.track === BASS;

    return (
        clef === 'both' ||
        (clef === 'treble' && isTreble) ||
        (clef === 'bass' && isBass)
    );
});


sectionNotes.forEach(note => {
    const t0 = (note.playTime ?? note.time);
const visualStart =
  visualClockStart +
  (((t0 - startTime) * 1000) / speedMultiplier) -
  getFallTimeMs();



    addMidiFallingRectangle(
        note.midi,
        note.duration,
        note.track,
        visualStart
    );
    const t = setTimeout(() => {
    synth.triggerAttackRelease(
        getNoteName(note.midi),
        note.duration / speedMultiplier
    );
}, visualPreroll + (((note.playTime ?? note.time) - startTime) * 1000) / speedMultiplier);


    previewTimeouts.push(t);

    // Score mode: highlight keyboard keys as each note sounds during preview
    if (scoreModeActive) {
        const keyOnDelay  = visualPreroll + (((note.playTime ?? note.time) - startTime) * 1000) / speedMultiplier;
        const keyOffDelay = keyOnDelay + (note.duration * 1000) / speedMultiplier;
        const midi = note.midi;
        const track = note.track;

        const kOn = setTimeout(() => {
            if (!previewMode) return;
            scoreKeysPlaying = true;
            if (track === TREBLE) expectedMidiTreble.add(midi);
            else if (track === BASS) expectedMidiBass.add(midi);
        }, keyOnDelay);

        const kOff = setTimeout(() => {
            if (track === TREBLE) expectedMidiTreble.delete(midi);
            else if (track === BASS) expectedMidiBass.delete(midi);
        }, keyOffDelay);

        previewTimeouts.push(kOn, kOff);
    }

    // Score mode: highlight each note as it sounds during preview
    if (scoreModeActive) {
        const highlightDelay = visualPreroll + (((note.playTime ?? note.time) - startTime) * 1000) / speedMultiplier;
        const th = setTimeout(() => {
            if (!previewMode) return;
            // Collect all notes at the same playTime so both clefs highlight together
            const notePlayTime = note.playTime ?? note.time;

            // If this preview note is from the repeat pass, mirror to first-pass SVG elements
            const physMeasure = getMeasureFromTime(note.time);
            const isRepeatPass = physMeasure !== null &&
                physMeasure >= REPEAT_START + REPEAT_LEN &&
                physMeasure <= REPEAT_END + REPEAT_LEN;

            let notesToHighlight;
            if (isRepeatPass) {
                // Use raw MIDI time (not playTime) to locate first-pass equivalents.
                // playTime is interleaved-index-based (repeat-pass m29 idx=2, first-pass
                // m29 idx=1 — offset is 1×secondsPerMeasure, NOT REPEAT_LEN×secondsPerMeasure).
                // Raw MIDI time offsets are always exactly REPEAT_LEN×secondsPerMeasure.
                const firstPassRawTime = note.time - REPEAT_LEN * secondsPerMeasure;
                notesToHighlight = sectionNotes.filter(n =>
                    Math.abs(n.time - firstPassRawTime) < 0.01
                );
                if (!notesToHighlight.length) {
                    // First-pass measures not in range — fall back to allMidiNotes
                    notesToHighlight = allMidiNotes.filter(n =>
                        Math.abs(n.time - firstPassRawTime) < 0.01
                    );
                }
                if (!notesToHighlight.length) {
                    notesToHighlight = sectionNotes.filter(n =>
                        Math.abs((n.playTime ?? n.time) - notePlayTime) < 0.01
                    );
                }
            } else {
                notesToHighlight = sectionNotes.filter(n =>
                    Math.abs((n.playTime ?? n.time) - notePlayTime) < 0.01
                );
            }

            const seen = new Set();
            const allIndices = [];
            for (const sn of notesToHighlight) {
                const k = `${sn.time.toFixed(4)}|${sn.midi}|${sn.track}`;
                if (seen.has(k)) continue;
                seen.add(k);
                allIndices.push(..._svgIndicesForMidiNote(sn, 'both'));
            }
            if (allIndices.length > 0) _applyHighlight(allIndices);
        }, highlightDelay);
        previewTimeouts.push(th);
    }
});

if (!sectionNotes.length) {
    speedLocked = false;
    setSpeedButtonsEnabled(true);
    previewMode = false;
    spawnNextValidNote();
    return;
}

const lastNoteEnd = Math.max(...sectionNotes.map(n => (n.playTime ?? n.time) + n.duration));

const previewLength =
    ((lastNoteEnd - startTime) * 1000) / speedMultiplier;

const endTimeout = setTimeout(() => {
    previewMode = false;
    speedLocked = false;
    setSpeedButtonsEnabled(true);
    scoreKeysPlaying = false;

    // Clear any keyboard keys left highlighted by landing preview notes
    expectedMidiTreble.clear();
    expectedMidiBass.clear();

    if (scoreModeActive) clearScoreHighlight();

    // Kill beat/count/1&2& completely — preview is over, user's turn now
    stopMetronome();
    _cancelCountAudio();

    // Stop the listen-first countdown ticker
    if (typeof _listenCountdownTimer !== 'undefined' && _listenCountdownTimer) {
        clearInterval(_listenCountdownTimer);
        _listenCountdownTimer = null;
    }

    const feedback = document.getElementById('feedback');
    feedback.textContent = 'Your turn';
    feedback.classList.remove('correct', 'wrong', 'show');

    spawnNextValidNote();
}, visualPreroll + previewLength + 400);


previewTimeouts.push(endTimeout);

}

// ── Skip Preview helper ──────────────────────────────────────────────────────
window._skipPreview = function() {
    if (!previewMode) return;

    // Cancel all pending preview timeouts/intervals
    previewTimeouts.forEach(t => {
        if (t && t._isFakeTimeout) {
            t._clear();
        } else {
            clearTimeout(t);
        }
    });
    previewTimeouts.length = 0;

    // Kill the listen-countdown ticker if still running
    if (typeof _listenCountdownTimer !== 'undefined' && _listenCountdownTimer) {
        clearInterval(_listenCountdownTimer);
    }

    // Reset preview state
    previewMode = false;
    speedLocked = false;
    scoreKeysPlaying = false;
    setSpeedButtonsEnabled(true);
    expectedMidiTreble.clear();
    expectedMidiBass.clear();
    if (scoreModeActive) clearScoreHighlight();
    stopMetronome();
    if (typeof _cancelCountAudio === 'function') _cancelCountAudio();

    // Hide the skip box
    const box = document.getElementById('skipPreviewBox');
    if (box) box.style.display = 'none';

    const feedback = document.getElementById('feedback');
    feedback.textContent = 'Your turn';
    feedback.classList.remove('correct', 'wrong', 'show');

    spawnNextValidNote();
};

// Show/hide the skip-preview box whenever previewMode changes.
(function _patchPreviewVisibility() {
    const box = document.getElementById('skipPreviewBox');
    if (!box) return;
    let _prev = false;
    setInterval(() => {
        if (previewMode !== _prev) {
            _prev = previewMode;
            box.style.display = previewMode ? 'block' : 'none';
        }
    }, 150);
})();
// ─────────────────────────────────────────────────────────────────────────────

function spawnNextValidNote() {

    // Guard: check up-front whether the current hand filter matches ANY note in
    // practiceNotes. If not, show a clear message and bail — prevents an infinite
    // async loop when loopEnabled is true and the hand has zero playable notes.
    const handHasNotes = practiceNotes.some(n => {
        if (clefMode === 'both') return true;
        if (clefMode === 'treble') return n.track === TREBLE;
        if (clefMode === 'bass')   return n.track === BASS;
        return false;
    });
    if (!handHasNotes) {
        const feedback = document.getElementById('feedback');
        const handLabel = clefMode === 'treble' ? 'Right hand' : clefMode === 'bass' ? 'Left hand' : 'Selected hand';
        feedback.textContent = `${handLabel} has no notes in this range — try a different section or hand.`;
        feedback.classList.remove('correct', 'wrong', 'show');
        void feedback.offsetWidth;
        feedback.classList.add('show');
        trainingActive = false;
        stopButton.disabled = true;
        return;
    }

    while (trainingIndex < practiceNotes.length) {
        const note = practiceNotes[trainingIndex];

        // Check if this note is a tied continuation using _tiedNoteKeys directly
        // (populated in loadSongMidi using post-split timestamps — works regardless of score mode).
        // Grace notes (duration < 0.1s) are NEVER tied continuations — skip the check for them.
        const isGraceMidi = note.duration < 0.1;
        const midiKey = `${note.time.toFixed(4)}|${note.midi}|${note.track}`;
        // Also check the pre-split timestamp as a safety net: splitRepeatedNotes shifts
        // consecutive same-pitch re-attacks by +NOTE_GAP_TIME, and _tiedNoteKeys is built
        // post-split, so the direct key should always match. The shifted fallback handles
        // any remaining floating-point edge cases.
        const shiftedKey = `${(note.time - NOTE_GAP_TIME).toFixed(4)}|${note.midi}|${note.track}`;
        const isTiedContinuation = !isGraceMidi && (_tiedNoteKeys.has(midiKey) || _tiedNoteKeys.has(shiftedKey));

        if (isTiedContinuation) {
            // Tied continuation — skip silently (user already played the parent note)
            trainingIndex++;
            updateTrainingProgress();
            continue;
        }

        // Skip grace notes — they are ornamental, not real practice steps.
        // The bass note simultaneous with the grace is NOT skipped; it plays as step 1.
        const graceRankEntry = _midiRankMap.get(midiKey);
        if (graceRankEntry) {
            const graceBucket = _svgBuckets[graceRankEntry.sheet_measure]?.[graceRankEntry.clef];
            const graceIdx = graceBucket?.[graceRankEntry.rank];
            if (graceIdx !== undefined && _svgNoteElements[graceIdx]?.isGrace) {
                trainingIndex++;
                updateTrainingProgress();
                continue;
            }
        }

        const isTreble = note.track === TREBLE;
        const isBass   = note.track === BASS;

        if (
            clefMode === 'both' ||
            (clefMode === 'treble' && isTreble) ||
            (clefMode === 'bass'   && isBass)
        ) {
            spawnTrainingNote(note);
            return;
        }

        trainingIndex++;
        updateTrainingProgress();
    }

    if (loopEnabled) {
        trainingIndex = 0;
        document.getElementById('feedback').textContent = 'Looping section…';
        setTimeout(() => {
            playMeasurePreview(sectionStartTime, clefMode);
        }, 600);
        return;
    }

    const feedback = document.getElementById('feedback');
    feedback.textContent = 'Excellent work! 🌟';
    feedback.classList.remove('wrong');
    feedback.classList.add('correct', 'show');

    trainingActive = false;
    stopButton.disabled = true;
    startPracticeButton.disabled = false;
    setSpeedButtonsEnabled(true);
    stopMetronome();
    hideTrainingProgress();
}

// ── Shared chord-advance helper ──────────────────────────────────────────────
// Counts how many practiceNotes share the same playTime as practiceNotes[trainingIndex]
// and advances by that exact count.
//
// FIX: Do NOT use Math.max(skip, currentChordNotes.size).
// currentChordNotes can be stale near measure boundaries: a grace note at
// playTime = idx*spm - 0.02 and the first beat at idx*spm + 0 are 0.02s apart
// (outside the 0.01s chord window), so skip=1 is correct. But if currentChordNotes
// still holds notes from an earlier chord with size > 1, the Math.max overshoot
// would jump trainingIndex into a later or repeated measure, re-presenting the
// grace note as if the section had looped.
function advanceChordIndex() {
    if (!practiceNotes[trainingIndex]) return;
    const baseTime  = practiceNotes[trainingIndex].playTime ?? practiceNotes[trainingIndex].time;
    const baseTrack = practiceNotes[trainingIndex].track;

    let i = trainingIndex;

    if (clefMode === 'both') {
        // In 'both' mode: if the current step included cross-track notes at the same
        // playTime (they were all in currentChordNotes), advance past ALL of them
        // regardless of track. Then skip any other-track notes whose playTime is
        // strictly before baseTime (stale interleaved steps already completed).

        // Step 1: skip ALL notes at the same playTime (same or different track)
        // — these were all presented together as one chord step.
        while (i < practiceNotes.length) {
            const t = practiceNotes[i].playTime ?? practiceNotes[i].time;
            if (Math.abs(t - baseTime) < 0.01) { i++; }
            else break;
        }

        // Step 2: skip any stale other-track notes that sit before baseTime
        // (can happen when the two hands have offset rhythms and we've already
        //  played the other hand's earlier steps)
        while (i < practiceNotes.length) {
            const n = practiceNotes[i];
            const t = n.playTime ?? n.time;
            if (n.track !== baseTrack && t < baseTime - 0.001) { i++; }
            else break;
        }
    } else {
        // Single-hand mode: advance past all notes at same playTime (original logic)
        while (i < practiceNotes.length) {
            const t = practiceNotes[i].playTime ?? practiceNotes[i].time;
            if (Math.abs(t - baseTime) < 0.01) { i++; }
            else break;
        }
    }

    // Ensure we advance by at least 1
    trainingIndex = Math.max(i, trainingIndex + 1);
}
// ─────────────────────────────────────────────────────────────────────────────

function startVisualCountdown(onComplete) {
    const overlay = document.getElementById('countdownOverlay');
    let count = 3;

    countdownActive = true;
    overlay.style.display = 'block';
    overlay.textContent = count;

    const tick = () => {
        if (!countdownActive) {
            overlay.style.display = 'none';
            return;
        }
        count--;

        if (count > 0) {
            overlay.textContent = count;
            countdownTimeoutId = setTimeout(tick, 1000);
        } else {
            overlay.style.display = 'none';
            countdownActive = false;
            countdownTimeoutId = null;
            onComplete();
        }
    };

    countdownTimeoutId = setTimeout(tick, 1000);
}

// Animation loop
function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const keyboardTop = scoreModeActive ? 0 : canvas.height - KEYBOARD_HEIGHT;
    const now = performance.now();

    // Safety net: if nothing is actively waiting for input, ensure no keys are stuck highlighted
    if (!waitingForInput && !visualsPlaying && !scoreKeysPlaying && noteHoldStartTime === null) {
        if (expectedMidiTreble.size > 0) expectedMidiTreble.clear();
        if (expectedMidiBass.size > 0)   expectedMidiBass.clear();
    }

    if (visualsPlaying && !scoreModeActive) {
        fallingRectangles = fallingRectangles.filter(rect => {
            const elapsed =
    performance.now() - rect.startTime;


    const progress = elapsed / getFallTimeMs();

    rect.y = rect.startY + progress * (rect.endY - rect.startY);

if (
    rect.isMidi &&
    !rect.landed &&
    rect.y >= rect.endY
) {
    rect.landed = true;

    if (rect.track === TREBLE) {
        expectedMidiTreble.add(rect.midi);
    } else if (rect.track === BASS) {
        expectedMidiBass.add(rect.midi);
    }

    const isPartOfCurrentChord = currentChordNotes.has(rect.midi);
    
    if (!isPartOfCurrentChord) {
        setTimeout(() => {
            expectedMidiTreble.delete(rect.midi);
            expectedMidiBass.delete(rect.midi);
        }, 100);
    }
}
if (rect.y > canvas.height) {
    return false;
}

// Recompute gradient each frame at rect's actual y so colours render correctly
{
    const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.height);
    if (rect.track === TREBLE) {
        g.addColorStop(0.00, THEME.trebleFallTop);
        g.addColorStop(0.25, THEME.trebleFallMid1);
        g.addColorStop(0.65, THEME.trebleFallMid2);
        g.addColorStop(1.00, THEME.trebleFallBot);
    } else {
        g.addColorStop(0.00, THEME.bassFallTop);
        g.addColorStop(0.25, THEME.bassFallMid1);
        g.addColorStop(0.65, THEME.bassFallMid2);
        g.addColorStop(1.00, THEME.bassFallBot);
    }
    ctx.fillStyle = g;
}

// Glow shadow for treble notes
if (rect.track === TREBLE) {
    ctx.shadowColor = THEME.trebleFallShadow;
    ctx.shadowBlur = 18;
} else {
    ctx.shadowColor = THEME.bassFallShadow;
    ctx.shadowBlur = 10;
}

const r = 12;
ctx.beginPath();
ctx.moveTo(rect.x + r, rect.y);
ctx.lineTo(rect.x + rect.width - r, rect.y);
ctx.quadraticCurveTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + r);
ctx.lineTo(rect.x + rect.width, rect.y + rect.height - r);
ctx.quadraticCurveTo(rect.x + rect.width, rect.y + rect.height, rect.x + rect.width - r, rect.y + rect.height);
ctx.lineTo(rect.x + r, rect.y + rect.height);
ctx.quadraticCurveTo(rect.x, rect.y + rect.height, rect.x, rect.y + rect.height - r);
ctx.lineTo(rect.x, rect.y + r);
ctx.quadraticCurveTo(rect.x, rect.y, rect.x + r, rect.y);
ctx.closePath();
ctx.fill();
ctx.shadowBlur = 0;

ctx.save();
ctx.globalCompositeOperation = "screen";
ctx.globalAlpha = 0.22;

const gloss = ctx.createLinearGradient(
    rect.x,
    rect.y,
    rect.x + rect.width,
    rect.y
);

gloss.addColorStop(0.0, "rgba(255,255,255,0.05)");
gloss.addColorStop(0.4, "rgba(255,255,255,0.35)");
gloss.addColorStop(0.6, "rgba(255,255,255,0.35)");
gloss.addColorStop(1.0, "rgba(255,255,255,0.05)");

ctx.fillStyle = gloss;
ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

ctx.restore();

const shimmerSpeed = 0.0015 * speedMultiplier;
const shimmerPhase =
    (performance.now() * shimmerSpeed) % 1;

const shimmerY =
    rect.y + shimmerPhase * rect.height;

const isDownbeat = metronomeRunning && (metroBeat % SONG_CONFIG.timeSignature[0] === 0);

ctx.save();
ctx.globalAlpha = isDownbeat ? 0.28 : 0.18;
ctx.globalCompositeOperation = "lighter";

const shimmerGradient = ctx.createLinearGradient(
    0,
    shimmerY - 20,
    0,
    shimmerY + 20
);

shimmerGradient.addColorStop(0, "rgba(255,255,255,0)");
shimmerGradient.addColorStop(0.5, "rgba(255,255,255,0.8)");
shimmerGradient.addColorStop(1, "rgba(255,255,255,0)");

ctx.fillStyle = shimmerGradient;
ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

ctx.restore();

if (showNoteNames && rect.isMidi && rect.noteName) {
        if (rect.track === BASS) {
            ctx.fillStyle = THEME.fallingLabelBass;
            ctx.shadowColor = "rgba(0,0,0,0.5)";
        } else {
            ctx.fillStyle = THEME.fallingLabelTreble;
            ctx.shadowColor = "rgba(0,0,0,0.6)";
        }
        
        ctx.font = "bold 15px Arial";
        ctx.shadowBlur = 2;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            rect.noteName,
            rect.x + rect.width / 2,
            rect.y + rect.height / 2
        );
        ctx.shadowBlur = 0;
    }

    return true;
});
} 
drawKeyboard();
    drawBlackKeyArrow();
    requestAnimationFrame(animate);
}
function drawBlackKeyArrow() {
    if (!showBlackKeyArrow || !arrowTargetGroup) return;

    const keyHeight = KEYBOARD_HEIGHT;
    const keyboardTop = scoreModeActive ? 0 : canvas.height - KEYBOARD_HEIGHT;

    const targetMidi = arrowTargetGroup === "2" ? 61 : 66;

    const x = noteToX(targetMidi) + getWhiteKeyWidth()    / 2;
    const y = keyboardTop - 140;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, keyboardTop - 20);
    ctx.stroke();

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.moveTo(x - 10, keyboardTop - 30);
    ctx.lineTo(x, keyboardTop - 20);
    ctx.lineTo(x + 10, keyboardTop - 30);
    ctx.fill();

    const text = `Group of ${arrowTargetGroup} black keys`;
    ctx.font = "16px Arial";
    const textWidth = ctx.measureText(text).width;

    const boxX = x - textWidth / 2 - 10;
    const boxY = y - 35;
    const boxWidth = textWidth + 20;
    const boxHeight = 28;

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    ctx.strokeStyle = "red";
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, boxY + boxHeight / 2);
}
animate();
// ================================
// SIMPLE METRONOME (BUTTON ONLY)
// ================================
// Returns the spoken syllable for a given 16th-note slot within a beat.
// slotInBeat: 0="one/two", 1="e", 2="and", 3="a"
function getCountWord(beatIndex, slotInBeat) {
    const beatsPerMeasure = SONG_CONFIG.timeSignature[0];
    const beat = (beatIndex % beatsPerMeasure) + 1;

    const beatNames = {
        en: ["one", "two", "three", "four"],
        it: ["one", "two", "three", "four"]   // Italian mp3s not available; use English audio
    };
    const lang = beatNames[countLanguage] || beatNames.en;

    if (countMode === "subdivision") {
        // "1 & 2 & 3 & 4 &" — speak on beat (slot 0) and "and" (slot 2) only
        switch (slotInBeat) {
            case 0: return lang[beat - 1];   // "one" / "two" / "three" / "four"
            case 1: return null;             // skip "e"
            case 2: return "and";            // "&"
            case 3: return null;             // skip "a"
        }
    }

    // Normal mode: only speak on the downbeat of each beat
    if (slotInBeat === 0) return lang[beat - 1];
    return null;
}

// (Old _scheduleCountWords / _clearSpeechTimeouts removed — replaced by
//  the Web Audio lookahead scheduler: _runCountScheduler / _cancelCountAudio)

function startMetronome(startTimeOverride = null) {
    stopMetronome();

    transportStartTime = startTimeOverride ?? performance.now();
    metronomeRunning = true;

    if (!metroSynth) {
        metroSynth = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.001, decay: 0.03, sustain: 0 },
            volume: -6
        }).toDestination();
    }

    const bpm = (60 / secondsPerBeat) * speedMultiplier;

    // Each beat divided into 4 sixteenth-note slots for "1 e & a" counting
    const stepMs = (60000 / bpm) / 4;

    let lastStep = -1;

    function tick() {
        if (!metronomeRunning) return;

        const elapsed = performance.now() - transportStartTime;
        if (elapsed < 0) {
            metroInterval = requestAnimationFrame(tick);
            return;
        }
        const step = Math.floor(elapsed / stepMs);

        if (step !== lastStep) {
            lastStep = step;

            const slotInBeat = step % 4;
            const isMainBeat = slotInBeat === 0;

            // Beat click sound only
            if (beatEnabled && isMainBeat) {
                metroSynth.triggerAttackRelease("16n");
            }
            // NOTE: counting words are now handled by the Web Audio lookahead
            // scheduler (_runCountScheduler) started below — NOT in this rAF loop.
        }

        metroInterval = requestAnimationFrame(tick);
    }

    tick();

    // Start the Web Audio lookahead scheduler for counting words.
    // We must NOT fire it until transportStartTime has been reached:
    // when transportStartTime is in the future (preroll offset), launching
    // the scheduler immediately makes count words fire ~2 s early, out of
    // sync with both the beat click and the falling notes.
    // Poll via rAF until the transport clock >= 0, then anchor.
    if (countEnabled) {
        _loadCountBuffers().then(() => {
            if (!metronomeRunning) return null;
            return _ensureCountAudioCtx();
        }).then(ctx => {
            if (!ctx || !metronomeRunning) return;

            const waitForTransport = () => {
                if (!metronomeRunning) return;
                if (performance.now() < transportStartTime) {
                    requestAnimationFrame(waitForTransport);
                    return;
                }
                // Transport clock has reached zero — anchor the scheduler here.
                _schedWallMs       = performance.now();
                _schedCtxSec       = ctx.currentTime;
                _lastScheduledStep = -1;
                _runCountScheduler(bpm);
            };
            requestAnimationFrame(waitForTransport);
        });
    }
}

// ================================
// SHARED HOLD / SUSTAIN HELPERS
// ================================

// Called when a note is released. Returns true if it was a sustained note released early.
// If so, it flags the error and keeps the note highlighted.
function handleSustainedNoteRelease(midiNote) {
    if (!sustainedNotes.has(midiNote)) return false;
    if (sustainedNoteExpired(midiNote)) {
        sustainedNotes.delete(midiNote);
        return false;
    }
    // Released too early — flag error, keep highlighting
    midiPressedNotes.delete(midiNote);
    if (synth) synth.triggerRelease(getNoteName(midiNote));
    rebuildKeyboardHighlights();
    const feedback = document.getElementById('feedback');
    const s = sustainedNotes.get(midiNote);
    const remaining = Math.max(0, (s.requiredDurationMs - (performance.now() - s.startTime)) / 1000);
    feedback.innerHTML = `Keep holding <strong>${getNoteName(midiNote)}</strong>! ${remaining.toFixed(1)}s remaining`;
    feedback.classList.remove('correct', 'wrong', 'show');
    void feedback.offsetWidth;
    feedback.classList.add('wrong', 'show');
    return true;
}

// Core hold evaluation — called from mouseup, touchend, and MIDI noteOff
// Returns true if the hold was evaluated (advance or retry), false if not applicable.
function evaluateHoldOnRelease(releasedMidi) {
    // In both-hands mode: enforce sustained holds via the _bgHeldNotes registry.
    if (clefMode === 'both') {
        if (synth) synth.triggerRelease(getNoteName(releasedMidi));
        midiPressedNotes.delete(releasedMidi);

        // Check if this note must still be held — penalise and block if so
        _bgCheckEarlyRelease(releasedMidi);
        return true;
    }

    // If a sustained note was released early, handle that and stop
    if (handleSustainedNoteRelease(releasedMidi)) return true;

    if (noteHoldStartTime === null) return false;

    const heldTime = performance.now() - noteHoldStartTime;

    if (holdEvaluated) { noteHoldStartTime = null; activeMidiNote = null; return true; }
    holdEvaluated = true;

    const feedback = document.getElementById('feedback');

    if (heldTime >= expectedHoldDuration) {
        feedback.textContent = 'Good!';
        feedback.classList.remove('correct', 'wrong', 'show');
        void feedback.offsetWidth;
        feedback.classList.add('correct', 'show');
        explanationLocked = false;

        waitingForInput = false;
        expectedMidiNote = null;

        // Save the hold start time NOW, before it gets cleared at the end of this function.
        // spawnTrainingNote's carry-forward block needs it to compute how much of a
        // longer-duration note (e.g. bass crotchet) has already elapsed when the next
        // step (e.g. treble quaver) is spawned.
        _lastHoldStartTime = noteHoldStartTime;

        // In both-hands mode: move the completed notes into sustainedNotes
        // so they remain required while the other hand continues
        if (clefMode === 'both') {
            const nowMs = performance.now();
            currentChordNotes.forEach(midi => {
                if (midi !== releasedMidi) {
                    // Notes still pressed — they may need to be sustained
                    // For simplicity, they've been held for expectedHoldDuration, so they're done
                }
                sustainedNotes.delete(midi);
            });
            // Clean up expired sustained notes from the other hand
            cleanExpiredSustainedNotes();
            rebuildKeyboardHighlights();
        } else {
            expectedMidiTreble.clear();
            expectedMidiBass.clear();
        }

        advanceChordIndex();
        updateTrainingProgress();

        document.getElementById('holdInfo').textContent = '';
        setTimeout(() => spawnNextValidNote(), 300);

    } else {
        const heldBeats = heldTime / 1000 / secondsPerBeat;
        const expectedBeats = expectedHoldDuration / 1000 / secondsPerBeat;

        feedback.innerHTML =
            `Too short — held <span class="music-symbol">${beatsToNoteName(heldBeats)}</span>, need <span class="music-symbol">${beatsToNoteName(expectedBeats)}</span>`;

        feedback.classList.remove('correct', 'wrong', 'show');
        void feedback.offsetWidth;
        feedback.classList.add('wrong', 'show');

        const holdEl = document.getElementById('holdInfo');
        holdEl.innerHTML = `Hold for <span class="music-symbol">${beatsToNoteName(expectedBeats)}</span>`;

        if (retryTimeout) { clearTimeout(retryTimeout); retryTimeout = null; }
        _lastHoldStartTime = null; // retry — no carry-forward should happen
        retryTimeout = setTimeout(() => {
            if (trainingIndex < practiceNotes.length) {
                spawnTrainingNote(practiceNotes[trainingIndex]);
            }
        }, 600);
    }

    noteHoldStartTime = null;
    _lastHoldStartTime = null; // cleared here; was already saved above before this line
    activeMidiNote = null;
    return true;
}

// ================================
// MOUSE INPUT (NOTE ON / OFF)
// ================================
function getMidiFromMouse(x, y) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    x = x * scaleX;
    y = y * scaleY;
    
    const keyboardTop = scoreModeActive ? 0 : canvas.height - KEYBOARD_HEIGHT;
    if (y < keyboardTop) return null;

    const whiteKeyWidth = getWhiteKeyWidth();
    const blackKeyWidth = whiteKeyWidth * 0.6;
    const blackKeyHeight = KEYBOARD_HEIGHT * 0.6;

    let whiteIndex = 0;
    for (let midi = START_NOTE; midi <= END_NOTE; midi++) {
        if (!isBlackMidi(midi)) {
            whiteIndex++;
            continue;
        }
        const bx = (whiteIndex - 1) * whiteKeyWidth + whiteKeyWidth * 0.7;
        if (
            x >= bx &&
            x <= bx + blackKeyWidth &&
            y >= keyboardTop &&
            y <= keyboardTop + blackKeyHeight
        ) {
            return midi;
        }
    }
    return xToMidi(x);
}

// Registered once here (not inside processUserNoteOn) to avoid stacking
// duplicate listeners every time a free-mode key is pressed.
canvas.addEventListener('mouseleave', () => {
    mouseDown = false;
    if (freeMode && freeModeActiveNote !== null) {
        freeModeSynth.triggerRelease(getNoteName(freeModeActiveNote));
        freeModeActiveNote = null;
        expectedMidiNote = null;
        expectedMidiTreble.clear();
        expectedMidiBass.clear();
    }
});

canvas.addEventListener('mousedown', async (e) => {
    if (previewMode) return;
    await Tone.start();
    mouseDown = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const keyboardStartY = scoreModeActive ? 0 : (canvas.height - KEYBOARD_HEIGHT) * (rect.height / canvas.height);
    if (y < keyboardStartY) return;
    const midiNote = getMidiFromMouse(x, y);
    if (midiNote === null) return;
    lastMouseMidi = midiNote;

    // Click-to-latch: in training mode (non-free), latch the note so chord
    // notes can be clicked one-by-one and held for the entire beat.
    if (!freeMode && trainingActive) {
        _dbgClicks++;
        const alreadyLatched = mouseLatchedNotes.has(midiNote);
        const alreadyPressed = midiPressedNotes.has(midiNote);
        _dbgLog(`CLICK midi=${midiNote}(${getNoteName(midiNote)}) alreadyLatched=${alreadyLatched} alreadyPressed=${alreadyPressed} holdEval=${holdEvaluated} holdRunning=${noteHoldStartTime !== null}`);

        // If this note is already latched & the hold timer is running, the user is
        // clicking again to signal done holding — evaluate immediately instead of
        // toggling the latch off (which would silently do nothing useful).
        if (alreadyLatched && noteHoldStartTime !== null && !holdEvaluated) {
            _dbgLog(`  -> re-click while holding: evaluating hold immediately`);
            _dbgUpdate();
            // In both-hands mode the hold is managed by the beat-group registry.
            // evaluateHoldOnRelease only calls _bgCheckEarlyRelease and returns,
            // leaving _beatGroupTimer null with no path to completion when the user
            // re-presses after a premature release. Use _bgRestartHoldTimer instead,
            // which correctly re-arms the completion timer (or no-ops if the note
            // is no longer in the must-hold registry because time has elapsed).
            if (clefMode === 'both') {
                const restarted = _bgRestartHoldTimer(midiNote);
                if (!restarted) {
                    // Note is no longer in the hold registry (time already elapsed
                    // or was never registered). If the beat-group timer was cancelled
                    // by an early-release, restart it now so the group can complete.
                    if (_beatGroupTimer === null) {
                        const allSubNotesDone = !_beatGroupNotes.some(({ note: n }) => {
                            const t = n.playTime ?? n.time;
                            return t > (_beatGroupCurrentPlayTime ?? -1) + 0.001;
                        });
                        const allHoldsComplete = [..._bgHeldNotes.values()].every(
                            h => performance.now() >= h.requiredUntilMs
                        );
                        if (allSubNotesDone && allHoldsComplete) {
                            _beatGroupTimer = setTimeout(() => {
                                _beatGroupTimer = null;
                                _onBeatGroupComplete();
                            }, 50);
                        }
                    }
                }
            } else {
                evaluateHoldOnRelease(midiNote);
            }
            return;
        }

        mouseToggleLatch(midiNote);
        if (mouseLatchedNotes.has(midiNote)) {
            // Note was just latched — treat as note-on
            processUserNoteOn(midiNote);
        } else {
            _dbgLog(`  -> toggle OFF (unlatch), processUserNoteOn skipped`);
        }
        _dbgUpdate();
        // If toggled off: processUserNoteOn won't re-fire; the note was released above
        return;
    }

    processUserNoteOn(midiNote);
});

canvas.addEventListener('mousemove', (e) => {
    if (!mouseDown || !freeMode) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const keyboardStartY = scoreModeActive ? 0 : canvas.height - KEYBOARD_HEIGHT;
    if (y < keyboardStartY) return;

    const midiNote = getMidiFromMouse(x, y);
    if (midiNote === null || midiNote === lastMouseMidi) return;

    lastMouseMidi = midiNote;
    processUserNoteOn(midiNote);
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
    const releasedMidi = lastMouseMidi;
    lastMouseMidi = null;

    if (freeMode && freeModeActiveNote !== null) {
        freeModeSynth.triggerRelease(getNoteName(freeModeActiveNote));
        freeModeActiveNote = null;
        expectedMidiNote = null;
        expectedMidiTreble.clear();
        expectedMidiBass.clear();
        return;
    }

    // In latch mode: on mouseup, evaluate the hold — if the full duration has
    // elapsed, this advances to the next note. If not, the auto-evaluate
    // setTimeout will fire when the time is up (note stays latched/pressed).
    if (!freeMode && trainingActive && releasedMidi !== null && mouseLatchedNotes.has(releasedMidi)) {
        if (noteHoldStartTime !== null && !holdEvaluated) {
            evaluateHoldOnRelease(releasedMidi);
        }
        return;
    }

    if (releasedMidi !== null) {
        // In both-hands mode: always check the hold registry first
        if (clefMode === 'both' && _bgHeldNotes.has(releasedMidi)) {
            midiPressedNotes.delete(releasedMidi);
            if (synth) synth.triggerRelease(getNoteName(releasedMidi));
            _bgCheckEarlyRelease(releasedMidi);
            return;
        }
        midiPressedNotes.delete(releasedMidi);
        if (synth) synth.triggerRelease(getNoteName(releasedMidi));
        // Check sustained note release first
        if (handleSustainedNoteRelease(releasedMidi)) return;
    }

    if (activeMidiNote === null || noteHoldStartTime === null) return;
    if (getNoteName(activeMidiNote) !== currentTrainingNote && !currentChordNotes.has(activeMidiNote)) {
        activeMidiNote = null;
        noteHoldStartTime = null;
        expectedMidiTreble.clear();
        expectedMidiBass.clear();
        return;
    }

    if (!holdEvaluated) evaluateHoldOnRelease(releasedMidi ?? activeMidiNote);
});
// ================================
// TOUCH EVENTS
// ================================
canvas.addEventListener('touchstart', async (e) => {
    if (previewMode) return;
    e.preventDefault();
    await Tone.start();

    touchActive = true;
    mouseDown = true;

    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const keyboardStartY = scoreModeActive ? 0 : (canvas.height - KEYBOARD_HEIGHT) * (rect.height / canvas.height);
        if (y < keyboardStartY) continue;

        const midiNote = getMidiFromMouse(x, y);
        if (midiNote === null) continue;

        activeTouches.set(touch.identifier, midiNote);

        processUserNoteOn(midiNote);
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (!touchActive) return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const keyboardStartY = scoreModeActive ? 0 : (canvas.height - KEYBOARD_HEIGHT) * (rect.height / canvas.height);
        if (y < keyboardStartY) continue;

        const midiNote = getMidiFromMouse(x, y);
        if (midiNote === null) continue;

        const oldNote = activeTouches.get(touch.identifier);

        if (oldNote !== midiNote) {
            activeTouches.set(touch.identifier, midiNote);
            processUserNoteOn(midiNote);
        }
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (!touchActive) return;
    e.preventDefault();

    let lastReleasedMidi = null;

    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const midiNote = activeTouches.get(touch.identifier);

        if (midiNote !== undefined) {
            lastReleasedMidi = midiNote;
            if (freeMode && midiNote === freeModeActiveNote) {
                freeModeSynth.triggerRelease(getNoteName(midiNote));
                freeModeActiveNote = null;
                expectedMidiNote = null;
                expectedMidiTreble.clear();
            } else if (synth) {
                synth.triggerRelease(getNoteName(midiNote));
            }

            midiPressedNotes.delete(midiNote);
            activeTouches.delete(touch.identifier);
        }
    }

    // Check for early sustained-note release
    if (lastReleasedMidi !== null && clefMode === 'both' && _bgHeldNotes.has(lastReleasedMidi)) {
        _bgCheckEarlyRelease(lastReleasedMidi);
        // Tear down touch tracking
        if (e.touches.length === 0) { touchActive = false; mouseDown = false; activeTouches.clear(); }
        return;
    }

    if (lastReleasedMidi !== null && sustainedNotes.has(lastReleasedMidi)) {
        handleSustainedNoteRelease(lastReleasedMidi);
    }

    // Evaluate hold when all current-chord notes have been released
    // (sustained notes from the other hand may still be held — that's fine)
    const currentChordAllReleased = !freeMode
        && noteHoldStartTime !== null
        && Array.from(currentChordNotes).every(m => !midiPressedNotes.has(m));

    if (currentChordAllReleased && !holdEvaluated) {
        evaluateHoldOnRelease(lastReleasedMidi ?? activeMidiNote ?? 0);
    }

    // Tear down touch tracking once all physical fingers have left the screen
    if (e.touches.length === 0) {
        touchActive = false;
        mouseDown = false;
        activeTouches.clear();

        // Safety-net clear only for non-both-hands mode (sustained notes need to stay)
        if (clefMode !== 'both' && !currentChordAllReleased) {
            expectedMidiTreble.clear();
            expectedMidiBass.clear();
        }
    }
}, { passive: false });

canvas.addEventListener('touchcancel', (e) => {
    if (!touchActive) return;
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const midiNote = activeTouches.get(touch.identifier);

        if (midiNote !== undefined && synth) {
            synth.triggerRelease(getNoteName(midiNote));
            midiPressedNotes.delete(midiNote);
            activeTouches.delete(touch.identifier);
        }
    }

    if (e.touches.length === 0) {
        touchActive = false;
        mouseDown = false;
        activeTouches.clear();
        expectedMidiTreble.clear();
        expectedMidiBass.clear();
        noteHoldStartTime = null;
        activeMidiNote = null;
        sustainedNotes.clear();
    }
}, { passive: false });

// MIDI handling
async function initMIDI() {
    if(!navigator.requestMIDIAccess){ console.log('Web MIDI API not supported'); return; }
    try {
        const midiAccess = await navigator.requestMIDIAccess();
        for(const input of midiAccess.inputs.values()){
            midiInputs.push(input);
            input.onmidimessage = handleMIDIMessage;
        }
        midiAccess.onstatechange = (event)=>{
            if(event.port.state==='connected' && event.port.connection==='open' && event.port.type==='input'){
                midiInputs.push(event.port);
                event.port.onmidimessage=handleMIDIMessage;
            } else if(event.port.state==='disconnected'){
                const idx = midiInputs.indexOf(event.port);
                if(idx>-1) midiInputs.splice(idx,1);
            }
        }
    } catch(err){ console.error(err); }
}

function setTargetNote(noteName){
    targetNote = noteName;
}

function splitRepeatedNotes(notes, gapSeconds = NOTE_GAP_TIME) {
    const result = [];

    for (let i = 0; i < notes.length; i++) {
        const current = notes[i];
        const prev = result[result.length - 1];

        if (
            prev &&
            prev.midi === current.midi &&
            prev.track === current.track &&
            Math.abs((prev.time + prev.duration) - current.time) < 0.001
        ) {
            prev.duration = Math.max(
                0,
                prev.duration - gapSeconds
            );

            result.push({
                ...current,
                time: current.time + gapSeconds
            });
        } else {
            result.push({ ...current });
        }
    }

    return result;
}


function removeRepeatedMeasures(notes, secondsPerMeasure) {
    const measures = new Map();
    const result = [];

    for (const note of notes) {
        const measureIndex = Math.floor(note.time / secondsPerMeasure);

        if (!measures.has(measureIndex)) {
            measures.set(measureIndex, []);
        }

        measures.get(measureIndex).push(note);
    }

    const seenSignatures = new Set();

    for (const [measureIndex, measureNotes] of measures.entries()) {
        const signature = JSON.stringify(
            measureNotes.map(n => [
                n.midi,
                +(n.time % secondsPerMeasure).toFixed(3),
                +n.duration.toFixed(3),
                n.track
            ])
        );

        if (seenSignatures.has(signature)) {
            continue;
        }

        seenSignatures.add(signature);
        result.push(...measureNotes);
    }

    return result.sort((a, b) => a.time - b.time);
}

function reportEmptyLogicalMeasures(startLogical, endLogical, notes) {
    const counts = new Map();
    for (let m = startLogical; m <= endLogical; m++) counts.set(m, 0);

    for (const n of notes) {
        const lm = (n.logicalMeasure ?? getLogicalSheetMeasureFromTime(n.time));
        if (lm !== null && lm >= startLogical && lm <= endLogical) {
            counts.set(lm, (counts.get(lm) || 0) + 1);
        }
    }

    const empty = [];
    for (let m = startLogical; m <= endLogical; m++) {
        if ((counts.get(m) || 0) === 0) empty.push(m);
    }

    console.log("Notes per logical bar:", Object.fromEntries(counts));
    if (empty.length) console.warn("Empty logical bars in this hand:", empty.join(", "));
    return empty;
}

startPracticeButton.addEventListener('click', async () => {
    // Prevent double-click / re-entry while countdown or preview is running
    if (startPracticeButton.disabled) return;
    startPracticeButton.disabled = true;

    await Tone.start();
    
    if (midiInputs.length === 0) {
        try {
            const midiAccess = await navigator.requestMIDIAccess();
            console.log('✅ MIDI Access granted');
            
            for (const input of midiAccess.inputs.values()) {
                console.log('🔌 Connected:', input.name);
                midiInputs.push(input);
                
                input.onmidimessage = (event) => {
                    handleMIDIMessage(event);
                };
            }
        } catch (err) {
            console.error('❌ MIDI Error:', err);
        }
    }
    
    hardStopUserNote();

    const selectedHand = handSelect.value;
    const startMeasure = parseInt(startMeasureInput.value, 10);
const endMeasure = parseInt(endMeasureInput.value, 10);

if (
    isNaN(startMeasure) ||
    isNaN(endMeasure) ||
    startMeasure < 1 ||
    endMeasure < startMeasure
) {
    alert("Invalid measure range");
    startPracticeButton.disabled = false;
    return;
}
if (endMeasure > MAX_LOGICAL_MEASURE) {
    alert(`Max sheet measure is ${MAX_LOGICAL_MEASURE}`);
    startPracticeButton.disabled = false;
    return;
}

const startLogical = startMeasure;
const endLogical   = endMeasure;

const built = buildPhysicalPracticeMeasureSequence(startLogical, endLogical, skipSheetRepeats);
if (!built) {
    alert("Could not map that sheet range to the MIDI timeline.");
    startPracticeButton.disabled = false;
    return;
}

const physicalSeq = built.seq;
const allowedPhysical = new Set(physicalSeq);

const physicalIndex = new Map();
physicalSeq.forEach((p, idx) => physicalIndex.set(p, idx));

// Cumulative play-time start for each position in physicalSeq.
// With mixed time signatures, different measures may have different durations,
// so we can't use idx * secondsPerMeasure — we must sum actual measure durations.
const physicalSeqCumTime = [];
{
    let t = 0;
    for (const p of physicalSeq) {
        physicalSeqCumTime.push(t);
        const entry = MEASURE_TIME_MAP[p];
        t += entry ? (entry.end - entry.start) : secondsPerMeasure;
    }
}

const logicalSeq =
    skipSheetRepeats
        ? Array.from({ length: endLogical - startLogical + 1 }, (_, i) => startLogical + i)
        : physicalSeq.map(p => PHYSICAL_TO_LOGICAL[p]);

console.log("Skip repeats:", skipSheetRepeats);
console.log("Logical sequence:", logicalSeq.join(","));
console.log("Physical measures used:", physicalSeq.join(","));



sectionStartTime = 0;
sectionEndTime   = physicalSeq.reduce((acc, p) => {
    const entry = MEASURE_TIME_MAP[p];
    return acc + (entry ? (entry.end - entry.start) : secondsPerMeasure);
}, 0);

// Build a set of allowed logical measures so overflow-corrected notes can be rescued.
const allowedLogical = new Set(physicalSeq.map(q => PHYSICAL_TO_LOGICAL[q] ?? q));

practiceNotes = allMidiNotes
    .map(note => {
        let p = getMeasureFromTime(note.time);
        if (p === null) return null;

        let overflowCorrected = false;

        // Always check the rank map to see if this note was overflowed to a different
        // sheet measure (barline-straddle or grace-note-before-barline correction).
        // If the rank map places the note in a different measure than its raw MIDI time,
        // we must use the rank-map's measure for playTime/scheduling — otherwise the
        // note is practised in the wrong slot (e.g. rank=0 of m3 fires during m2).
        {
            const mk = `${note.time.toFixed(4)}|${note.midi}|${note.track}`;
            const entry = _midiRankMap.get(mk);
            if (entry) {
                const rankSheet = entry.sheet_measure;
                const rawSheet  = PHYSICAL_TO_LOGICAL[p] ?? p;
                if (rankSheet !== rawSheet) {
                    // The rank map moved this note to a different measure.
                    // Re-assign p to match the rank map's sheet measure.
                    if (allowedLogical.has(rankSheet)) {
                        const correctedPhys = physicalSeq.find(
                            q => (PHYSICAL_TO_LOGICAL[q] ?? q) === rankSheet
                        );
                        if (correctedPhys !== undefined) {
                            console.log(`🔁 Rank-map rescue: time=${note.time.toFixed(4)} physMeasure ${p}→${correctedPhys} (sheet ${rawSheet}→${rankSheet})`);
                            p = correctedPhys;
                            overflowCorrected = (note.time < (MEASURE_TIME_MAP[p]?.start ?? 0));
                        } else {
                            // Rank map placed it in a measure outside our selection — skip.
                            return null;
                        }
                    } else if (!allowedPhysical.has(p)) {
                        // Neither the raw nor the rank-map measure is in the selection — skip.
                        return null;
                    }
                    // If rankSheet not in allowedLogical but raw p IS allowed, fall through
                    // (the note plays in p but highlights wherever the rank map says).
                }
            }
        }

        if (!allowedPhysical.has(p)) {
            // The raw MIDI time landed in a measure just outside the selection.
            // Check whether the rank-map overflow correction moved it into an
            // allowed measure (classic grace-note-before-barline case).
            //
            // IMPORTANT: adjacency is checked against the specific correctedPhys
            // this note would be rescued into, NOT against all physicalSeq members.
            // This prevents first-pass notes (e.g. physical 35, sheet 35) from being
            // incorrectly rescued into a range like 36→37 whose physicalSeq happens
            // to contain physical 36 (adjacent to 35), even though the intended
            // correctedPhys is physical 43 (not adjacent to 35).
            const mk = `${note.time.toFixed(4)}|${note.midi}|${note.track}`;
            const entry = _midiRankMap.get(mk);
            if (entry && allowedLogical.has(entry.sheet_measure)) {
                const correctedPhys = physicalSeq.find(
                    q => (PHYSICAL_TO_LOGICAL[q] ?? q) === entry.sheet_measure
                );
                if (correctedPhys !== undefined && Math.abs(correctedPhys - p) <= 1) {
                    console.log(`🔁 Grace-note rescue: time=${note.time.toFixed(4)} physMeasure ${p}→${correctedPhys} (sheet ${entry.sheet_measure})`);
                    p = correctedPhys;
                    overflowCorrected = true;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }

const mapEntry = MEASURE_TIME_MAP[p];
if (!mapEntry) return null;   // skip note — MIDI hasn't loaded yet or measure out of range
const measureStart = mapEntry.start;
const measureEnd   = mapEntry.end;

const TOLERANCE = 0.001;
// Overflow-corrected notes (grace notes whose MIDI time sits fractionally before
// the barline) are by definition outside the corrected measure's time window,
// so skip the time-range guard for them.
// Tick-based MIDI note times accumulate tiny FP rounding errors that can place
// a beat-1 note a hair before the measure start. Apply a small left tolerance.
const LEFT_TOLERANCE = 0.0001;
if (!overflowCorrected && (note.time < measureStart - LEFT_TOLERANCE || note.time >= measureEnd + TOLERANCE)) return null;
        const isTreble = note.track === TREBLE;
        const isBass   = note.track === BASS;
        if (selectedHand !== "both") {
            const want = selectedHand === "treble" ? isTreble : isBass;
            if (!want) return null;
        }

        const idx = physicalIndex.get(p);
        // For overflow-corrected grace notes whose MIDI time sits just before the
        // barline, note.time - measureStart is negative. Clamping to 0 makes their
        // playTime identical to the first main note, grouping them as a chord.
        // Give them a tiny pre-measure offset (-0.001s) so they sort just before
        // the measure's main notes and are always a separate step.
        const rawOffset = note.time - MEASURE_TIME_MAP[p].start;
        // Overflow-corrected grace notes get a playTime 0.02s BEFORE the measure start
        // so they sort before the main notes AND are outside the 0.01s chord-grouping
        // window used in spawnTrainingNote's lookahead.
        const offsetInMeasure = (overflowCorrected && rawOffset < 0) ? -0.02 : Math.max(0, rawOffset);

        const playTime = physicalSeqCumTime[idx] + offsetInMeasure;

        const logicalMeasure =
            skipSheetRepeats
                ? (startLogical + idx)
                : (PHYSICAL_TO_LOGICAL[p] ?? null);


        return {
            ...note,
            playTime,
            logicalMeasure,
            physicalMeasure: p,
        };
    })
    .filter(Boolean);

practiceNotes.sort((a, b) => a.playTime - b.playTime);

// DEBUG: log every practiceNote for measure 35 analysis
console.group('🔬 practiceNotes dump (all notes):');
practiceNotes.forEach((n, i) => {
    const mk = `${n.time.toFixed(4)}|${n.midi}|${n.track}`;
    const rankEntry = _midiRankMap.get(mk);
    console.log(`[${i}] midi=${n.midi} track=${n.track} time=${n.time.toFixed(4)} playTime=${(n.playTime??n.time).toFixed(4)} dur=${n.duration.toFixed(3)} physMeasure=${n.physicalMeasure} logMeasure=${n.logicalMeasure} svgSheet=${rankEntry?.sheet_measure} rank=${rankEntry?.rank}`);
});
console.groupEnd();

// scoreNoteOffset no longer used for highlighting — kept at 0
scoreNoteOffset = 0;

const emptyBars = reportEmptyLogicalMeasures(startMeasure, endMeasure, practiceNotes);

if (emptyBars.length) {
    const feedback = document.getElementById('feedback');
    feedback.textContent =
        `FYI: no notes in bars ${emptyBars.join(", ")} for this hand.`;
    feedback.classList.remove('correct', 'wrong', 'show');
    void feedback.offsetWidth;
    feedback.classList.add('show');
}

    if (practiceNotes.length === 0) {
        alert("No notes found for this selection");
        startPracticeButton.disabled = false;
        return;
    }

    trainingIndex = 0;
    showTrainingProgress();
updateTrainingProgress();
    clefMode = selectedHand === 'both' ? 'both' : selectedHand;

    trainingActive = true;
    waitingForInput = false;
    setSpeedButtonsEnabled(false); // locked for the whole session; unlocks on Stop or Reset

    stopButton.disabled = false;
    transportStartTime = performance.now();

document.getElementById('feedback').textContent = 'Get ready…';

startVisualCountdown(() => {

// The MIDI audio fires after a visualPreroll delay (getFallTimeMs() ms).
// Offset transportStartTime forward by that same amount so beat "1"
// fires exactly when the first note sounds, not 2 s before it.
transportStartTime = performance.now() + getFallTimeMs();

// metronome is started inside playMeasurePreview and killed when preview ends
playMeasurePreview(sectionStartTime, clefMode);
});


});

playSongButton.addEventListener('click', async () => {
    await Tone.start();

    stopPlayback(false);
    ensureSynth();

    startFullSongPlayback();
});

function stopPlayback(userInitiated = false) {

isPlaying = false;
trainingActive = false;
previewMode = false;
visualsPlaying = false;
scoreKeysPlaying = false;
waitingForInput = false;
fullSongPlaying = false;
speedLocked = false;
countdownActive = false;
setSpeedButtonsEnabled(true);

if (countdownTimeoutId) { clearTimeout(countdownTimeoutId); countdownTimeoutId = null; }
if (retryTimeout) { clearTimeout(retryTimeout); retryTimeout = null; }

// Clear beat group state
if (_beatGroupTimer) { clearTimeout(_beatGroupTimer); _beatGroupTimer = null; }
_beatGroupNotes   = [];
_beatGroupPressed = new Set();
_beatGroupStartMs = null;
_beatGroupCurrentPlayTime = null;
_bgHeldNotes.clear();

stopMetronome();

if (synth) synth.releaseAll();
Tone.Transport.stop();
Tone.Transport.cancel();

mouseClearAllLatches();
expectedMidiTreble.clear();
expectedMidiBass.clear();
currentChordNotes.clear();
midiPressedNotes.clear();

playbackTimeouts.forEach(t => clearTimeout(t));
playbackTimeouts = [];

previewTimeouts.forEach(t => clearTimeout(t));
previewTimeouts = [];

fallingRectangles = [];
expectedMidiNote = null;
activeMidiNote = null;

// Always reset counting/beat state and un-highlight panel buttons on stop
beatEnabled        = false;
countEnabled       = false;
subdivisionEnabled = false;
countMode          = "normal";
beatToggle.textContent        = 'Beat';
countToggle.textContent       = 'Counting';
subdivisionToggle.textContent = '1 & 2 &';
document.getElementById('beatBtn')   ?.classList.remove('active');
document.getElementById('countBtn')  ?.classList.remove('active');
document.getElementById('subdivBtn') ?.classList.remove('active');

if (!userInitiated) return;

hideTrainingProgress();

hideScoreNoteDisplay();
clearScoreHighlight();

const feedback = document.getElementById('feedback');
feedback.textContent = 'Stopped';
feedback.classList.remove('correct', 'wrong', 'show');
void feedback.offsetWidth;
feedback.classList.add('show');

document.getElementById('countdownOverlay').style.display = 'none';
stopButton.disabled = true;
startPracticeButton.disabled = false;
}

function resetAll() {
    if (retryTimeout) { clearTimeout(retryTimeout); retryTimeout = null; }
    playbackTimeouts.forEach(t => clearTimeout(t)); playbackTimeouts = [];
    previewTimeouts.forEach(t => clearTimeout(t));  previewTimeouts = [];

    // ── 2. Stop all audio & transport ────────────────────────────────────
    stopMetronome();
    if (synth) synth.releaseAll();
    try { Tone.Transport.stop(); Tone.Transport.cancel(); } catch(e) {}

    // ── 3. Kill every active state flag ──────────────────────────────────
    isPlaying        = false;
    trainingActive   = false;
    fullSongPlaying  = false;
    previewMode      = false;
    waitingForInput  = false;
    visualsPlaying   = false;
    scoreKeysPlaying = false;
    speedLocked      = false;
    countdownActive  = false;
    setSpeedButtonsEnabled(true);

    // ── 4. Exit Free Mode if it is on ────────────────────────────────────
    if (freeMode) {
        freeMode = false;
        freeModeButton.textContent = 'Free Mode';
    }
    if (freeModeActiveNote !== null) {
        if (freeModeSynth) { try { freeModeSynth.releaseAll(); } catch(e) {} }
        freeModeActiveNote = null;
    }

    // ── 5. Clear all note / MIDI state ───────────────────────────────────
    trainingIndex      = 0;
    scoreNoteOffset    = 0;
    _lastPannedMeasure = -1;
    fallingRectangles  = [];

    expectedMidiNote    = null;
    activeMidiNote      = null;
    currentTrainingNote = null;
    noteHoldStartTime   = null;
    pressedNotes        = [];

    expectedMidiTreble.clear();
    expectedMidiBass.clear();
    currentChordNotes.clear();
    midiPressedNotes.clear();
    chordNotesCompleted.clear();
    mouseClearAllLatches();

    // ── 6. Hide all overlays / visuals ───────────────────────────────────
    document.getElementById('countdownOverlay').style.display = 'none';
    hideTrainingProgress();
    hideScoreNoteDisplay();
    clearScoreHighlight();

    // ── 7. Reset UI controls ─────────────────────────────────────────────
    const feedback = document.getElementById('feedback');
    feedback.classList.remove('correct', 'wrong', 'show');
    feedback.textContent = '';
    document.getElementById('holdInfo').textContent = '';

    speedMultiplier = 1.0;
    speedDisplay.textContent = '1.0×';
    syncBpmDisplay();

    beatEnabled    = false;
    countEnabled   = false;
    subdivisionEnabled = false;
    metronomeRunning = false;
    beatToggle.textContent        = 'Beat';
    countToggle.textContent       = 'Counting';
    subdivisionToggle.textContent = '1 & 2 &';

    handSelect.value = 'treble';
    startMeasureInput.value = 1;
    endMeasureInput.value   = 4;
    skipRepeatsCheckbox.checked = false;
    skipSheetRepeats = false;
    loopCheckbox.checked = false;
    loopEnabled  = false;

    document.getElementById('pressedNoteCircle').textContent = '';
    document.getElementById('pressedNoteCircle').className   = 'note-circle';
    document.getElementById('correctNoteCircle').textContent = '';

    stopButton.disabled = true;

    // ── 8. Reset panel measure inputs (the visible ones) ─────────────────
    const panelStart = document.getElementById('panelStartMeasure');
    const panelEnd   = document.getElementById('panelEndMeasure');
    if (panelStart) panelStart.value = 1;
    if (panelEnd)   panelEnd.value   = 4;

    // ── 9. Reset hand-select buttons ─────────────────────────────────────
    handSelect.value = 'both';
    window.syncHandBtns();

    // ── 10. Deactivate Beat / Counting / Subdivision panel buttons ───────
    document.getElementById('beatBtn')   ?.classList.remove('active');
    document.getElementById('countBtn')  ?.classList.remove('active');
    document.getElementById('subdivBtn') ?.classList.remove('active');

    // ── 11. Uncheck panel Loop & Skip-Repeats checkboxes ─────────────────
    const panelLoop = document.getElementById('panelLoopCheckbox');
    const panelSkip = document.getElementById('panelSkipRepeatsCheckbox');
    if (panelLoop) panelLoop.checked = false;
    if (panelSkip) panelSkip.checked = false;

    // ── 12. Restore "Hide Note Names" button ─────────────────────────────
    showNoteNames = true;
    toggleNamesButton.textContent = 'Hide Note Names';

    // ── 13. Score Mode — left as-is; user’s view choice persists across resets ──

    // ── 14. Confirm ──────────────────────────────────────────────────────
    statsCombo         = 0;
    statsPerfect       = 0;
    statsTotalAttempts = 0;
    statsWrong         = 0;
    updateStatsBar();
    const pFill = document.getElementById('panelProgressFill');
    const pText = document.getElementById('panelProgressText');
    if (pFill) pFill.style.width = '0%';
    if (pText) pText.textContent = '0%';

    feedback.textContent = 'All reset — ready!';
    void feedback.offsetWidth;
    feedback.classList.add('show');
    console.log('✅ All reset');
}
window.resetAll = resetAll;
    
function startFullSongPlayback() {
    
    if (!allMidiNotes.length) return;

    // Single authoritative timestamp — metronome anchor, songStartTime,
    // transportStartTime, and visualBaseline all derive from the same value
    // so counting stays perfectly in sync with the falling notes.
    const now = performance.now();
    songStartTime      = now;
    visualClockStart   = now;
    transportStartTime = now;
    const visualBaseline = now + 16;

    if (beatEnabled || countEnabled) {
        startMetronome(now);
    }

    fullSongPlaying = true;
    visualsPlaying  = true;

    fallingRectangles = [];
    playbackTimeouts  = [];


    // For score mode: group notes by time so we highlight all simultaneous notes together
    const seenHighlightTimes = new Set();

    allMidiNotes.forEach(note => {

        const visualStartTime =
    visualBaseline +
    ((note.time * 1000) / speedMultiplier) -
    getFallTimeMs();



addMidiFallingRectangle(
    note.midi,
    note.duration,
    note.track,
    visualStartTime
);



        const t = setTimeout(() => {
    if (!fullSongPlaying) return;

    synth.triggerAttackRelease(
        getNoteName(note.midi),
        note.duration / speedMultiplier
    );
}, (note.time * 1000) / speedMultiplier);

        playbackTimeouts.push(t);

        // Score mode: highlight keyboard keys in sync with playback
        if (scoreModeActive) {
            const keyOnDelay  = (note.time * 1000) / speedMultiplier;
            const keyOffDelay = ((note.time + note.duration) * 1000) / speedMultiplier;
            const midi = note.midi;
            const track = note.track;

            const kOn = setTimeout(() => {
                if (!fullSongPlaying) return;
                scoreKeysPlaying = true;
                if (track === TREBLE) expectedMidiTreble.add(midi);
                else if (track === BASS) expectedMidiBass.add(midi);
            }, keyOnDelay);

            const kOff = setTimeout(() => {
                if (track === TREBLE) expectedMidiTreble.delete(midi);
                else if (track === BASS) expectedMidiBass.delete(midi);
            }, keyOffDelay);

            playbackTimeouts.push(kOn, kOff);
        }

        // Score mode highlight: fire once per unique timestamp
        if (scoreModeActive) {
            const timeKey = note.time.toFixed(4);
            if (!seenHighlightTimes.has(timeKey)) {
                seenHighlightTimes.add(timeKey);
                const ht = setTimeout(() => {
                    if (!fullSongPlaying) return;

                    // Determine whether this timestamp falls in the repeat pass
                    // (physical measures 15-21 → logical 7-13).
                    const physMeasure = getMeasureFromTime(note.time);
                    const isRepeatPass = physMeasure !== null &&
                        physMeasure >= REPEAT_START + REPEAT_LEN &&
                        physMeasure <= REPEAT_END + REPEAT_LEN;

                    let notesToHighlight;
                    if (isRepeatPass) {
                        // Mirror: find the first-pass notes at the equivalent time
                        const firstPassTime = note.time - REPEAT_LEN * secondsPerMeasure;
                        notesToHighlight = allMidiNotes.filter(n =>
                            Math.abs(n.time - firstPassTime) < 0.01
                        );
                        // Fallback: if nothing found (timing drift), use repeat-pass notes directly
                        if (!notesToHighlight.length) {
                            notesToHighlight = allMidiNotes.filter(n =>
                                Math.abs(n.time - note.time) < 0.01
                            );
                        }
                    } else {
                        notesToHighlight = allMidiNotes.filter(n =>
                            Math.abs(n.time - note.time) < 0.01
                        );
                    }

                    const seen = new Set();
                    const allIndices = [];
                    for (const sn of notesToHighlight) {
                        const k = `${sn.time.toFixed(4)}|${sn.midi}|${sn.track}`;
                        if (seen.has(k)) continue;
                        seen.add(k);
                        allIndices.push(..._svgIndicesForMidiNote(sn, 'both'));
                    }
                    if (allIndices.length > 0) _applyHighlight(allIndices);
                }, (note.time * 1000) / speedMultiplier);
                playbackTimeouts.push(ht);
            }
        }
    });

    const lastNote = allMidiNotes[allMidiNotes.length - 1];
    const endTime =
        ((lastNote.time + lastNote.duration) * 1000) / speedMultiplier;

    setTimeout(() => {
        if (fullSongPlaying) stopPlayback();
    }, endTime + 200);
    stopButton.disabled = false;
}

// ============================================================
// SCORE VIEW — RANK-BASED HIGHLIGHTING
// ============================================================
// Root cause of all previous bugs:
//
// BUG 1 (positional zip): SVG notehead #N ≠ MIDI note #N globally, because
//   the old code sorted all SVG rows treble-first then bass, which scrambles
//   ordering across multi-system pages.
//
// BUG 2 (fraction mismatch): Measure 1 (and any system-start measure) has
//   Clef + KeySig + TimeSig symbols consuming ~43% of horizontal space before
//   the first notehead. So SVG beat_frac for the first note is ~0.43, but the
//   MIDI beat_frac is ~0.0 — a FRAC_TOL of 0.12 can never bridge this gap,
//   causing the first 3-4 notes to be silently skipped every time.
//
// THE FIX — rank-based matching:
//   Within each (sheet_measure, clef) bucket:
//     - SVG noteheads are ranked 0, 1, 2, ... by their X position (left→right).
//     - MIDI notes are ranked 0, 1, 2, ... by their timestamp (after tie-filtering).
//     - SVG rank i  ↔  MIDI rank i.
//   No fraction arithmetic. No global ordering. No drift.
//   Ties and notation-symbol spacing are both handled automatically.
// ============================================================

// ---- State ----
let _svgNoteElements    = [];   // annotated noteheads: {el, tx, ty, clef, sheet_measure, pageNum}
let _currentHighlightEl = null;
let _lastPannedMeasure  = -1;

// _svgBuckets[sheet_measure][clef] = ordered array of indices into _svgNoteElements
// For measures that appear on multiple pages (e.g. measure 36 on page 1 and page 2),
// this contains ONLY page 1 noteheads. Page 2+ noteheads are in _svgBucketsPage2.
let _svgBuckets = {};

// _svgBucketsPage2[sheet_measure][clef] = page-2 noteheads for measures that appear on
// both page 1 (end of repeat) and page 2 (start of post-repeat section).
// Currently only measure REPEAT_END (36) is affected.
let _svgBucketsPage2 = {};

// _bucketFirstIsGrace[`${measure}|${clef}`] = true if that bucket's first (lowest-tx) note is a grace note.
// Used in assignRanks to detect MIDI grace notes placed by the MIDI file in the preceding measure
// but whose SVG notehead sits at the start of the next measure (e.g. measures 29, 31, 33, 35).
let _bucketFirstIsGrace = {};

// _midiRankMap: for each MIDI note (keyed by time+midi+track), stores its rank
// within its (sheet_measure, clef) bucket so we can do an O(1) lookup.
// Built in _buildSvgMidiMap() alongside the SVG index.
let _midiRankMap = new Map();   // key = `${time.toFixed(4)}|${midi}|${track}` → {sheet_measure, clef, rank}

// Tie detection threshold: splitRepeatedNotes inserts 0.02s gaps between re-attacked
// same-pitch notes. After splitting, genuine ties have gap ≈ 0 (< 1ms), while
// re-attacks have gap = 0.02s. Threshold must be well below NOTE_GAP_TIME (0.02).
const TIE_GAP_THRESHOLD = 0.005;

// Pre-computed barline geometry for all three SVG pages.
// Generated by analysing the MuseScore SVG exports in Python.
// Each system entry: treble/bass Y bounds, barline X positions, and the
// sheet-music measure number of the first measure in that system.
const SVG_PAGE_SYSTEMS = SONG_CONFIG.svgPageSystems || [
  // PAGE 1 — 5 systems × 4 measures = m1..20
  [
    { treble_top:729.6,  treble_bot:826.1,  bass_top:1023.4, bass_bot:1119.8, barline_xs:[335.4,1130.0,1645.6,2246.7,2762.4], start_measure:1  },
    { treble_top:1410.0, treble_bot:1506.5, bass_top:1705.7, bass_bot:1802.2, barline_xs:[214.8,937.7,1507.2,2124.0,2762.4],  start_measure:5  },
    { treble_top:2097.6, treble_bot:2194.1, bass_top:2310.1, bass_bot:2406.6, barline_xs:[214.8,939.8,1506.2,2072.5,2762.4],  start_measure:9  },
    { treble_top:2696.7, treble_bot:2793.2, bass_top:3018.8, bass_bot:3115.3, barline_xs:[214.8,1019.3,1568.0,2213.8,2762.4], start_measure:13 },
    { treble_top:3405.4, treble_bot:3501.9, bass_top:3730.5, bass_bot:3827.0, barline_xs:[214.8,978.8,1568.0,2173.2,2762.4],  start_measure:17 },
  ],
  // PAGE 2 — 5 systems: m21..24, m25..28, m29..32, m33..37 (5 measures), m38..40 (3 measures)
  [
    { treble_top:404.3,  treble_bot:500.8,  bass_top:700.8,  bass_bot:797.3,  barline_xs:[214.8,981.6,1547.1,2187.1,2762.4],  start_measure:21 },
    { treble_top:1153.2, treble_bot:1249.7, bass_top:1446.8, bass_bot:1543.3, barline_xs:[214.8,981.1,1545.9,2185.4,2762.4],  start_measure:25 },
    { treble_top:1899.3, treble_bot:1995.7, bass_top:2236.4, bass_bot:2332.9, barline_xs:[214.8,970.9,1526.6,2139.2,2762.4],  start_measure:29 },
    // 5 measures: m33-m37
    { treble_top:2688.8, treble_bot:2785.3, bass_top:3009.4, bass_bot:3105.9, barline_xs:[214.8,864.6,1430.1,2007.3,2522.3,2762.4], start_measure:33 },
    // 3 measures: m38-m40 (2740.2/2758.0 is double barline = one boundary → use 2758.0)
    { treble_top:3461.9, treble_bot:3558.4, bass_top:3700.7, bass_bot:3797.2, barline_xs:[214.8,1213.3,2230.2,2758.0],         start_measure:38 },
  ],
];

// ============================================================
// STEP 1 — collect SVG noteheads, annotate with measure, build buckets
// ============================================================
function _buildSvgNoteIndex() {
    _svgNoteElements    = [];
    _svgBuckets         = {};
    _svgBucketsPage2    = {};
    _bucketFirstIsGrace = {};
    _midiRankMap        = new Map();
    _currentHighlightEl = null;

    let totalTied = 0;

    // Process all 3 pages
    for (let pageNum = 1; pageNum <= SCORE_TOTAL_PAGES; pageNum++) {
        const container = document.getElementById(`scorePage${pageNum}`);
        if (!container) continue;
        const svgEl = container.querySelector('svg');
        if (!svgEl) continue;

        // Inject glow filter once per SVG
        if (!svgEl.querySelector('#hlGlow')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = `<filter id="hlGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>`;
            svgEl.insertBefore(defs, svgEl.firstChild);
        }

        const pageSystems = SVG_PAGE_SYSTEMS[pageNum - 1] || [];

        // ── Step 1: collect all noteheads for this page ──────────────────
        // SVG matrix() can use comma OR space separators per spec; handle both.
        // The matrix 'a' value (scale) distinguishes grace notes (≈0.6754) from
        // normal notes (≈0.9648). Grace notes are flagged so they can be bucketed
        // into the NEXT measure (matching where the MIDI places them in time).
        const GRACE_SCALE_THRESHOLD = 0.85;
        const raw = [];
        svgEl.querySelectorAll('path.Note').forEach(el => {
            const t  = el.getAttribute('transform') || '';
            // Matches: matrix(a  b  c  d  tx  ty)  — commas, spaces, or mixed
            const mm = t.match(
                /matrix\(\s*([\d.eE+-]+)[,\s]+([\d.eE+-]+)[,\s]+([\d.eE+-]+)[,\s]+([\d.eE+-]+)[,\s]+([\d.eE+-]+)[,\s]+([\d.eE+-]+)\s*\)/
            );
            if (!mm) return;
            // Groups: 1=a 2=b 3=c 4=d  5=tx(e)  6=ty(f)
            const scaleA = parseFloat(mm[1]);
            const isGrace = scaleA < GRACE_SCALE_THRESHOLD;
            raw.push({ el, tx: parseFloat(mm[5]), ty: parseFloat(mm[6]), isGrace });
        });

        if (!raw.length) {
            console.warn(`⚠️  Page ${pageNum}: no path.Note elements found (SVG may be missing or use unexpected transform format)`);
            continue;
        }
        console.log(`📄 Page ${pageNum}: found ${raw.length} raw noteheads (${raw.filter(n=>n.isGrace).length} grace)`);

        // ── Step 2: find tied-continuation noteheads ─────────────────────
        const tiedNoteheadSet = new Set();
        svgEl.querySelectorAll('path.TieSegment').forEach(el => {
            const d = el.getAttribute('d') || '';
            // MuseScore tie paths are closed lens shapes:
            //   M x0,y0  C x1,y1 x2,y2 x3,y3  C x4,y4 x5,y5 x0,y0
            // x0,y0 = LEFT (main) notehead — where the arc starts AND returns to.
            // x3,y3 = end of the FIRST cubic bezier = RIGHT (continuation) notehead.
            // Using coords[-1] is WRONG — the path closes back to x0,y0 (the main note).
            const nums = [...d.matchAll(/[-\d.]+/g)].map(m => parseFloat(m[0]));
            if (nums.length < 8) return;
            const ex = nums[6], ey = nums[7]; // end of first C = continuation notehead
            let bestIdx = -1, bestDist = Infinity;
            for (let i = 0; i < raw.length; i++) {
                const dist = Math.abs(raw[i].tx - ex) + Math.abs(raw[i].ty - ey) * 0.3;
                if (dist < bestDist) { bestDist = dist; bestIdx = i; }
            }
            // Threshold of 40 (not 60): all legitimate same-page ties have dist ≤ 21;
            // the only case that reaches ~58 is a cross-page tie whose arc endpoint
            // overshoots the last notehead on the page (e.g. m35 quaver tied into m36).
            // Using 40 correctly excludes the continuation noteheads while leaving the
            // parent note (the quaver) in its bucket so it can be highlighted.
            if (bestIdx >= 0 && bestDist < 40) tiedNoteheadSet.add(bestIdx);
        });

        // Special case — measure REPEAT_END treble, page 2:
        // The tied whole note that continues from m(REPEAT_END-1) is correctly identified as
        // a tied continuation and would normally be excluded. But we want it highlighted
        // (it's visually prominent). Un-exclude it so it ends up in _svgBucketsPage2[REPEAT_END][treble].
        if (pageNum === 2 && REPEAT_END > 0) {
            const sysRepeatEnd = SVG_PAGE_SYSTEMS[1]?.find(s => s.start_measure === REPEAT_END);
            if (sysRepeatEnd) {
                for (const ri of tiedNoteheadSet) {
                    const rn = raw[ri];
                    const inTreble = rn.ty >= sysRepeatEnd.treble_top - 50 && rn.ty <= sysRepeatEnd.treble_bot + 50;
                    const inMx    = rn.tx >= sysRepeatEnd.barline_xs[0] && rn.tx < sysRepeatEnd.barline_xs[1];
                    if (inTreble && inMx) {
                        tiedNoteheadSet.delete(ri);
                        break; // only one tied whole note to un-exclude
                    }
                }
            }
        }

        totalTied += tiedNoteheadSet.size;

        // ── Step 3: annotate each notehead ───────────────────────────────
        // Grace notes in MuseScore SVGs are placed at the BEGINNING of the measure
        // they belong to (visually just before the main beat of that measure).
        // Their MIDI events also fire at the start of that same measure.
        // So grace notes stay in their visual measure — NO +1 offset needed.
        // They are ranked BEFORE the main notes in the same measure (lower tx),
        // which matches the MIDI ordering (grace note time < main note time).
        for (let ri = 0; ri < raw.length; ri++) {
            if (tiedNoteheadSet.has(ri)) continue;
            const n = raw[ri];
            for (const sys of pageSystems) {
                const inTreble = n.ty >= sys.treble_top - 80 && n.ty <= sys.treble_bot + 50;
                const inBass   = n.ty >= sys.bass_top   - 50 && n.ty <= sys.bass_bot   + 50;
                if (!inTreble && !inBass) continue;
                const clef = inTreble ? 'treble' : 'bass';
                const bls  = sys.barline_xs;
                for (let i = 0; i < bls.length - 1; i++) {
                    const leftBound  = (i === 0) ? (bls[i] - 20) : bls[i];
                    const rightBound = (i === bls.length - 2) ? (bls[i + 1] + 20) : bls[i + 1];
                    if (n.tx >= leftBound && n.tx < rightBound) {
                        const svgMeasure = sys.start_measure + i;
                        // Grace notes stay in their visual measure (same as MIDI measure)
                        const sheet_measure = svgMeasure;
                        const idx = _svgNoteElements.length;
                        _svgNoteElements.push({ el: n.el, tx: n.tx, ty: n.ty, clef, sheet_measure, isGrace: n.isGrace, pageNum });

                        // For songs with a repeat, page-2 copies of REPEAT_END go into
                        // _svgBucketsPage2 so first-pass highlights use page-1 noteheads
                        // and repeat-pass highlights use page-2 noteheads.
                        const isRepeatPassPage = (REPEAT_END > 0 && pageNum >= 2 && sheet_measure === REPEAT_END);
                        const targetBuckets = isRepeatPassPage ? _svgBucketsPage2 : _svgBuckets;
                        if (!targetBuckets[sheet_measure]) targetBuckets[sheet_measure] = { treble: [], bass: [] };
                        targetBuckets[sheet_measure][clef].push(idx);
                        break;
                    }
                }
                break;
            }
        }
    }

    // Sort each bucket by X position
    for (const m of Object.keys(_svgBuckets)) {
        for (const clef of ['treble', 'bass']) {
            _svgBuckets[m][clef].sort((a, b) => _svgNoteElements[a].tx - _svgNoteElements[b].tx);
        }
    }
    for (const m of Object.keys(_svgBucketsPage2)) {
        for (const clef of ['treble', 'bass']) {
            _svgBucketsPage2[m][clef].sort((a, b) => _svgNoteElements[a].tx - _svgNoteElements[b].tx);
        }
    }

    // Build a lookup: does each measure|clef bucket START with a grace note?
    // Used by assignRanks to detect MIDI grace notes that belong to the next measure.
    _bucketFirstIsGrace = {};
    for (const [m, clefs] of Object.entries(_svgBuckets)) {
        for (const clef of ['treble', 'bass']) {
            const arr = clefs[clef] || [];
            if (arr.length > 0) {
                _bucketFirstIsGrace[`${m}|${clef}`] = !!_svgNoteElements[arr[0]].isGrace;
            }
        }
    }

    console.log(`🔗 SVG tied-continuation noteheads detected: ${totalTied}`);
    console.log(`✅ SVG noteheads: ${_svgNoteElements.length} playable (${totalTied} tied continuations excluded) across measures ` +
        `${Math.min(...Object.keys(_svgBuckets).map(Number))}–` +
        `${Math.max(...Object.keys(_svgBuckets).map(Number))}`);
}

function _buildSvgMidiMap() {
    _buildSvgNoteIndex();
    if (!_svgNoteElements.length) return;

    // DEBUG: dump SVG buckets 28 and 34-36
    for (const m of [28,34,35,36]) {
        for (const c of ["treble","bass"]) {
            const bucket = _svgBuckets[m]?.[c] || [];
            if (!bucket.length) continue;
            const items = bucket.map((idx,r) => {
                const n = _svgNoteElements[idx];
                return "rank"+r+":tx="+n.tx.toFixed(0)+" midi_ty="+n.ty.toFixed(0)+" grace="+n.isGrace;
            }).join("  ");
            console.log("🪣 SVG bucket m="+m+" "+c+" ("+bucket.length+" notes): "+items);
        }
    }

    const rankCounters = {};

    function midiKeyFor(note) {
        return `${note.time.toFixed(4)}|${note.midi}|${note.track}`;
    }

    // Pre-compute how many SVG noteheads each measure+clef bucket holds for one pass.
    // For repeated sections the MIDI sends notes twice but the SVG only has them once,
    // so the % bucketSize wrapping handles the second pass. What we need here is the
    // raw (single-pass) capacity of each bucket.
    const bucketCapacity = {};
    for (const [m, clefs] of Object.entries(_svgBuckets)) {
        for (const c of ['treble', 'bass']) {
            bucketCapacity[`${m}|${c}`] = (clefs[c] || []).length;
        }
    }

    // assignedCount tracks how many MIDI notes have been assigned to each measure|clef
    // within the current (first) pass. Once it hits bucketCapacity, any further note
    // whose MIDI time still lands in that measure is a boundary-straddle and belongs
    // to the next measure (classic grace-note-before-barline case).
    const assignedCount = {};

    // overflowFired tracks which (sheetMeasure|clef) buckets have already had
    // the barline-straddle overflow applied. Overflow should fire at most once
    // per bucket: the very first time a boundary note pushes a bucket past cap.
    // Without this guard the repeat-pass notes (e.g. physical m37-44 → logical
    // m29-36) arrive with assignedCount already === cap from the first pass, so
    // "used >= cap && used < 2*cap" would fire for every single repeat note,
    // redirecting all of m29's repeat notes into m30's bucket, m31's into m32,
    // etc. — producing the "bass plays only even measures on repeat" bug.
    const overflowFired = new Set();

    function assignRanks(notes, clef) {
        for (const note of notes) {
            const mk = midiKeyFor(note);
            // Also check the pre-splitRepeatedNotes timestamp (shifted back by NOTE_GAP_TIME)
            // because _tiedNoteKeys was built before splitRepeatedNotes ran and some
            // tied-continuation notes had their .time shifted forward by 0.02s.
            const mkShifted = `${(note.time - NOTE_GAP_TIME).toFixed(4)}|${note.midi}|${note.track}`;

            // Skip tied-continuation MIDI notes: the SVG buckets already exclude their
            // noteheads, so counting them here shifts every subsequent rank by +1.
            // Exception: treble REPEAT_END's tied whole note is intentionally kept in
            // _svgBucketsPage2[REPEAT_END][treble] for highlighting, so its MIDI note must also
            // get a rank entry (rank 0) rather than being skipped.
            const isTiedM36Treble = (_tiedNoteKeys.has(mk) || _tiedNoteKeys.has(mkShifted))
                && clef === 'treble'
                && (() => {
                    const pm = getMeasureFromTime(note.time);
                    const sm = pm !== null ? (PHYSICAL_TO_LOGICAL[pm] ?? pm) : null;
                    return sm === REPEAT_END;
                })();
            if (!isTiedM36Treble && (_tiedNoteKeys.has(mk) || _tiedNoteKeys.has(mkShifted))) continue;

            const physMeasure = getMeasureFromTime(note.time);
            if (physMeasure === null) continue;
            let sheetMeasure = PHYSICAL_TO_LOGICAL[physMeasure] ?? physMeasure;

            // Grace notes for measures 31, 33, 35 have their MIDI timestamp in the
            // preceding measure (30, 32, 34) because those buckets are empty (cap=0).
            // On the repeat pass, the grace note for logical 29 lands in logical 36 (cap=0 or
            // bucket-full from first pass). Bump them all forward to the correct SVG bucket.
            // IMPORTANT: set gracePreCorrected=true here so the overflow check below
            // does not fire a second time on the already-corrected sheetMeasure.
            let hardcodedGraceCorrected = false;

            // REPEAT_END bass AND treble: _svgBuckets[REPEAT_END][bass|treble] is empty because the
            // page-1 SVG only has a tied whole note (excluded as a tied continuation). The actual
            // playable noteheads live on page 2 (_svgBucketsPage2[REPEAT_END][bass|treble]).
            // Suppress the overflow→REPEAT_END+1 so all REPEAT_END notes stay at sheetMeasure=REPEAT_END
            // and _svgIndicesForMidiNote can route them to the correct page-2 bucket.
            // Only applies to songs with repeats (where this page-layout scenario occurs).
            if (REPEAT_LEN > 0 && sheetMeasure === REPEAT_END && (clef === 'bass' || clef === 'treble')) {
                hardcodedGraceCorrected = true;
            }

            // Grace corrections for empty-treble measures inside the repeat block,
            // and the repeat-pass grace note that lands in logical REPEAT_END.
            // Only applicable for songs that have a repeat section (REPEAT_LEN > 0).
            // Empty-treble measures are REPEAT_START+1, REPEAT_START+3, REPEAT_START+5
            // (the alternating bass-only measures in the repeat block).
            if (REPEAT_LEN > 0 && note.duration < 0.1) {
                const rs1 = REPEAT_START + 1, rs3 = REPEAT_START + 3, rs5 = REPEAT_START + 5;
                if (sheetMeasure === rs1 || sheetMeasure === rs3 || sheetMeasure === rs5) {
                    sheetMeasure += 1;
                    hardcodedGraceCorrected = true;
                } else if (sheetMeasure === REPEAT_END && clef === 'treble') {
                    // Repeat pass: treble grace note for logical REPEAT_START lands in logical REPEAT_END.
                    // Always redirect to logical REPEAT_START.
                    // NOTE: bass clef intentionally excluded — bass REPEAT_END has genuine short notes.
                    sheetMeasure = REPEAT_START;
                    hardcodedGraceCorrected = true;
                }
            }

            // Measure-boundary overflow correction:
            // If the current measure's SVG bucket is already at capacity (all its
            // noteheads have been claimed), this MIDI note's timestamp must have
            // landed fractionally before the barline while the SVG places it in
            // the next measure. Nudge sheetMeasure forward so ranks stay aligned.
            // Only apply during the first pass (assignedCount < 2× capacity would
            // fire on the second repeat pass too — cap at exactly bucketCapacity).
            const capKey = `${sheetMeasure}|${clef}`;
            const cap    = bucketCapacity[capKey] ?? 0;
            const used   = assignedCount[capKey] ?? 0;

            // Grace-note pre-correction (handles measures 29, 31, 33, 35, etc.):
            // The MIDI file timestamps some grace notes in measure M-1, but their
            // SVG notehead sits at the very beginning of measure M (the bucket for
            // measure M starts with a grace note). In that case the current bucket
            // does NOT start with a grace note, so assigning here would misalign
            // every subsequent rank. Detect this and bump forward immediately,
            // before the bucket-full overflow check runs.
            const isMidiGrace   = note.duration < 0.1;
            const thisStartsGrace = !!_bucketFirstIsGrace[capKey];
            const nextKey         = `${sheetMeasure + 1}|${clef}`;
            const nextStartsGrace = !!_bucketFirstIsGrace[nextKey];
            // Grace-note pre-correction pass-guard:
            // cap===0 means the current bucket is EMPTY for this clef (e.g. measure 30
            // treble has zero SVG notes — all bass chords). used < 2*cap would be 0 < 0
            // = false and the correction would never fire. Handle cap===0 specially:
            // allow the correction on the very first encounter (used===0), and again
            // on the second repeat pass (used===1 etc.) by using used < max(2*cap, 2).
            const allowGraceCorrect = (cap === 0)
                ? (used === 0 || used === 1)  // empty bucket: allow first & second pass
                : (used < 2 * cap);            // normal bucket: within first pass
            let gracePreCorrected = hardcodedGraceCorrected; // inherit hardcoded guard
            if (!hardcodedGraceCorrected && isMidiGrace && !thisStartsGrace && nextStartsGrace && allowGraceCorrect) {
                const nextCap = bucketCapacity[nextKey] ?? 0;
                if (nextCap > 0) {
                    console.log(`🎶 GracePreCorrect [${clef}] midi=${note.midi} t=${note.time.toFixed(4)} → sheetMeasure ${sheetMeasure}→${sheetMeasure + 1}`);
                    sheetMeasure = sheetMeasure + 1;
                    gracePreCorrected = true;
                }
            }

            // Overflow only for genuine barline-straddle notes: a note whose MIDI
            // timestamp lands fractionally before the barline while the SVG places it
            // in the next measure. This should fire AT MOST ONCE per bucket — the very
            // first time a note finds the bucket already at capacity.
            // overflowFired prevents re-triggering on repeat-pass notes, which arrive
            // with assignedCount already === cap from the first pass (making "used >= cap"
            // true for every repeat-pass note — the root cause of the bass even-measures
            // only on repeat bug).
            //
            // Additionally, notes whose physical measure falls in the repeat-pass range
            // (physical 15-21, logical 7-13) must NEVER trigger overflow — they are
            // genuine second-pass notes, not barline-straddle notes. Without this guard,
            // the FIRST repeat-pass note for each measure fires overflow (because overflowFired
            // doesn't have the key yet) and gets mis-routed to the next sheet measure.
            // Physical measure 14 is the 1st ending (NOT part of the repeat pass).
            // The repeat pass occupies physical REPEAT_END+2 .. REPEAT_END+REPEAT_LEN+1 = 15..21.
            const isRepeatPassNote = physMeasure > REPEAT_END && physMeasure <= REPEAT_END + REPEAT_LEN;
            const overflowKey = `${sheetMeasure}|${clef}`;
            // For permanently-empty buckets (cap===0), ALL notes must be redirected —
            // not just the first one. overflowFired only blocks re-triggering for
            // non-empty buckets (barline-straddle case) where only a single note
            // overflows. When cap===0 the bucket can never hold any note, so every
            // chord member landing here needs the same redirect.
            const alreadyFired = overflowFired.has(overflowKey);
            const isPermanentlyEmpty = cap === 0;
            // For permanently-empty buckets (cap===0): in songs WITH repeats the
            // redirect fires on both passes (used < 2). In songs WITHOUT repeats
            // (REPEAT_LEN === 0) an empty bucket simply means a rest-only measure
            // in one clef — we must NOT redirect, or every subsequent rank shifts.
            const emptyBucketShouldOverflow = isPermanentlyEmpty &&
                (REPEAT_LEN > 0 ? used < 2 : false);
            // For permanently-empty buckets (cap===0) the redirect must fire on BOTH
            // passes — there are no SVG noteheads here at all, so every note landing
            // in this bucket is always wrong, regardless of first vs. repeat pass.
            // isRepeatPassNote must NOT block the redirect when isPermanentlyEmpty.
            const shouldOverflow = !gracePreCorrected &&
                (!isRepeatPassNote || isPermanentlyEmpty) &&
                (!alreadyFired || isPermanentlyEmpty) &&
                (isPermanentlyEmpty ? emptyBucketShouldOverflow : (used >= cap && used < 2 * cap));
            let didOverflow = false;
            if (shouldOverflow) {
                const nextCap = bucketCapacity[`${sheetMeasure + 1}|${clef}`] ?? 0;
                if (nextCap > 0) {
                    console.log(`📐 Overflow [${clef}] midi=${note.midi} time=${note.time.toFixed(4)} → sheetMeasure ${sheetMeasure}→${sheetMeasure + 1} (bucket full: ${used}/${cap})`);
                    if (!isPermanentlyEmpty) overflowFired.add(overflowKey); // only guard non-empty barline-straddle
                    sheetMeasure = sheetMeasure + 1;
                    didOverflow = true;
                }
            }
            // Always increment assignedCount so second-pass detection works correctly.
            // Exception: barline-straddle overflow notes share rank=0 and must NOT
            // increment the target bucket's assignedCount — otherwise the genuine
            // first note of that bucket would see used >= cap and trigger another overflow.
            const newCapKey = `${sheetMeasure}|${clef}`;
            if (!didOverflow || isPermanentlyEmpty) {
                assignedCount[newCapKey] = (assignedCount[newCapKey] ?? 0) + 1;
            }

            const bucketKey = `${sheetMeasure}|${clef}`;
            if (rankCounters[bucketKey] === undefined) rankCounters[bucketKey] = 0;

            // Raw rank keeps incrementing across both passes of a repeated section.
            // Wrap it by the SVG bucket size so that repeat-pass notes (e.g. physical
            // measures 37-44 which map to the same logical measures 29-36 as the first
            // pass) resolve to rank 0, 1, 2, … again — i.e. they highlight the same
            // SVG noteheads as the first pass.  For measures that are never repeated
            // the bucket size is never exceeded so % has no effect.
            //
            // Barline-straddle overflow notes: these notes landed in the previous measure
            // by MIDI time but belong visually at rank=0 of the next measure. They share
            // rank=0 with the genuine first note of that measure — do NOT increment the
            // rank counter so the genuine first note also gets rank=0. Both notes will
            // highlight the same SVG notehead (rank=0), which is correct.
            let rawRank;
            if (didOverflow && !isPermanentlyEmpty) {
                // Peek at rank=0 without consuming — the genuine first note of this
                // bucket will also get rank=0 when it arrives.
                rawRank = rankCounters[bucketKey]; // don't increment
            } else {
                rawRank = rankCounters[bucketKey]++;
            }
            // For measure 36 bass the noteheads live in _svgBucketsPage2 (page-1 bucket is empty).
            // Fall back to page2 so the % wrap uses the correct size (6), not 0.
            const bucketSize = ((_svgBuckets[sheetMeasure]?.[clef] || []).length)
                || ((_svgBucketsPage2[sheetMeasure]?.[clef] || []).length);
            let rank         = (bucketSize > 0) ? (rawRank % bucketSize) : rawRank;

            // NOTE: m28/m30 treble grace-note offset removed — grace B no longer exists
            // in the SVG, so the old rank+1 was skipping rank 0 and pushing the last
            // MIDI note (rawRank=6) to rank 7, which is out of bounds on a 7-note bucket.

            // DEBUG: log all assignments to sheet REPEAT_END-1 treble (penultimate repeat measure)
            if (sheetMeasure === REPEAT_END - 1 && clef === 'treble') {
                console.log(`📊 assignRanks sheet${REPEAT_END-1}|treble: mk=${mk} rawRank=${rawRank} bucketSize=${bucketSize} rank=${rank} used_before=${used} cap=${cap} gracePreCorrected=${gracePreCorrected} hardcoded=${hardcodedGraceCorrected}`);
            }

            // DEBUG: log all assignments to sheet 28 (both clefs)
            // Expected rank map for m28 (user-verified):
            //   rank 0: treble grace B
            //   rank 1: treble C+  /  bass A
            //   rank 2: treble B
            //   rank 3: treble C+  /  bass C+E
            //   rank 4: treble A
            //   rank 5: treble B   /  bass G
            //   rank 6: treble G
            //   rank 7: treble A   /  bass B+D
            //   rank 8: treble E
            // DEBUG: log all assignments to the measure two before the repeat block starts
            if (sheetMeasure === REPEAT_START - 1 && REPEAT_LEN > 0) {
                console.log(`📊 assignRanks m${REPEAT_START - 1}|${clef}: midi=${note.midi}(${getNoteName(note.midi)}) t=${note.time.toFixed(4)} dur=${note.duration.toFixed(3)} rawRank=${rawRank} rank=${rank} grace=${note.duration < 0.1}`);
            }

            _midiRankMap.set(mk, { sheet_measure: sheetMeasure, clef, rank });


        }
    }

    // Sort by time only — grace notes must arrive AFTER the previous measure's normal
    // notes so the bucket-full overflow correction fires and nudges them forward correctly.
    const trebleMidi = allMidiNotes.filter(n => n.track === TREBLE)
        .sort((a, b) => a.time - b.time || a.midi - b.midi);
    const bassMidi = allMidiNotes.filter(n => n.track === BASS)
        .sort((a, b) => a.time - b.time || a.midi - b.midi);

    assignRanks(trebleMidi, 'treble');

    // Reset assignedCount between clef passes so that the pass-guard logic
    // (used >= cap && used < 2*cap) is evaluated independently for each clef.
    // Without this, treble-clef assigned-count values leak into the bass pass
    // (they share the same object keyed by measure|clef, but the clef suffix
    // makes them distinct — so in practice there is no cross-contamination).
    // We reset anyway as a defensive measure to ensure clean state.
    for (const key of Object.keys(assignedCount)) {
        if (key.endsWith('|bass')) delete assignedCount[key];
    }

    assignRanks(bassMidi, 'bass');

    console.log(`🗺  Rank map built: ${_midiRankMap.size} notes`);
}


function _svgIndicesForMidiNote(noteObj, hand) {
    const midiKey = `${noteObj.time.toFixed(4)}|${noteObj.midi}|${noteObj.track}`;
    const entry   = _midiRankMap.get(midiKey);
    if (!entry) {
        console.warn(`_svgIndicesForMidiNote: no rank entry for ${getNoteName(noteObj.midi)} t=${noteObj.time.toFixed(3)}`);
        return [];
    }

    const { clef } = entry;
    if (hand !== 'both' && clef !== hand) return [];

    // For songs with a repeat, REPEAT_END noteheads live in _svgBucketsPage2
    // (the page-1 copy only has a tied whole note which is excluded from the bucket).
    // Both first-pass and repeat-pass notes for that measure use _svgBucketsPage2.
    const physMeasure2 = REPEAT_END > 0 ? getMeasureFromTime(noteObj.time) : null;
    const isRepeatPass2 = REPEAT_END > 0 && entry.sheet_measure === REPEAT_END &&
                          physMeasure2 !== null && physMeasure2 > REPEAT_END;
    const bucketSource = (REPEAT_END > 0 && (isRepeatPass2 || entry.sheet_measure === REPEAT_END))
        ? _svgBucketsPage2
        : _svgBuckets;

    const bucket = bucketSource[entry.sheet_measure]?.[clef];
    if (!bucket || entry.rank >= bucket.length) {
        console.warn(`_svgIndicesForMidiNote: bucket[${entry.sheet_measure}][${clef}] rank=${entry.rank} missing (repeatPass=${isRepeatPass2})`);
        return [];
    }

    // Return the matched note AND all chord-mates at the same X position.
    // Strategy: try a tight 2px tolerance first (catches true chord-mates that
    // are pixel-aligned). If that returns only the matched note itself, widen to
    // 6px to handle minor SVG rounding across staves. This prevents grace notes
    // placed just a few pixels away from accidentally being co-highlighted.
    const matchedIdx = bucket[entry.rank];
    const matchedTx  = _svgNoteElements[matchedIdx].tx;
    const tight  = bucket.filter(i => Math.abs(_svgNoteElements[i].tx - matchedTx) < 2);
    const result = tight.length > 1 ? tight
                 : bucket.filter(i => Math.abs(_svgNoteElements[i].tx - matchedTx) < 6);
    return result;
}


let _currentHighlightEls = [];

// colorMap: optional Map<index, cssColor> — overrides the default clef-based color for
// specific indices. Used to paint sustained carry-across notes green while the new
// sub-slot notes remain purple/gold.
function _applyHighlight(indices, colorMap) {
    // Clear previous highlights
    for (const el of _currentHighlightEls) {
        el.removeAttribute('fill');
        el.removeAttribute('filter');
    }
    // Accept either an array of indices (numbers) or legacy array of elements
    const idxArray = Array.isArray(indices) ? indices.filter(x => x != null) : (indices != null ? [indices] : []);
    _currentHighlightEls = idxArray.map(x => (typeof x === 'number' ? _svgNoteElements[x]?.el : x)).filter(Boolean);

    // ── DEBUG: log every highlighted note and flag strays ──────────────────
    // Only check for strays when actively waiting for user input (not during preview/playback)
    if (idxArray.length > 0 && waitingForInput) {
        const expectedMidis = new Set([...currentChordNotes]);
        const highlightedNotes = idxArray.map(x => {
            if (typeof x !== 'number') return { idx: '?', midi: null, name: '?', colorKey: 'unknown' };
            const ne    = _svgNoteElements[x];
            const color = (colorMap && colorMap.has(x)) ? colorMap.get(x)
                        : ne?.clef === 'bass' ? THEME.bassNote : THEME.trebleNote;
            const colorKey = color === '#16a34a' ? 'green' : color === THEME.trebleNote ? 'treble' : color === THEME.bassNote ? 'bass' : color;
            let midi = null;
            for (const [, entry] of _midiRankMap) {
                const bucket = _svgBuckets[entry.sheet_measure]?.[entry.clef];
                if (bucket && bucket[entry.rank] === x) { midi = entry.midi; break; }
            }
            const stray = midi !== null && !expectedMidis.has(midi);
            return { idx: x, midi, name: midi ? getNoteName(midi) : '?', colorKey, stray };
        });
        const strays = highlightedNotes.filter(n => n.stray);
        const label  = strays.length > 0 ? '🚨 _applyHighlight STRAY' : '🎨 _applyHighlight';
        console.log(
            label,
            '| highlighted:', highlightedNotes.map(n => `${n.name}(${n.colorKey})`).join(', '),
            '| expected (currentChordNotes):', [...currentChordNotes].map(getNoteName).join(', ') || '(none)',
            strays.length > 0 ? `| STRAYS: ${strays.map(n => `${n.name}(${n.colorKey})`).join(', ')}` : ''
        );
        if (strays.length > 0) console.trace('_applyHighlight stray — call stack:');
    }
    // ── END DEBUG ───────────────────────────────────────────────────────────

    idxArray.forEach(x => {
        const el   = typeof x === 'number' ? _svgNoteElements[x]?.el : x;
        const clef = typeof x === 'number' ? _svgNoteElements[x]?.clef : null;
        if (!el) return;
        // colorMap override → clef default (treble: accent, bass: bass accent)
        const color = (colorMap && colorMap.has(x)) ? colorMap.get(x)
                    : clef === 'bass' ? THEME.bassNote : THEME.trebleNote;
        el.setAttribute('fill', color);
        el.setAttribute('filter', 'url(#hlGlow)');
    });
    scrollToHighlight();
}

// ============================================================
// AUTO-SCROLL: only scroll when note leaves the visible band
// ============================================================
let _lastScrolledDocY = -9999;
let _scrollLocked     = false;

function scrollToHighlight() {
    if (!scoreModeActive || !_currentHighlightEls.length) return;
    if (_scrollLocked) return;

    const el   = _currentHighlightEls[0];
    const rect = el.getBoundingClientRect();

    const BRAND_BAR_H  = 56;
    const bottomDock   = document.getElementById('bottomDock');
    const BOTTOM_BAR_H = bottomDock ? bottomDock.getBoundingClientRect().height : 200;

    const topBound    = BRAND_BAR_H + 10;
    const bottomBound = window.innerHeight - BOTTOM_BAR_H - 10;

    // Note is already visible — do nothing
    if (rect.top >= topBound && rect.bottom <= bottomBound) return;

    const docY     = rect.top + window.scrollY;
    const visibleH = window.innerHeight - BRAND_BAR_H - BOTTOM_BAR_H;
    const targetTop = BRAND_BAR_H + visibleH * 0.30;

    window.scrollTo({ top: docY - targetTop, behavior: 'smooth' });

    _scrollLocked = true;
    setTimeout(() => { _scrollLocked = false; }, 1000);
}

// Keep legacy single-element reference for anything that reads _currentHighlightEl
Object.defineProperty(window, '_currentHighlightEl', {
    get() { return _currentHighlightEls[0] ?? null; },
    configurable: true
});

function clearScoreHighlight() {
    _applyHighlight([]);
}


// ============================================================
// PUBLIC: called whenever a training note is spawned
// ============================================================
function onTrainingNoteSpawned(noteObj) {
    if (!scoreModeActive) return;

    const noteName = getNoteName(noteObj.midi);
    const beats    = noteObj.duration / secondsPerBeat;
    showScoreNoteDisplay(noteName, beatsToNoteName(beats));

    const allIndices = [];
    const notePlayTime = noteObj.playTime ?? noteObj.time;

    // If this note is from the repeat pass, mirror to the first-pass equivalent notes
    const physMeasure = getMeasureFromTime(noteObj.time);
    const isRepeatPass = physMeasure !== null &&
        physMeasure >= REPEAT_START + REPEAT_LEN &&
        physMeasure <= REPEAT_END + REPEAT_LEN;

    let simultaneousNotes;
    if (isRepeatPass) {
        // Use raw MIDI time (not playTime) to locate first-pass equivalents.
        // playTime is interleaved-index-based (repeat-pass m29 idx=2, first-pass
        // m29 idx=1 — offset is 1×secondsPerMeasure, NOT REPEAT_LEN×secondsPerMeasure).
        // Raw MIDI time offsets are always exactly REPEAT_LEN×secondsPerMeasure.
        const firstPassRawTime = noteObj.time - REPEAT_LEN * secondsPerMeasure;
        simultaneousNotes = practiceNotes.filter(n =>
            Math.abs(n.time - firstPassRawTime) < 0.01
        );
        if (!simultaneousNotes.length) {
            // First-pass measures are not in the current range (e.g. range 36→37).
            // Fall back: find the first-pass equivalents by raw MIDI time in allMidiNotes.
            simultaneousNotes = allMidiNotes.filter(n =>
                Math.abs(n.time - firstPassRawTime) < 0.01
            );
        }
        if (!simultaneousNotes.length) {
            simultaneousNotes = practiceNotes.filter(n =>
                Math.abs((n.playTime ?? n.time) - notePlayTime) < 0.01
            );
        }
    } else {
        simultaneousNotes = practiceNotes.filter(n =>
            Math.abs((n.playTime ?? n.time) - notePlayTime) < 0.01
        );
    }

    console.log(`🎵 onTrainingNoteSpawned: notePlayTime=${notePlayTime.toFixed(4)} isRepeatPass=${isRepeatPass} simultaneousNotes=${simultaneousNotes.length}`);

    // Deduplicate by time+midi+track so we don't double-lookup.
    // Also skip notes that are carried-across sustains (_bgHeldNotes) — those are
    // already physically held from a previous slot and do NOT need a new score
    // highlight. Highlighting them here causes a stray green/purple flash right
    // after a successful press before the app moves to the next musical event.
    const seen = new Set();
    for (const n of simultaneousNotes) {
        if (_bgHeldNotes && _bgHeldNotes.has(n.midi)) continue; // carried-across sustain — skip
        const k = `${n.time.toFixed(4)}|${n.midi}|${n.track}`;
        if (seen.has(k)) continue;
        seen.add(k);
        const indices = _svgIndicesForMidiNote(n, 'both');
        allIndices.push(...indices);
    }

    // Fallback: just use the primary noteObj
    if (allIndices.length === 0) {
        const fallback = _svgIndicesForMidiNote(noteObj, clefMode);
        allIndices.push(...fallback);
    }

    if (allIndices.length > 0) {
        _applyHighlight(allIndices);
    } else {
        console.warn(`onTrainingNoteSpawned: no SVG match for ${noteName} t=${noteObj.time.toFixed(3)}`);
    }
}

// ============================================================
// Score-note display badge
// ============================================================
function showScoreNoteDisplay(noteName, hint) {
    const el = document.getElementById('scoreNoteDisplay');
    document.getElementById('scoreNoteName').textContent = noteName || '—';
    document.getElementById('scoreNoteHint').textContent = hint    || '';
    el.classList.add('active');
}

function hideScoreNoteDisplay() {
    document.getElementById('scoreNoteDisplay').classList.remove('active');
}

// ============================================================
// Debug helper
// ============================================================
window._debug = function() {
    console.group('Rank-based SVG buckets (first 5 measures)');
    const measures = Object.keys(_svgBuckets).map(Number).sort((a,b)=>a-b).slice(0,5);
    for (const m of measures) {
        for (const clef of ['treble','bass']) {
            const bucket = _svgBuckets[m]?.[clef] || [];
            if (!bucket.length) continue;
            const items = bucket.map((idx,r) => {
                const n = _svgNoteElements[idx];
                return `rank${r}:tx=${n.tx.toFixed(0)}`;
            }).join('  ');
            console.log(`m=${m} ${clef}: ${items}`);
        }
    }
    console.log(`_midiRankMap has ${_midiRankMap.size} entries`);
    console.groupEnd();
};

// ============================================================
// SCORE VIEW — ALL 3 PAGES LOADED & STACKED
// ============================================================
async function initScoreMode() {
    try {
        await renderAllScorePages();
    } catch(e) {
        console.warn('SVG score load failed:', e);
    }
}

async function renderAllScorePages() {
    for (let pageNum = 1; pageNum <= SCORE_TOTAL_PAGES; pageNum++) {
        const container = document.getElementById(`scorePage${pageNum}`);
        if (!container) continue;
        const response = await fetch(`${SONG_CONFIG.svgBase}-${pageNum}.svg`);
        const svgText = await response.text();
        container.innerHTML = svgText;
        const svgEl = container.querySelector('svg');
        if (svgEl) {
            svgEl.style.width  = '90vw';
            svgEl.style.height = 'auto';
            svgEl.style.display = 'block';
            svgEl.removeAttribute('width');
            svgEl.removeAttribute('height');
            // Remove all <title> elements so browsers don't show filename tooltips on hover
            svgEl.querySelectorAll('title').forEach(t => t.remove());
        }
    }
    // Build the full SVG↔MIDI map across all pages
    _buildSvgMidiMap();
}

// Legacy single-page render kept so prev/next button listeners don't crash
async function renderScorePage(pageNum) {
    await renderAllScorePages();
}

document.getElementById('scorePrevBtn').addEventListener('click', async () => {});
document.getElementById('scoreNextBtn').addEventListener('click', async () => {});

const scoreModeToggle = document.getElementById('scoreModeToggle');
scoreModeToggle.addEventListener('change', async () => {
    scoreModeActive = scoreModeToggle.checked;

    const bottomDock       = document.getElementById('bottomDock');
    const scoreView        = document.getElementById('scoreView');
    const scoreNoteDisplay = document.getElementById('scoreNoteDisplay');

    if (scoreModeActive) {
        bottomDock.classList.add('score-mode');
        document.body.classList.add('score-mode');
        scoreView.classList.add('active');
        canvas.height = KEYBOARD_HEIGHT;
        drawKeyboard();
        await initScoreMode();
        if (trainingActive && currentTrainingNote && practiceNotes.length > 0) {
            const noteObj = practiceNotes[trainingIndex];
            showScoreNoteDisplay(currentTrainingNote);
            if (noteObj) {
                const indices = _svgIndicesForMidiNote(noteObj, clefMode);
                if (indices.length > 0) _applyHighlight(indices);
            }
        }
    } else {
        bottomDock.classList.remove('score-mode');
        document.body.classList.remove('score-mode');
        _lastScrolledDocY = -9999;
        _scrollLocked = false;
        scoreView.classList.remove('active');
        scoreNoteDisplay.classList.remove('active');
        clearScoreHighlight();
        resizeCanvas();
    }
});

function handleMIDIMessage(event) {
    if (previewMode) return;
    
    Tone.start();
    
    const [status, note, velocity] = event.data;
    const messageType = status & 0xf0;

    const isNoteOn = messageType === 0x90 && velocity > 0;
    const isNoteOff = messageType === 0x80 || (messageType === 0x90 && velocity === 0);

    const noteName = getNoteName(note);
    const feedback = document.getElementById('feedback');

if (isNoteOn) {
    pressedNotes = [noteName];
    processUserNoteOn(note);
}
    if (isNoteOff) {
if (freeMode && note === freeModeActiveNote) {
    freeModeSynth.triggerRelease(getNoteName(note));
    freeModeActiveNote = null;
    expectedMidiNote = null;
    expectedMidiTreble.clear();
    return;
}

        // In both-hands mode: always run the hold-registry check on every note-off,
        // even if the note is no longer in currentChordNotes (it may still be in _bgHeldNotes).
        if (clefMode === 'both' && _bgHeldNotes.has(note)) {
            midiPressedNotes.delete(note);
            if (synth) synth.triggerRelease(getNoteName(note));
            _bgCheckEarlyRelease(note);
            return;
        }

        // Check for early sustained-note release before the standard hold evaluation
        if (sustainedNotes.has(note) && !sustainedNoteExpired(note)) {
            midiPressedNotes.delete(note);
            synth.triggerRelease(getNoteName(note));
            handleSustainedNoteRelease(note);
            return;
        }

        if (!currentChordNotes.has(note)) return;
        
        midiPressedNotes.delete(note);
        
        synth.triggerRelease(getNoteName(note));
        
        // In both-hands mode: only evaluate hold when ALL current-step chord notes released
        // (sustained notes from other hand may still be held — that's intended)
        const currentStepAllReleased = Array.from(currentChordNotes).every(m => !midiPressedNotes.has(m));
        if (!currentStepAllReleased) return;
        
        if (noteHoldStartTime === null) return;

        if (holdEvaluated) { noteHoldStartTime = null; activeMidiNote = null; return; }

        evaluateHoldOnRelease(note);
    }
}
