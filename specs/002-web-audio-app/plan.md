# Implementation Plan: Web-Based Rhythm Practice Application

**Branch**: `002-web-audio-app` | **Date**: 2025-10-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-web-audio-app/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a Progressive Web Application (PWA) that recreates all functionality of the existing Rust CLI rhythm practice tool, replacing MIDI output with Web Audio API synthesis. The application must be installable on mobile home screens, work offline, and provide the same pattern generation, playback, and interactive controls as the CLI version. Core features include play/pause control (starting in paused state), real-time tempo/complexity adjustment, pattern notation display, and cross-platform browser support. Implementation uses TypeScript with vanilla JavaScript (no framework dependencies).

## Technical Context

**Language/Version**: TypeScript 5.x, targeting ES2020+
**Primary Dependencies**: None (vanilla JS) - Web Audio API (browser native), Service Worker API (browser native)
**Storage**: IndexedDB for session history and settings persistence (offline storage)
**Testing**: [NEEDS CLARIFICATION: Testing framework - Vitest, Jest, or Web Test Runner for unit tests; Playwright or Cypress for e2e]
**Target Platform**: Modern web browsers with Web Audio API and PWA support (Chrome 35+, Firefox 25+, Safari 14.1+, Edge 79+)
**Project Type**: web (PWA with service worker)
**Performance Goals**: <50ms cumulative timing drift over 2 minutes playback, <200ms pattern generation/display, <5 second first load
**Constraints**: Must work offline after initial load, <50ms play/pause response, timing accuracy using Web Audio API scheduling, PWA installability on iOS and Android, no framework dependencies
**Scale/Scope**: Single-page application, ~10-15 UI screens/views (main practice view, settings panels), pattern generation algorithm ported from Rust

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: Constitution file is template-only, no project-specific principles defined yet.

**Assessment**: Since the constitution is not yet filled in, there are no gates to validate against. This feature will proceed with standard web application best practices:
- Modular architecture with clear separation of concerns (TypeScript modules)
- Comprehensive testing (unit, integration, end-to-end)
- Progressive enhancement for offline capability
- Accessibility and responsive design
- No framework dependencies - vanilla TypeScript/JavaScript only

**Action**: Consider establishing project constitution principles after this feature to guide future development.

## Project Structure

### Documentation (this feature)

```
specs/002-web-audio-app/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
web/
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── icons/               # App icons for various sizes
│   ├── sw.js                # Service worker (compiled from TypeScript)
│   └── index.html           # Entry HTML
├── src/
│   ├── models/              # Pattern, BeatGrid, Session (ported from Rust)
│   │   ├── Pattern.ts
│   │   ├── BeatGrid.ts
│   │   ├── Session.ts
│   │   └── types.ts
│   ├── audio/               # Web Audio API scheduling and synthesis
│   │   ├── AudioEngine.ts   # Main audio scheduling engine
│   │   ├── AudioScheduler.ts # Look-ahead scheduler
│   │   └── SoundSynthesis.ts # Kick/click sound generation
│   ├── generator/           # Pattern generation (ported from Rust)
│   │   ├── PatternGenerator.ts
│   │   └── WeightCalculator.ts
│   ├── ui/                  # UI components and controllers
│   │   ├── components/      # Reusable UI components
│   │   │   ├── PlayButton.ts
│   │   │   ├── TempoControl.ts
│   │   │   ├── ComplexitySelector.ts
│   │   │   └── PatternNotation.ts
│   │   ├── controllers/     # Page controllers
│   │   │   └── PracticeController.ts
│   │   └── styles/          # CSS modules
│   ├── storage/             # IndexedDB wrapper for offline storage
│   │   └── SessionStorage.ts
│   ├── utils/               # Timing, keyboard handling
│   │   ├── KeyboardHandler.ts
│   │   └── VisibilityHandler.ts
│   ├── sw/                  # Service worker source
│   │   └── service-worker.ts
│   └── main.ts              # Application entry point
├── tests/
│   ├── unit/                # Component and logic tests
│   │   ├── models/
│   │   ├── audio/
│   │   └── generator/
│   ├── integration/         # Feature integration tests
│   │   └── playback/
│   └── e2e/                 # End-to-end browser tests
│       └── practice-workflow.spec.ts
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── vite.config.ts           # Build configuration (Vite for bundling)

dist/                        # Build output (generated)
```

**Structure Decision**: Web application structure selected based on PWA requirements in spec. The `web/` directory will contain the complete web app as a separate deliverable from the existing Rust CLI tool. This allows both versions to coexist in the repository. The structure separates presentation (ui/), business logic (models/, generator/), and platform integration (audio/, storage/) for testability and maintainability. Vanilla TypeScript with no framework dependencies keeps bundle size minimal and ensures maximum compatibility.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No violations identified - constitution is not yet established.

## Phase 0: Research & Technical Decisions

### Research Tasks

1. **Build Tooling Selection**
   - **Unknown**: Build system choice (Vite, esbuild, Parcel, or Rollup)
   - **Research needed**: Evaluate modern PWA build tooling for TypeScript compilation, bundling, and dev server with HMR
   - **Decision criteria**: Build performance, PWA/service worker support, TypeScript integration, bundle size optimization, development experience

