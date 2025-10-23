# Quickstart Guide: Web-Based Rhythm Practice Application

**Feature**: 002-web-audio-app
**Date**: 2025-10-23

## Prerequisites

- **Node.js**: 18.x or later
- **npm** or **yarn**: Latest stable version
- **Modern browser**: Chrome 35+, Firefox 25+, Safari 14.1+, or Edge 79+
- **TypeScript**: 5.x (installed via npm)

## Initial Setup

### 1. Install Dependencies

```bash
cd web/
npm install
```

**Key Dependencies**:
- `typescript` - TypeScript compiler
- `vite` - Build tool and dev server
- `vite-plugin-pwa` - PWA support for Vite
- `vitest` - Unit test framework
- `@playwright/test` - E2E testing framework

**Dev Dependencies**:
```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0",
    "vitest": "^1.0.0",
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.10.0"
  }
}
```

### 2. Configure TypeScript

The project uses `tsconfig.json` for TypeScript configuration:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 3. Configure Vite

The project uses `vite.config.ts` for build configuration:

```typescript
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Kickbeats - Rhythm Practice',
        short_name: 'Kickbeats',
        description: 'Practice rhythm patterns by ear',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

## Development Workflow

### Running the Dev Server

```bash
npm run dev
```

This starts Vite dev server with:
- Hot Module Replacement (HMR)
- Fast TypeScript compilation
- PWA service worker in development mode
- Default: http://localhost:5173

### Building for Production

```bash
npm run build
```

Output: `dist/` directory with optimized bundles

**Build includes**:
- TypeScript compilation
- Bundle minification and tree-shaking
- Service worker generation
- PWA manifest generation
- Source maps (optional)

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally for testing.

## Testing

### Unit Tests (Vitest)

Run all unit tests:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

**Test Structure**:
```
tests/unit/
├── models/
│   ├── Pattern.test.ts
│   ├── BeatGrid.test.ts
│   └── Session.test.ts
├── audio/
│   ├── AudioEngine.test.ts
│   └── AudioScheduler.test.ts
└── generator/
    └── PatternGenerator.test.ts
```

**Example Unit Test**:
```typescript
import { describe, it, expect } from 'vitest';
import { Pattern } from '@/models/Pattern';

describe('Pattern', () => {
  it('calculates density correctly', () => {
    const steps = [true, false, false, false, true, false, false, false];
    const pattern = new Pattern(steps, { numerator: 4, denominator: 4 }, 'simple');
    expect(pattern.density()).toBe(0.25);
  });
});
```

### E2E Tests (Playwright)

Install Playwright browsers (first time only):
```bash
npx playwright install
```

Run e2e tests:
```bash
npm run test:e2e
```

Run e2e tests with UI:
```bash
npm run test:e2e:ui
```

**Test Structure**:
```
tests/e2e/
├── practice-workflow.spec.ts
├── pwa-install.spec.ts
└── offline-mode.spec.ts
```

**Example E2E Test**:
```typescript
import { test, expect } from '@playwright/test';

test('practice workflow', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Click play button
  await page.click('[data-testid="play-button"]');

  // Wait for audio to start
  await expect(page.locator('[data-testid="play-button"]')).toHaveText('⏸ Pause');

  // Generate new pattern
  await page.click('[data-testid="new-pattern-button"]');

  // Reveal pattern
  await page.click('[data-testid="reveal-button"]');
  await expect(page.locator('[data-testid="pattern-notation"]')).toBeVisible();
});
```

## PWA Testing

### Testing PWA on Desktop

1. Build production version: `npm run build`
2. Serve locally: `npm run preview`
3. Open Chrome DevTools → Application → Service Workers
4. Verify service worker is registered
5. Go offline (DevTools → Network → Offline)
6. Reload page - should work offline

### Testing PWA on Mobile

#### iOS Safari

1. Deploy to HTTPS server (requirement for PWA)
2. Open in Safari on iOS device
3. Tap Share button → "Add to Home Screen"
4. Launch from home screen icon
5. Test offline mode by enabling Airplane Mode

#### Android Chrome

1. Deploy to HTTPS server
2. Open in Chrome on Android device
3. Chrome will show "Add to Home Screen" prompt automatically
4. Or: Menu → "Add to Home Screen"
5. Launch from home screen icon
6. Test offline mode by enabling Airplane Mode

**Testing Checklist**:
- [ ] App loads in standalone mode (no browser UI)
- [ ] All features work offline after first load
- [ ] Audio playback works
- [ ] Pattern generation works
- [ ] Settings persist across launches
- [ ] App icon appears correctly in app switcher
- [ ] Update mechanism works when new version deployed

### Local HTTPS for PWA Testing

PWA requires HTTPS. For local testing:

```bash
# Install mkcert for local SSL certificates
brew install mkcert  # macOS
# or
choco install mkcert  # Windows

# Create local CA
mkcert -install

