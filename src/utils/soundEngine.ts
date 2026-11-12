// Web Audio API procedural sound synthesizer for 1990s retro cyber-investigation terminal

class RetroSoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public volume: number = 0.25;

  constructor() {
    try {
      const saved = localStorage.getItem('retro_sound_muted');
      this.isMuted = saved ? JSON.parse(saved) : false;
    } catch {
      this.isMuted = false;
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('retro_sound_muted', JSON.stringify(this.isMuted));
    } catch {}
    if (!this.isMuted) {
      this.playBeep(800, 0.05, 'sine');
    }
    return this.isMuted;
  }

  public playKeyClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350 + Math.random() * 120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.02);

    gain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.025);
  }

  public playBootBeep() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Classic PC BIOS POST beep: 900Hz square wave
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playFileAccess() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Disk seek chirp
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200 + i * 200, now + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(400, now + i * 0.04 + 0.03);

      gain.gain.setValueAtTime(this.volume * 0.12, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.035);
    }
  }

  public playWarning() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(180, now + 0.1);

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playBeep(freq = 600, duration = 0.08, type: OscillatorType = 'sine') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  public playRadioSquelch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 2.5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.13);
    } catch (_) {}
  }

  public speakTranscriptLine(text: string, speaker?: string, onEnd?: () => void) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/\[\d+:\d+\]/g, '').replace(/[#*]/g, '').trim();
      if (!cleanText) {
        onEnd?.();
        return;
      }

      this.playRadioSquelch();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      if (
        speaker &&
        (speaker.includes('DISPATCH') ||
          speaker.includes('OPERATOR') ||
          speaker.includes('FBI') ||
          speaker.includes('OFFICER') ||
          speaker.includes('AGENT'))
      ) {
        utterance.pitch = 0.88;
      } else {
        utterance.pitch = 1.05;
      }
      utterance.volume = Math.min(1, this.volume * 3);

      utterance.onend = () => {
        this.playRadioSquelch();
        onEnd?.();
      };
      utterance.onerror = () => {
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (_) {
      onEnd?.();
    }
  }

  public stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }

  public startTapeAudioReel(textToSpeak?: string, onEnded?: () => void): () => void {
    if (this.isMuted) return () => {};
    this.initCtx();
    if (!this.ctx) return () => {};

    let stopped = false;
    let noiseNode: AudioBufferSourceNode | null = null;
    let humOsc: OscillatorNode | null = null;
    let tapeGain: GainNode | null = null;

    try {
      const now = this.ctx.currentTime;
      this.playRadioSquelch();

      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.12;
      }
      noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1100;
      bandpass.Q.value = 1.2;

      humOsc = this.ctx.createOscillator();
      humOsc.type = 'sine';
      humOsc.frequency.value = 60;
      const humGain = this.ctx.createGain();
      humGain.gain.value = this.volume * 0.08;

      tapeGain = this.ctx.createGain();
      tapeGain.gain.setValueAtTime(this.volume * 0.15, now);

      noiseNode.connect(bandpass);
      bandpass.connect(tapeGain);
      humOsc.connect(humGain);
      humGain.connect(tapeGain);
      tapeGain.connect(this.ctx.destination);

      noiseNode.start(now);
      humOsc.start(now);

      if (textToSpeak && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const lines = textToSpeak
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && !l.startsWith('---'));

        let lineIdx = 0;
        const playNextLine = () => {
          if (stopped || lineIdx >= lines.length) {
            if (!stopped) onEnded?.();
            return;
          }
          const curLine = lines[lineIdx++];
          this.speakTranscriptLine(curLine, undefined, () => {
            if (!stopped) {
              setTimeout(playNextLine, 350);
            }
          });
        };

        setTimeout(playNextLine, 300);
      }
    } catch (_) {}

    return () => {
      stopped = true;
      this.stopSpeech();
      this.playRadioSquelch();
      try {
        if (tapeGain && this.ctx) {
          tapeGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        }
        setTimeout(() => {
          try {
            noiseNode?.stop();
            humOsc?.stop();
            noiseNode?.disconnect();
            humOsc?.disconnect();
          } catch (_) {}
        }, 120);
      } catch (_) {}
    };
  }
}

export const soundEngine = new RetroSoundEngine();
