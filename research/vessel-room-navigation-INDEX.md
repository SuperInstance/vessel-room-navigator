# Vessel Room Navigation System — Document Index

**Date:** 2026-05-13  
**Concept:** Casey's fishing vessel as a navigable 3D web space (ScummVM meets Google Street View)  
**Repository:** github.com/SuperInstance/vessel-room-navigator  
**Live demo:** superinstance.github.io/vessel-room-navigator/  
**PLATO room:** vessel-room-navigator (localhost:8847)

---

## Document Map

| # | Document | Source Model | Words | Covers |
|---|----------|-------------|-------|--------|
| 0 | **INDEX** (this file) | Oracle1 (glm-5.1) | — | Master index, key insights, action items |
| 1 | **vessel-room-navigation-v1.md** | Oracle1 | ~1,500 | Original spec: room types, navigation, camera system, data model, phases |
| 2 | **vessel-room-navigation-design.md** | MiniMax M2.7 | ~4,900 | Full design doc: room hierarchy, navigation semantics, camera architecture, alarm routing, human/agentic UX |
| 3 | **camera-architecture-for-vessel-rooms.md** | glm-5-turbo | ~4,700 | Camera domain model, 5 camera types, viewport layouts, sensor fusion, events→mutations, offline behavior |
| 4 | **vessel-room-topology-analysis.md** | MiniMax M2.7 | ~3,000 | Formal graph theory: Laman rigidity, betweenness centrality, shortest paths, alarm routing, fragility analysis |
| 5 | **room-graph-brainstorm.md** | Seed-2.0-mini | ~3,200 | Room graph theory: LOD compression, caching, time-stamped URLs, dynamic room creation, federation, inheritance |
| 6 | **vessel-room-archeology.md** | MiniMax M2.7 + Seed-2.0-mini | ~3,500 | Archaeology (1986→2006) and reverse-actualization (2036→2046) with backward design decisions |
| 7 | **vessel-room-ux-flows.md** | Oracle1 + Seed-2.0-mini | ~3,000 | Captain's 30-minute watch trace, glance/stare model, 3-second rule, alarm encoding, night mode, multi-device, agentic UX flows, agent permissions, whisper routing |
| 8 | **vessel-room-human-ux-seed.md** | Seed-2.0-mini | ~1,500 | Human UX principles from the deck: muscle memory, glance velocity, wet/dark/bouncing design |

**Total research base: ~25,000 words across 9 documents**

---

## Key Insights Summary

### From Graph Topology
- Walk graph is under-constrained (E=14 < Laman threshold 15)
- Add F↔ER edge for minimal rigidity — eliminates single-point failure at ER
- Wheelhouse is critical chokepoint (betweenness 27) — single room failure splits vessel
- No Hamiltonian path exists (ER/AC form dead-end branch)
- Warp edges improve worst-case pair distance by 97.5% (AC↔F: 4 walk → 0.1 warp)

### From Camera Architecture
- Cameras are first-class room objects with stable UUIDs, types, modes, presets
- 5 camera types: PTZ, thermal, dashboard, quilted, composite
- 5 camera modes: gunnery, monitor, lookout, nav, panorama
- Viewport layout: 4-corner glance (5 FPS) + center stare (full FPS)
- Sensor fusion: thermal overlay with hotspot detection, radar/AIS bearing tags, depth sounder waveform
- Partial degradation: 10 capability dimensions per camera with specific UX adaptations

### From Archaeology
- 1986 analog clipboard system was brilliant: glanceable, shared, works in any condition, zero latency
- 1996 FishMUD and VesselView failed because offshore connectivity didn't exist
- 2006 SeaMap VR failed on bandwidth, hardware cost, and trust
- The 1986 laminated deck plan design rule: "does it work as well as dry-erase in a storm?"

### From Reverse-Actualization
- By 2036: room system mandatory on vessels >40ft, marine biologists rent camera data, insurance pulls room logs
- By 2046: digital boat is primary, room graph is ISO standard, fleet-mind replaces per-vessel rooms
- **Build now:** room-as-URL, federated IDs, event-sourced history, plugin architecture, offline-first

### From Arch/Design Synthesis
- Room types: physical (7), virtual (alarm, radio, watch, PLATO, nav archive), composite (4-cam, simplified nav, engine monitor, lookout, night patrol)
- Composite rooms aggregate feeds from multiple physical rooms — NOT just layout switches
- Warp triggers: manual, alarm, voice, hotkey, agent-initiated
- Agent permissions per room: Oracle1 (full), FM (engine/wheelhouse full), JC1 (camera-intensive), CCC (none)

---

## Action Items

### Build Phase 1 (Now)

Priority order:

1. **F↔ER walk edge** — Add virtual walk edge between Foredeck and Engine Room to achieve minimal rigidity
2. **Room-as-URL** — Every room gets a bookmarkable URL with timestamp parameter
3. **Event-sourced room history** — Log every room state change (room enters/exits, camera moves, alarms, warps)
4. **Offline-first** — Cache rooms locally, degrade gracefully, sync on reconnect
5. **Plugin camera architecture** — Camera interface designed for third-party extensions from day one

### Build Phase 2 (Camera pipeline)

1. RTSP/RTMP → WebRTC transcoding pipeline (FFmpeg → Janus → browser)
2. Thermal overlay compositing (raw IR → temp map → false color → hotspot detection → optical registration)
3. PTZ API: pan/tilt/zoom absolute and relative, preset CRUD, gunnery mode
4. Edge-blended panorama stitching (4 cameras → 360°)

### Build Phase 3 (Real data integration)

1. NMEA 2000 gauge binding (RPM, fuel, temp, trim → dashboard overlays)
2. AIS/radar overlay in panorama space (bearing tags, CPA/TCPA, click-to-identify)
3. Alarm system: sensor triggers → event routing → room mutation → notification → auto-warp

### Research Phase

1. Room graph optimization: implement F↔ER edge, benchmark connectivity improvement
2. Bandwidth LOD testing: measure payload sizes at each LOD tier
3. Multi-vessel federation protocol: inter-vessel room references, capabilities negotiation
4. Room inheritance system: template room graphs, fork-merge for new vessels

---

## Models Used

| Model | Type | Use |
|-------|------|-----|
| MiniMax M2.7 | Balanced | Formal analysis, synthesis, archeology |
| Seed-2.0-mini | Creative divergent | Room graph brainstorm, human UX, archeology |
| glm-5.1 (z.ai) | Expert | Failed — plan expired |
| glm-5-turbo (z.ai) | Runner | Camera architecture deep dive |
| DeepSeek v4-pro | High reasoning | Failed — key revoked |
| DeepSeek v4-flash | Fast analysis | Failed — key revoked |

## PLATO Room

All knowledge filed to: `vessel-room-navigator` room at localhost:8847

Tiles filed: spec, architecture, rooms, repo, camera-system, alarm-system, warp-system, phases