# Create certificate for localhost
mkcert localhost 127.0.0.1 ::1

# Update vite.config.ts
export default defineConfig({
  server: {
    https: {
      key: './localhost-key.pem',
      cert: './localhost.pem'
    }
  }
});
```

## Project Structure

```
web/
├── public/                    # Static assets
│   ├── manifest.json          # PWA manifest (generated)
│   ├── sw.js                  # Service worker (generated)
│   ├── index.html             # Entry HTML
│   └── icons/                 # App icons
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── models/                # Data models (ported from Rust)
│   │   ├── Pattern.ts
│   │   ├── BeatGrid.ts
│   │   ├── Session.ts
│   │   └── types.ts
│   ├── audio/                 # Web Audio API
│   │   ├── AudioEngine.ts
│   │   ├── AudioScheduler.ts
│   │   └── SoundSynthesis.ts
│   ├── generator/             # Pattern generation
│   │   ├── PatternGenerator.ts
│   │   └── WeightCalculator.ts
│   ├── ui/                    # UI components
│   │   ├── components/
│   │   ├── controllers/
│   │   └── styles/
│   ├── storage/               # IndexedDB
│   │   └── SessionStorage.ts
│   ├── utils/                 # Utilities
│   │   ├── KeyboardHandler.ts
│   │   └── VisibilityHandler.ts
│   ├── sw/                    # Service worker source
│   │   └── service-worker.ts
│   └── main.ts                # Entry point
├── tests/
│   ├── unit/                  # Vitest tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # Playwright tests
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite config
├── playwright.config.ts       # Playwright config
├── package.json               # Dependencies
└── README.md                  # Project documentation
```

## Debugging

### Browser DevTools

**Chrome DevTools**:
- **Application tab**: Service worker, manifest, storage
- **Console**: TypeScript source maps work automatically
- **Network tab**: Verify caching, offline mode
- **Performance tab**: Audio timing analysis

**Useful Commands**:
```javascript
// In browser console
// Check audio context state
window.audioContext?.state

// Check service worker
navigator.serviceWorker.controller

// Check storage usage
navigator.storage.estimate()
```

### VSCode Configuration

**Recommended Extensions**:
- ESLint
- Prettier
- TypeScript Vue Plugin
- Playwright Test for VSCode

**.vscode/launch.json** for debugging:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/web/src"
    }
  ]
}
```

## Performance Optimization

### Bundle Size Analysis

```bash
npm run build -- --mode=analyze
```

### Performance Monitoring

Add performance marks:
```typescript
performance.mark('pattern-generation-start');
const pattern = generator.generate(complexity, timeSignature);
performance.mark('pattern-generation-end');
performance.measure('pattern-generation', 'pattern-generation-start', 'pattern-generation-end');
```

View in DevTools → Performance tab.

## Deployment

### Prerequisites

- **HTTPS**: Required for PWA
- **Server configuration**: Proper MIME types and caching headers

### Build and Deploy

```bash
# Build production bundle
npm run build

# Deploy dist/ directory to hosting provider
# Examples: Netlify, Vercel, GitHub Pages, Firebase Hosting
```

### Server Configuration

**Required headers**:
```
# Enable CORS for manifest
Access-Control-Allow-Origin: *

# Cache static assets
Cache-Control: public, max-age=31536000, immutable  # For hashed assets
Cache-Control: no-cache  # For HTML and manifest

# Proper MIME types
.js   -> application/javascript
.css  -> text/css
.json -> application/json
.webmanifest -> application/manifest+json
```

**Service Worker Scope**:
- Service worker must be served from root or above app scope
- Don't cache service worker itself

## Troubleshooting

### Service Worker Not Registering

- Verify HTTPS (required in production)
- Check browser console for errors
- Clear browser cache and hard reload
- Check service worker scope in manifest

### Audio Not Playing

- Verify user gesture (autoplay policy)
- Check AudioContext state (suspended → running)
- Test with simple AudioContext test:
```typescript
const ctx = new AudioContext();
const osc = ctx.createOscillator();
osc.connect(ctx.destination);
osc.start(ctx.currentTime);
osc.stop(ctx.currentTime + 0.1);
```

### IndexedDB Errors

- Check browser compatibility
- Verify quota (may be full)
- Test in incognito mode (clean state)

### PWA Not Installing

- Verify manifest is valid (use Chrome DevTools → Application → Manifest)
- Check all required fields present
- Verify icons exist and are correct sizes
- Ensure HTTPS in production

## Next Steps

1. **Complete Phase 1**: Review data model and contracts
2. **Generate tasks**: Run `/speckit.tasks` to create implementation tasks
3. **Start development**: Begin with P1 user stories (pattern playback, controls, PWA)
4. **Test continuously**: Write tests alongside implementation
5. **Deploy early**: Get PWA on test device ASAP for real-world testing

## References

- [Web Audio API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
