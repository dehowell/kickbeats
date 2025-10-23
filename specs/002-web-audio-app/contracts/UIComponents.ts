/**
 * UI Components Contract
 *
 * Defines interfaces for vanilla TypeScript UI components.
 * Components communicate via custom DOM events.
 */

import { Pattern, ComplexityLevel, TimeSignature } from './types';

/**
 * Base component interface
 */
export interface IComponent {
  /**
   * Render component to container
   * @param container - Parent HTML element
   */
  render(container: HTMLElement): void;

  /**
   * Update component state
   * @param state - New state values
   */
  update(state: Partial<ComponentState>): void;

  /**
   * Clean up resources and event listeners
   */
  destroy(): void;
}

/**
 * Play/Pause button component
 */
export interface IPlayButton extends IComponent {
  /** Set playing state */
  setPlaying(isPlaying: boolean): void;

  /** Enable/disable button */
  setEnabled(enabled: boolean): void;
}

/**
 * Tempo control component
 */
export interface ITempoControl extends IComponent {
  /** Set tempo value */
  setTempo(bpm: number): void;

  /** Set tempo range */
  setRange(min: number, max: number): void;
}

/**
 * Complexity selector component
 */
export interface IComplexitySelector extends IComponent {
  /** Set selected complexity */
  setComplexity(level: ComplexityLevel): void;

  /** Get available complexity levels */
  getLevels(): ComplexityLevel[];
}

/**
 * Time signature selector component
 */
export interface ITimeSignatureSelector extends IComponent {
  /** Set selected time signature */
  setTimeSignature(ts: TimeSignature): void;

  /** Get available time signatures */
  getAvailableSignatures(): TimeSignatureOption[];
}

/**
 * Pattern notation display component
 */
export interface IPatternNotation extends IComponent {
  /** Show pattern notation */
  showPattern(pattern: Pattern): void;

  /** Hide pattern notation */
  hidePattern(): void;

  /** Highlight current position during playback */
  highlightPosition(position: number): void;

  /** Clear position highlight */
  clearHighlight(): void;
}

/**
 * Practice controller (main app controller)
 */
export interface IPracticeController {
  /** Initialize controller and components */
  initialize(): Promise<void>;

  /** Handle play/pause action */
  togglePlayback(): void;

  /** Handle generate new pattern action */
  generateNewPattern(): void;

  /** Handle reveal pattern action */
  revealPattern(): void;

  /** Handle tempo change */
  changeTempo(bpm: number): void;

  /** Handle complexity change */
  changeComplexity(level: ComplexityLevel): void;

  /** Handle time signature change */
  changeTimeSignature(ts: TimeSignature): void;

  /** Clean up resources */
  dispose(): void;
}

/**
 * Component state
 */
export interface ComponentState {
  /** Is audio playing? */
  isPlaying: boolean;

  /** Current tempo */
  tempo: number;

  /** Current complexity */
  complexity: ComplexityLevel;

  /** Current time signature */
  timeSignature: TimeSignature;

  /** Current pattern */
  currentPattern: Pattern | null;

  /** Is pattern revealed? */
  patternRevealed: boolean;

  /** Current playback position */
  currentPosition: number;

  /** Is audio engine initialized? */
  audioInitialized: boolean;
}

/**
 * Custom DOM events for component communication
 */
export type ComponentEvent =
  | PlayToggleEvent
  | NewPatternEvent
  | RevealPatternEvent
  | TempoChangeEvent
  | ComplexityChangeEvent
  | TimeSignatureChangeEvent;

/**
 * Play toggle event
 */
export interface PlayToggleEvent extends CustomEvent {
  type: 'play-toggle';
  detail: {
    shouldPlay: boolean;
  };
}

/**
 * New pattern requested event
 */
export interface NewPatternEvent extends CustomEvent {
  type: 'new-pattern';
  detail: Record<string, never>; // No payload
}

/**
 * Reveal pattern event
 */
export interface RevealPatternEvent extends CustomEvent {
  type: 'reveal-pattern';
  detail: Record<string, never>; // No payload
}

/**
 * Tempo change event
 */
export interface TempoChangeEvent extends CustomEvent {
  type: 'tempo-change';
  detail: {
    tempo: number;
  };
}

/**
 * Complexity change event
 */
export interface ComplexityChangeEvent extends CustomEvent {
  type: 'complexity-change';
  detail: {
    complexity: ComplexityLevel;
  };
}

/**
 * Time signature change event
 */
export interface TimeSignatureChangeEvent extends CustomEvent {
  type: 'time-signature-change';
  detail: {
    timeSignature: TimeSignature;
  };
}

/**
 * Time signature display option
 */
export interface TimeSignatureOption {
  value: TimeSignature;
  label: string;
  description: string;
}

/**
 * Standard time signature options
 */
export const TIME_SIGNATURE_OPTIONS: TimeSignatureOption[] = [
  {
    value: { numerator: 4, denominator: 4 },
    label: '4/4',
    description: 'Common time'
  },
  {
    value: { numerator: 3, denominator: 4 },
    label: '3/4',
    description: 'Waltz time'
  },
  {
    value: { numerator: 6, denominator: 8 },
    label: '6/8',
    description: 'Compound duple'
  },
  {
    value: { numerator: 2, denominator: 4 },
    label: '2/4',
    description: 'March time'
  },
  {
    value: { numerator: 5, denominator: 4 },
    label: '5/4',
    description: 'Quintuple meter'
  },
  {
    value: { numerator: 7, denominator: 8 },
    label: '7/8',
    description: 'Irregular meter'
  }
];

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: ' ', // Space bar
  NEW_PATTERN: 'n',
  REVEAL: 'r',
  TEMPO_UP: 'ArrowUp',
  TEMPO_DOWN: 'ArrowDown'
} as const;

/**
 * Component class names (for styling)
 */
export const CSS_CLASSES = {
  PLAY_BUTTON: 'play-button',
  PLAY_BUTTON_PLAYING: 'play-button--playing',
  TEMPO_CONTROL: 'tempo-control',
  TEMPO_SLIDER: 'tempo-slider',
  TEMPO_VALUE: 'tempo-value',
  COMPLEXITY_SELECTOR: 'complexity-selector',
  COMPLEXITY_OPTION: 'complexity-option',
  COMPLEXITY_OPTION_ACTIVE: 'complexity-option--active',
  TIME_SIGNATURE_SELECTOR: 'time-signature-selector',
  PATTERN_NOTATION: 'pattern-notation',
  PATTERN_NOTATION_HIDDEN: 'pattern-notation--hidden',
  PATTERN_GRID: 'pattern-grid',
  PATTERN_BEAT: 'pattern-beat',
  PATTERN_STEP: 'pattern-step',
  PATTERN_STEP_KICK: 'pattern-step--kick',
  PATTERN_STEP_REST: 'pattern-step--rest',
  PATTERN_STEP_ACTIVE: 'pattern-step--active',
  CONTROL_PANEL: 'control-panel',
  BUTTON: 'button',
  BUTTON_PRIMARY: 'button--primary',
  BUTTON_SECONDARY: 'button--secondary',
  BUTTON_DISABLED: 'button--disabled'
} as const;
