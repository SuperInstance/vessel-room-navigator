# Cocapn Vessel Room Navigator 🚢

**Your boat as a navigable 3D web space.**  
ScummVM meets Google Street View. Walk between rooms, warp instantly, monitor cameras, read gauges, respond to alarms, and design 3D mockups — all in your browser.

**[→ Launch the Navigator](https://fleet.cocapn.ai/)**

---

## What Is This?

Every physical space on a fishing vessel is a "room" — a 360° panoramic webpage. The room system IS the user interface. No menus, no abstractions. The boat IS the interface.

Walk from the wheelhouse to the engine room. Warp instantly to the crow's nest. Check thermal cameras, read engine gauges, respond to alarms, or pull up the design panel and type "add a winch" to see a 3D mockup rendered right in the room.

**[Click here to try it right now.](https://fleet.cocapn.ai/)** No install, no signup, no server. Just a browser.

---

## Features

| | What you can do |
|---|---|
| 🎯 **360° Rooms** | Drag to look around 7 AI-photorealistic panoramas |
| 🚶 **Walk / Warp** | Click doors to walk, ⚡ to teleport, or press 1-9 |
| 📷 **Cameras** | PTZ, thermal, radar feeds in corner viewports |
| 📊 **Dashboards** | Live engine, nav, and monitor gauges |
| 🚨 **Alarms** | Trigger alarms → click to auto-warp to problem room |
| 🎨 **Visualizer** | Type "add a winch" or "show smoke" → 3D mockups render in-room |
| 💬 **Chat** | Talk to the room agent, get responses |
| 🔑 **Keys** | WASD/Arrow = look. 1-9 = warp. ☰ = panel. |

---

## Rooms

| Room | Type | Has |
|------|------|-----|
| Wheelhouse | Physical | Engine dash, radar, nav display |
| Galley | Physical | Warm kitchen, porthole view |
| Foredeck | Physical | Bow camera, open ocean |
| Aft Cockpit | Physical | Stern cam, simplified nav display |
| Engine Room | Physical | 4 thermal cameras, gauge monitor |
| Wheelhouse Roof | Physical | 360° panorama, radar antenna |
| Crow's Nest | Physical | PTZ gunnery station |
| Alarm Center | Virtual | Composite alert monitoring |
| 4-Camera Wall | Composite | Multi-angle display |

---

## How to Use

```bash
# Option 1: Open the live site
open https://fleet.cocapn.ai/

# Option 2: Serve locally
git clone https://github.com/SuperInstance/vessel-room-navigator.git
cd vessel-room-navigator
python3 -m http.server 8888
# → http://localhost:8888
```

No build step. No dependencies. No server. Works offline after first load.

---

## Architecture

The room system is a **unified probe/discover/test/pick/remember loop** that applies to any domain:

```
                          ONE AGENT LOOP
┌──────────────────────────────────────────────────────────┐
│  probe → discover → test → pick → remember → walk       │
│                                                          │
│  Physical rooms  ◄──►  Code primitives  ◄──►  Knowledge  │
│  (vessel spaces)     (FLUX compiler)        (PLATO)       │
└──────────────────────────────────────────────────────────┘
```

Everything is a room. Every room has capabilities. The agent's only job is to find what works best. [Read the synthesis →](docs/research/vessel-room-synthesis.md)

---

## Research

16 documents, ~240KB, covering every angle:

| Document | Focus |
|----------|-------|
| [Design Synthesis](docs/research/vessel-room-navigation-design.md) | Full architecture, 9 room types |
| [Camera Architecture](docs/research/camera-architecture-for-vessel-rooms.md) | PTZ, thermal, radar — 5 modes |
| [Topology Analysis](docs/research/vessel-room-topology-analysis.md) | Formal graph theory, Laman rigidity |
| [ESP32 Agent](docs/research/vessel-room-esp32-agent.md) | Camera IS the agent — JSON, WebSocket |
| [GPU Vector DB](docs/research/vessel-room-gpu-vectordb.md) | Modular compute: CUDA/WebGPU/Vulkan/WASM |
| [Gemini + PLATO](docs/research/vessel-room-gemini-plato.md) | On-device AI, no cloud, zero cost |
| [Generative Platform](docs/research/vessel-room-generative-platform.md) | GPU-powered iteration loop |
| [Synthesis](docs/research/vessel-room-synthesis.md) | Unified room theory |
| [Full index →](docs/research/vessel-room-navigation-INDEX.md) | All 16 documents |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D rendering | Three.js (360° sphere interiors) |
| Panorama textures | FLUX-1-schnell (AI-generated, 1792×1024) |
| Visualization engine | Three.js primitives (boxes, cylinders, particles) |
| Chat/voice | Gemini Nano (browser-native AI) + PLATO tiles |
| Camera agents | ESP32-S3 firmware (C++, JSON/WebSocket, ESP-NOW) |
| Vector search | WebGPU / CUDA / Vulkan / Metal / WASM (modular) |
| Knowledge base | PLATO room server (distributed tile system) |

---

## License

Cocapn — Keeper fleet infrastructure.  
Built for the Bering Sea and everywhere else with salt in the air.