2. **Web Audio API Best Practices**
   - **Unknown**: Optimal Web Audio API patterns for precise timing, audio synthesis techniques for kick/click sounds
   - **Research needed**: Web Audio API scheduling patterns (look-ahead scheduler), AudioContext best practices, sample synthesis vs oscillator-based synthesis for percussive sounds
   - **Decision criteria**: Timing accuracy (<50ms drift requirement), browser compatibility, offline capability, audio quality, implementation complexity

3. **PWA Implementation Patterns**
   - **Unknown**: Service worker strategies, cache management, update mechanisms for TypeScript-compiled assets
   - **Research needed**: PWA best practices for offline-first apps, service worker caching strategies (cache-first, network-first), update notification patterns, iOS Safari PWA limitations
   - **Decision criteria**: Offline reliability, update UX, iOS Safari PWA support, asset versioning

4. **Pattern Generation Algorithm Port**
   - **Unknown**: Best approach to port Rust pattern generation logic to TypeScript, maintaining algorithm parity
   - **Research needed**: Direct translation approach vs reimplementation, random number generation consistency, testing strategy for algorithm parity with Rust version
   - **Decision criteria**: Code maintainability, performance (JavaScript number precision), correctness validation against Rust implementation

5. **Testing Strategy**
   - **Unknown**: Testing framework selection for TypeScript, timing accuracy testing approach in browser
   - **Research needed**: Modern web testing frameworks (Vitest vs Jest for unit, Playwright vs Cypress for e2e), timing precision measurement in browser environment, mocking Web Audio API
   - **Decision criteria**: Test reliability, TypeScript support, CI/CD integration, timing measurement accuracy, Web Audio API mocking capabilities

6. **Vanilla JS UI Patterns**
   - **Unknown**: UI state management patterns without framework, DOM manipulation best practices
   - **Research needed**: Modern vanilla JS patterns (Web Components vs class-based components), reactive updates without framework, keyboard event handling
   - **Decision criteria**: Code maintainability, performance, bundle size, browser compatibility, testability

7. **TypeScript Module System**
   - **Unknown**: ES modules vs other module systems, tree-shaking optimization
   - **Research needed**: Modern ES module patterns for browser, dynamic imports for code splitting, TypeScript module resolution
   - **Decision criteria**: Browser compatibility, bundle size, load performance, code organization

### Output

All research findings will be consolidated in `research.md` with decisions, rationales, and alternatives considered.

## Phase 1: Design & Contracts

### Data Model

Extract entities from spec and Rust codebase:
- **Pattern**: Kick positions, tempo, complexity, time signature (TypeScript types/interfaces)
- **BeatGrid**: Metrical hierarchy for weighted generation
- **Session**: History of generated patterns, current playback state
- **PlaybackState**: Playing/paused, current position, timing reference
- **Settings**: User preferences (tempo, complexity, time signature, notation visibility)
- **AudioContext State**: Audio context lifecycle, scheduling state

Output: `data-model.md`

### API Contracts

Since this is a client-side PWA with no backend API, contracts will define:
- **Internal Module Interfaces**:
  - AudioEngine API (TypeScript interfaces)
  - PatternGenerator API
  - SessionStorage API
  - UI component interfaces
- **Service Worker Messages**: Cache requests, update notifications, typed message contracts
- **Storage Schema**: IndexedDB object stores structure with TypeScript types
- **Event Contracts**: Custom DOM events for component communication

Output: `contracts/` directory with TypeScript interface definitions

### Quickstart Guide

Document for developers:
- TypeScript and Node.js setup requirements
- Build system setup (npm/yarn install)
- Running in development mode with HMR
- TypeScript compilation
- Testing locally (unit and e2e)
- PWA testing on mobile devices (iOS Safari, Android Chrome)
- Build for production
- Deployment considerations (HTTPS requirement for PWA, service worker scope)

Output: `quickstart.md`

## Phase 2: Task Generation

*Not executed by this command - run `/speckit.tasks` after Phase 1 complete*

Tasks will be generated based on user stories prioritization:
- P1 tasks: Pattern playback with Web Audio API, interactive controls (vanilla TS), PWA installation (manifest + service worker)
- P2 tasks: Tempo/complexity adjustment, cross-platform testing
- P3 tasks: Time signature selection

## Notes

- The web app will coexist with the existing Rust CLI tool in the repository
- Pattern generation algorithm must be ported to match Rust behavior exactly - testing against Rust output will be critical
- Timing accuracy will be a critical implementation challenge - Web Audio API look-ahead scheduling pattern is essential
- PWA testing on actual mobile devices (iOS Safari, Android Chrome) will be essential
- Vanilla TypeScript approach means all UI updates must be manually managed (no reactive framework) - consider using custom event system for component communication
- Service worker must be compiled from TypeScript and properly versioned for updates
- IndexedDB wrapper should provide TypeScript-safe API with proper error handling
- Bundle size will be critical for mobile performance - monitor and optimize during development
