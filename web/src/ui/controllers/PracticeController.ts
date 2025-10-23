/**
 * Practice Controller
 * Main application coordinator - manages UI, audio, and state
 */

import { AudioEngine } from '../../audio/AudioEngine';
import { PatternGenerator } from '../../generator/PatternGenerator';
import { PracticeSession } from '../../models/Session';
import { PlayButton } from '../components/PlayButton';
import { NewPatternButton } from '../components/NewPatternButton';
import { RevealButton } from '../components/RevealButton';
import { PatternNotation } from '../components/PatternNotation';
import { TempoControl } from '../components/TempoControl';
import { ComplexitySelector } from '../components/ComplexitySelector';
import { TimeSignatureSelector } from '../components/TimeSignatureSelector';
import { KeyboardHandler } from '../../utils/KeyboardHandler';
import { VisibilityHandler } from '../../utils/VisibilityHandler';
import { getSessionStorage } from '../../storage/SessionStorage';

export class PracticeController {
  private audioEngine: AudioEngine;
  private patternGenerator: PatternGenerator;
  private session: PracticeSession;
  private keyboardHandler: KeyboardHandler;
  private visibilityHandler: VisibilityHandler;

  // UI components
  private playButton: PlayButton | null;
  private newPatternButton: NewPatternButton | null;
  private revealButton: RevealButton | null;
  private patternNotation: PatternNotation | null;
  private tempoControl: TempoControl | null;
  private complexitySelector: ComplexitySelector | null;
  private timeSignatureSelector: TimeSignatureSelector | null;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.audioEngine = new AudioEngine();
    this.patternGenerator = new PatternGenerator();
    this.session = new PracticeSession();
    this.keyboardHandler = new KeyboardHandler();
    this.visibilityHandler = new VisibilityHandler();
    this.playButton = null;
    this.newPatternButton = null;
    this.revealButton = null;
    this.patternNotation = null;
    this.tempoControl = null;
    this.complexitySelector = null;
    this.timeSignatureSelector = null;
  }

  /**
   * Initialize controller and components
   */
  async initialize(): Promise<void> {
    if (!this.container) {
      throw new Error('Container element is required');
    }

    // Initialize storage
    const storage = getSessionStorage();
    await storage.initialize();

    // Try to load most recent session
    try {
      const savedSession = await storage.loadMostRecentSession();
      if (savedSession && savedSession.currentPattern) {
        // Restore session state
        this.session = PracticeSession.fromJSON(savedSession);
      }
    } catch (error) {
      console.warn('Failed to load saved session:', error);
    }

    // Create UI
    this.createUI();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Setup visibility handling
    this.setupVisibilityHandling();

    // Generate initial pattern if none loaded
    if (!this.session.currentPattern) {
      this.generateNewPattern();
    } else {
      // Update UI with loaded pattern
      if (this.patternNotation) {
        this.patternNotation.setPattern(this.session.currentPattern);
      }
    }

    // Setup periodic session saving
    this.setupPeriodicSave();
  }

  /**
   * Create UI components
   */
  private createUI(): void {
    if (!this.container) {
      throw new Error('Container element is required');
    }

    // Clear loading message
    this.container.innerHTML = '';

    // Create main layout
    const mainLayout = document.createElement('div');
    mainLayout.className = 'main-layout';

    // Create controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';

    // Create buttons
    this.playButton = new PlayButton(controlsContainer);
    this.newPatternButton = new NewPatternButton(controlsContainer);
    this.revealButton = new RevealButton(controlsContainer);

    // Create settings container
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'settings-container';

    // Create tempo control
    this.tempoControl = new TempoControl(settingsContainer, this.session.tempoBpm);

    // Create complexity selector
    this.complexitySelector = new ComplexitySelector(settingsContainer, this.session.complexityLevel);

    // Create time signature selector
    this.timeSignatureSelector = new TimeSignatureSelector(settingsContainer, this.session.timeSignature);

    // Create notation display
    const notationContainer = document.createElement('div');
    notationContainer.className = 'notation-container';
    this.patternNotation = new PatternNotation(notationContainer);

    // Add event listeners
    controlsContainer.addEventListener('play-toggle', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.handlePlayToggle(customEvent.detail.shouldPlay);
    });

    controlsContainer.addEventListener('new-pattern', () => {
      this.handleNewPattern();
    });

    controlsContainer.addEventListener('reveal-toggle', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.handleRevealToggle(customEvent.detail.shouldReveal);
    });

    settingsContainer.addEventListener('tempo-change', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.handleTempoChange(customEvent.detail.tempo);
    });

    settingsContainer.addEventListener('complexity-change', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.handleComplexityChange(customEvent.detail.complexity);
    });

    settingsContainer.addEventListener('time-signature-change', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.handleTimeSignatureChange(customEvent.detail.timeSignature);
    });

    // Assemble layout
    mainLayout.appendChild(controlsContainer);
    mainLayout.appendChild(settingsContainer);
    mainLayout.appendChild(notationContainer);
    this.container.appendChild(mainLayout);
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    // Space bar: play/pause
    this.keyboardHandler.register(' ', () => {
      this.togglePlayback();
    });

    // 'n' key: new pattern
    this.keyboardHandler.register('n', () => {
      this.handleNewPattern();
    });

    // 'r' key: reveal/hide pattern
    this.keyboardHandler.register('r', () => {
      const isCurrentlyShown = this.patternNotation?.isShown() || false;
      this.handleRevealToggle(!isCurrentlyShown);
    });

    // ArrowUp: increase tempo by 5 BPM
    this.keyboardHandler.register('ArrowUp', () => {
      if (this.tempoControl) {
        this.tempoControl.incrementTempo(5);
      }
    });

    // ArrowDown: decrease tempo by 5 BPM
    this.keyboardHandler.register('ArrowDown', () => {
      if (this.tempoControl) {
        this.tempoControl.incrementTempo(-5);
      }
    });

    // Start listening
    this.keyboardHandler.start();
  }

  /**
   * Setup visibility handling
   */
  private setupVisibilityHandling(): void {
    this.visibilityHandler.onVisibilityChange((isVisible) => {
      if (!isVisible && this.audioEngine.getState().isPlaying) {
        // Pause when tab becomes invisible
        this.audioEngine.pause();
        if (this.playButton) {
          this.playButton.setPlaying(false);
        }
      }
    });

    this.visibilityHandler.start();
  }

  /**
   * Handle play/pause toggle
   */
  private async handlePlayToggle(shouldPlay: boolean): Promise<void> {
    try {
      // Initialize audio on first play (requires user gesture)
      if (!this.audioEngine.isInitialized()) {
        await this.audioEngine.initialize();
      }

      if (shouldPlay) {
        // Ensure we have a pattern
        if (!this.session.currentPattern) {
          this.generateNewPattern();
        }

        if (this.session.currentPattern) {
          this.audioEngine.play(this.session.currentPattern, this.session.tempoBpm);
        }
      } else {
        this.audioEngine.pause();
      }

      // Update button state
      if (this.playButton) {
        this.playButton.setPlaying(shouldPlay);
      }
    } catch (error) {
      console.error('Failed to toggle playback:', error);
      alert('Failed to start audio. Please ensure your browser supports Web Audio API.');
    }
  }

  /**
   * Toggle playback
   */
  togglePlayback(): void {
    const currentState = this.audioEngine.getState();
    this.handlePlayToggle(!currentState.isPlaying);
  }

  /**
   * Handle new pattern generation
   */
  private handleNewPattern(): void {
    this.generateNewPattern();

    // Update notation if visible
    if (this.patternNotation && this.session.currentPattern) {
      this.patternNotation.setPattern(this.session.currentPattern);
    }
  }

  /**
   * Handle reveal toggle
   */
  private handleRevealToggle(shouldReveal: boolean): void {
    if (!this.patternNotation || !this.revealButton) return;

    if (shouldReveal) {
      // Ensure we have a pattern to show
      if (this.session.currentPattern) {
        this.patternNotation.setPattern(this.session.currentPattern);
        this.patternNotation.show();
      }
    } else {
      this.patternNotation.hide();
    }

    // Update button state
    this.revealButton.setRevealed(shouldReveal);
  }

  /**
   * Handle tempo change
   */
  private handleTempoChange(tempo: number): void {
    this.session.tempoBpm = tempo;

    // Update audio engine if playing
    if (this.audioEngine.getState().isPlaying) {
      this.audioEngine.setTempo(tempo);
    }

    // Save session
    this.saveSession();
  }

  /**
   * Handle complexity change
   */
  private handleComplexityChange(complexity: import('../../models/types').ComplexityLevel): void {
    this.session.complexityLevel = complexity;

    // Save session
    this.saveSession();
  }

  /**
   * Handle time signature change
   */
  private handleTimeSignatureChange(timeSignature: import('../../models/types').TimeSignature): void {
    this.session.timeSignature = timeSignature;

    // Generate new pattern with new time signature
    this.generateNewPattern();

    // Save session
    this.saveSession();
  }

  /**
   * Generate new pattern
   */
  generateNewPattern(): void {
    const pattern = this.patternGenerator.generate(
      this.session.complexityLevel,
      this.session.timeSignature,
      this.session.patternHistory
    );

    this.session.setCurrentPattern(pattern);

    // If playing, restart with new pattern
    if (this.audioEngine.getState().isPlaying) {
      this.audioEngine.play(pattern, this.session.tempoBpm);
    }

    // Save session after pattern change
    this.saveSession();
  }

  /**
   * Setup periodic session saving (every 30 seconds)
   */
  private setupPeriodicSave(): void {
    setInterval(() => {
      this.saveSession();
    }, 30000); // 30 seconds
  }

  /**
   * Save current session to IndexedDB
   */
  private async saveSession(): Promise<void> {
    try {
      const storage = getSessionStorage();
      await storage.saveSession(this.session.toJSON());
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Save session one last time before disposal
    this.saveSession();

    this.audioEngine.dispose();
    this.keyboardHandler.dispose();
    this.visibilityHandler.dispose();
    if (this.playButton) {
      this.playButton.destroy();
    }
    if (this.newPatternButton) {
      this.newPatternButton.destroy();
    }
    if (this.revealButton) {
      this.revealButton.destroy();
    }
    if (this.patternNotation) {
      this.patternNotation.destroy();
    }
    if (this.tempoControl) {
      this.tempoControl.destroy();
    }
    if (this.complexitySelector) {
      this.complexitySelector.destroy();
    }
    if (this.timeSignatureSelector) {
      this.timeSignatureSelector.destroy();
    }
  }
}
