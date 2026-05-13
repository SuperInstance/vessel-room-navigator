# Cocapn Vessel Room Navigator 🚢

**Your boat as a navigable 3D web space** — ScummVM meets Google Street View for a fishing vessel.

Each physical space on the vessel is a "room" — a 3D panoramic webpage. Walk between rooms, warp instantly to any space, monitor cameras, read dashboards, and respond to alarms. Composite rooms mix features from physical rooms into custom displays.

## Quick Start

```bash
# Serve locally
python3 -m http.server 8888
# Open http://localhost:8888 in a browser
```

Or open `index.html` directly (most browsers support local file://).

## Navigation

| Action | Desktop | Mobile |
|--------|---------|--------|
| **Look around** | Drag mouse | Touch drag |
| **Walk to room** | Click wall/door | Tap wall |
| **Quick look direction** | WASD or Arrow keys | Compass buttons |
| **Warp teleport** | Click ⚡ button in side panel | Side panel |
| **Warp by number** | Keys 1-9 | Side panel |
| **Open panel** | ☰ button | ☰ button |

## Rooms

| Room | Type | Description |
|------|------|-------------|
| 🚪 Wheelhouse | physical | Navigation & engine controls |
| 🚪 Galley | physical | Mess & cooking area |
| 🚪 Foredeck | physical | Forward exterior deck |
| 🚪 Aft Cockpit | physical | Work deck & hauling |
| 🚪 Engine Room | physical | Main power & thermal cams |
| 🚪 Wheelhouse Roof | physical | Overhead panorama |
| 🚪 Crow's Nest | physical | Mast lookout, PTZ gunnery |
| 🖥️ Alarm Center | virtual | Composite alarm board |
| 🧩 4-Camera Wall | composite | 2×2 grid of most useful cams |

## Architecture

```
vessel-room-navigator/
├── index.html          # Single-file prototype (Three.js viewer)
├── rooms-config.json   # Room graph & camera definitions
├── docs/
│   └── index.html      # Same viewer, for GH Pages
└── README.md           # This file
```

### Data Model

Each room is defined in `rooms-config.json`:

```json
{
  "wheelhouse": {
    "name": "Wheelhouse",
    "type": "physical",
    "adjacent": ["galley", "wheelhouse_roof", "engine_room"],
    "warp": ["crow_nest", "foredeck", "aft_cockpit"],
    "directions": {
      "fore": {"label": "Forward Window", "camera": "wheelhouse_fwd"},
      "port": {"label": "Port Window", "camera": "wheelhouse_port"}
    },
    "cameras": [...],
    "overlays": [...]
  }
}
```

### Room Types

1. **Physical** — maps 1:1 to a vessel space. Has directions, cameras, adjacency.
2. **Virtual** — software-only space (e.g., alarm center, radio room).
3. **Composite** — aggregates features from physical rooms (e.g., 4-camera wall).

### Key Concepts

- **Rooms are first-class web pages** — each is a URL/bookmarkable
- **Warp is default fast-travel** — instant teleport, no walking animation
- **Compositing is a room type** — not bolted onto physical rooms
- **Cameras are room objects** — a room has cameras, not the other way around
- **Alarms trigger warps** — system routes you to the right room automatically

## Camera System

Cameras are named objects within rooms:

| Feature | Description |
|---------|-------------|
| **PTZ** | Pan/tilt/zoom, interactive controls |
| **Thermal** | Engine monitoring, temp reading |
| **Dashboard** | Gauge overlay, real-time data |
| **Quilted** | Multi-camera 360° stitch |
| **Composite** | Feed from another room's camera |

### Crow's Nest Gunnery Mode

The crow's nest PTZ camera supports a "gunnery" mode:
- Click-drag to aim
- Zoom +/Zoom - buttons
- 🎯 Acquire button (future: auto-track target)
- Reticle overlay on camera feed

## Dashboard Overlays

Each room can have data overlays:

- **Engine Dashboard** — RPM, fuel, temp, trim (bottom overlay in wheelhouse)
- **Nav Display** — heading, speed, depth, wind (top overlay)
- **Engine Monitor** — per-engine temps, exhaust, oil pressure (right overlay)
- **Simplified Nav** — large-font readout for back deck visibility

## Alarm System

- Select a room from the dropdown, click 🚨 TRIGGER ALARM
- Alarm notification pulses at top of screen
- Click notification to **auto-warp** to the alarmed room
- Alarm board room shows all alerts in one composite view

## Warp System

| Trigger | Behavior |
|---------|----------|
| Manual click | Instant teleport via ⚡ button |
| Alarm | Auto-warps to problem room on click |
| Number key | Keys 1-9 warp to rooms in order |
| All rooms list | Click any room name |

## Planned Phases

### Phase 2 — Live Camera Feeds
- RTSP/RTMP → WebRTC transcoding pipeline
- Real MJPG snapshots from physical cameras
- FFmpeg-based stream relay

### Phase 3 — Real Data Integration
- NMEA 2000 gauge data (RPM, fuel, temp real values)
- AIS overlay on compass/camera views
- GPS position via WebSocket

### Phase 4 — Fleet Deployment
- Camera presets per room
- Voice command integration ("go to crow's nest")
- Multi-vessel support
- Remote access from shore

## Design Principles

1. **Boat IS the UI** — no abstract menus, rooms are real spaces
2. **Warp is instant** — no loading screens, sub-200ms transitions
3. **Cameras are room features** — a room has cameras, not the other way around
4. **Composites are rooms** — not lego blocks, first-class entities
5. **Alarms route you** — system takes you where you need to be

## Tech Stack

- **Three.js** — 3D rendering (CDN, no build step)
- **CSS2DRenderer** — labels and overlays
- **Modular JS** — ES modules, importmap
- **No build step** — open in any browser

## License

Cocapn — Keeper fleet infrastructure
