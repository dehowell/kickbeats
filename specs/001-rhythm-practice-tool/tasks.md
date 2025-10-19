# Tasks: Rhythm Practice Tool

**Input**: Design documents from `/specs/001-rhythm-practice-tool/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-interface.md

**Tests**: Tests are NOT explicitly requested in the specification. Testing will be done manually per Independent Test criteria for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- Single project structure: `src/`, `tests/` at repository root
- Language: Rust 1.75+
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per plan.md

- [x] T001 Initialize Rust project with cargo and create Cargo.toml with dependencies (midir 0.9, wmidi 4.0, crossterm 0.27, ratatui 0.24, tokio 1.35, audio_thread_priority 0.3, uuid 1.6, rand 0.8)
- [x] T002 Create module directory structure: src/models/, src/engine/, src/generator/, src/visualizer/, src/cli/
- [x] T003 [P] Create module declaration files: src/models/mod.rs, src/engine/mod.rs, src/generator/mod.rs, src/visualizer/mod.rs, src/cli/mod.rs
- [x] T004 [P] Create test directory structure: tests/unit/, tests/integration/, tests/timing/
- [x] T005 [P] Configure cargo fmt and cargo clippy settings in .rustfmt.toml and clippy.toml
- [x] T006 Update src/main.rs with module declarations and basic entry point

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data models and types that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 [P] Implement TimeSignature struct in src/models/time_signature.rs with numerator and denominator fields
- [x] T008 [P] Implement ComplexityLevel enum in src/models/complexity.rs with Simple, Medium, Complex variants
- [x] T009 [P] Implement PlaybackState enum in src/models/playback_state.rs with Stopped, Playing variants
- [x] T010 Implement Pattern struct in src/models/pattern.rs with id, steps, time_signature, subdivision, num_measures, complexity_level, created_at fields
- [x] T011 Add Pattern methods in src/models/pattern.rs: note_positions(), density(), hamming_distance()
- [x] T012 Add Pattern validation in src/models/pattern.rs: validate_steps() checking mandatory downbeat, density range, consecutive limits
- [x] T013 Implement PracticeSession struct in src/models/session.rs with session_id, current_pattern, pattern_history, tempo_bpm, complexity_level, time_signature, playback_state, pattern_revealed, patterns_generated, session_start, last_activity fields
- [x] T014 Implement BeatGrid struct in src/models/beat_grid.rs with time_signature, subdivision, num_measures, position_weights fields
- [x] T015 Add BeatGrid methods in src/models/beat_grid.rs: total_positions(), beat_positions(), position_strength(), seconds_per_position()
- [x] T016 Update src/models/mod.rs to export all types: Pattern, PracticeSession, BeatGrid, TimeSignature, ComplexityLevel, PlaybackState

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Practice Basic Rhythm Recognition (Priority: P1) 🎯 MVP

**Goal**: User launches tool → hears random kick pattern with click track → presses 'r' → sees ASCII visualization

**Independent Test**: Run `cargo run`, listen to pattern loop, press 'r', verify ASCII matches audio (kicks align with beat grid)

### Implementation for User Story 1

- [x] T017 [P] [US1] Implement WeightedGenerator in src/generator/weighted.rs with base_weights_4_4() for default position weights
- [x] T018 [P] [US1] Add WeightedGenerator::generate() method in src/generator/weighted.rs to create Pattern using weighted random generation
- [x] T019 [P] [US1] Implement pattern_to_ascii() function in src/visualizer/ascii.rs to convert Pattern to ASCII string with beat grid format
- [x] T020 [P] [US1] Create MidiEngine struct in src/engine/midi.rs with midir MidiOutputConnection field
- [x] T021 [US1] Implement MidiEngine::new() in src/engine/midi.rs to initialize MIDI output and connect to first available device
- [x] T022 [US1] Implement MidiEngine::send_note_on() and send_note_off() methods in src/engine/midi.rs using wmidi message types
- [x] T023 [US1] Implement pattern_to_midi_events() function in src/engine/timing.rs to convert Pattern to Vec<TimedNote> with kick and click events
- [x] T024 [US1] Implement MidiPlaybackLoop in src/engine/playback.rs for seamless looping with absolute time tracking and sub-10ms accuracy
- [x] T025 [US1] Implement CommandLoop struct in src/cli/commands.rs with terminal raw mode setup using crossterm
- [x] T026 [US1] Add CommandLoop::print_welcome() in src/cli/commands.rs to display startup message, settings, and command help
- [x] T027 [US1] Add CommandLoop::handle_key() in src/cli/commands.rs to process 'r' (reveal) and 'q' (quit) commands
- [x] T028 [US1] Implement 'r' command handler in src/cli/commands.rs: set pattern_revealed flag, call visualizer, display ASCII, continue playback
- [x] T029 [US1] Implement 'q' command handler in src/cli/commands.rs: stop playback, display session summary, cleanup, exit
- [x] T030 [US1] Wire main.rs: parse CLI args (tempo, complexity, time-signature), create PracticeSession, generate first pattern, start MIDI playback thread, enter CommandLoop
- [x] T031 [US1] Add MIDI device error handling in src/engine/midi.rs: graceful error messages if device unavailable, exit with code 1
- [x] T032 [US1] Add SIGINT/Ctrl-C handler in src/main.rs to call quit command gracefully

**Checkpoint**: At this point, User Story 1 (MVP) should be fully functional and testable independently
  - Launch tool → pattern + click track play
  - Press 'r' → ASCII visualization displays
  - Press 'q' → clean exit with summary
  - Verify timing accuracy <10ms via manual listening

---

## Phase 4: User Story 2 - Generate New Practice Patterns (Priority: P2)

**Goal**: User presses 'n' → new random pattern generates and plays seamlessly, different from previous patterns

**Independent Test**: With tool running (US1 complete), press 'n' multiple times, verify each pattern is different (check ASCII after reveal) and playback transitions seamlessly with no gaps

### Implementation for User Story 2

- [x] T033 [US2] Implement uniqueness checking in src/generator/unique.rs: is_pattern_unique() function using Hamming distance ≥ 3
- [x] T034 [US2] Add pattern generation with retry logic in src/generator/weighted.rs: generate_unique() method with max 10 retries, relaxing distance to 2, then 1 if needed
- [x] T035 [US2] Implement PracticeSession::add_to_history() in src/models/session.rs to maintain VecDeque with max 20 patterns, evicting oldest
- [x] T036 [US2] Add 'n' command handler in src/cli/commands.rs: call generate_unique(), add to history, set as current_pattern, reset pattern_revealed, transition MIDI playback
- [x] T037 [US2] Implement seamless pattern transition in src/engine/playback.rs: receive new pattern via channel, swap at loop boundary with no gap
- [x] T038 [US2] Add pattern generation counter in src/cli/commands.rs: increment patterns_generated, display "Pattern #X this session"
- [x] T039 [US2] Add uniqueness failure warning in src/cli/commands.rs: if relaxed constraint used, display "Could not generate sufficiently unique pattern after 10 attempts"

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently
  - MVP (US1) still works: launch, listen, reveal, quit
  - US2 adds: press 'n' → new pattern plays, verify uniqueness via multiple generations

---

## Phase 5: User Story 3 - Adjust Practice Session Settings (Priority: P3)

**Goal**: User adjusts tempo or complexity during session, settings apply to current/future playback and patterns

**Independent Test**: With tool running (US1+US2 complete), press 't' and enter new tempo (e.g., 140), verify playback speed changes immediately. Press 'c' and select complexity (e.g., 3), press 'n', verify new pattern matches complexity (more kicks, syncopation).

### Implementation for User Story 3

- [ ] T040 [P] [US3] Add complexity adjustment to WeightedGenerator in src/generator/weighted.rs: adjust_for_complexity() to modify position weights based on Simple/Medium/Complex
- [ ] T041 [P] [US3] Implement CLI argument parsing in src/main.rs using clap or manual parsing: --tempo, --complexity, --time-signature flags with validation
- [ ] T042 [US3] Add 't' command handler in src/cli/commands.rs: prompt "Enter new tempo (40-300 BPM): ", read line, parse u16, validate range, update session.tempo_bpm
- [ ] T043 [US3] Implement tempo change notification in src/engine/playback.rs: receive new tempo via channel, recalculate TimedNote onset times, apply immediately without stopping
- [ ] T044 [US3] Add tempo validation and error handling in src/cli/commands.rs: non-numeric input, out of range, empty input cancels
- [ ] T045 [US3] Add 'c' command handler in src/cli/commands.rs: display complexity menu (1=Simple, 2=Medium, 3=Complex), wait for single-key input
- [ ] T046 [US3] Implement complexity change in src/cli/commands.rs: update session.complexity_level, display confirmation, note applies to next pattern generation
- [ ] T047 [US3] Add complexity validation in src/cli/commands.rs: invalid choice error, retry prompt max 3 attempts, cancel on failure
- [ ] T048 [US3] Update WeightedGenerator::generate() in src/generator/weighted.rs to use session.complexity_level for weight adjustment

**Checkpoint**: All user stories should now be independently functional
  - US1 (MVP): Launch, listen, reveal, quit
  - US2: Generate new patterns with uniqueness
  - US3: Adjust tempo (immediate effect), adjust complexity (next pattern), verify via listening and reveal

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall quality

- [ ] T049 [P] Add comprehensive error messages in src/engine/midi.rs for Linux (ALSA setup), Windows (WinMM driver), macOS (permissions) per contracts/cli-interface.md
- [ ] T050 [P] Implement session summary statistics in src/cli/commands.rs: calculate duration, patterns_generated, average tempo, display on quit
- [ ] T051 [P] Add timing drift detection in src/engine/playback.rs: track actual vs expected loop times, log warnings if drift >10ms
- [ ] T052 [P] Refactor BeatGrid initialization in src/generator/weighted.rs to support future time signatures (3/4, 6/8) using match on time_signature
- [ ] T053 [P] Add terminal capability detection in src/cli/commands.rs: check for raw mode support, display graceful error if terminal is non-interactive
- [ ] T054 Code cleanup: run cargo fmt on all files, run cargo clippy and address warnings
- [ ] T055 Validate against quickstart.md: create examples/test_midi.rs as described, verify cargo build succeeds, test MIDI output
- [ ] T056 [P] Add inline documentation: doc comments for all public structs, functions, and methods using /// syntax
- [ ] T057 Update README.md with build instructions, usage examples, MIDI setup per platform (macOS/Linux/Windows)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable (uniqueness works with single pattern)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1+US2 but independently testable (tempo/complexity change can be validated immediately)

### Within Each User Story

**User Story 1**:
- T017-T019 (generator, visualizer) can be parallel
- T020-T024 (MIDI engine) sequential: MidiEngine::new() → methods → conversion → playback loop
- T025-T029 (CLI) sequential: CommandLoop setup → welcome → key handling → commands
- T030-T032 (integration) depends on all above

**User Story 2**:
- T033-T034 (uniqueness) must be before T036 (command handler)
- T037 (seamless transition) can be parallel with T033-T036

**User Story 3**:
- T040-T041 (complexity adjustment, arg parsing) can be parallel
- T042-T044 (tempo change) sequential
- T045-T047 (complexity change) sequential

### Parallel Opportunities

- **Phase 1**: T003, T004, T005 can run in parallel
- **Phase 2**: T007, T008, T009 (supporting types) can run in parallel
- **US1**: T017, T018, T019, T020 can start in parallel (generator and MIDI engine are independent initially)
- **US3**: T040 and T041 can run in parallel
- **Polish**: T049, T050, T051, T052, T055, T056 can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch foundational models together:
Task: "Implement TimeSignature struct in src/models/time_signature.rs"
Task: "Implement ComplexityLevel enum in src/models/complexity.rs"
Task: "Implement PlaybackState enum in src/models/playback_state.rs"

# Launch independent US1 components together:
Task: "Implement WeightedGenerator in src/generator/weighted.rs"
Task: "Implement pattern_to_ascii() in src/visualizer/ascii.rs"
Task: "Create MidiEngine struct in src/engine/midi.rs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T016) - CRITICAL
3. Complete Phase 3: User Story 1 (T017-T032)
4. **STOP and VALIDATE**:
   - Run `cargo build` → verify no errors
   - Run `cargo run` → hear pattern + click
   - Press 'r' → see ASCII visualization
   - Verify timing: patterns loop seamlessly, no gaps
   - Press 'q' → clean exit
5. Deploy/demo if ready - this is a usable rhythm practice tool!

### Incremental Delivery

1. **MVP (US1)**: Launch → listen → reveal → quit = 32 tasks
2. **Add Variety (US2)**: Press 'n' for new patterns = +7 tasks (39 total)
3. **Add Customization (US3)**: Adjust tempo/complexity = +9 tasks (48 total)
4. **Polish**: Error handling, documentation, cleanup = +9 tasks (57 total)

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T016)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T017-T032) - MVP critical path
   - **Developer B**: User Story 2 (T033-T039) - can start models/uniqueness after US1 generator done
   - **Developer C**: User Story 3 (T040-T048) - can start complexity weights in parallel
3. Integration: US2 and US3 both integrate with US1's CommandLoop and MidiEngine

However, **recommended approach for single developer**:
- Do US1 completely first (MVP)
- Validate thoroughly
- Then add US2
- Then add US3
- This ensures you always have a working tool

---

## Task Count Summary

- **Total**: 57 tasks
- **Phase 1 (Setup)**: 6 tasks
- **Phase 2 (Foundational)**: 10 tasks
- **Phase 3 (US1 - MVP)**: 16 tasks
- **Phase 4 (US2)**: 7 tasks
- **Phase 5 (US3)**: 9 tasks
- **Phase 6 (Polish)**: 9 tasks

**MVP Scope (US1 only)**: 32 tasks (Setup + Foundational + US1)

**Parallel Opportunities Identified**:
- Phase 1: 3 parallel tasks (T003, T004, T005)
- Phase 2: 3 parallel tasks (T007, T008, T009)
- US1: 4 initial parallel tasks (T017, T018, T019, T020)
- US3: 2 parallel tasks (T040, T041)
- Polish: 7 parallel tasks (T049, T050, T051, T052, T053, T056)

---

## Independent Test Criteria (per User Story)

### User Story 1 (MVP)
- [ ] Launch `cargo run` successfully
- [ ] Hear kick drum pattern playing in seamless loop
- [ ] Hear click track synchronized with pattern (clicks on beats 1, 2, 3, 4)
- [ ] Press 'r' → ASCII visualization displays within 2 seconds
- [ ] ASCII shows kicks aligned with beat positions (e.g., "X--- | X--- | X--- | X---")
- [ ] Verify audio matches ASCII by counting kicks and comparing
- [ ] Press 'q' → playback stops, session summary displays, clean exit

### User Story 2
- [ ] With US1 working, press 'n' multiple times
- [ ] Each press generates a new pattern immediately (no gaps in playback)
- [ ] Patterns sound different from each other
- [ ] Press 'r' after each 'n' → verify ASCII is different (Hamming distance ≥ 3)
- [ ] Generate 10+ patterns → verify 95%+ are unique
- [ ] Pattern counter increments: "Pattern #4 this session"

### User Story 3
- [ ] With US1+US2 working, press 't'
- [ ] Enter new tempo (e.g., "140") → playback speed changes immediately
- [ ] Verify click track matches new tempo (faster/slower)
- [ ] Press 'c' → select complexity (e.g., '3' for Complex)
- [ ] Press 'n' → new pattern has more kicks and syncopation
- [ ] Press 'r' → verify complex pattern has 6-8 kicks with off-beat emphasis
- [ ] Test edge cases: invalid tempo (e.g., "500"), invalid complexity (e.g., '5'), cancel with empty input

---

## Notes

- **[P] tasks** = different files, no dependencies within their group
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **Real-time constraint**: MIDI playback thread must never allocate, use locks, or block
- Commit after each task or logical group (e.g., after implementing a complete struct)
- Stop at any checkpoint to validate story independently
- **Timing validation**: Use manual listening + stopwatch to verify <10ms loop accuracy
- **Cross-platform testing**: Test on macOS first (CoreMIDI built-in), then Linux (ALSA), then Windows (WinMM)

---

## Suggested MVP Scope

**Minimum Viable Product**: User Story 1 only (32 tasks)

This delivers a fully functional rhythm practice tool where users can:
- Launch and hear a random kick drum pattern with click track
- Practice transcribing by ear
- Reveal the pattern to check their work
- Quit cleanly

This is enough to validate the core concept and gather feedback before adding variety (US2) and customization (US3).
