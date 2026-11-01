import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

class HapticService {
  /**
   * Level 1: Soft Heartbeat vibration (Gentle Nudge)
   * Thump... Thump
   */
  async triggerHeartbeat() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (_) {}
      }, 160);
    } catch (e) {
      console.log('Haptics unavailable:', e);
    }
  }

  /**
   * Level 2: Continuous pulse haptic (The Encourager)
   */
  async triggerPulse() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (_) {}
      }, 200);
      setTimeout(async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (_) {}
      }, 400);
    } catch (e) {
      console.log('Haptics unavailable:', e);
    }
  }

  /**
   * Level 3: Urgent double-thump haptic (The Serious Friend)
   */
  async triggerUrgent() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (_) {}
      }, 150);
      setTimeout(async () => {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (_) {}
      }, 350);
    } catch (e) {
      console.log('Haptics unavailable:', e);
    }
  }

  /**
   * "Nourish My Garden" confirmation pop
   * Satisfying physical reward feedback
   */
  async triggerNourishSuccess() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(async () => {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
      }, 120);
    } catch (e) {
      console.log('Haptics unavailable:', e);
    }
  }

  /**
   * Selection / light tap
   */
  async triggerSelection() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      console.log('Haptics unavailable:', e);
    }
  }

  async selection() {
    return this.triggerSelection();
  }
}

export default new HapticService();

