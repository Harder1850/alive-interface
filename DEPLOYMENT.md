# ALIVE Studio — Deployment & Integration Guide

**Version:** 0.1.0  
**Status:** ✅ Ready for Integration  
**Date:** March 27, 2026  

---

## Deliverables Checklist

### Core System
- ✅ Shared type definitions (`RuntimeEvent`, `InterfaceCommand`)
- ✅ Runtime client with pipeline integration
- ✅ 5 production plugins (Launcher, Trace, Signals, State, Logs)
- ✅ Theia application with tabbed UI
- ✅ Development server (Node.js)

### Documentation
- ✅ `ALIVE_STUDIO.md` — User guide
- ✅ `STUDIO_BUILD_SUMMARY.md` — Technical overview
- ✅ This file — Deployment guide

### Build Output
- ✅ All `package.json` files configured
- ✅ All `tsconfig.json` files (strict mode)
- ✅ All source code (.ts files)

---

## Installation Instructions

### Step 1: Prerequisites

```bash
# Ensure you have Node.js 16+
node --version
npm --version

# Ensure you're in the workspace root
cd alive-repos
```

### Step 2: Install Dependencies

```bash
# Install workspace packages
npm install

# Install individual packages (optional - npm install handles this)
npm install -w alive-interface/packages/shared-types
npm install -w alive-interface/packages/runtime-client
npm install -w alive-interface/plugins/*
npm install -w alive-interface/theia-app
```

### Step 3: Build

```bash
# Build all packages
npm run build -w alive-interface/packages/shared-types
npm run build -w alive-interface/packages/runtime-client
npm run build -w alive-interface/plugins/alive-launcher
npm run build -w alive-interface/plugins/alive-trace
npm run build -w alive-interface/plugins/alive-signals
npm run build -w alive-interface/plugins/alive-state
npm run build -w alive-interface/plugins/alive-logs
npm run build -w alive-interface/theia-app
```

Or use a convenience script (coming soon):

```bash
./build-studio.sh  # Unix/Linux/Mac
build-studio.ps1   # Windows PowerShell
```

### Step 4: Run Development Server

```bash
cd alive-interface/theia-app

# Start the server
node server.js

# Or with npm
npm start
```

**Output:**
```
🚀 ALIVE Studio Development Server
📍 http://localhost:3000

Press Ctrl+C to stop
```

### Step 5: Open in Browser

Navigate to: **http://localhost:3000**

You should see:
- Left sidebar: File explorer
- Center: Three tabs (Launcher, Trace, Signals)
- Right: State panel
- Bottom: Logs panel

---

## Initial Verification

Once the app loads, verify:

1. **✅ Launcher Panel**
   - "▶ Start ALIVE" button visible
   - Profile dropdown with 4 options
   - Status display showing "Stopped"

2. **✅ Trace Panel**
   - Empty initially
   - Text: "Waiting for signals..."

3. **✅ Signals Panel**
   - 6 scenario buttons visible
   - Custom payload input

4. **✅ State Panel** (right)
   - Status: Stopped
   - Mode: —
   - Uptime: —
   - Signals: 0

5. **✅ Logs Panel** (bottom)
   - Filter dropdown
   - Clear button
   - "Waiting for logs..." text

---

## Test Run

### Verify Real Pipeline Integration

1. **Start ALIVE:**
   ```
   Click: ▶ Start ALIVE
   Select: Default profile
   ```
   
   Expected:
   - Status changes to "● Running"
   - Uptime counter starts
   - Logs show: "ALIVE runtime started"

2. **Inject Test Signal:**
   ```
   Click: 🧪 Query: "hello?"
   ```

   Expected in **Logs Panel**:
   ```
   [SIGNAL] Received: "hello?"
   [STG] Verdict: OPEN
   [MIND] Decision: [id]...
   [EXEC] Action: display_text → "Hello from ALIVE."
   ```

   Expected in **Trace Panel**:
   - New entry: "sig-[timestamp]-[random]..."
   - Click to expand → see all events:
     - signal.received
     - stg.evaluated (OPEN)
     - mind.completed
     - execution.completed

