/**
 * Sound Synthesis Module
 * Generates kick drum and click sounds using Web Audio API oscillators
 */

export class SoundSynthesis {
  /**
   * Play kick drum sound
   * Short sine wave burst with frequency and amplitude envelope
   */
  playKick(audioContext: AudioContext, time: number, volume: number = 0.7): void {
    // Create oscillator for kick
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect: oscillator → gain → destination
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Kick drum: sine wave with frequency drop
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.05);

    // Amplitude envelope: quick attack, exponential decay
    gainNode.gain.setValueAtTime(volume, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    // Schedule playback
    osc.start(time);
    osc.stop(time + 0.15);
  }

  /**
   * Play click/metronome sound
   * Brief high-frequency burst for click track
   */
  playClick(
    audioContext: AudioContext,
    time: number,
    volume: number = 0.5,
    emphasis: boolean = false
  ): void {
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect: oscillator → gain → destination
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Click: short high-frequency burst
    osc.type = 'sine';
    const freq = emphasis ? 3000 : 2000; // Emphasized beats are higher pitched
    osc.frequency.setValueAtTime(freq, time);

    // Very short, sharp sound
    const clickVolume = emphasis ? volume * 1.3 : volume;
    gainNode.gain.setValueAtTime(clickVolume, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.01);

    // Schedule playback
    osc.start(time);
    osc.stop(time + 0.01);
  }

  /**
   * Pre-cache sounds into AudioBuffers (optional optimization)
   * For now, we generate sounds on-the-fly which is sufficient
   */
  async precacheSounds(_audioContext: AudioContext): Promise<void> {
    // Future optimization: render sounds to AudioBuffer once
    // For MVP, generating sounds on-the-fly is fine
    return Promise.resolve();
  }
}
