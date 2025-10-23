# Research: Web-Based Rhythm Practice Application

**Feature**: 002-web-audio-app
**Date**: 2025-10-23
**Status**: Phase 0 Complete

## Research Areas

### 1. Build Tooling Selection

**Decision**: **Vite** for build tooling

**Rationale**:
- **Superior PWA support**: Vite has excellent PWA plugin (vite-plugin-pwa) with built-in service worker generation and manifest handling
- **TypeScript integration**: First-class TypeScript support with fast HMR
- **Build performance**: Extremely fast dev server using native ES modules, production builds via Rollup
- **Bundle optimization**: Automatic code splitting, tree-shaking, and minification
- **Developer experience**: Zero-config for TypeScript, hot module replacement works reliably
- **Service worker compilation**: vite-plugin-pwa handles TypeScript service worker compilation automatically
- **Modern output**: Generates optimized ES modules with legacy fallbacks

**Alternatives Considered**:
- **esbuild**: Faster builds but less mature PWA tooling, would need manual service worker setup
- **Parcel**: Good zero-config experience but PWA support is less robust than Vite
- **Rollup**: Excellent for libraries but requires more configuration for app development, no dev server

**Configuration Notes**:
- Use `vite-plugin-pwa` with `workbox` strategy for service worker generation
- Configure TypeScript target as ES2020+ for modern browsers
- Set up code splitting for audio synthesis modules (can be lazy-loaded)
- Enable source maps for debugging but exclude from production bundle

---

### 2. Web Audio API Best Practices

**Decision**: **Look-ahead scheduling** with **oscillator-based synthesis** for percussive sounds

**Rationale**:

**Scheduling Pattern**:
- **Look-ahead scheduler**: Use a timer (setInterval/setTimeout) to schedule audio events slightly ahead of playback time
- Schedule audio events using `AudioContext.currentTime` + small look-ahead buffer (25-50ms)
- This compensates for JavaScript timer imprecision while using Web Audio API's precise timing
- Re-schedule events continuously to maintain tight timing over long playback sessions

**Sound Synthesis**:
- **Kick drum**: Short oscillator burst (sine wave 50-150Hz) with exponential frequency envelope and amplitude decay
- **Click**: Brief noise burst or high-frequency oscillator click (2-4kHz, 5-10ms duration)
- **No external samples needed**: Synthesized sounds work offline and are tiny in memory
- **AudioBuffer caching**: Pre-render kick/click sounds into AudioBuffers on initialization for consistent playback

**AudioContext Management**:
- Create AudioContext on user gesture (to comply with browser autoplay policies)
- Handle `suspend`/`resume` for tab visibility changes
- Use `audioContext.currentTime` as timing reference (monotonically increasing, drift-resistant)

**Timing Accuracy**:
- Web Audio API scheduling is sample-accurate when using `AudioContext.currentTime`
- Look-ahead scheduling typically achieves <10ms accuracy for event timing
- Main challenge is JavaScript timer drift, mitigated by re-scheduling based on audio time

**Alternatives Considered**:
- **Direct JavaScript timing**: setTimeout/setInterval alone - too imprecise (50-100ms+ drift)
- **Pre-recorded samples**: Would require loading audio files, complicates offline mode
- **ScriptProcessorNode**: Deprecated, replaced by AudioWorklet
- **AudioWorklet**: Overkill for this use case, adds complexity, not needed for simple scheduling

**Implementation Notes**:
```typescript
// Core pattern:
class AudioScheduler {
  private scheduleAheadTime = 0.1; // 100ms look-ahead
  private scheduleInterval = 25; // Check every 25ms

  scheduleNotes() {
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
      scheduleNote(nextNoteTime);
      advanceNote();
    }
  }

  scheduleNote(time: number) {
    // Use time parameter for sample-accurate scheduling
    oscillator.start(time);
    oscillator.stop(time + duration);
  }
}
```

---

### 3. PWA Implementation Patterns

**Decision**: **Cache-first strategy** with **background update** and **user notification**

**Rationale**:

**Caching Strategy**:
- **Cache-first for app shell**: HTML, JS, CSS served from cache immediately
- **Network-first for API calls**: Not applicable (no backend)
- **Precache all assets**: Use workbox `precacheAndRoute` to cache all build assets on install
- This ensures full offline functionality after first load

**Update Mechanism**:
- **Background updates**: Service worker updates automatically in background
- **Skip waiting**: After update downloads, prompt user to reload
- **Update notification**: Show non-intrusive banner: "Update available - Reload to apply"
- **Versioned caching**: Use build hash in cache names for automatic invalidation

**iOS Safari PWA Limitations**:
- **No install prompt**: Users must manually "Add to Home Screen"
- **Limited storage**: IndexedDB storage can be evicted, keep data minimal
- **No background audio**: Audio stops when app is backgrounded (acceptable for practice tool)
- **Viewport quirks**: Must set viewport meta tag correctly for standalone mode
- **No push notifications**: Not needed for this app