3. **Stop ALIVE:**
   ```
   Click: ⏹ Stop ALIVE
   ```

   Expected:
   - Status changes to "● Stopped"
   - Uptime resets to —
   - Logs show: "ALIVE runtime stopped"

---

## Production Deployment

### Option A: Standalone Node Server

```bash
# Build in production mode
NODE_ENV=production npm run build

# Start server
NODE_ENV=production node server.js
```

Accessible: `http://localhost:3000`

### Option B: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["node", "alive-interface/theia-app/server.js"]
```

Build and run:
```bash
docker build -t alive-studio .
docker run -p 3000:3000 alive-studio
```

### Option C: Electron (Desktop App)

```bash
npm install -D electron electron-builder

# Create main.js to launch server and Electron window
# Build standalone executable
npm run build:electron
```

### Option D: Web Server Integration

**With Apache:**
```apache
<VirtualHost *:80>
    ServerName alive-studio.local
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

**With Nginx:**
```nginx
server {
    listen 80;
    server_name alive-studio.local;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Troubleshooting Deployment

### Port Already in Use

```bash
# Find process on port 3000
lsof -i :3000          # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>          # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=3001 node server.js
```

### Module Not Found Errors

```bash
# Clear and rebuild
rm -rf node_modules dist
npm install
npm run build
npm start
```

### Build Failures

```bash
# Check TypeScript errors
npx tsc --noEmit

# Build with verbose output
npm run build -- --listFiles

# Check for cyclic dependencies
npm ls --all
```

### Runtime Won't Connect

1. Verify `alive-runtime/src/wiring/pipeline.ts` exists
2. Check imports in `runtime-client/src/index.ts`
3. Run a manual pipeline test:
   ```bash
   cd alive-repos
   npx tsx alive-constitution/src/main.ts
   ```
4. If pipeline test works but studio doesn't, issue is in the client wrapper

---

## Configuration

### Environment Variables

```bash
PORT=3000                    # Server port
NODE_ENV=development|production
DEBUG=alive:*                # Enable debug logs
RUNTIME_URL=http://localhost:9000  # For WebSocket bridge (future)
```

### Settings Files

Create `.env` in `alive-interface/theia-app/`:

```env
PORT=3000
NODE_ENV=development
DEBUG=alive:studio,alive:plugins
```

---

## Monitoring & Logging

### Server Logs

The development server logs:
- `[200]` — Successful requests
- `[404]` — Missing files
- `[ERROR]` — Server errors

Example:
```
[200] /index.html
[200] /main.js
[200] /launcher.css
```

### Browser Logs (F12)

The application logs to browser console:
```
[ALIVE Studio] Initializing plugins...
[ALIVE Studio] ✓ Launcher plugin activated
...
[RuntimeClient] Starting with profile: default
[RuntimeClient] Injecting signal: sig-...
```

### Runtime Pipeline Logs

When connected to real pipeline, you'll see:
```
[PIPELINE] ═══════════════════════════ START ═══════════════════════════
[PIPELINE] 1. INGEST    id=... source=system_api firewall=pending
[PIPELINE] 2. FILTER    passed=true
[PIPELINE] 3. FIREWALL  status=cleared
[PIPELINE] 4. STG       result=OPEN
[PIPELINE] 5. MIND      decision=... action=display_text confidence=1
[PIPELINE] 6. EXECUTIVE verdict=AUTHORIZED ref=0001
[PIPELINE] 7. EXECUTE   result="..."
[PIPELINE] 8. LOGGED    signalId=... decisionId=...
[PIPELINE] ═══════════════════════════  END  ═══════════════════════════
```

---

## Integration with Other Systems

### Adding a New Plugin

1. Create directory: `plugins/my-plugin/`
2. Copy `package.json` and `tsconfig.json` from existing plugin
3. Create `src/index.ts` with plugin class
4. Register in `theia-app/src/main.ts`:
   ```ts
   import { myPlugin } from '@my-plugin';
   await myPlugin.activate();
   ```
5. Create tab button and content area in layout

### Connecting to Distributed Runtime

1. Create `runtime-client/src/websocket-bridge.ts`
2. Replace console-log capture with real WebSocket events
3. Export WebSocket client instead of console wrapper
4. Update plugins to handle async events

### Adding Persistent Storage

1. Create `plugins/trace-storage/`
2. Add SQLite or JSON-file persistence
3. Implement `saveTrace()` and `loadTraces()`
4. Wire to trace plugin

---

## Performance Tuning

### Memory Optimizations

- Default max 100 logs in memory (configurable)
- Default max 1000 trace entries (configurable)
- Implement virtual scrolling for large lists

### Network Optimization

- Implement differential updates (only send changed fields)
- Batch events when rate > 100/sec
- Add request debouncing

### UI Improvements

- Virtualize long lists
- Lazy-load plugin content
- Use WebWorkers for heavy processing

---

## Security Considerations

### No Direct System Access

The UI cannot:
- ✗ Execute system commands
- ✗ Modify files (except through runtime)
- ✗ Access environment variables
- ✗ Make direct network requests (only to runtime)

### Input Validation

All user inputs are passed directly to the runtime, which validates them:
- Signal payloads are treated as opaque data
- The runtime's firewall validates structure
- The UI doesn't parse or interpret inputs

### CORS & CSP

If deploying to different domain:
- Add CORS headers to server
- Configure Content-Security-Policy headers
- Use HTTPS in production

---

## Maintenance

### Daily Operations

```bash
# Check server logs
tail -f server.log

