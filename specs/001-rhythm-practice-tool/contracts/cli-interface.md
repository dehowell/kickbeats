# CLI Interface Contract: Rhythm Practice Tool

**Feature**: 001-rhythm-practice-tool
**Date**: 2025-10-18
**Phase**: Phase 1 - Design

## Overview

This document specifies the command-line interface for the rhythm practice tool. The tool operates in an interactive session mode where users launch the application, which immediately begins playback, and then issue commands via single-key input.

---

## Interface Mode

**Mode**: Interactive Terminal Session

The tool runs as a foreground process with:
- Continuous MIDI playback in background thread
- Non-blocking keyboard input via terminal
- Real-time command processing
- Visual feedback via terminal output

---

## Launch Command

### `kickbeats` (or `kickbeats practice`)

Launches the practice session with default settings.

**Usage**:
```bash
kickbeats [OPTIONS]
```

**Options**:

| Flag | Long Form | Type | Default | Description |
|------|-----------|------|---------|-------------|
| `-t` | `--tempo` | u16 | 120 | Tempo in BPM (40-300) |
| `-c` | `--complexity` | enum | medium | Pattern complexity: simple, medium, complex |
| `-s` | `--time-signature` | string | "4/4" | Time signature (e.g., "4/4", "3/4", "6/8") |
| `-h` | `--help` | - | - | Display help message |
| `-v` | `--version` | - | - | Display version information |

**Examples**:
```bash
# Launch with defaults (120 BPM, medium complexity, 4/4 time)
kickbeats

# Launch at slower tempo with simple patterns
kickbeats -t 80 -c simple

# Launch with complex patterns in 3/4 time
kickbeats --tempo 140 --complexity complex --time-signature "3/4"
```

**Behavior on Launch**:
1. Initialize MIDI output (or display error if unavailable)
2. Generate first random pattern
3. Begin playback immediately (pattern + click track)
4. Display welcome message and command help
5. Enter interactive command loop

**Success Output**:
```
Kickbeats - Rhythm Practice Tool v0.1.0
======================================

Settings:
  Tempo: 120 BPM
  Complexity: Medium
  Time Signature: 4/4

MIDI Output: Connected to [Device Name]

♪ Playing pattern... (pattern hidden)

Commands:
  [r] Reveal pattern
  [n] New pattern
  [t] Change tempo
  [c] Change complexity
  [q] Quit

Press any command key...
```

**Error Output**:
```
Error: No MIDI output device available

Please ensure:
  - A MIDI device is connected or a virtual MIDI device exists
  - You have permission to access MIDI devices

On macOS: Use built-in CoreMIDI (no setup required)
On Linux: Ensure ALSA is configured
On Windows: Ensure WinMM or a MIDI driver is installed

Exiting.
```

**Exit Codes**:
- `0`: Successful execution (user quit normally)
- `1`: MIDI device error
- `2`: Invalid arguments
- `3`: Other runtime error

---

## Interactive Commands

Once the session is running, users issue single-key commands (no Enter required).

### `r` - Reveal Pattern

Displays the ASCII visualization of the currently playing pattern.

**Input**: Single key press: `r`

**Preconditions**:
- Session is active
- Pattern is currently playing

**Behavior**:
1. Set `session.pattern_revealed = true`
2. Generate ASCII visualization from `current_pattern`
3. Display pattern with beat grid
4. Continue playback

**Success Output**:
```
Revealed pattern:

Beat:    1       2       3       4
        ---- | ---- | ---- | ----
Kick:   X--X | --X- | X--- | X-X-

♪ Still playing... Press [n] for new pattern, [q] to quit.
```

