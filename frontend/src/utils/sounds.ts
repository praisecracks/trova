/**
 * Trova — Secure Escrow Payments Sound Synthesis Engine
 * Uses the Web Audio API to synthesize waveforms on the fly safely, adhering to autoplay regulations.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    this.isMuted = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('trustlink_effects_muted') === 'true' 
      : false;
  }

  /**
   * Lazily instantiates the AudioContext upon first user interaction sound request.
   */
  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    // Handle chrome/safari state suspension safety
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  public setMuteState(muted: boolean) {
    this.isMuted = muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('trustlink_effects_muted', String(muted));
    }
    // Dispatch dynamic event to sync header mute icons instantly without full page re-render
    window.dispatchEvent(new CustomEvent('trustlink_mute_changed', { detail: muted }));
  }

  /**
   * Sound 1: ESCROW FUND RELEASE (Success moment)
   * Multi-tone progressive bell sequence:
   *  - Tone 1: E5 (659.25Hz) lasting 0.12s
   *  - Tone 2: A5 (880.00Hz) lasting 0.12s
   *  - Tone 3: C#6 (1109.73Hz) lasting 0.35s
   */
  public playReleaseFunds() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      const context = this.ctx;
      if (!context) return;

      const now = context.currentTime;

      // Master output gain node to govern volume cleanly
      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0.22, now); // soft, rich volume ceiling
      masterGain.connect(context.destination);

      const playTone = (freq: number, startOffset: number, duration: number, isLast: boolean) => {
        const startTime = now + startOffset;
        const endTime = startTime + duration;

        const triOsc = context.createOscillator();
        const sineOsc = context.createOscillator();
        const nodeGain = context.createGain();

        triOsc.type = 'triangle';
        triOsc.frequency.setValueAtTime(freq, startTime);

        sineOsc.type = 'sine';
        sineOsc.frequency.setValueAtTime(freq, startTime);

        // Click-free Gain Envelope
        nodeGain.gain.setValueAtTime(0, startTime);
        nodeGain.gain.linearRampToValueAtTime(0.8, startTime + 0.006); // ultra-soft rapid attack

        if (isLast) {
          // brief sustain then 0.15s gentle fade to absolute zero
          const sustainDuration = 0.18;
          nodeGain.gain.setValueAtTime(0.8, startTime + sustainDuration);
          nodeGain.gain.exponentialRampToValueAtTime(0.001, endTime);
        } else {
          // linear decay smoothly at the end
          nodeGain.gain.exponentialRampToValueAtTime(0.001, endTime);
        }

        triOsc.connect(nodeGain);
        sineOsc.connect(nodeGain);
        nodeGain.connect(masterGain);

        triOsc.start(startTime);
        sineOsc.start(startTime);

        triOsc.stop(endTime);
        sineOsc.stop(endTime);

        // Garbage collection of elements to avoid leaks
        setTimeout(() => {
          triOsc.disconnect();
          sineOsc.disconnect();
          nodeGain.disconnect();
        }, (startOffset + duration + 0.2) * 1000);
      };

      // Sequence scheduling
      playTone(659.25, 0, 0.12, false);       // E5
      playTone(880.00, 0.12, 0.12, false);     // A5
      playTone(1109.73, 0.24, 0.35, true);     // C#6

      setTimeout(() => {
        masterGain.disconnect();
      }, 950);

    } catch (err) {
      console.warn("Skipping synthesized audio: Context is not fully activated yet.", err);
    }
  }

  /**
   * Sound 2: DISPUTE RESOLVED (Cooperative balance closing)
   * Harmonious steady hum with Sine oscillators
   *  - Root: F#4 (369.99Hz)
   *  - Perfect fifth: C#5 (554.37Hz)
   *  - Duration: exactly 0.40s
   */
  public playDisputeResolved() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      const context = this.ctx;
      if (!context) return;

      const now = context.currentTime;
      const duration = 0.40;
      const endTime = now + duration;

      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0.28, now);
      masterGain.connect(context.destination);

      const osc1 = context.createOscillator();
      const osc2 = context.createOscillator();
      const gainNode = context.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(369.99, now); // F#4

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(554.37, now); // C#5 (perfect fifth over standard root)

      // Gain Envelope:
      // Attack: Fade in slowly over 0.08 seconds (soft rise)
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.9, now + 0.08);

      // Sustain: Hold warm and stable for 0.18 seconds (up to 0.26s total)
      gainNode.gain.setValueAtTime(0.9, now + 0.26);

      // Release: Fade out smoothly over 0.14 seconds to absolute silence
      gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(masterGain);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(endTime);
      osc2.stop(endTime);

      setTimeout(() => {
        osc1.disconnect();
        osc2.disconnect();
        gainNode.disconnect();
        masterGain.disconnect();
      }, (duration + 0.25) * 1000);

    } catch (err) {
      console.warn("Skipping synthesized audio: Context is suspended.", err);
    }
  }
}

export const sounds = new SoundManager();