**Asset Versioning**:
- Vite generates content-hashed filenames automatically (e.g., `main.abc123.js`)
- Service worker precache manifest includes these hashes
- New build = new service worker = automatic update detection

**Alternatives Considered**:
- **Network-first**: Would slow down offline usage, unnecessary for static app
- **Stale-while-revalidate**: Adds complexity, cache-first is sufficient
- **Manual update checking**: Background updates are more user-friendly

**Implementation Notes**:
```typescript
// vite.config.ts with vite-plugin-pwa
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [] // No runtime caching needed
  },
  manifest: {
    name: 'Kickbeats',
    short_name: 'Kickbeats',
    theme_color: '#1a1a1a',
    icons: [/* ... */],
    display: 'standalone',
    start_url: '/',
    scope: '/'
  }
})
```

---

### 4. Pattern Generation Algorithm Port

**Decision**: **Direct translation** from Rust to TypeScript with **shared test fixtures**

**Rationale**:

**Translation Approach**:
- **Line-by-line port**: Translate Rust pattern generation logic directly to TypeScript
- Preserve algorithm structure, variable names, and logic flow
- This minimizes risk of introducing behavioral differences

**Random Number Generation**:
- Rust uses `rand` crate with specific RNG algorithms
- TypeScript: Use `Math.random()` for simplicity (sufficient for pattern generation)
- For testing parity: Consider seeded RNG (can implement simple LCG for reproducible tests)

**Testing Strategy**:
- **Golden tests**: Generate patterns with Rust CLI, save as JSON fixtures
- Run same generation parameters through TypeScript implementation
- Compare outputs (exact match for deterministic RNG, statistical match for `Math.random()`)
- Test key properties: kick density, Hamming distance, metrical weighting

**Number Precision**:
- JavaScript numbers are IEEE 754 double precision (64-bit)
- Sufficient for pattern generation (dealing with integer positions and probability weights)
- No precision concerns for this use case

**Alternatives Considered**:
- **Reimplementation**: Risk of subtle algorithm differences, harder to validate
- **Compile Rust to WASM**: Overkill for simple algorithm, adds build complexity and bundle size
- **Shared library approach**: Not feasible without backend

**Implementation Notes**:
- Port `models/Pattern`, `models/BeatGrid`, and `generator/` modules
- Create TypeScript equivalents maintaining same public APIs
- Write property-based tests for pattern constraints
- Include regression tests with fixtures from Rust implementation

---

### 5. Testing Strategy

**Decision**: **Vitest** for unit tests, **Playwright** for e2e tests

**Rationale**:

**Unit Testing (Vitest)**:
- **Vite integration**: Vitest is designed for Vite projects, shares config
- **Fast execution**: Uses Vite's transform pipeline, very fast test runs
- **TypeScript support**: First-class TypeScript support, no extra config
- **Jest-compatible API**: Easy migration if needed, familiar syntax
- **ESM native**: Works with ES modules naturally (Jest requires configuration)

**E2E Testing (Playwright)**:
- **Multi-browser**: Tests Chrome, Firefox, Safari (Webkit) - critical for PWA
- **PWA testing**: Can test service worker, offline mode, installation
- **Mobile emulation**: Can emulate iOS Safari and Android Chrome
- **Reliable**: Modern architecture, auto-waits, reduces flaky tests
- **Developer tools**: Great debugging with trace viewer and inspector

**Web Audio API Mocking**:
- **Unit tests**: Mock AudioContext methods, verify scheduling calls
- **Integration tests**: Use real AudioContext in test environment (headless browser)
- **Timing tests**: Mock time using Vitest fake timers, verify scheduling logic
- **Property tests**: Verify timing calculations without actual audio playback

**Service Worker Testing**:
- **Vitest**: Test service worker logic in isolation (mock events)
- **Playwright**: Test full PWA lifecycle (install, cache, offline, update)

**Alternatives Considered**:
- **Jest**: Requires more configuration for ESM and Vite, slower than Vitest
- **Web Test Runner**: Good option but less ecosystem, Vitest has momentum
- **Cypress**: Good e2e framework but Playwright has better multi-browser support
- **Puppeteer**: Lower-level than Playwright, no Firefox/Safari support

**Implementation Notes**:
```typescript
// Example timing test with Vitest
import { describe, it, expect, vi } from 'vitest';

describe('AudioScheduler', () => {
  it('schedules notes with look-ahead timing', () => {
    vi.useFakeTimers();
    const mockAudioContext = {
      currentTime: 0,
      createOscillator: vi.fn()
    };
    // Test scheduling logic...
  });
});
```

---

### 6. Vanilla JS UI Patterns

**Decision**: **Class-based components** with **custom event system** and **centralized state management**

**Rationale**:

**Component Architecture**:
- **Class-based components**: TypeScript classes for UI components (not Web Components)
- Each component manages its own DOM subtree and event handlers
- Simpler than Web Components (no Shadow DOM complexity)
- Better TypeScript integration than functional patterns
- Example: `PlayButton`, `TempoControl`, `PatternNotation` classes

