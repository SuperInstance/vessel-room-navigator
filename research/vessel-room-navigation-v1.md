# Vessel Room Navigation System v1

**Concept:** Casey's fishing vessel as a navigable 3D web space — ScummVM meets Google Street View.

## Core Metaphor

The **boat IS the UI**. Every physical space on the vessel is a "room" — a webpage that is a 3D/panoramic node. Moving between rooms is ScummVM-style point-and-click (or warp). Each room has its own function and interactive elements.

## Room Types

### Physical Rooms (one-to-one with vessel spaces)
- **Foredeck** — exterior forward deck
- **Aft Cockpit** — aft exterior work area
- **Galley** — interior mess/cooking
- **Wheelhouse** — primary navigation/bridge, dashboard of engine controls
- **Wheelhouse Roof** — exterior above wheelhouse
- **Crow's Nest** — mast lookout position

### Composite Rooms (aggregated from physical room features)
- **4-Camera Display Wall** — most useful camera angles in one view
- **Simplified Nav Display (Back Deck)** — large/easy-to-read navigation readout for aft visibility
- **Engine Room (Composite)** — all engine gauges in one virtual space
- **Alarm Warp Room** — dynamically created when alarm fires, auto-shows relevant cameras

### Virtual Rooms (software-only spaces)
- **Radio Room** — comms overlay, frequency management, identification
- **Watch Center** — quilted panorama mode (seamless multi-camera stitching)
- **Alarm Board** — grid of alarm indicators, click-to-warp to problem room

## Navigation Mechanics

### Room Graph
```
Foredeck ←→ Galley ←→ Wheelhouse ←→ Wheelhouse Roof
                     ↓
              Engine Room ←→ Aft Cockpit ←→ Crow's Nest
```

Each room has:
- **Adjacency list** — which rooms you can walk to (point-and-click to adjacent)
- **Warp list** — any room you can teleport to (e.g., "alarm in engine room" from wheelhouse)
- **Directional cameras** — fore/aft/port/starboard panos per room

### Movement
- **Step:** click adjacent room → smooth transition (walking)
- **Warp:** direct teleport to any room (alarm response, quick dash)
- **Pan/zoom:** within a room, look around (Street View style)
- **6-DOF:** fore/aft/port/starboard/up/down per room node

## Camera System

### Camera as Room Object
Every camera in your system is a **named object** in a room:
```
crow's_nest_camera = {
  room: "crow's nest",
  type: "ptz",          // pan/tilt/zoom
  default: "lookout",    // default preset
  modes: {
    lookout: "wide panorama",
    gunnery: "narrow FOV, mouse-aim reticle, click to fire (future)",
    track: "auto-follow detected object"
  }
}
```

### Camera Modes
| Room | Camera | Interaction |
|------|--------|-------------|
| Crow's Nest | PTZ lookup cam | Point-and-zoom like a gunner's station |
| Wheelhouse Roof | 360° panorama | Quilted from directional cameras |
| Aft Cockpit | Work deck cam | Monitor gear, crew |
| Foredeck | Bow cam | Forward lookout, anchor monitoring |
| Engine Room | Thermal/gauge cams | Read gauges remotely |

### Panorama Quilting
When multiple cameras cover different directions from the same room:
- **Normal mode:** each direction is a separate camera feed shown in correct orientation
- **Quilted mode:** software-stitched 360° panorama for quick look
- **Radio overlay mode:** quilted panorama + AIS/radio identification overlaid on contacts

## Interactive Elements Per Room

### Wheelhouse (most complex)
- Dashboard of engine controls (RPM, fuel, temp, trim)
- Navigation displays (chart plotter, radar)
- Alarm indicators
- Radio controls
- Warp buttons to other rooms

### Crow's Nest
- 360° look around + zoom
- Click-to-identify (future: AIS overlay on camera view)
- Reticle mode for gunnery station (future: auto-tracking)

### Aft Cockpit (simplified)
- Reduced nav display (readable from distance — larger fonts, fewer metrics)
- Deck camera feeds
- Winch/gear controls

## Warp System

### Warp Triggers
1. **Manual:** click room name in nav bar → instant teleport
2. **Alarm:** room auto-activates when alarm fires in that space
   - If you're in the galley and engine room alarm fires → warps to wheelhouse (where the engine dashboard is)
   - Warp-to-room for "alarm review" → shows dashboard of affected space
3. **Voice/speech:** "go to crow's nest" → warp
4. **Hotkey:** deck buttons mapped to rooms

### Warp Animation
- Fade out → scene load → fade in (fast, <200ms)
- Room overlay persists briefly showing "Warped: Engine Room"

## Data Model (JSON)

