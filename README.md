# Cocapn Vessel Room Navigator 🚢

**Your boat as a navigable 3D web space.**  
ScummVM meets Google Street View. Walk between rooms, warp instantly, monitor cameras, read gauges, respond to alarms, and design 3D mockups — all in your browser.

**[→ Launch the Navigator](https://superinstance.github.io/vessel-room-navigator/)**

---

## What Is This?

Every physical space on a fishing vessel is a "room" — a 360° panoramic webpage. The room system IS the user interface. No menus, no abstractions. The boat IS the interface.

Walk from the wheelhouse to the engine room. Warp instantly to the crow's nest. Check thermal cameras, read engine gauges, respond to alarms, or pull up the design panel and type "add a winch" to see a 3D mockup rendered right in the room.

**[Click here to try it right now.](https://superinstance.github.io/vessel-room-navigator/)** No install, no signup, no server. Just a browser.

---

## Features

| | What you can do |
|---|---|
| 🎯 **360° Rooms** | Drag to look around 7 AI-photorealistic panoramas |
| 🚶 **Walk / Warp** | Click doors to walk, ⚡ to teleport, or press 1-9 |
| 📷 **Cameras** | Static placeholder images (thermal/radar/gunnery) in corner viewports — **not** live PTZ/thermal/radar feeds |
| 📊 **Dashboards** | Simulated demo gauges (random jitter around static baseline values — **not** connected to real sensors or telemetry) |
| 🚨 **Alarms** | Trigger alarms → click to auto-warp to problem room |
| 🎨 **Visualizer** | Type "add a winch" or "show smoke" → 3D mockups render in-room |
| 💬 **Chat** | Keyword-triggered object placer; unrecognized input returns a random canned reply (no AI / no LLM) |
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
open https://superinstance.github.io/vessel-room-navigator/

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

> **Legend:** ✅ = real and running in the live demo today (verified against `index.html`).
> 🔮 = architecture explored in `research/*.md`, **not** implemented in the deployed single-file demo.
>
> The live site is a **standalone single HTML file with no backend, no WebSocket, and no network calls** beyond loading static `.jpg` textures. (Verified: `index.html` contains zero `fetch(` / `WebSocket(` calls.) Rows marked 🔮 describe research directions, not shipping behavior.

| Layer | Status | What's actually in the demo |
|-------|:------:|-----------------------------|
| 3D rendering | ✅ | Three.js rendering a 360° panorama onto the inside of a sphere (`THREE.TextureLoader`, `WebGLRenderer`). |
| Panorama textures | ✅ | 10 static `.jpg` files at 1792×1024 (verified dimensions). They were **generated offline** with FLUX-1-schnell; the demo just loads these static images — there is no runtime image generation. |
| Visualization engine | ✅ | Three.js primitives — boxes, cylinders, spheres, tori, cones, particle "fire", and "crew" figures — placed by the visualizer panel. |
| Chat / voice | 🔮 | Gemini Nano + PLATO are **research-only**. The actual chat handler is `parsePrompt`, a keyword→primitive map; unrecognized input returns a random line from a 5-item hardcoded fallback array (`fb`). No LLM, no Gemini, no cloud call. |
| Camera agents | 🔮 | ESP32-S3 firmware is **research-only**. In the demo, "cameras" are static `.jpg` placeholders shown in corner viewports (selected by camera type: thermal/radar/gunnery/default). There is no hardware link, no PTZ control, and no live feed. |
| Vector search | 🔮 | WebGPU / CUDA / Vulkan / Metal / WASM vector DB is **research-only** ([docs](docs/research/vessel-room-gpu-vectordb.md)). Not present in the demo. |
| Knowledge base | 🔮 | PLATO room server is **research-only** ([docs](docs/research/vessel-room-gemini-plato.md)). Not present in the demo. |

---

## License

Cocapn — Keeper fleet infrastructure.  
Built for the Bering Sea and everywhere else with salt in the air.