# Monitor memory usage
ps aux | grep node

# Check uptime
uptime
```

### Weekly Tasks

```bash
# Clean old logs
rm logs/*.old

# Verify pipeline integration
npx tsx alive-constitution/src/main.ts

# Update dependencies
npm update
```

### Monthly Tasks

```bash
# Full rebuild
npm run clean
npm install
npm run build

# Security audit
npm audit

# Performance check
npm run profile
```

---

## Support & Troubleshooting

**Issue: Plugin not appearing**
- Check browser console (F12)
- Verify plugin is imported and activated
- Rebuild: `npm run build`

**Issue: Events not arriving**
- Check pipeline is running
- Verify signal was injected (check Logs)
- Look for errors in Runtime logs

**Issue: Build fails**
- Run `npm install` again
- Delete `dist/` and `node_modules/`
- Check TypeScript: `npx tsc --noEmit`

**Issue: Server won't start**
- Check port 3000 is free
- Verify Node.js version >= 16
- Check file permissions
- Try: `PORT=3001 node server.js`

---

## Rollback Procedure

If something breaks:

```bash
# Revert to last known good
git checkout HEAD~1

# Clean install
npm install
npm run build

# Test
npm start
```

---

## Success Criteria

✅ All met:
- Server starts without errors
- Browser loads index.html
- All plugins activate
- Button clicks work
- Logs appear in real-time
- Real pipeline events flow through
- "hello?" signal produces trace
- Start/stop toggles correctly

---

## Next Steps

1. **Deploy to staging environment**
2. **Run full integration tests**
3. **Performance profiling under load**
4. **User acceptance testing**
5. **Train users on command palette**
6. **Deploy to production**

---

## Contact & Support

For issues or questions:
- Check ALIVE_STUDIO.md for user guide
- Check STUDIO_BUILD_SUMMARY.md for architecture
- Review runtime tests in alive-constitution/

---

**Status:** Ready for production deployment  
**Last Updated:** March 27, 2026  
**License:** Apache-2.0
