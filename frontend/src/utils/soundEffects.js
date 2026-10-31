/**
 * TerraSal UI Sound Effects Engine
 * Powered by Web Audio API - zero external assets, instant, high-fidelity tactile sounds.
 */

// Singleton AudioContext reference
let audioCtx = null;

const STORAGE_KEY_ENABLED = 'terrasal_sound_enabled';
const STORAGE_KEY_VOLUME = 'terrasal_sound_volume';

// Read preferences from localStorage
let soundEnabled = typeof window !== 'undefined'
  ? localStorage.getItem(STORAGE_KEY_ENABLED) !== 'false'
  : true;

let soundVolume = typeof window !== 'undefined'
  ? parseFloat(localStorage.getItem(STORAGE_KEY_VOLUME) || '0.6')
  : 0.6;

/**
 * Initialize or resume AudioContext safely upon user gesture
 */
export function getAudioContext() {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Check if sound is enabled
 */
export function isSoundEnabled() {
  return soundEnabled;
}

/**
 * Set sound enabled state
 */
export function setSoundEnabled(enabled) {
  soundEnabled = !!enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ENABLED, String(soundEnabled));
    window.dispatchEvent(new CustomEvent('terrasal-sound-change', {
      detail: { enabled: soundEnabled, volume: soundVolume }
    }));
  }
}

/**
 * Toggle sound enabled state
 */
export function toggleSound() {
  setSoundEnabled(!soundEnabled);
  if (soundEnabled) {
    playSound('pop');
  }
  return soundEnabled;
}

/**
 * Get current sound volume (0.0 - 1.0)
 */
export function getSoundVolume() {
  return soundVolume;
}

/**
 * Set sound volume (0.0 - 1.0)
 */
export function setSoundVolume(vol) {
  soundVolume = Math.max(0, Math.min(1, vol));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_VOLUME, String(soundVolume));
    window.dispatchEvent(new CustomEvent('terrasal-sound-change', {
      detail: { enabled: soundEnabled, volume: soundVolume }
    }));
  }
}

/**
 * Helper to get slightly randomized frequency (±3%) for natural organic variety
 */
function jitter(freq, amount = 0.04) {
  const factor = 1 + (Math.random() * (amount * 2) - amount);
  return freq * factor;
}

/**
 * Play synthesized sound effects
 * @param {'pop' | 'click' | 'toggle' | 'toggleOn' | 'toggleOff' | 'tab' | 'water' | 'success' | 'delete' | 'alert'} type
 * @param {object} [options]
 */
export function playSound(type = 'pop', options = {}) {
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const masterVol = options.volume !== undefined ? options.volume : soundVolume;
  if (masterVol <= 0) return;

  const now = ctx.currentTime;

  try {
    switch (type) {
      // 1. POP: Bubbly, warm, rounded pop (for general buttons, cards, pills)
      case 'pop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startFreq = jitter(options.frequency || 580);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.32 * masterVol, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.085);
        break;
      }

      // 2. CLICK: Crisp, tactile mechanical trackpad click
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const startFreq = jitter(1400, 0.02);
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.28 * masterVol, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      // 3. TOGGLE ON: Cheerful two-tone rising chime (e.g. checkbox on, modal open)
      case 'toggle':
      case 'toggleOn': {
        const f1 = jitter(480, 0.02);
        const f2 = jitter(720, 0.02);

        [
          { freq: f1, start: now, dur: 0.06, vol: 0.22 },
          { freq: f2, start: now + 0.045, dur: 0.08, vol: 0.26 }
        ].forEach(({ freq, start, dur, vol }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.05, start + dur);

          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(vol * masterVol, start + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + dur + 0.01);
        });
        break;
      }

      // 4. TOGGLE OFF: Gentle falling tone
      case 'toggleOff': {
        const f1 = jitter(680, 0.02);
        const f2 = jitter(440, 0.02);

        [
          { freq: f1, start: now, dur: 0.05, vol: 0.22 },
          { freq: f2, start: now + 0.04, dur: 0.07, vol: 0.2 }
        ].forEach(({ freq, start, dur, vol }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.9, start + dur);

          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(vol * masterVol, start + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + dur + 0.01);
        });
        break;
      }

      // 5. TAB: Soft airy swoosh / page navigation feedback
      case 'tab': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const startFreq = jitter(340, 0.03);
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.45, now + 0.1);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.24 * masterVol, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.11);
        break;
      }

      // 6. WATER DROP / BLOOP: Satisfying droplet sound (thematic for TerraSal soil & moisture)
      case 'water':
      case 'bubble': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        // Droplet pitch rises sharply then curves
        const baseFreq = jitter(420, 0.05);
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.04);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.12);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3 * masterVol, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
        break;
      }

      // 7. SUCCESS / CHIME: Rich celestial major chord (C5, E5, G5, C6) with sparkle
      case 'success':
      case 'chime': {
        const notes = [
          { freq: 523.25, time: 0.00, dur: 0.35, vol: 0.22 }, // C5
          { freq: 659.25, time: 0.04, dur: 0.38, vol: 0.24 }, // E5
          { freq: 783.99, time: 0.08, dur: 0.42, vol: 0.26 }, // G5
          { freq: 1046.50, time: 0.12, dur: 0.50, vol: 0.28 } // C6
        ];

        notes.forEach(({ freq, time, dur, vol }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + time);

          // Add a subtle second harmonic for richness
          gain.gain.setValueAtTime(0, now + time);
          gain.gain.linearRampToValueAtTime(vol * masterVol, now + time + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + time);
          osc.stop(now + time + dur + 0.02);
        });
        break;
      }

      // 8. DELETE: Subdued downward pluck
      case 'delete': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25 * masterVol, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
        break;
      }

      // 9. ALERT / PING: Dual chime ping
      case 'alert': {
        [0, 0.1].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now + delay);

          gain.gain.setValueAtTime(0, now + delay);
          gain.gain.linearRampToValueAtTime(0.2 * masterVol, now + delay + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.09);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + delay);
          osc.stop(now + delay + 0.095);
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    // Gracefully handle audio errors
    console.debug('Audio playback error:', err);
  }
}

