import { Platform } from 'react-native';

class SoundService {
  /**
   * Synthesize audio frequencies for web preview
   */
  private playWebTone(frequency: number, type: OscillatorType = 'sine', duration = 0.4) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {
        console.log('Web audio tone note:', e);
      }
    }
  }

  /**
   * First Reminder: Soft Forest Bird chirp / Wind Chime (528Hz Love/Healing frequency)
   */
  async playChime() {
    console.log('🎵 [Sound] Soft Wind Chime (Level 1 Ambient Soundscape)');
    this.playWebTone(528, 'sine', 0.8);
    setTimeout(() => this.playWebTone(660, 'sine', 0.6), 180);
    setTimeout(() => this.playWebTone(792, 'sine', 0.9), 360);
  }

  /**
   * Second Reminder: Calm Piano chord (440Hz / 554Hz / 659Hz A-Major triad)
   */
  async playPianoChord() {
    console.log('🎵 [Sound] Calm Piano Chord (Level 2 Ambient Soundscape)');
    this.playWebTone(440, 'triangle', 1.0);
    this.playWebTone(554.37, 'triangle', 1.0);
    this.playWebTone(659.25, 'triangle', 1.2);
  }

  /**
   * Third Reminder: Heartbeat rhythm (Thump-Thump urgent signal)
   */
  async playHeartbeat() {
    console.log('🎵 [Sound] Heartbeat Rhythm (Level 3 Urgent Soundscape)');
    this.playWebTone(80, 'sine', 0.15);
    setTimeout(() => this.playWebTone(70, 'sine', 0.2), 160);
    setTimeout(() => {
      this.playWebTone(80, 'sine', 0.15);
      setTimeout(() => this.playWebTone(70, 'sine', 0.2), 160);
    }, 600);
  }

  /**
   * "Nourish My Garden" watering splash sound
   */
  async playWaterSplash() {
    console.log('🎵 [Sound] Garden Water Splash & Bloom sound');
    this.playWebTone(320, 'sine', 0.2);
    setTimeout(() => this.playWebTone(480, 'triangle', 0.25), 80);
    setTimeout(() => this.playWebTone(720, 'sine', 0.5), 180);
  }
}

export default new SoundService();
