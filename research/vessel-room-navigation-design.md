# Vessel Room Navigation System — Design Document

## Version 0.1 · 2026-05-13

> **Premise:** A fishing vessel as a navigable 3D web space. ScummVM meets Google Street View. The boat IS the UI. Every physical space on the vessel is a "room" — a panoramic 3D webpage. Crew and AI agents move through the vessel the same way you move through a building: by walking through doorways, climbing ladders, and stepping onto decks. The abstraction scales from a single camera up to a full composite view that aggregates four camera feeds into one. Alarms auto-warp the captain to the problem room so no critical event goes unseen.

---

## 1. Room Types & Hierarchy

### 1.1 Physical Rooms

Map 1:1 to actual vessel spaces. Each physical room corresponds to a bounded geographic area with one or more mounted cameras and a defined set of adjacencies to other rooms.

| Room ID | Physical Space | Cameras | Adjacencies |
|---|---|---|---|
| `wheelhouse` | Wheelhouse interior | nav_cam, aft_cam, port_cam, starboard_cam | `foredeck`, `aft_cockpit`, `engine_room`, `wheelhouse_roof` |
| `galley` | Galley / mess | galley_cam | `wheelhouse` (via internal ladder) |
| `foredeck` | Foredeck (bow work area) | fore_cam, horizon_cam | `wheelhouse`, `crow_nest` (ladder) |
| `aft_cockpit` | Aft cockpit | aft_cam, aft_thermal_cam | `wheelhouse`, `engine_room` |
| `engine_room` | Engine room | engine_cam, engine_thermal_cam | `wheelhouse`, `aft_cockpit` |
| `wheelhouse_roof` | Wheelhouse roof / radar platform | radar_cam, roof_cam | `wheelhouse`, `crow_nest` |
| `crow_nest` | Crow's nest / mast lookout | lookout_cam, lookout_thermal_cam | `foredeck`, `wheelhouse_roof` |

Each physical room has metadata:
```json
{
  "id": "engine_room",
  "label": "Engine Room",
  "spaceType": "physical",
  "cameraIds": ["engine_cam", "engine_thermal_cam"],
  "adjacentRoomIds": ["wheelhouse", "aft_cockpit"],
  "ladderTo": null,
  "emergencyOverride": true,
  "nightModeDim": 0.3,
  "ambientTemp": 28
}
```

Physical rooms are the **ground truth** of the navigation graph. They never lie — if the nav graph says the wheelhouse is adjacent to the engine room, there's a ladder connecting them.

### 1.2 Virtual Rooms

Software-only spaces with no physical counterpart. Virtual rooms exist to provide focused, single-purpose interfaces for monitoring and control tasks that don't map cleanly to a physical location.

| Room ID | Purpose | Composition |
|---|---|---|
| `alarm_center` | Aggregated view of all active alarms fleet-wide | Composite from all alarm sources |
| `radio_room` | Comms panel: VHF, satellite phone, weather faxes | Composite from comms instrument feeds |
| `watch_center` | Fleet-wide situational awareness: all boats on one screen | Multi-vessel composite |
| `plato_room` | PLATO knowledge tiles: recent files, activity, hot knowledge | PLATO API composite |
| `nav_archive` | Replay/rewind any camera from the past 72 hours | Temporal stitching |

Virtual rooms are reached via warp, never via walking. They appear as glowing panels or "portals" in any physical room — floating HUD elements that can be clicked.

### 1.3 Composite Rooms

Aggregations of specific cameras from one or more physical rooms, presented as a single unified view. The key distinction from virtual rooms: composite rooms always have at least one physical anchor (they show real camera feeds), while virtual rooms are pure software abstractions.

| Composite Room ID | Source Cameras | Purpose |
|---|---|---|
| `four_camera_wall` | wheelhouse:nav_cam + wheelhouse:aft_cam + wheelhouse:port_cam + wheelhouse:starboard_cam | Multi-angle surveillance wall |
| `simplified_nav` | wheelhouse:nav_cam + radar_cam overlaid | Clean navigation display |
| `engine_monitoring_view` | engine_cam + engine_thermal_cam + engine:oil_pressure + engine:temp_gauge | Engine monitoring station |
| `lookout_bubble` | lookout_cam + lookout_thermal_cam + horizon_cam | All-round lookout composite |
| `night_patrol_suite` | engine_thermal_cam + aft_thermal_cam + lookout_thermal_cam | Night vision composite |

