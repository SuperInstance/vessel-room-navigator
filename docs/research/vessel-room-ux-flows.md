# Vessel Room Navigation: Human & Agentic UX Flows

Design patterns for how humans and AI agents navigate the room system.

---

## Part 1: Human UX Flows

### 1.1 The Captain's Watch: 30-Minute Trace

A realistic rotation starting from bunk rest:

```
0:00 — Soft chime. Casey in Quarters (room 8).
        Warp to Wheelhouse (0.8s, instant arrival).
        Panoramic view loads: radar overlay stitched from 4 mast cameras.
        Herring school 2.1NM out, 12° off port bow.

0:05 — Glance check of engine room: tap engine warp button.
        Engine Room loads: 4 thermal viewports × coolant/output/exhaust/oil.
        All green. Tap WHEELHOUSE to return.

0:12 — Net tension gauge dipping. Tap AFT COCKPIT.
        Panoramic shows 120ft net winching up.
        Blue dots overlay crew helmet cameras. Spots frayed port net section.
        Radio call via overlay CHANNEL 9 dot.

0:22 — Coffee check. Warp GALLEY. Thermos steaming, snacks stocked.
        Tap WHEELHOUSE to return.

0:28 — Radio check: warp RADIO ROOM (virtual). No distress calls.
        0:30 — Back in Wheelhouse. Rotation complete.
```

### 1.2 Glance vs. Stare Model

Not all rooms are equal. The system distinguishes attention modes:

| Mode | Duration | Cameras | FPS | Interaction |
|------|----------|---------|-----|-------------|
| **Glance** | <3 sec | Corner viewports (4) | 5 FPS | Passive observation |
| **Scan** | 3-15 sec | Center viewport | 15 FPS | PTZ pan, menu navigation |
| **Stare** | >15 sec | Full center viewport | 30 FPS | Zoom, acquire, dashboard interaction |

**Room-specific defaults:**
- Wheelhouse: Stare (primary workspace)
- Engine Room: Glance → Scan if gauge anomaly
- Galley: Glance (no sustained attention needed)
- Crow's Nest: Scan → Stare when tracking
- Aft Cockpit: Glance between hauls

### 1.3 The 3-Second Rule

From alarm trigger to seeing the problem, everything under 3 seconds:

```
T+0.0s — Sensor triggers (temp > threshold)
T+0.2s — Event routed to room server
T+0.5s — Alarm notification appears (pulsing red, room name, temp value)
T+1.0s — User clicks notification
T+1.2s — Warp transition begins (fade out)
T+1.4s — Target room loads with problem camera highlighted
T+1.8s — User sees the problem (thermal overlay on port engine with hotspot circle)
T+2.5s — User makes decision (hit ACQUIRE, call engineer, etc.)
Total: 2.5s — within 3-second budget
```

**Engineering targets:**
- Notification render: P99 < 500ms
- Warp transition: P99 < 300ms
- Room state restore (camera positions, overlay state): P99 < 500ms
- Full room load (uninterrupted): P99 < 2s

### 1.4 Alarm Urgency Encoding

| Level | Color | Sound | Warp Speed | Example |
|-------|-------|-------|------------|---------|
| INFO | Blue | None | None | "Galley coffee ready" |
| WARNING | Yellow | Single tone | Normal | "Fuel 25%, time to refuel" |
| CRITICAL | Orange | Fast pulse | Fast (0.5s) | "Engine temp 210°F" |
| EMERGENCY | Red | Continuous | Instant (0.1s) | "Fire detected — Engine Room" |
| OVERRIDE | White flash | Siren + voice | Warp + alert | "Man overboard — ALL ROOMS" |

### 1.5 Night Mode

- All overlays shift to red-green colorblind-safe palette
- Dashboard gauges dim to 30% brightness
- Blue light reduced by 90%
- Compass and direction labels become subtle
- Alarm colors intensify (red on near-black = maximum contrast with minimum light)
- Red light preservation: no bright white anywhere

### 1.6 Glove-Friendly Design

- Minimum touch target: 44px (Apple HIG), recommended 55px (gloves)
- Buttons have elevated borders for tactile feedback
- Critical actions (emergency warp, fire suppression) are 60px+ with physical edges
- Voice commands as primary backup: "go to engine room" "warp to crow's nest"
- Hardware buttons on wheelhouse panel map to room warps

### 1.7 Multi-Device Responsive