**Edge Cases**:
- If already revealed: Display again (idempotent)
- If pattern is None: Display "No pattern playing" (shouldn't happen in normal flow)

---

### `n` - New Pattern

Generates and plays a new random pattern.

**Input**: Single key press: `n`

**Preconditions**: Session is active

**Behavior**:
1. Generate new pattern with current settings (tempo, complexity, time signature)
2. Validate uniqueness against `pattern_history` (Hamming distance ≥ 3)
3. If not unique, retry up to 10 times with slight weight adjustments
4. Add to `pattern_history`, set as `current_pattern`
5. Set `pattern_revealed = false`
6. Seamlessly transition MIDI playback to new pattern
7. Increment `patterns_generated` counter

**Success Output**:
```
Generating new pattern...

♪ Playing new pattern... (pattern hidden)

Pattern #4 this session.

Commands: [r] Reveal | [n] New | [t] Tempo | [c] Complexity | [q] Quit
```

**Error Output** (if generation fails after 10 retries):
```
Warning: Could not generate sufficiently unique pattern after 10 attempts.
Using pattern with relaxed uniqueness constraint.

♪ Playing new pattern... (pattern hidden)
```

**Edge Cases**:
- First pattern of session: No uniqueness check needed (history empty)
- 20+ patterns generated: Oldest pattern evicted from history
- Generation failure: Relax Hamming distance to 2, then 1, then accept any valid pattern

---

### `t` - Change Tempo

Prompts user to enter a new tempo and applies it immediately.

**Input**:
1. Single key press: `t`
2. Then: Multi-character input followed by Enter (e.g., "140\n")

**Preconditions**: Session is active

**Behavior**:
1. Pause to display prompt: "Enter new tempo (40-300 BPM): "
2. Read line input from stdin
3. Parse as u16
4. Validate range (40-300)
5. If valid: Update `session.tempo_bpm`, adjust MIDI timing immediately
6. If invalid: Display error, keep current tempo
7. Resume playback at new tempo

**Success Output**:
```
Enter new tempo (40-300 BPM): 140
✓ Tempo changed to 140 BPM

♪ Playing at 140 BPM...
```

**Error Output**:
```
Enter new tempo (40-300 BPM): 350
✗ Invalid tempo: 350. Must be between 40 and 300 BPM.

Tempo remains 120 BPM.

♪ Continuing playback...
```

**Edge Cases**:
- Non-numeric input: "Invalid input. Please enter a number."
- Empty input (just Enter): Cancel operation, keep current tempo
- Negative number: Treat as error

---

### `c` - Change Complexity

Prompts user to select a new complexity level.

**Input**:
1. Single key press: `c`
2. Then: Single key selection: `1` (simple), `2` (medium), `3` (complex)

**Preconditions**: Session is active

**Behavior**:
1. Display menu:
   ```
   Select complexity:
   [1] Simple   - 2-4 kicks, mostly on-beats
   [2] Medium   - 4-6 kicks, balanced rhythm
   [3] Complex  - 6-8 kicks, high syncopation

   Choice (1-3):
   ```
2. Wait for single-key input (1, 2, or 3)
3. Update `session.complexity_level`
4. Display confirmation
5. Resume command loop (current pattern continues, new complexity applies to next pattern)

**Success Output**:
```
Select complexity:
[1] Simple   - 2-4 kicks, mostly on-beats
[2] Medium   - 4-6 kicks, balanced rhythm
[3] Complex  - 6-8 kicks, high syncopation

Choice (1-3): 3

✓ Complexity changed to Complex

Current pattern will continue. Press [n] to generate new pattern with complex difficulty.

♪ Continuing playback...
```

**Error Output**:
```
Choice (1-3): 5

✗ Invalid choice. Please enter 1, 2, or 3.

Complexity remains Medium.
```

**Edge Cases**:
- Non-numeric or out-of-range: Display error, retry prompt (max 3 attempts)
- Cancel (Esc or empty input): Keep current complexity
- After 3 failed attempts: Automatically cancel and return to main loop

---

### `q` - Quit

Exits the practice session gracefully.

**Input**: Single key press: `q`

**Preconditions**: Session is active

**Behavior**:
1. Stop MIDI playback immediately
2. Display session summary
3. Clean up MIDI resources
4. Exit program with code 0

**Output**:
```
Stopping playback...

Session Summary:
  Duration: 5 minutes 32 seconds
  Patterns practiced: 7
  Average tempo: 128 BPM

Thanks for practicing! Keep those rhythms tight. 🥁

Goodbye!
```

**Edge Cases**:
- Ctrl-C (SIGINT): Same as `q` command (graceful shutdown via signal handler)
- Unexpected termination: Attempt cleanup in Drop implementation

---

## Error Handling

### MIDI Device Errors During Session

If MIDI output fails during playback (device disconnected, etc.):

**Behavior**:
1. Catch error in real-time thread
2. Send error message to UI thread
3. Stop playback gracefully
4. Display error to user
5. Offer options: retry or quit

**Output**:
```
✗ MIDI Error: Device disconnected or unavailable

Options:
  [r] Retry connection
  [q] Quit application

Choice:
```

If user chooses retry:
- Attempt to reconnect to MIDI device
- If successful: Resume playback of current pattern
- If failed: Display error again with quit option only

---

## ASCII Pattern Visualization Format

Detailed specification for the `[r]` reveal command output.

### Basic Format (4/4 Time, 1 Measure)

```
Beat:    1       2       3       4
        ---- | ---- | ---- | ----
Kick:   X--X | --X- | X--- | X-X-
```

**Legend**:
- `X` = Kick drum hit
- `-` = Rest (no hit)
- `|` = Beat delimiter
- Numbers = Beat numbers

**Structure**:
- Row 1: Beat numbers (aligned above each group of 4 positions)
- Row 2: Grid lines (visual separation of beats)
- Row 3: Kick pattern (X and - representing steps)

### Alternative Representations

**Compact format** (single line, for narrow terminals):
```
[1---][2-X-][3X--][4--X] (X = kick, - = rest)
```

**Verbose format** (with position numbers):
```
Position: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
Beat:     |--1--|  |--2--|  |--3--|  |--4--|
Kick:     X  -  -  X  -  -  X  -  X  -  -  -  X  -  X  -
```

**Recommended**: Basic format (first example) for clarity and readability

### Multi-Measure Patterns

For patterns spanning multiple measures (future enhancement):

```
Measure 1:
Beat:    1       2       3       4
        ---- | ---- | ---- | ----
Kick:   X--X | --X- | X--- | X-X-

Measure 2:
Beat:    1       2       3       4
        ---- | ---- | ---- | ----
Kick:   X--- | X--- | --X- | ---X
```

---

## Input/Output Protocols

### Standard Streams

- **stdin**: Command input (non-blocking in raw mode)
- **stdout**: All output (info messages, visualizations, prompts)
- **stderr**: Error messages and warnings

### Terminal Requirements

- **Raw mode**: Enable for single-key commands (no Enter needed)
- **Non-canonical mode**: Disable line buffering
- **Echo off**: Don't display key presses for single-key commands
- **Restore on exit**: Return terminal to original mode

### Color Support (Optional Enhancement)

If terminal supports ANSI colors:
- Kicks (`X`): Bold or colored (e.g., cyan)
- Beat 1 downbeat: Highlighted or different color
- Error messages: Red
- Success messages: Green
- Prompts: Yellow or default

Fallback: Plain ASCII (no colors) for compatibility

---

## Contract Summary

### Entry Point
```
kickbeats [--tempo BPM] [--complexity LEVEL] [--time-signature SIG]
```

### Interactive Commands (Single-Key)
- `r`: Reveal current pattern
- `n`: Generate new pattern
- `t`: Change tempo (prompts for input)
- `c`: Change complexity (prompts for input)
- `q`: Quit session

### Output Formats
- Startup: Settings + device info + command help
- Reveal: ASCII pattern visualization
- Status: Real-time playback indicators
- Errors: Clear error messages with recovery options
- Exit: Session summary

### Error Codes
- `0`: Success
- `1`: MIDI error
- `2`: Invalid arguments
- `3`: Runtime error

---

**Document Status**: Complete
**Implementation Note**: This contract defines the user-facing interface. Implementation details (e.g., exact MIDI message formats, internal event loop structure) are not part of this contract and may vary.