Composite rooms are **views**, not spaces. They do not appear in the walk graph. They are accessed from within their parent physical room via a "Layout" control that switches the viewport configuration.

```json
{
  "id": "four_camera_wall",
  "label": "4-Camera Wall",
  "spaceType": "composite",
  "parentRoomId": "wheelhouse",
  "cameraIds": ["nav_cam", "aft_cam", "port_cam", "starboard_cam"],
  "layout": "2x2",
  "accessibleFrom": ["wheelhouse"]
}
```

### 1.4 Sub-Rooms (PTZ Presets as Rooms)

Each PTZ camera has named presets — specific pan/tilt/zoom positions that define meaningful vantage points. Each preset is exposed as a **sub-room**: a lightweight, fast-to-switch view that lives within its parent physical room.

Examples:

| PTZ Camera | Preset Sub-Room ID | Label | View |
|---|---|---|---|
| `lookout_cam` | `lookout_gunnery` | Lookout — Gunnery Preset | PTZ at preset gunnery orientation + overlay reticle |
| `lookout_cam` | `lookout_horizon` | Lookout — Horizon Scan | PTZ at preset looking at horizon |
| `lookout_cam` | `lookout_water` | Lookout — Water Scan | PTZ looking straight down at water around hull |
| `radar_cam` | `radar_ais_overlay` | Radar — AIS Overlay | Radar with AIS tags overlaid |
| `engine_cam` | `engine_block_view` | Engine — Block View | Close-up on engine block |
| `engine_cam` | `engine_exhaust_view` | Engine — Exhaust View | Exhaust elbow monitoring |

Sub-rooms switch in under 200ms — they're just PTZ preset recall with an overlay layer. They appear as a **tab row** at the bottom of a physical room's viewport, not as separate entries in the walk graph.

### 1.5 Temporal Rooms

A snapshot of a physical room at a specific point in time. Temporal rooms enable forensic replay: "Show me the engine room at 0400 UTC yesterday." The system retrieves archived frames from the camera recorder and presents them in a room shell that shows the original physical layout, but with a "temporal halo" indicating the time offset.

```json
{
  "id": "engine_room@2026-05-12T04:00:00Z",
  "label": "Engine Room @ 0400 UTC May 12",
  "spaceType": "temporal",
  "parentRoomId": "engine_room",
  "timestamp": "2026-05-12T04:00:00Z",
  "archiveRef": "rec_engine_20260512_0300_0500",
  "duration": 3600
}
```

Temporal rooms are read-only. They have a clock overlay and a "return to now" button. They cannot be the target of an auto-warp alarm.

### 1.6 Emergency Rooms

Dynamically spawned at runtime when a critical alarm fires. An emergency room is a **transient overlay** — it doesn't replace the current physical room; it layers on top of it. The system warps to the parent physical room of the alarm source, then overlays the emergency room context:

- **Engine fire emergency**: Warp to `engine_room`, overlay fire suppression status, highlight the affected zone in red, bring up the fire suppression control panel.
- **Flooding emergency**: Warp to `engine_room` (or `aft_cockpit`), overlay bilge pump status, auto-switch to thermal camera, show water ingress zone.
- **Man overboard**: Warp to the nearest physical room with camera coverage of the MOB location, overlay tracking tag on the person, show rescue instructions.

Emergency rooms are **ephemeral**. They auto-dismiss when the alarm clears or when the user explicitly dismisses them. If two emergency rooms trigger simultaneously, they stack as layered overlays with tab switching.

---

## 2. Navigation Semantics

### 2.1 Walk

