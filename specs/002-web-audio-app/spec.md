# Feature Specification: Web-Based Rhythm Practice Application

**Feature Branch**: `002-web-audio-app`
**Created**: 2025-10-23
**Status**: Draft
**Input**: User description: "Recreate all current functionality as a web application, but instead of generating a MIDI signal, produce audio using the web audio API."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browser-Based Pattern Playback (Priority: P1)

Musicians visit a web page, click a play button, and hear a kick drum pattern looping with a click track, just as they do in the CLI version today.

**Why this priority**: This is the core functionality - without working audio playback in the browser, no practice can happen. It's the minimal viable product that delivers immediate value.

**Independent Test**: Can be fully tested by opening the web app in a browser, clicking the play button, and verifying that audio plays and loops continuously.

**Acceptance Scenarios**:

1. **Given** a musician opens the web application, **When** the page loads, **Then** the application is in a paused state with a visible play button
2. **Given** the application is paused, **When** the user clicks the play button, **Then** they hear a kick drum pattern playing with a click track at 120 BPM
3. **Given** the pattern is playing, **When** the user clicks the pause button, **Then** playback stops immediately
4. **Given** the pattern is paused mid-measure, **When** the user clicks play again, **Then** playback resumes from the beginning of the pattern
5. **Given** the pattern is playing, **When** the pattern completes one measure, **Then** it immediately loops back to the beginning with no audible gap or timing drift
6. **Given** the pattern has been looping for 2 minutes, **When** checked against the expected timing, **Then** the cumulative timing drift is less than 50ms

---

### User Story 2 - Interactive Pattern Control (Priority: P1)

Musicians control the practice session through on-screen buttons or keyboard shortcuts, generating new patterns and revealing notation just like the CLI commands.

**Why this priority**: Basic interactivity (new pattern, reveal notation) is essential for the practice workflow and must work alongside playback to constitute an MVP.

**Independent Test**: Can be tested by clicking UI buttons or pressing keyboard shortcuts and verifying that the app responds with the expected actions (new pattern generation, notation display).

**Acceptance Scenarios**:

1. **Given** a pattern is playing, **When** the user clicks the "New Pattern" button or presses 'n', **Then** a new unique pattern is generated and starts playing immediately
2. **Given** the application is paused, **When** the user generates a new pattern, **Then** the new pattern is loaded but remains paused until the user clicks play
3. **Given** a pattern is playing, **When** the user clicks the "Reveal Pattern" button or presses 'r', **Then** the pattern notation appears on screen showing kick positions using visual notation
4. **Given** the notation is displayed, **When** the user generates a new pattern, **Then** the notation updates to show the new pattern
5. **Given** multiple patterns have been generated, **When** checked for uniqueness, **Then** each new pattern differs from the previous 20 patterns by at least 3 kick positions

---

### User Story 3 - Progressive Web App Installation (Priority: P1)

Musicians install the application on their mobile device home screen and launch it like a native app, enabling offline practice and faster access.

**Why this priority**: PWA installability is a core requirement that enables the app to feel native and work offline. This is essential for mobile musicians who practice in various environments.

**Independent Test**: Can be tested by visiting the web app on a mobile device, receiving an install prompt, adding to home screen, and launching the installed app with full functionality.

**Acceptance Scenarios**:

1. **Given** a musician visits the web app on a mobile browser (iOS Safari or Android Chrome), **When** the page loads and PWA criteria are met, **Then** the browser displays an "Add to Home Screen" prompt or option
2. **Given** the musician adds the app to their home screen, **When** they tap the home screen icon, **Then** the app launches in standalone mode without browser UI
3. **Given** the app is installed, **When** the musician opens it while offline, **Then** the app loads and functions normally (pattern generation, playback of cached audio)
4. **Given** the app is installed, **When** viewed in the app switcher, **Then** it displays with the correct app name and icon
5. **Given** the musician updates the app, **When** a new version is available, **Then** the app notifies the user and updates in the background

---

### User Story 4 - Tempo and Complexity Adjustment (Priority: P2)

Musicians adjust practice difficulty by changing tempo (40-300 BPM) and complexity level (simple, medium, complex) during their session without restarting.

**Why this priority**: Enables progressive practice and personalization but isn't required for basic functionality. Users can still practice effectively at a single tempo/complexity level.

