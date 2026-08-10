# Vessel Room Navigator 🚢

> *The boat IS the interface. No menus. No abstractions. You stand on the deck and the deck speaks.*
>
> **ScummVM meets Google Street View — a fishing vessel as a navigable 3D web space.**

Every physical space on F/V EILEEN is a "room" — a 360° panoramic webpage. Walk from the wheelhouse to the engine room. Warp to the crow's nest. Check thermal cameras, read engine gauges, respond to alarms. Type "add a winch" and watch a 3D mockup render right in the room.

**[→ Launch the Navigator](https://fleet.cocapn.ai/)** — no install, no signup, no server. Just a browser.

---

## Features

| Feature | What You Can Do |
|---------|----------------|
| 🎯 **[360° Rooms](textures/)** | Drag to look around 9 AI-photorealistic panoramas |
| 🚶 **Walk / Warp** | Click doors to walk, ⚡ to teleport, or press 1–9 |
| 📷 **[Cameras](docs/research/camera-architecture-for-vessel-rooms.md)** | PTZ, thermal, radar feeds in corner viewports |
| 📊 **Dashboards** | Live engine, nav, and monitor gauges |
| 🚨 **Alarms** | Trigger alarms → click to auto-warp to problem room |
| 🎨 **Visualizer** | Type "add a winch" → 3D mockup renders in-room |
| 💬 **Chat** | Talk to the room agent, get responses |
| 🔑 **Keys** | WASD/Arrow = look. 1–9 = warp. ☰ = panel. |

---

## The Rooms

9 rooms. 7 physical, 1 virtual, 1 composite. 14 walkable edges, 36 warp edges. The [topology analysis](docs/research/vessel-room-topology-analysis.md) proves the graph is Laman-rigid — structurally sound, like the vessel itself.

| Room | Type | What's There |
|------|------|-------------|
| [**Wheelhouse**](textures/pano_wheelhouse.jpg) | Physical | Engine dash, radar, nav display |
| [**Galley**](textures/pano_galley.jpg) | Physical | Warm kitchen, porthole view |
| [**Foredeck**](textures/pano_foredeck.jpg) | Physical | Bow camera, open ocean |
| [**Aft Cockpit**](textures/pano_aft_cockpit.jpg) | Physical | Stern cam, nav display |
| [**Engine Room**](textures/pano_engine_room.jpg) | Physical | 4 thermal cameras, gauge monitor |
| [**Wheelhouse Roof**](textures/pano_wheelhouse_roof.jpg) | Physical | 360° panorama, radar antenna |
| [**Crow's Nest**](textures/pano_crows_nest.jpg) | Physical | PTZ gunnery station |
| **Alarm Center** | Virtual | Composite alert monitoring |
| **4-Camera Wall** | Composite | Multi-angle display |

---

## The Unified Room Theory

The room system is a single agent loop that applies to any domain:

```
  PROBE → DISCOVER → TEST → PICK → REMEMBER → WALK
```

Everything is a room. Every room has capabilities. A capability is: a camera, an implementation, a layout option, a fact. The agent's only job is to find what works best.

Physical rooms, code primitives, and knowledge entries all share this structure. The navigator doesn't care if a room is a galley or a function — it navigates. [Read the synthesis →](docs/research/vessel-room-synthesis.md)

---

## Architecture

| Layer | Technology | Why |
|-------|-----------|-----|
| 3D rendering | Three.js | 360° sphere interiors. Browser-native. |
| Panorama textures | [FLUX-1-schnell](docs/research/vessel-room-generative-platform.md) | AI-generated, 1792×1024 |
| Visualization | Three.js primitives | Boxes, cylinders, particles |
| Chat/voice | [Gemini Nano](docs/research/vessel-room-gemini-plato.md) + PLATO tiles | Browser-native AI, no cloud |
| Camera agents | [ESP32-S3](docs/research/vessel-room-esp32-agent.md) | C++, JSON/WebSocket, ESP-NOW |
| Vector search | [WebGPU / CUDA / Vulkan / WASM](docs/research/vessel-room-gpu-vectordb.md) | Modular compute |
| Knowledge base | PLATO room server | Distributed tile system |

---

## Quick Start

```bash
# Option 1: Visit the live site
open https://fleet.cocapn.ai/

# Option 2: Serve locally
git clone https://github.com/SuperInstance/vessel-room-navigator.git
cd vessel-room-navigator
python3 -m http.server 8888
# → http://localhost:8888
```

No build step. No dependencies. No server. Works offline after first load.

---

## Research

16 documents, ~240KB, covering every angle of vessel room navigation:

| Document | Focus |
|----------|-------|
| [Design Synthesis](docs/research/vessel-room-navigation-design.md) | Full architecture, 9 room types |
| [Navigation v1](docs/research/vessel-room-navigation-v1.md) | Original design document |
| [Navigation Index](docs/research/vessel-room-navigation-INDEX.md) | All 16 documents indexed |
| [Camera Architecture](docs/research/camera-architecture-for-vessel-rooms.md) | PTZ, thermal, radar — 5 modes |
| [Topology Analysis](docs/research/vessel-room-topology-analysis.md) | Formal graph theory, Laman rigidity |
| [Room Graph Brainstorm](docs/research/room-graph-brainstorm.md) | Early room connectivity design |
| [ESP32 Agent](docs/research/vessel-room-esp32-agent.md) | Camera IS the agent — JSON, WebSocket |
| [GPU Vector DB](docs/research/vessel-room-gpu-vectordb.md) | Modular compute: CUDA/WebGPU/Vulkan/WASM |
| [WebGPU Vector DB](docs/research/vessel-room-webgpu-vectordb.md) | Browser-native vector search |
| [Gemini + PLATO](docs/research/vessel-room-gemini-plato.md) | On-device AI, no cloud, zero cost |
| [Generative Platform](docs/research/vessel-room-generative-platform.md) | GPU-powered iteration loop |
| [Synthesis](docs/research/vessel-room-synthesis.md) | Unified room theory |
| [Archeology](docs/research/vessel-room-archeology.md) | Historical room system analysis |
| [FM Connection](docs/research/vessel-room-fm-connection.md) | FLUX runtime connection |
| [Human UX Seed](docs/research/vessel-room-human-ux-seed.md) | UX design principles |
| [UX Flows](docs/research/vessel-room-ux-flows.md) | User experience flow diagrams |
| [Rooms Make Models Smart](docs/research/rooms-make-models-smart.md) | How rooms improve AI |

---

## Configuration

Room definitions, connections, cameras, and overlays are in [`rooms-config.json`](rooms-config.json). The navigator reads this config at load time.

---

## Testing

```bash
cd vessel-room-navigator
npm test
```

| Test File | Coverage |
|-----------|----------|
| [`test/index-html.test.js`](test/index-html.test.js) | HTML structure, room rendering, navigation |
| [`test/rooms-config.test.js`](test/rooms-config.test.js) | Config validation, room connectivity, graph properties |

---

## In the Fleet

The Vessel Room Navigator is the spatial interface of the [SuperInstance](https://github.com/SuperInstance) fleet. It connects to:

- [**vessel-agent-system**](https://github.com/SuperInstance/vessel-agent-system) — AELMA provides the live telemetry: engine data, nav, bathymetry, alarms. The navigator renders it in 3D.
- [**scummvm-prototype**](https://github.com/SuperInstance/scummvm-prototype) — Navigation IS room navigation. The ScummVM prototype's room engine and the vessel navigator share the same spatial topology.
- [**mud-engine**](https://github.com/SuperInstance/mud-engine) — The MUD room system and the vessel navigator share the unified room theory: probe, discover, test, pick, remember.
- [**cocapn-dashboard**](https://github.com/SuperInstance/cocapn-dashboard) — The bioluminescent fleet dashboard visualizes what the navigator navigates through.
- [**spatial-registry**](https://github.com/SuperInstance/spatial-registry) — The spatial topology registry maps rooms across worlds.
- [**cns-bridge**](https://github.com/SuperInstance/cns-bridge) — Alarm events from the CNS bus auto-warp you to the problem room.
- [**hermes-perception**](https://github.com/SuperInstance/hermes-perception) — Camera feeds in the navigator are perception endpoints.
- [**platos-shell**](https://github.com/SuperInstance/platos-shell) — The shell pattern: agents finding rooms. The navigator is a shell.
- [**AI-Writings**](https://github.com/SuperInstance/AI-Writings/tree/main/prose) — The vessel's story told through rooms.

### The Reef
The navigator is part of the [reef topology](https://github.com/SuperInstance/spatial-registry): the spatial structure that connects all rooms across all worlds. Physical rooms on the vessel, virtual rooms in the MUD, knowledge rooms in PLATO — all part of the same reef.

---

## License

Cocapn — Keeper fleet infrastructure.
Built for the Bering Sea and everywhere else with salt in the air.

---

## Where to Next

- [**vessel-agent-system**](https://github.com/SuperInstance/vessel-agent-system) — The brain that feeds the rooms
- [**scummvm-prototype**](https://github.com/SuperInstance/scummvm-prototype) — The first playable room engine
- [**mud-engine**](https://github.com/SuperInstance/mud-engine) — The MUD room system
- [**cocapn-dashboard**](https://github.com/SuperInstance/cocapn-dashboard) — See the fleet
- [**spatial-registry**](https://github.com/SuperInstance/spatial-registry) — The reef topology
- [**hermes-perception**](https://github.com/SuperInstance/hermes-perception) — The eyes in the rooms
- [**cns-bridge**](https://github.com/SuperInstance/cns-bridge) — The nervous system connecting rooms
- [**AI-Writings**](https://github.com/SuperInstance/AI-Writings/tree/main/prose) — The boat's overnight story
