// ============================================================================
// bgm.js — procedural chiptune background music using Web Audio.
// Plays a looped 16-bar pattern: a 4-on-the-floor kick, a synth bassline, a
// melodic arpeggio, and a hi-hat shimmer. Pure code, no audio files, no rights
// issues. Tempo / scale chosen for "upbeat climbing montage" energy.
// ============================================================================

const BPM = 128;
const BEAT = 60 / BPM;        // seconds per beat
const STEP = BEAT / 4;        // 16th-note step
const BAR  = BEAT * 4;        // 4 beats per bar
const LOOP_BARS = 8;          // 8-bar phrase, then repeat

// A minor pentatonic + a passing tone — feels heroic, slightly wistful.
// Hz values for octave 4-ish.
const NOTES = {
  A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00,
  A4: 440.00, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
  A2: 110.00, E2: 82.41,  D2: 73.42,  G2: 98.00,
};

// Bassline: one note per beat, walks A → G → D → E (i-VII-iv-v in A minor).
const BASS = [
  NOTES.A2, NOTES.A2, NOTES.A2, NOTES.A2,
  NOTES.G2, NOTES.G2, NOTES.G2, NOTES.G2,
  NOTES.D2, NOTES.D2, NOTES.D2, NOTES.D2,
  NOTES.E2, NOTES.E2, NOTES.E2, NOTES.E2,
];

// Lead arpeggio over the same chord progression — 8th notes (8 per bar).
const LEAD = [
  // A minor
  NOTES.A4, NOTES.E5, NOTES.C5, NOTES.E5, NOTES.A4, NOTES.E5, NOTES.C5, NOTES.E5,
  // G major
  NOTES.G4, NOTES.D5, NOTES.G5, NOTES.D5, NOTES.G4, NOTES.D5, NOTES.G5, NOTES.D5,
  // D minor
  NOTES.D4, NOTES.A4, NOTES.D5, NOTES.A4, NOTES.D4, NOTES.A4, NOTES.D5, NOTES.A4,
  // E minor (resolves back to A)
  NOTES.E4, NOTES.G4, NOTES.E5, NOTES.G4, NOTES.E4, NOTES.G4, NOTES.E5, NOTES.G4,
];

let ctx = null;
let masterGain = null;
let scheduler = 0;
let nextNoteTime = 0;
let step = 0;       // 16th-note step within the loop
let running = false;
let userGain = 0.18; // overall volume

function noteOn(freq, time, dur, type, gain) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  // Quick attack, exponential decay — gives notes punch without clicks.
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(gain, time + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(g).connect(masterGain);
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

function noiseHit(time, dur, gain) {
  // White noise burst for hi-hat / kick noise component.
  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + dur);
  src.connect(hp).connect(g).connect(masterGain);
  src.start(time);
  src.stop(time + dur + 0.02);
}

function kick(time) {
  // Pitched sine sweep + noise click = classic 808-style kick.
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
  g.gain.setValueAtTime(0.6, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
  osc.connect(g).connect(masterGain);
  osc.start(time);
  osc.stop(time + 0.2);
  noiseHit(time, 0.02, 0.15);
}

function scheduleStep(s, time) {
  const bar = (s / 16) | 0;
  const stepInBar = s % 16;

  // Kick: every quarter note (steps 0, 4, 8, 12).
  if (stepInBar % 4 === 0) kick(time);

  // Hi-hat: every 8th note offbeat (steps 2, 6, 10, 14).
  if (stepInBar % 4 === 2) noiseHit(time, 0.04, 0.06);

  // Bass: every quarter note, follows the BASS array.
  if (stepInBar % 4 === 0) {
    const beatIdx = (bar % 4) * 4 + (stepInBar / 4);
    noteOn(BASS[beatIdx % BASS.length], time, BEAT * 0.85, 'sawtooth', 0.16);
  }

  // Lead arpeggio: every 8th note.
  if (stepInBar % 2 === 0) {
    const leadIdx = (bar % 4) * 8 + (stepInBar / 2);
    noteOn(LEAD[leadIdx % LEAD.length], time, STEP * 1.6, 'square', 0.07);
  }
}

function tick() {
  if (!running) return;
  // Schedule any steps coming up in the next 100ms.
  const lookahead = 0.1;
  while (nextNoteTime < ctx.currentTime + lookahead) {
    scheduleStep(step, nextNoteTime);
    nextNoteTime += STEP;
    step = (step + 1) % (LOOP_BARS * 16);
  }
}

export function start() {
  if (running) return;
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = userGain;
    masterGain.connect(ctx.destination);
  }
  // Browsers suspend AudioContext until a user gesture — resume here.
  if (ctx.state === 'suspended') ctx.resume();
  running = true;
  nextNoteTime = ctx.currentTime + 0.05;
  step = 0;
  scheduler = setInterval(tick, 25);
}

export function stop() {
  running = false;
  clearInterval(scheduler);
  scheduler = 0;
  if (masterGain) {
    // Fade out smoothly so notes don't cut harshly.
    const t = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(masterGain.gain.value, t);
    masterGain.gain.linearRampToValueAtTime(0, t + 0.3);
    setTimeout(() => {
      if (masterGain) masterGain.gain.value = userGain;
    }, 400);
  }
}

export function setVolume(v) {
  userGain = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = userGain;
}