**Independent Test**: Can be tested by using tempo and complexity controls and verifying that playback adjusts in real-time without stopping.

**Acceptance Scenarios**:

1. **Given** a pattern is playing at 120 BPM, **When** the user changes the tempo to 80 BPM via slider or input, **Then** the pattern continues playing smoothly at the new tempo
2. **Given** a pattern has medium complexity, **When** the user selects "simple" complexity and generates a new pattern, **Then** the new pattern has 2-4 kicks per measure with mostly on-beat positions
3. **Given** a pattern has simple complexity, **When** the user selects "complex" and generates a new pattern, **Then** the new pattern has 6-8 kicks per measure with high syncopation
4. **Given** the user adjusts settings, **When** tempo is set outside the valid range (below 40 or above 300), **Then** the system constrains the value to the valid range

---

### User Story 5 - Time Signature Selection (Priority: P3)

Musicians can select different time signatures for pattern generation to practice various rhythmic contexts beyond 4/4 time.

**Why this priority**: Expands practice variety but isn't essential for initial release. Most practice happens in 4/4 time, and this can be added after core functionality is proven.

**Independent Test**: Can be tested by selecting a time signature (e.g., 3/4, 5/4) and verifying that generated patterns follow the correct measure length and metrical structure.

**Acceptance Scenarios**:

1. **Given** a musician selects 3/4 time signature, **When** a pattern is generated, **Then** the pattern contains 3 beats per measure and the notation reflects this structure
2. **Given** a pattern in 4/4 time is playing, **When** the user switches to 5/4 time and generates a new pattern, **Then** the new pattern plays with 5 beats per measure with appropriate metrical weighting

---

### User Story 6 - Cross-Platform Accessibility (Priority: P2)

Musicians access the practice tool from any device with a web browser (desktop, laptop, tablet, mobile) without installing software, or install it as a PWA for enhanced mobile experience.

**Why this priority**: A key advantage of web delivery is accessibility. Both web and installed modes should work seamlessly across platforms.

**Independent Test**: Can be tested by loading the application on different devices and browsers (Chrome, Firefox, Safari on desktop; Safari on iOS, Chrome on Android) and verifying basic functionality works.

**Acceptance Scenarios**:

1. **Given** a musician opens the web app on Chrome desktop, **When** they use the practice features, **Then** all functionality works with accurate audio playback
2. **Given** a musician opens the web app on an iPad with Safari, **When** they tap the play button and use touch controls, **Then** patterns play and controls respond to touch input
3. **Given** a musician opens the web app on a mobile browser, **When** they load the application, **Then** the UI adapts to the smaller screen with touch-friendly controls
4. **Given** a musician uses the installed PWA on Android, **When** they use all features, **Then** performance and functionality match the web version

---

### Edge Cases