Point-and-click navigation through physically adjacent rooms. The user clicks on a door, a ladder, or an adjacent wall element, and the system performs a smooth transition (CSS 3D transform or WebGL camera pan) to the destination room's default camera view. Walk preserves **spatial reasoning**: the user builds a mental model of the vessel's geography through repeated movement.

Walk transitions have a configurable duration:

- **Smooth walk** (default, 800ms): Camera pans from source view angle to destination default view angle. For adjacent rooms connected by a ladder, the camera animates "climbing" up or down.
- **Snap walk** (fast, 200ms): Cut to the new room's view without animation. Useful for power users with keyboard navigation.

Walk is the default for:
- Routine patrols and checks
- Proactive monitoring rounds (captain doing a walk-through)
- Any time the user is not under time pressure

### 2.2 Warp

Instant teleport to any room in the navigation graph. The screen fades to black (configurable: 0ms for instant, 150ms for a soft fade), then fades into the destination room's default view. Warp breaks spatial immersion but saves time.

Warp transitions are free — there's no adjacency constraint. Any room can warp to any other room in a single action.

### 2.3 Warp Triggers

| Trigger Type | Mechanism | Fade Behavior |
|---|---|---|
| **Manual warp** | Click on nav menu item, "Go to..." button | 150ms fade |
| **Alarm auto-warp** | Alarm fires → notification → user clicks "Go to" → warp | 150ms fade, audio alert |
| **Voice warp** | Wake word + "go to [room name]" | 150ms fade |
| **Hotkey warp** | Number keys 1–9 map to favorite rooms | 100ms snap fade |
| **Agent-initiated warp** | Agent calls `warp_to(room_id)` action | 100ms snap + agent annotation |

### 2.4 Walk vs. Warp Decision Matrix

| Context | Recommendation |
|---|---|
| Routine patrol, 30-min watch | Walk (builds spatial awareness) |
| Emergency alarm response | Warp (speed > immersion) |
| Checking a specific gauge | Warp (targeted, not exploratory) |
| Exploring a new area | Walk (discover adjacencies) |
| Agent reporting from a room | Warp (agent says "look here") |
| Multi-room composite setup | Warp to anchor, switch layout |

The system should **suggest** walk for rooms not yet visited in the current session and **suggest** warp for emergency contexts. But the user always has the final say.

### 2.5 Navigation Graph

The walk graph is defined as an adjacency list. Each physical room has a list of directly adjacent rooms. The graph is static (defined at vessel commissioning) but can be modified by the system admin.

```json
{
  "navigationGraph": {
    "wheelhouse": {
      "adjacent": ["foredeck", "aft_cockpit", "engine_room", "wheelhouse_roof"],
      "ladderTo": ["galley"],
      "defaultCamera": "nav_cam",
      "defaultView": "lookout"
    },
    "galley": {
      "adjacent": ["wheelhouse"],
      "ladderTo": [],
      "defaultCamera": "galley_cam",
      "defaultView": "full"
    }
  }
}
```

---

## 3. Camera System Architecture

### 3.1 Camera Object Model

Every camera in the system is a first-class object with a consistent data model, regardless of type:

```json
{
  "id": "engine_cam",
  "label": "Engine Room — Main Camera",
  "roomId": "engine_room",
  "cameraType": "ptz",
  "streamUrl": "rtsp://engine-cam-01.local:554/stream",
  "mode": "monitor",
  "interactive": true,
  "presets": [
    { "id": "engine_block_view", "label": "Block View", "pan": 0, "tilt": 0, "zoom": 50 },
    { "id": "engine_exhaust_view", "label": "Exhaust", "pan": 135, "tilt": -20, "zoom": 70 }
  ],
  "overlays": {
    "thermal": { "enabled": false, "palette": "iron" },
    "radar": { "enabled": false },
    "gps": { "enabled": true }
  },
  "nightMode": { "irCut": true, "irIlluminator": true },
  "status": { "online": true, "lastFrame": "2026-05-13T04:14:59Z", "fps": 30 }
}
```

### 3.2 Camera Types

