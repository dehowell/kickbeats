# Kickbeats Web Application

A web-based rhythm practice tool for musicians to improve their ability to identify kick drum patterns by ear.

## Features

- **Pattern Generation**: Randomly generated kick drum patterns with adjustable complexity
- **Interactive Playback**: Play/pause control with count-in
- **Pattern Revelation**: Show/hide rhythm notation
- **Tempo Control**: Adjust playback speed from 40-300 BPM with keyboard shortcuts
- **Complexity Levels**: Simple, Medium, and Complex pattern difficulty
- **Multiple Time Signatures**: Support for 4/4, 3/4, 6/8, 2/4, and 5/4 time
- **PWA Support**: Install as a Progressive Web App with offline capability
- **Cross-Platform**: Works on desktop, tablet, and mobile devices
- **Keyboard Shortcuts**: Full keyboard navigation support

## Requirements

- Modern web browser with Web Audio API support:
  - Chrome 34+
  - Firefox 25+
  - Safari 14.1+
  - Edge 79+
- JavaScript enabled
- For offline mode: Service Worker support

## Development

### Prerequisites

- Node.js 18+ and npm
- Git

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Build for Production

```bash
# Type check and build
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
web/
├── src/
│   ├── audio/          # Web Audio API integration
│   │   ├── AudioEngine.ts
│   │   ├── AudioScheduler.ts
│   │   └── SoundSynthesis.ts
│   ├── generator/      # Pattern generation logic
│   │   ├── PatternGenerator.ts
│   │   └── WeightCalculator.ts
│   ├── models/         # Data models
│   │   ├── BeatGrid.ts
│   │   ├── Pattern.ts
│   │   ├── Session.ts
│   │   └── types.ts
│   ├── storage/        # IndexedDB persistence
│   │   └── SessionStorage.ts
│   ├── ui/             # User interface
│   │   ├── components/
│   │   ├── controllers/
│   │   └── styles/
│   ├── utils/          # Utilities
│   │   ├── BrowserCompatibility.ts
│   │   ├── KeyboardHandler.ts
│   │   └── VisibilityHandler.ts
│   └── main.ts         # Application entry point
├── public/             # Static assets
│   ├── icons/
│   └── manifest.webmanifest
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Keyboard Shortcuts

- **Space**: Play/Pause
- **N**: Generate new pattern
- **R**: Reveal/hide pattern notation
- **↑**: Increase tempo by 5 BPM
- **↓**: Decrease tempo by 5 BPM

## Browser Compatibility

The application automatically detects browser capabilities and provides appropriate warnings or fallbacks for:

- Web Audio API support
- IndexedDB availability
- Service Worker support (for PWA features)
- Touch vs mouse input

### Known Limitations

- **iOS Safari**: Audio requires user interaction to start
- **Firefox**: Some audio context behaviors may differ slightly
- **Older browsers**: ES6 features required (const/let, arrow functions, async/await)

## PWA Installation

### Desktop

1. Look for the install icon in the browser address bar
2. Click "Install Kickbeats"
3. App will open in standalone window

### Mobile (iOS)

1. Open in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

### Mobile (Android)

1. Open in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home Screen"
4. Tap "Add"

## Accessibility

- Full keyboard navigation
- ARIA labels for screen readers
- High contrast UI
- Touch target sizes meet WCAG guidelines (minimum 44x44px)
- Reduced motion support via prefers-reduced-motion

## Performance

- Look-ahead audio scheduling for precise timing
- Lazy loading of audio modules
- Service worker caching for offline performance
- Optimized bundle size (~60KB)

## Contributing

This is the web implementation of the Kickbeats CLI tool. See the main repository README for contribution guidelines.

## License

See LICENSE file in the repository root.

## Support

For issues or questions, please file an issue at: https://github.com/dehowell/kickbeats/issues