```json
{
  "name": "Wheelhouse",
  "id": "wheelhouse",
  "type": "physical",
  "adjacent": ["galley", "wheelhouse_roof", "engine_room"],
  "warp": ["crow's_nest", "foredeck", "aft_cockpit"],
  "position": { "x": 10, "y": 0, "z": 5 },
  "panoramas": {
    "fore": "cam_wheelhouse_fwd",
    "aft": "cam_wheelhouse_aft",
    "port": "cam_wheelhouse_port",
    "starboard": "cam_wheelhouse_stbd",
    "up": "cam_wheelhouse_roof",
    "down": "cam_wheelhouse_floor"
  },
  "cameras": [
    {
      "id": "wheelhouse_dash",
      "type": "ptz",
      "url": "rtsp://cameras/wheelhouse/dash",
      "label": "Dashboard",
      "interactive": true,
      "default_mode": "read_gauges"
    }
  ],
  "overlays": [
    {
      "type": "dashboard",
      "data": "engine_controls",
      "position": "bottom-overlay"
    },
    {
      "type": "nav_display",
      "data": "chart_plotter", 
      "position": "top-overlay"
    }
  ],
  "alarm_routes": {
    "engine_fire": {
      "warp_to": "engine_room",
      "show": ["thermal_cam", "temp_gauge"]
    }
  }
}
```

## Technology Stack

### Frontend (3D Room Viewer)
- **Three.js** — core 3D rendering for panoramic spheres
- **React/Vue** — UI overlays (dashboards, nav, alarms) — keep it simple
- **WebGL** — panorama rendering via equirectangular projection on sphere interior
- **WebSocket** — real-time camera feed updates
- **Service Worker** — cache room definitions, background preload adjacent rooms

### Backend
- **Room server** — serves room configs (JSON), manages state
- **Camera proxy** — transcodes RTSP/RTMP to WebRTC/MJPEG for browser
- **Warp bus** — event system for warp triggers (alarms, voice commands)

### Camera Ingestion
- **FFmpeg** on server — restream RTSP cameras as adaptive WebRTC
- Or use **Janus/MediaSoup** for WebRTC gateway
- For static pano: capture periodic equirectangular stills, serve as cubes

## Room Types (Extended)

### 1. Single Camera Room
The simplest room — one camera to one equirectangular panorama sphere.
- **Interaction:** look around, zoom
- **Example:** crow's nest with one PTZ

### 2. Multi-Camera Panorama Room
Multiple directional cameras quilted into one 360° view.
- **Tile approach:** each camera direction mapped to a face of the cube map
- **Stitching:** simple edge overlap or software-stitched equirectangular
- **Example:** wheelhouse roof with 4 directional cameras

### 3. Dashboard Room
Camera feeds + data overlays. Informational rather than navigable.
- **Example:** 4-camera display wall
- **Example:** simplified nav display

### 4. Interactive Room
Camera feeds + clickable controls. Functional.
- **Wheelhouse** — click gauges for details, click buttons for actions
- **Crow's Nest** — click-drag for PTZ, click to identify

### 5. Composite Room
Aggregates features from multiple physical rooms.
- **4-camera wall** shows foredeck cam + aft cam + thermal + dash cam simultaneously
- **Engine monitoring room** — virtual room that shows all engine data regardless of physical location

## Prototype Plan

### Phase 1 (Now) — Static Room Viewer
- [ ] Three.js panorama sphere viewer
- [ ] Room graph with navigation (click adjacent rooms)
- [ ] Warp to any room
- [ ] Directional pan (fore/aft/port/starboard hotkeys)
- [ ] Static placeholders for cameras
- [ ] Basic dashboard overlays

### Phase 2 — Camera Integration
- [ ] RTSP/RTMP → WebRTC transcoding
- [ ] Live camera feeds in rooms
- [ ] Camera interactivity (PTZ control)
- [ ] Multi-camera quilting
- [ ] Overlay AIS/radio identification

### Phase 3 — Composite Rooms
- [ ] Custom room builder
- [ ] Multi-feed display layouts
- [ ] Alarm warp triggers
- [ ] Voice command integration
- [ ] Remote operation (from ashore)

### Phase 4 — Fleet Deployment
- [ ] Camera presets per room
- [ ] Auto-discovery of new camera feeds
- [ ] Conditional room rendering (low bandwidth mode)
- [ ] Recording/replay mode
- [ ] Multi-vessel support (fleet view)

## How It Maps To Casey's Vessel

| Physical Space | Room ID | Key Camera | Intent |
|----------------|---------|------------|--------|
| Wheelhouse | wheelhouse | Dashboard camera | Navigation, engine controls, alarms |
| Crow's Nest | crows_nest | PTZ lookout | Lookout, gunnery station |
| Foredeck | foredeck | Bow cam | Deck work, anchor |
| Aft Cockpit | aft_cockpit | Work deck cam | Hauling, gear work |
| Galley | galley | (none needed) | Rest, coffee |
| Engine Room | engine_room | Thermal/gauge cams | Engine monitoring |
| Wheelhouse Roof | wheelhouse_roof | Panorama | Overhead look |

## Key Design Decisions

1. **Rooms are first-class web pages** — each room is a URL you can bookmark
2. **Warp is the default fast-travel** — rooms are cheap to load, warp is instant
3. **Compositing is a room type** — not a feature bolted onto physical rooms
4. **Cameras are room objects** — a room has cameras, not the other way around
5. **Adjacency = walking** — animated transitions for immersion
6. **Alarms trigger warps** — the system routes you to the right room automatically
7. **Simplified views are separate rooms** — "back deck nav" has its own config with larger fonts, fewer metrics
