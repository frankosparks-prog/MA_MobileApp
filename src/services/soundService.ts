import { Platform } from 'react-native';
import hapticService from './hapticService';

export type AudioCommandType = 'chime' | 'piano' | 'heartbeat' | 'splash';

export interface AudioCommand {
  type: AudioCommandType;
  tones?: Array<{ freq: number; type?: OscillatorType; dur: number; delay?: number }>;
}

type AudioListener = (cmd: AudioCommand) => void;
let globalAudioListener: AudioListener | null = null;

export function registerAudioListener(listener: AudioListener): () => void {
  globalAudioListener = listener;
  return () => {
    if (globalAudioListener === listener) {
      globalAudioListener = null;
    }
  };
}

class SoundService {
  /**
   * Synthesizes audio tones using standard Web Audio API in web browsers.
   */
  private playWebTone(frequency: number, type: OscillatorType = 'sine', duration = 0.4) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
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
   * Dispatches sound commands to the mobile headless audio host or web synthesizer.
   */
  private dispatchCommand(cmd: AudioCommand) {
    if (Platform.OS === 'web') {
      if (cmd.type === 'chime') {
        this.playWebTone(528, 'sine', 0.8);
        setTimeout(() => this.playWebTone(660, 'sine', 0.6), 180);
        setTimeout(() => this.playWebTone(792, 'sine', 0.9), 360);
      } else if (cmd.type === 'piano') {
        this.playWebTone(440, 'triangle', 1.0);
        this.playWebTone(554.37, 'triangle', 1.0);
        this.playWebTone(659.25, 'triangle', 1.2);
      } else if (cmd.type === 'heartbeat') {
        this.playWebTone(85, 'sine', 0.18);
        setTimeout(() => this.playWebTone(72, 'sine', 0.22), 140);
        setTimeout(() => {
          this.playWebTone(85, 'sine', 0.18);
          setTimeout(() => this.playWebTone(72, 'sine', 0.22), 140);
        }, 500);
      } else if (cmd.type === 'splash') {
        this.playWebTone(320, 'sine', 0.22);
        setTimeout(() => this.playWebTone(480, 'triangle', 0.28), 80);
        setTimeout(() => this.playWebTone(720, 'sine', 0.5), 180);
      }
    } else {
      // Dispatch to mobile headless audio bridge if registered
      try {
        globalAudioListener?.(cmd);
      } catch (e) {
        console.log('Mobile audio dispatch note:', e);
      }
    }
  }

  /**
   * First Reminder: Soft Forest Bird chirp / Wind Chime (528Hz healing frequency)
   */
  async playChime() {
    console.log('🎵 [Sound] Soft Wind Chime (Level 1 Ambient Soundscape)');
    hapticService.triggerHeartbeat();
    this.dispatchCommand({ type: 'chime' });
  }

  /**
   * Second Reminder: Calm Piano Chord (440Hz / 554Hz / 659Hz A-Major triad)
   */
  async playPianoChord() {
    console.log('🎵 [Sound] Calm Piano Chord (Level 2 Ambient Soundscape)');
    hapticService.triggerPulse();
    this.dispatchCommand({ type: 'piano' });
  }

  /**
   * Third Reminder: Heartbeat Rhythm (Thump-Thump urgent clinical signal)
   */
  async playHeartbeat() {
    console.log('🎵 [Sound] Heartbeat Rhythm (Level 3 Urgent Soundscape)');
    hapticService.triggerUrgent();
    this.dispatchCommand({ type: 'heartbeat' });
  }

  /**
   * "Nourish My Garden" watering splash & bloom sound
   */
  async playWaterSplash() {
    console.log('🎵 [Sound] Garden Water Splash & Bloom sound');
    hapticService.triggerNourishSuccess();
    this.dispatchCommand({ type: 'splash' });
  }
}

export default new SoundService();