**State Management**:
- **Centralized store**: Single `AppState` object with observable pattern
- Components subscribe to state changes via callbacks/events
- Simple state update flow: user action → state mutation → component re-render
- No framework needed for this scale (~10-15 components)

**Event Handling**:
- **Custom events**: Use `CustomEvent` for component communication
- Components dispatch typed events up the tree
- Controller/coordinator listens and updates state
- Example: `PlayButton` dispatches `play-requested` event, `PracticeController` handles it

**DOM Updates**:
- **Manual updates**: Components update their own DOM on state changes
- Template strings for generating HTML
- Incremental updates (only change what's needed)
- No virtual DOM needed at this scale

**Alternatives Considered**:
- **Web Components**: Overkill for internal components, Shadow DOM complicates styling
- **Functional components**: Less natural TypeScript integration, harder to encapsulate state
- **Third-party state libraries**: Adds dependency for simple needs
- **Virtual DOM libraries**: Unnecessary complexity and bundle size

**Implementation Notes**:
```typescript
// Example component structure
class PlayButton {
  private element: HTMLButtonElement;
  private isPlaying: boolean = false;

  constructor(container: HTMLElement) {
    this.element = this.createButton();
    container.appendChild(this.element);
    this.attachEventListeners();
  }

  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'play-button';
    button.innerHTML = this.getButtonHTML();
    return button;
  }

  private attachEventListeners(): void {
    this.element.addEventListener('click', () => {
      this.dispatchEvent('play-toggle');
    });
  }

  private dispatchEvent(type: string): void {
    this.element.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      detail: { isPlaying: this.isPlaying }
    }));
  }

  update(isPlaying: boolean): void {
    this.isPlaying = isPlaying;
    this.element.innerHTML = this.getButtonHTML();
  }

  private getButtonHTML(): string {
    return this.isPlaying ? '⏸ Pause' : '▶️ Play';
  }
}

// State management
class AppState {
  private listeners: Map<string, Set<Function>> = new Map();
  private state = {
    isPlaying: false,
    tempo: 120,
    complexity: 'medium',
    currentPattern: null
  };

  subscribe(key: string, callback: Function): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
  }

  setState(updates: Partial<typeof this.state>): void {
    Object.assign(this.state, updates);
    Object.keys(updates).forEach(key => {
      this.listeners.get(key)?.forEach(cb => cb(this.state[key]));
    });
  }
}
```

---

### 7. TypeScript Module System

**Decision**: **ES Modules** with **explicit exports** and **dynamic imports** for code splitting

**Rationale**:

**Module System**:
- **ES Modules (ESM)**: Native browser support, standard for modern web development
- Use `import`/`export` syntax throughout
- Vite handles module resolution and bundling automatically
- Tree-shaking works best with ESM

**Module Resolution**:
- Configure `tsconfig.json` with `"module": "ES2020"` and `"moduleResolution": "bundler"`
- Use path aliases for cleaner imports (e.g., `@/models/*` instead of `../../models`)
- Explicit file extensions not required with bundler

**Code Splitting**:
- **Dynamic imports** for lazy-loading heavy modules
- Example: Audio synthesis module loaded on first play (not on initial page load)
- Vite automatically creates separate chunks for dynamic imports
- Pattern: `const module = await import('./audio/SoundSynthesis')`

**Tree-Shaking**:
- Write side-effect-free modules where possible
- Use named exports (better for tree-shaking than default exports)
- Vite/Rollup automatically removes unused code in production builds

**Alternatives Considered**:
- **CommonJS**: Legacy, not optimal for browsers, poor tree-shaking
- **UMD**: Unnecessary compatibility layer for modern browsers
- **No code splitting**: Larger initial bundle, slower first load

**Implementation Notes**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

```typescript
// Dynamic import example
class PracticeController {
  private async loadAudioEngine() {
    const { AudioEngine } = await import('@/audio/AudioEngine');
    this.audioEngine = new AudioEngine();
  }
}
```

---

## Summary of Decisions

| Area | Decision | Key Benefit |
|------|----------|-------------|
| **Build Tool** | Vite + vite-plugin-pwa | Excellent PWA support, fast builds, TypeScript integration |
| **Audio Scheduling** | Look-ahead scheduler | Achieves <50ms timing accuracy requirement |
| **Sound Synthesis** | Oscillator-based synthesis | Offline-capable, tiny memory footprint |
| **PWA Caching** | Cache-first with background updates | Fast offline access, smooth updates |
| **Algorithm Port** | Direct translation with test fixtures | Minimizes risk of behavioral differences |
| **Unit Testing** | Vitest | Fast, Vite-integrated, TypeScript-native |
| **E2E Testing** | Playwright | Multi-browser, PWA testing, mobile emulation |
| **UI Architecture** | Class-based components + events | Type-safe, maintainable, no framework overhead |
| **State Management** | Centralized observable state | Simple, sufficient for app scale |
| **Module System** | ES Modules + dynamic imports | Tree-shaking, code splitting, modern standard |

## Next Steps

All technical unknowns have been resolved. Proceed to **Phase 1** to design data models and module contracts based on these research findings.