| Type | Description | Examples |
|---|---|---|
| `ptz` | Full pan/tilt/zoom control | Engine room main cam, crow's nest lookout cam |
| `fixed` | Fixed lens, no PTZ | Foredeck horizon cam, aft cockpit cam |
| `thermal` | Thermal/IR imaging | Engine thermal cam, aft thermal cam |
| `dashboard` | Data-only feed (gauges, instruments) | Engine oil pressure gauge, fuel level indicator |
| `quilted` | Stitched panorama from multiple fixed cameras | Wheelhouse 360° quilted view |
| `composite` | Multi-camera layout (2x2, 1+3, etc.) | Four-camera wall, simplified nav display |

### 3.3 Camera Modes

Each camera has a **mode** that determines its interaction paradigm and overlay set:

| Mode | Interaction | Overlays |
|---|---|---|
| `gunnery` | Reticle, target acquire, range finder | Reticle, mil-dots, target box, range readout |
| `monitor` | Pan/tilt/zoom, click-to-center | GPS tag, timestamp, camera label |
| `lookout` | Free pan, wide FOV, enhanced horizon | Compass rose, bearing labels, AIS tags |
| `nav` | Overlay charts, route line, waypoints | Chart overlay, route, waypoints, AIS |
| `thermal` | Temperature scale, hotspot detection | False-color palette, temp at cursor, hotspot circles |

Camera mode is independent of camera type. A `ptz` camera can be in `lookout` mode or `gunnery` mode. Mode switching is instant (no camera hardware change — just UI overlay change).

### 3.4 Camera Viewport Positions

A room's screen layout determines where camera viewports appear. The standard layout vocabulary:

- **Corner glance** (4 corners): 4 small viewports at screen corners, one large center viewport. Used for "stare at nav cam, glance at the others" pattern.
- **Full center**: One camera takes the full screen. Used for focused attention.
- **2x2 grid**: 4 cameras equally sized in a 2×2 grid. Used for composite rooms.
- **1+3**: One large viewport (60% width) + 3 small viewports stacked on the right. Used for nav + supporting cameras.
- **Strip**: Horizontal strip of cameras (useful for horizon stitch). Used in crow's nest for wide-area scanning.

Layout is controlled per-room and persisted to PLATO so the system remembers "the captain always uses 1+3 in the wheelhouse."

### 3.5 PTZ Control

PTZ cameras support:
- **Click-to-center**: Click anywhere in the viewport to move the PTZ so that point is centered
- **Drag to pan**: Click-drag to pan the camera
- **Scroll to zoom**: Mouse scroll / pinch to zoom
- **Preset recall**: Click preset button or hotkey to jump to named preset
- **Gunnery mode** (when camera mode = `gunnery`): Reticle appears, mouse becomes targeting cursor, click to place tracking box on target

### 3.6 Panorama Quilting

The system can stitch 4 directional fixed cameras into a 360° quilted panorama view. The quilting pipeline:

1. **Capture**: 4 cameras (fore, aft, port, starboard) each capture a 90° FOV frame simultaneously
2. **Project**: Each frame is projected onto a cube-map face
3. **Blend**: Edge seams are blended using multi-band blending (Laplace pyramid, 4 bands)
4. **Present**: The quilted panorama is presented as a canvas that can be panned by dragging

The quilted view is treated as a single `quilted` camera in the data model but rendered as interactive canvas. Navigation between directional cameras while in quilted mode uses smooth interpolation (not snapping).

### 3.7 Thermal Overlay

When a thermal camera and an optical camera are co-located (e.g., `engine_cam` + `engine_thermal_cam`), the system can composite them:

- **Blended overlay**: Thermal opacity 0–100% over optical
- **Side-by-side**: Thermal on left, optical on right
- **Pip (picture-in-picture)**: Small thermal inset in corner of optical main view
- **Hotspot detection**: Circles drawn around areas exceeding threshold temperature
- **Cursor temp**: At mouse cursor position, show temperature readout in °C

The false-color palette is selectable: iron, rainbow, amber, medical. Night mode activates IR illuminator automatically.

### 3.8 Radar/AIS Overlay in Panorama Space