- What happens when a user's browser doesn't support the Web Audio API? (Display a clear error message with browser upgrade recommendations)
- How does the system handle browser tab switching or sleep mode? (Pause playback when tab is not visible/active, resume when returning based on previous play state)
- What happens when a user tries to change tempo while audio context is suspended? (Queue the change and apply when audio context resumes)
- How does the system handle rapid button clicks (e.g., pressing "New Pattern" 10 times quickly)? (Debounce input to prevent audio glitches, process one request at a time)
- What happens when pattern generation fails to find a unique pattern after maximum retries? (Fall back to accepting a pattern with relaxed uniqueness constraints and continue)
- How does the system handle devices with high audio latency? (Use browser's native timing APIs and accept that some devices may have noticeable latency, which is a browser/device limitation)
- What happens if the user clicks play but the browser blocks audio context creation? (Display an error message prompting user interaction to enable audio)
- What happens when the service worker fails to install or update? (App continues to work in online mode, displays a warning about offline functionality being unavailable)
- How does the app handle running in standalone mode versus browser mode? (Functions identically in both modes, with standalone mode hiding browser chrome)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Application MUST be a Progressive Web App that meets PWA installability criteria
- **FR-002**: Application MUST provide a web app manifest with app name, icons, theme colors, and display mode
- **FR-003**: Application MUST implement a service worker for offline functionality and asset caching
- **FR-004**: Application MUST be installable on mobile device home screens (iOS and Android)
- **FR-005**: Application MUST function offline after initial load, including pattern generation and audio playback
- **FR-006**: System MUST start in a paused state when the application first loads
- **FR-007**: Users MUST be able to start playback via a play button or keyboard shortcut (space bar)
- **FR-008**: Users MUST be able to pause playback via a pause button or keyboard shortcut (space bar)
- **FR-009**: System MUST generate random kick drum patterns with the same weighted probability algorithm as the CLI version (based on metrical hierarchy)
- **FR-010**: System MUST play generated patterns using Web Audio API with looping playback and click track
- **FR-011**: System MUST provide visual notation display showing kick positions in a clear, readable format
- **FR-012**: Users MUST be able to generate new patterns on demand via button click or keyboard shortcut ('n')
- **FR-013**: System MUST maintain playback state (playing/paused) when generating new patterns
- **FR-014**: Users MUST be able to reveal/hide pattern notation via button click or keyboard shortcut ('r')
- **FR-015**: Users MUST be able to adjust tempo in real-time within the range of 40-300 BPM
- **FR-016**: Users MUST be able to select complexity levels (simple, medium, complex) that affect pattern generation weights
- **FR-017**: System MUST maintain a session history of the last 20 patterns to ensure variety (minimum Hamming distance of 3)
- **FR-018**: System MUST support time signature selection with at least 4/4 time, with support for additional time signatures (3/4, 5/4, etc.)
- **FR-019**: System MUST handle browser tab visibility changes by pausing playback when tab is inactive
- **FR-020**: System MUST work in modern browsers supporting Web Audio API and PWA features (Chrome 35+, Firefox 25+, Safari 14.1+, Edge 79+)
- **FR-021**: System MUST provide responsive UI that adapts to different screen sizes (desktop, tablet, mobile)
- **FR-022**: System MUST display clear error messages when Web Audio API is not available or audio context cannot be created
- **FR-023**: System MUST maintain timing accuracy within 50ms cumulative drift over 2 minutes of continuous playback
- **FR-024**: Application MUST notify users when updates are available and allow them to refresh to the latest version
- **FR-025**: Application MUST work in both browser and standalone (installed PWA) modes with identical functionality

### Key Entities

- **Pattern**: Represents a rhythmic pattern consisting of kick drum positions across a measure, with associated tempo, complexity level, and time signature metadata
- **Audio Scheduler**: Manages precise timing of audio events using Web Audio API's scheduling system to maintain accurate playback and looping
- **Playback State**: Tracks whether the application is currently playing or paused, ensuring consistent behavior across user interactions
- **Session History**: Maintains a record of recently generated patterns to enforce uniqueness constraints
- **Audio Context**: Represents the Web Audio API context that manages audio generation, scheduling, and playback state
- **UI Controls**: Buttons, sliders, and keyboard bindings that allow users to control playback, generation, and display settings
- **Service Worker**: Manages offline caching, asset management, and update notifications for PWA functionality
- **App Manifest**: Defines PWA metadata including app name, icons, colors, and display preferences

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Musicians can load the application and start practicing within 5 seconds (page load plus single play button click)
- **SC-002**: Application meets all PWA installability criteria and prompts for installation on supported mobile browsers
- **SC-003**: Installed PWA launches in standalone mode within 2 seconds on mobile devices
- **SC-004**: Application functions fully offline after initial load, including all practice features
- **SC-005**: Pattern playback maintains timing accuracy with less than 50ms cumulative drift over 2 minutes of continuous looping
- **SC-006**: Application loads and functions correctly in at least 95% of modern browser/OS combinations (Chrome, Firefox, Safari, Edge on Windows, macOS, Linux, iOS, Android)
- **SC-007**: Users can generate new patterns and see notation updates within 200ms of button press
- **SC-008**: Generated patterns maintain 95% or higher uniqueness within a 20-pattern session window
- **SC-009**: Application remains responsive and playback continues smoothly during tempo and complexity adjustments
- **SC-010**: Musicians can complete a full practice workflow (play, listen, pause, transcribe, reveal, generate new) in both web and installed modes
- **SC-011**: Application continues functioning after 30 minutes of continuous use without memory leaks or performance degradation
- **SC-012**: Play/pause state changes respond to user input within 50ms
- **SC-013**: Service worker successfully caches all assets on first load, enabling complete offline functionality