| Device | Viewport Layout | Typical Use |
|--------|----------------|-------------|
| Big screen (24"+ wheelhouse) | Full 6-viewport: center panorama + 4 corner cams + dashboard | Primary navigation |
| Tablet (deck) | Simplified: 1 cam stream + critical gauges | Quick checks, work deck |
| Phone (pocket) | Single cam, no dashboard | Alarms-only, backup |
| Wearable | Audio cues + haptic alerts | Glance-only |

---

## Part 2: Agentic UX Flows

### 2.1 Agents as Crew Members

Each agent has different room access and camera interaction:

| Agent | Primary Rooms | Camera Access | Mutations Allowed |
|-------|--------------|---------------|-------------------|
| **Oracle1** 🔮 | All rooms (keeper) | All cameras read-only | Add overlays, spawn viewports |
| **Forgemaster** ⚒️ | Engine Room, Wheelhouse | Thermal, dashboard | Add gauges, modify layouts |
| **JC1** ⚡ | Crow's Nest, Foredeck | PTZ, optical | Camera mode changes, tracking |
| **CCC** 🦀 | None (public-facing) | None | None |

### 2.2 Agent Room Presence

Agents don't "appear" in rooms like avatars. Their presence is signaled:

- **Knowledge badge:** An agent has analyzed this room recently.
- **Toast notification:** "FM flagged port engine temp anomaly"
- **Overlay modification:** If FM adds a gauge, it appears as an overlay with FM's signature color.
- **Active agent indicator:** A small badge showing which agents are currently "in" this room.

### 2.3 Agent-Initiated Room Mutations

Agents can change rooms without human intervention:
- FM detects temp spike → adds temperature gauge overlay to wheelhouse dash
- JC1 tracks a vessel → adds tracking reticle to crow's nest panorama
- Oracle1 sees repeated alarm → modifies alarm routing table
- CCC analyzes radio traffic → adds radio overlay to wheelhouse

**Mutation types:**
1. **Add overlay** — Gauge, highlight, annotation, notification banner
2. **Spawn viewport** — Create new camera view in specified position
3. **Switch layout** — Change viewport arrangement (2×2 → 1+3 → center+strip)
4. **Highlight zone** — Circled area on camera feed with annotation
5. **Modify route** — Change alarm routing table

### 2.4 Agent Whisper Routing

Agents communicate across rooms through the room system:

```
FM in Engine Room: temp spike on port engine, 185°F→210°F in 30s
  │
  ▼ whispers to
JC1 in Crow's Nest: verify via thermal cam
  │
  ▼ confirms
JC1: thermal gradient confirms hotspot on port manifold
  │
  ▼ whispers to
Oracle1 (all rooms): port manifold overheat detected. 
  │
  ▼ files to
PLATO room "engine-room-events": tile created with timestamp, temp curve, recommendation
  │
  ▼ updates room
Engine Room dashboard: new gauge "Port Manifold Temp" with trend arrow ↑
Wheelhouse: yellow alert "Port Manifold — monitor"
```

**Whisper protocol properties:**
- Per-type TTL (temp events: 1 hour, structural events: permanent)
- Propagate through room adjacency (agent in one room talks to agent in adjacent room)
- Converge at human-facing dashboard
- File to PLATO as knowledge tiles

### 2.5 Agent Room Permissions

| Room Type | Oracle1 | FM | JC1 | CCC |
|-----------|---------|----|-----|-----|
| Physical | ✅ Full | ✅ Full | ✅ Full | ❌ None |
| Virtual (Alarm Center) | ✅ Full | ✅ Read | ✅ Read | ❌ |
| Virtual (Radio Room) | ✅ Full | ❌ | ❌ | ❌ |
| Composite | ✅ Full | ✅ Read/Add | ✅ Read | ❌ |
| Other Vessels | ✅ Fleet admin | ❌ | ❌ | ❌ |

### 2.6 Bottle-Based Room Evolution

Agents file knowledge to PLATO → PLATO tiles inform room configurations:

1. Agent detects pattern (e.g., engine temp spikes correlated with starboard list)
2. Agent files PLATO tile to `engine-room-events` room
3. Tile quality gate: >0.7 confidence passes
4. Room configuration updates: new correlation gauge appears in Engine Room
5. Human sees: "Temp-Starboard List correlation: 0.82"
6. If useful, overlay becomes permanent

### 2.7 Agent Warp Priorities

When an alarm fires, optimal agent routing:

| Alarm Type | Primary Responder | Secondary | Reason |
|------------|------------------|-----------|--------|
| Engine temp | FM (Engine Room) | Oracle1 (monitor) | FM does thermal analysis |
| Visual contact | JC1 (Crow's Nest) | Oracle1 (log) | JC1 does vision tracking |
| Radio call | Oracle1 (Radio Room) | — | Only Keeper has comms |
| Fire | ALL (Engine Room) | — | Critical, all hands |
| Low fuel | FM (Fuel Room) | — | FM manages resources |

---

## Part 3: Flow Diagrams

### Warp Decision Matrix

```
                ┌─────────────────────────────┐
                │   ROOM CHANGE REQUESTED      │
                └─────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌─────────┐   ┌─────────┐
              │ ADJACENT │   │  OTHER  │
              └─────────┘   └─────────┘
                    │             │
              ┌─────┴─────┐  ┌───┴────┐
              ▼           ▼  ▼        ▼
        ┌─────────┐  ┌──────┐  ┌───────┐
        │ WALK    │  │ WALK │  │ WARP  │
        │ animate │  │ fast │  │ blink  │
        └─────────┘  └──────┘  └───────┘
```

### Alarm Propagation

```
Sensor ──► Event Bus ──► Alarm Engine
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              ┌─────────┐ ┌───────┐ ┌───────┐
              │ Room     │ │ Agent │ │ Human │
              │ Mutation │ │ Route │ │ Notif │
              └─────────┘ └───────┘ └───────┘
```



### Room-to-Agent Routing

```
Agent Registry → Room Assignment → Capability Matrix → Whisper Table
        │                │                    │                │
        ▼                ▼                    ▼                ▼
  Who can see     Which rooms        What can each     How do they
  this room?      does each see?     do in a room?     talk across rooms?
```