When a radar feed and a panorama (quilted) view are both present in a room, AIS targets are projected into the panorama coordinate space. Each AIS target appears as a bearing-accurate tag floating at the correct position within the panorama canvas. Clicking a tag shows the vessel's identity (MMSI, name, callsign, CPA/TCPA). This allows the captain to look at a bearing in the panorama and simultaneously see the AIS information for the vessel at that bearing.

---

## 4. Alarm & Warp Routing

### 4.1 Alarm Sources

All alarm-capable data points in the system are **alarm sources**. Each source emits alarms in a defined taxonomy:

| Source | Alarms | Severity Scale |
|---|---|---|
| Engine ECU | Coolant temp, oil pressure, exhaust temp, RPM, voltage | 0–100 (0=nominal, 100=critical) |
| Fuel system | Level, flow rate, leak detection | 0–100 |
| Bilge system | Water level, pump status | 0–100 |
| Fire detection | Smoke, flame, heat rate-of-rise | binary + severity |
| Navigation | Waypoint off-course, CPA breach, GPS loss | binary + severity |
| Camera motion | Motion in designated quiet zones (engine room entry) | binary |
| Weather | Wind speed threshold, wave height threshold | 0–100 |
| Comms | VHF distress received, EPIRB activation | binary critical |

### 4.2 Alarm Encoding

Each alarm carries a 4-dimensional encoding:

| Dimension | Expression | Design Implication |
|---|---|---|
| **Color** | Red = critical, Yellow = warning, Green = nominal | Color is always visible, even at small sizes |
| **Audio** | Tone pitch proportional to severity; critical = pulsing two-tone | Audio encoding carries urgency without reading |
| **Position** | Room overlay: which physical room the alarm belongs to | The alarm is "in" the room; navigation takes you to the room |
| **Warp speed** | Fade duration: critical = 0ms (instant), low = 300ms | Fade time is proportional to urgency; critical alarms snap |

### 4.3 Alarm Lifecycle

```
NOMINAL → [threshold crossed] → ALARM FIRED
  → Notification appears in current room (banner + audio)
  → Alarm overlay appears in source room
  → [User clicks "Go to" or "Warp to"] → Warp initiated
  → User arrives at source room with problem context highlighted
  → [Condition resolved] → ALARM CLEARED
  → Notification dismisses, overlay removed
  → Event logged to alarm history
```

### 4.4 Auto-Warp Mechanics

When an alarm fires, the system:

1. **Logs** the alarm with timestamp, source, severity
2. **Renders** a notification in the current room viewport (stays on top of whatever room the user is in)
3. **Shows** the alarm in the alarm center (virtual room, all alarms fleet-wide)
4. **On user click**: warps to the source physical room, switches to the best camera for that alarm type, highlights the affected zone

Auto-warp is **never** fully automatic (always user-confirmed for non-critical). The exception is **critical binary alarms** (fire, MOB, EPIRB) where a config flag `autoWarpCritical: true` can be set — in that case, warp happens automatically after a 2-second countdown with cancel option.

### 4.5 Multi-Alarm Behavior

When two or more alarms fire simultaneously:

- **All alarms appear** in the notification queue (most severe first)
- **Each alarm** shows its own "Warp to" button
- **The most severe** alarm's source room is shown first in the alarm center
- **The user** chooses priority by clicking which to warp to
- **Agents** can be assigned to investigate lower-priority alarms while the human handles the critical one

The system does NOT auto-queue or auto-cycle. The human decides. Agents assist by investigating secondary alarms and reporting back.

---

## 5. Human UX Patterns

### 5.1 The Captain's Watch — 30-Minute Patrol Trace

A realistic trace through the vessel during a routine watch:

**Minute 0–2 (arrival at wheelhouse):**
Captain arrives, is in `wheelhouse`. Default view is `simplified_nav` composite. 4-camera wall available by tapping "Layout" → "4-cam." Sees nav, radar, AIS, engine status.

**Minute 3–8 (engine room check):**
Warp to `engine_room`. System switches to `engine_monitoring_view` composite (engine_cam + engine_thermal_cam + oil pressure + temp gauges). Thermal overlay active. Oil pressure: nominal (green). Coolant temp: 82°C (green). Captain glances at engine block on fixed cam, exhaust elbow on PTZ preset. Checks bilge pump status. Sees all green.

