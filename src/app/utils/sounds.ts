// Sound utility for ambient app sounds using Web Audio API
class SoundManager {
  private context: AudioContext | null = null;
  private enabled: boolean = true;
  private masterVolume: number = 0.15; // Soft ambient volume

  constructor() {
    // Initialize on first user interaction to comply with browser autoplay policies
    if (typeof window !== 'undefined') {
      const initAudio = () => {
        if (!this.context) {
          try {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
            console.log('🎵 Sound system initialized');
          } catch (e) {
            console.warn('Web Audio API initialization failed:', e);
          }
        }
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
      };
      document.addEventListener('click', initAudio, { once: true });
      document.addEventListener('touchstart', initAudio, { once: true });
    }
  }

  private getContext(): AudioContext | null {
    if (!this.context && typeof window !== 'undefined') {
      try {
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
        return null;
      }
    }
    return this.context;
  }

  private createOscillator(
    frequency: number,
    type: OscillatorType = 'sine',
    duration: number = 0.1,
    volume: number = 1
  ): void {
    if (!this.enabled) return;
    
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      const finalVolume = this.masterVolume * volume;
      gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }

  private playChord(frequencies: number[], duration: number = 0.15, volume: number = 1): void {
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.createOscillator(freq, 'sine', duration, volume * 0.8);
      }, index * 20);
    });
  }

  // Play a beat/kick sound
  private playKick(volume: number = 1): void {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(150, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);

      const finalVolume = this.masterVolume * volume;
      gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }

  // Play a snare/clap sound
  private playSnare(volume: number = 1): void {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;

    try {
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      
      const gainNode = ctx.createGain();
      const finalVolume = this.masterVolume * volume;
      gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }

  // Play hi-hat sound
  private playHiHat(volume: number = 1): void {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;

    try {
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      
      const gainNode = ctx.createGain();
      const finalVolume = this.masterVolume * volume * 0.3;
      gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      
      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.03);
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }

  // Play 808 bass sound
  private play808(frequency: number, duration: number = 0.3, volume: number = 1): void {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, ctx.currentTime + duration);

      const finalVolume = this.masterVolume * volume;
      gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }

  // Play synth pluck
  private playPluck(frequency: number, volume: number = 1): void {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      const finalVolume = this.masterVolume * volume;
      gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }

  // Play melody sequence
  private playMelody(notes: { freq: number; delay: number; duration: number }[], volume: number = 1): void {
    notes.forEach(note => {
      setTimeout(() => {
        this.playPluck(note.freq, volume);
      }, note.delay);
    });
  }

  // Action sounds
  like(): void {
    // Swapped with dislike - now plays downward tone
    this.playChord([523.25, 415.30], 0.12, 0.5);
  }

  unlike(): void {
    // Gentle release
    this.createOscillator(440, 'sine', 0.1, 0.4);
  }

  comment(): void {
    // Trap hi-hat double tap with pitched percussion
    this.playHiHat(0.8);
    setTimeout(() => this.playHiHat(0.6), 50);
    setTimeout(() => this.playPluck(1046.50, 0.6), 60);
  }

  share(): void {
    // Butterfly effect inspired - 808 slide with snare
    this.play808(55, 0.25, 0.8);
    setTimeout(() => this.playSnare(0.5), 120);
  }

  save(): void {
    // Bookmark - Lo-fi vinyl crackle feel with warm bass
    this.play808(65.41, 0.35, 0.7);
    setTimeout(() => this.playPluck(523.25, 0.5), 80);
  }

  unsave(): void {
    // Release with reversed feel
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(this.masterVolume * 0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }

  openModal(): void {
    // Atmospheric riser with kick
    this.playKick(0.6);
    setTimeout(() => {
      const ctx = this.getContext();
      if (!ctx || !this.enabled) return;

      try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(this.masterVolume * 0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
      } catch (e) {
        console.warn('Error playing sound:', e);
      }
    }, 40);
  }

  closeModal(): void {
    // Reverse riser with snare
    this.playSnare(0.4);
    setTimeout(() => {
      const ctx = this.getContext();
      if (!ctx || !this.enabled) return;

      try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);

        gainNode.gain.setValueAtTime(this.masterVolume * 0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
      } catch (e) {
        console.warn('Error playing sound:', e);
      }
    }, 30);
  }

  navigate(): void {
    // Page flip - quick pluck
    this.playPluck(440, 0.4);
  }

  button(): void {
    // Swapped with like - now plays upward tone (was the like sound)
    this.playChord([523.25, 659.25], 0.15, 0.7);
  }

  notification(): void {
    // Notification bell - melodic chime sequence
    this.playMelody([
      { freq: 987.77, delay: 0, duration: 0.1 },
      { freq: 1174.66, delay: 50, duration: 0.15 }
    ], 0.7);
  }

  message(): void {
    // Message pop - kick and pluck combo
    this.playKick(0.5);
    setTimeout(() => this.playPluck(880, 0.6), 40);
  }

  refresh(): void {
    // Swoosh refresh - fast arp up
    this.playMelody([
      { freq: 523.25, delay: 0, duration: 0.08 },
      { freq: 659.25, delay: 40, duration: 0.08 },
      { freq: 783.99, delay: 80, duration: 0.12 }
    ], 0.5);
  }

  storyOpen(): void {
    // Story opener - cinematic bass hit with rise
    this.play808(45, 0.4, 0.8);
    setTimeout(() => this.playPluck(392, 0.5), 100);
  }

  storyClose(): void {
    // Story closer - fade bass
    this.play808(55, 0.25, 0.5);
  }

  storyNext(): void {
    // Quick hi-hat tap
    this.playHiHat(0.8);
  }

  storyPrev(): void {
    // Quick reverse tap
    this.playHiHat(0.6);
    setTimeout(() => this.playPluck(523.25, 0.3), 20);
  }

  swipe(): void {
    // Swipe sound - fast sweep
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.06);

      gainNode.gain.setValueAtTime(this.masterVolume * 0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.06);
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }

  delete(): void {
    // Delete - distorted descending whomp
    this.playSnare(0.4);
    setTimeout(() => {
      const ctx = this.getContext();
      if (!ctx || !this.enabled) return;

      try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);

        gainNode.gain.setValueAtTime(this.masterVolume * 0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.25);
      } catch (e) {
        console.warn('Error playing sound:', e);
      }
    }, 50);
  }

  error(): void {
    // Error - dissonant alarm
    this.createOscillator(180, 'square', 0.08, 0.5);
    setTimeout(() => this.createOscillator(160, 'square', 0.08, 0.5), 80);
  }

  success(): void {
    // Success - triumphant melody
    this.playKick(0.6);
    this.playMelody([
      { freq: 659.25, delay: 0, duration: 0.12 },
      { freq: 783.99, delay: 80, duration: 0.12 },
      { freq: 987.77, delay: 160, duration: 0.2 }
    ], 0.7);
  }

  typing(): void {
    // Typing - subtle mechanical click
    this.playHiHat(0.5);
  }

  search(): void {
    // Search activation - glassy ping
    this.playPluck(1760, 0.6);
  }

  follow(): void {
    // Follow - celebratory kick + melody
    this.playKick(0.7);
    setTimeout(() => {
      this.playMelody([
        { freq: 523.25, delay: 0, duration: 0.12 },
        { freq: 659.25, delay: 60, duration: 0.12 },
        { freq: 830.61, delay: 120, duration: 0.18 }
      ], 0.65);
    }, 100);
  }

  unfollow(): void {
    // Unfollow - neutral bass thump
    this.play808(60, 0.2, 0.5);
  }

  post(): void {
    // Post success - full beat drop
    this.playKick(0.8);
    setTimeout(() => this.playSnare(0.6), 150);
    setTimeout(() => {
      this.playMelody([
        { freq: 659.25, delay: 0, duration: 0.15 },
        { freq: 783.99, delay: 60, duration: 0.15 },
        { freq: 987.77, delay: 120, duration: 0.2 },
        { freq: 1174.66, delay: 200, duration: 0.25 }
      ], 0.7);
    }, 200);
  }

  // Settings
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundsEnabled', enabled.toString());
    }
  }

  isEnabled(): boolean {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('soundsEnabled');
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
    }
    return this.enabled;
  }

  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundVolume', this.masterVolume.toString());
    }
  }

  getVolume(): number {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('soundVolume');
      if (stored !== null) {
        this.masterVolume = parseFloat(stored);
      }
    }
    return this.masterVolume;
  }
}

// Export singleton instance
export const soundManager = new SoundManager();