**Minute 9–14 (foredeck and crow's nest):**
Walk from engine_room → wheelhouse → foredeck. On foredeck, checks forward mooring cleats, horn. Walks up ladder to `crow_nest`. Default view: `lookout_bubble` composite (lookout_cam + thermal + horizon_cam). Pan across horizon. AIS shows 3 vessels: fishing boat 12° port, cargo ship 045° starboard, sailboat 270° dead astern. All CPA/TCPA nominal.

**Minute 15–20 (wheelhouse roof / radar):**
Walk from crow_nest → wheelhouse_roof. Radar camera in `radar_ais_overlay` sub-room. Radar sweep running. AIS overlay shows all vessels with vectors. No anomalies. Go back down to wheelhouse.

**Minute 21–28 (galley and rest):**
Walk to `galley`. Galley cam shows clean galley, coffee maker on. Check fridge temps via dashboard overlay. All nominal. Sit in wheelhouse for final minutes.

**Minute 29–30 (alarm center sweep):**
Warp to `alarm_center`. All 47 alarm points fleet-wide shown. All green. Watch rotation complete.

This trace demonstrates: walk for routine patrol (minutes 9–20), warp for targeted checks (minute 3), virtual room for sweep (minute 29). The system supports all three without forcing a single paradigm.

### 5.2 Glance vs. Stare

Different rooms support different attention models:

**Glance rooms** (quick check, <10 seconds):
- Engine room (is the temp OK?)
- Galley (is the stove off?)
- Foredeck (are the mooring lines good?)
- Aft cockpit (is the deck clear?)

Glance rooms open in the corner viewport if the captain is in an adjacent room, or warp-and-back in 10 seconds. The room's default layout for glance rooms is minimal — just the most critical camera + one supporting gauge.

**Stare rooms** (sustained attention, minutes or hours):
- Wheelhouse navigation display (watch-standing)
- Crow's nest lookout during poor visibility
- Alarm center during a developing situation

Stare rooms default to composite layouts that can be open for extended periods without fatigue. The wheelhouse nav display uses the `simplified_nav` composite by default: nav cam + radar overlay in a clean, readable format with large text and high contrast.

### 5.3 The 3-Second Rule

From alarm to seeing the problem — the full latency budget:

| Step | Time Budget | Implementation |
|---|---|---|
| Alarm data available | 0ms | Sensor → ECU → network latency (~50ms, acceptable) |
| Alarm rendered in UI | <500ms | WebSocket push to client, alarm card render |
| User clicks "Warp" | — | User decision time, unpredictable |
| Warp transition | <300ms | Fade to black + fade in (critical = instant) |
| Room loads with context | <1000ms | Camera stream starts, overlays render |
| **Total worst case** | **<3000ms** | Engineering target: P99 < 2s |

Meeting the 3-second rule requires:
- WebSocket for alarm push (not HTTP polling)
- Pre-warm camera streams for all physical rooms (background loading)
- Streaming video start with keyframe-first delivery
- Alarm context pre-fetched alongside warp initiation

### 5.4 Night Mode

Night mode is a global state that affects all rooms simultaneously. When night mode activates:

- **Display dimming**: All UI elements dim to 20% base brightness
- **Red light preservation**: Primary text shifts to red (#CC0000) on black; red wavelengths preserve night vision
- **Reduced blue light**: All blue/cyan accent colors shift to deep red equivalents
- **IR illuminators**: Thermal cameras switch to active IR mode
- **Camera sensitivity boost**: Fixed cameras gain +6dB gain
- **Touch targets enlarge**: All tappable elements grow by 25% (minimum 44px → 55px)
- **Touch feedback**: All touch interactions have stronger haptic feedback

Night mode can be:
- **Scheduled**: Auto-activates at local sunset, deactivates at local sunrise
- **Manual**: Toggle in any room via the system menu
- **Voice**: "Hey Captain, night mode" / "Night mode off"

### 5.5 Glove-Friendly Controls

The vessel environment is cold, wet, and the captain is often wearing gloves. Touch targets are designed accordingly:

| Element | Minimum Size | Recommended |
|---|---|---|
| Primary action button | 44×44px | 55×55px |
| Navigation arrows | 50×50px | 60×60px |
| PTZ direction pad | 60×60px per direction | 70×70px |
| Alarm "Warp to" button | 60×44px | 70×55px |
| Room selector item | 44px height, full width | 55px height |
| Camera viewport tap zone | 44×44px | 55×55px |

Physical buttons supplement touch for critical actions:
- **Physical button 1**: Warp to wheelhouse (primary operating position)
- **Physical button 2**: Warp to engine room (most common alarm source)
- **Physical button 3**: Warp to alarm center
- **Physical button 4**: Acknowledge last alarm
- **Physical rotary encoder**: PTZ pan/tilt (fine control without touch)

Voice commands serve as a tertiary input channel for when hands are fully occupied:
- "Go to engine room"
- "Show me the foredeck"
- "Activate night mode"
- "Acknowledge alarm"
- "Take a screenshot"

### 5.6 Multi-Device Responsive Layout

The system adapts to screen size:

| Device Class | Screen Size | Layout Adaptation |
|---|---|---|
| **Bridge display** | 24"+ ultrawide | Full 4-corner glance + center nav, all overlays, radar panel |
| **Laptop** | 13–17" | 1+3 or 2x2 grid, collapsible sidebar nav |
| **Tablet** | 8–12" | Full-center viewport, bottom tab bar for room switching |
| **Phone** | < 6" | Single camera view, swipe for adjacent rooms, floating action buttons |

The bridge display is the primary design target. Phone/tablet are secondary — they use simplified layouts optimized for "check on the boat" rather than "run the watch."

---

## 6. Agentic UX Patterns

### 6.1 Agents as Crew Members in Room Space

Agents are first-class occupants of the room space. Each agent in the fleet has:

- **Room access level**: Which rooms the agent can enter and what it can see there
- **Camera interaction permission**: Whether the agent can control PTZ, switch modes, recall presets
- **Overlay authority**: Whether the agent can add or modify overlays in a room
- **Presence indicator**: A badge in the room showing "FM Agent is here" with its current focus

Example agent persona for a Vessel Fleet Manager (FM):
```json
{
  "agentId": "fm-vessel-01",
  "callsign": "FM",
  "role": "fleet_manager",
  "roomAccess": ["alarm_center", "watch_center", "plato_room", "wheelhouse", "engine_room"],
  "cameraInteraction": { "look": true, "ptz": false, "presets": false },
  "overlayAuthority": true,
  "whisperRouting": true
}
```

### 6.2 Agent Room Presence

Agents do not occupy physical space the same way humans do, but their **presence** is represented in the room UI:

- **Room badge**: When an agent is active in a room, a small badge shows its callsign and what it's monitoring
- **Activity feed**: In-room notifications from agents appear as a transient toast: "FM: engine temp up 3° from baseline"
- **No agent "stand"**: Agents don't appear as avatars in camera feeds — they're data-layer presences

When an agent initiates a warp for a human (e.g., FM detects an engine temp anomaly and wants the captain to see it), the notification includes: "FM says: Check this → [Warp to engine_room]" with a one-click warp button.

### 6.3 Agent-Initiated Room Mutations

Agents can dynamically modify the room layout and overlay configuration:

| Mutation | Description | Example |
|---|---|---|
| **Add gauge overlay** | Agent pins a data gauge to a camera viewport | FM adds oil pressure gauge to engine_cam viewport |
| **Spawn camera viewport** | Agent opens an additional camera in the current layout | FM opens thermal cam alongside optical in engine room |
| **Switch room layout** | Agent changes the 2x2/1+3/full layout | FM switches wheelhouse from 4-cam to simplified_nav |
| **Highlight zone** | Agent draws a bounding box around an area of interest | JC1 in crow's nest highlights a debris field on the horizon |
| **Spawn annotation** | Agent drops a text annotation pinned to a geographic location in the panorama | "Debris field here — advise course change" |

Agents request mutations through the Room Mutation API. The human can approve, deny, or set "allow FM to add overlays without asking."

### 6.4 Agent Whisper Routing

Agents can route information to each other via a **whisper** protocol before surfacing anything to the human:

```
JC1 (crow's nest) whispers to FM (fleet manager):
  "Thermal anomaly bearing 045, 8 miles. Possible debris or vessel.
   Request: Verify from engine thermal at bearing 045."

FM whispers back to JC1:
  "Confirmed debris on radar too. No AIS. Suggest marking as hazard.
   I will annotate for the captain."

FM annotates plato_room with hazard tile.
  Human opens plato_room, sees annotation.
  Human optionally warps to crow_nest to see the debris in optical.
```

The human sees the **final output** — not the back-and-forth between agents. This prevents information overload while allowing agents to collaborate on complex problems.

### 6.5 Bottle-Based Room Evolution

Agents file knowledge to PLATO in structured tiles. PLATO tiles inform room configurations over time:

| Agent Action | PLATO Tile | Room Evolution |
|---|---|---|
| FM detects that engine_cam stream is unreliable after 60s of running | `asset:engine_cam:reliability_issue` | System auto-switches engine room default to thermal cam until engine_cam reconnects |
| JC1 reports that crow_nest thermal is better than optical in fog | `weather:fog:thermal_preferred` | System auto-switches crow_nest to thermal mode during fog events |
| Fleet agent discovers that 4-camera wall in wheelhouse causes cognitive overload during night watch | `ux:wheelhouse:night_glance_preferred` | System auto-switches wheelhouse to full-center layout during night mode |

The bottle (PLATO tile) is the knowledge carrier. The room system is the actuator. The human benefits from fleet-wide learning without having to manually reconfigure anything.

### 6.6 Agent Hierarchy & Room Access by Role

Different agents have different room access appropriate to their function:

| Agent | Role | Room Access | Primary Function |
|---|---|---|---|
| FM (Fleet Manager) | Fleet-wide oversight | All rooms, all cameras | Coordinate fleet, surface critical alarms |
| JC1 (JetsonClaw-1) | Hardware/infrastructure | wheelhouse, engine_room, wheelhouse_roof | Hardware monitoring, camera health |
| WC1 (Watch Clerk) | Watch logging | alarm_center, watch_center, plato_room | Log keeping, schedule management |
| RC1 (Radio Clerk) | Comms | radio_room, alarm_center | Comms monitoring, distress handling |
| EC1 (Engine Clerk) | Engine monitoring | engine_room, alarm_center | Engine metrics, predictive maintenance |

Agents with overlapping room access can collaborate in shared rooms (e.g., FM and EC1 both in engine_room for a complex engine event).

---

## Appendix: Reference Architecture

### Data Flow Summary

```
Sensors/ECU
    ↓ (CAN bus / NMEA 2000)
Vessel Gateway
    ↓ (MQTT / WebSocket)
PLATO (knowledge layer)
    ↓ (Tile events)
Room Controller (navigation graph, alarm routing)
    ↓ (WebSocket push)
Client UI (room viewports, overlays, alarms)
    ↓ (User actions)
Room Controller (warp, layout switch, PTZ commands)
    ↓ (RTSP/RTMP)
Camera Streams (live)
    ↓ (HLS/DASH)
Archival Storage (72-hour rolling buffer)
```

### Key Files (Implementation Reference)

| File | Purpose |
|---|---|
| `vessel-nav-graph.json` | Static navigation adjacency graph |
| `alarm-taxonomy.json` | All alarm sources, severity mappings |
| `camera-registry.json` | All cameras, types, modes, presets |
| `room-layouts.json` | Named layout presets per room |
| `agent-manifest.json` | Agent roles, access levels, permissions |
| `plato-tile-schema.json` | Tile schema for agent knowledge filing |

---

*Document version 0.1 — Draft for internal review. Subject to revision based on prototype testing.*