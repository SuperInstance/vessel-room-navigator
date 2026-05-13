# Cocapn Vessel Room Navigator 🚢

**Your boat as a navigable 3D web space.**  
ScummVM meets Google Street View for a fishing vessel. Walk between rooms, warp instantly, monitor cameras, read gauges, respond to alarms, and design mockups — all in your browser.

**[→ Launch the Navigator](https://superinstance.github.io/vessel-room-navigator/)**

---

## What It Is

Every physical space on the vessel is a "room" — a 360° panoramic webpage. The room system is the UI. No menus, no abstractions. The boat IS the interface.

| You can | How |
|---------|-----|
| **Look around** | Drag or touch. 360° interior spheres. |
| **Walk rooms** | Click doors in the panel. Smooth transitions. |
| **Warp instantly** | Teleport to any room. ⚡ buttons or keys 1-9. |
| **Monitor cameras** | PTZ, thermal, radar feeds in corner viewports. |
| **Check gauges** | Live dashboards: RPM, temps, fuel, nav data. |
| **Respond to alarms** | Trigger test alarms → click to auto-warp. |
| **Design mockups** | 🎨 panel: "add a winch" or "show fire" → 3D objects. |
| **Chat with agent** | 💬 panel: type commands, get responses. |
| **Use on any device** | Desktop, tablet, phone — responsive. |

---

## Rooms

| Room | Type | What's There |
|------|------|-------------|
| 🚪 **Wheelhouse** | Physical | Engine dash, radar, nav display, compass |
| 🚪 **Galley** | Physical | Warm kitchen, porthole view |
| 🚪 **Foredeck** | Physical | Bow camera, open ocean horizon |
| 🚪 **Aft Cockpit** | Physical | Stern cam, simplified nav display |
| 🚪 **Engine Room** | Physical | 4 thermal cameras, gauge monitor |
| 🚪 **Wheelhouse Roof** | Physical | 360° panorama, radar antenna |
| 🚪 **Crow's Nest** | Physical | PTZ gunnery station, horizon scan |
| 🖥️ **Alarm Center** | Virtual | Composite alert monitoring |
| 🧩 **4-Camera Wall** | Composite | Multi-angle display grid |

---

## Design Philosophy

**Rooms make tiny models smart.** The room structure encodes the intelligence. Cameras, sensors, thresholds, adjacencies — each room defines what's possible and relevant. An ESP32 agent following room constraints outperforms a 70B-parameter model without structure. (See [research/](research/) for the full analysis.)

### Architecture

```
┌──────────────────────────────────────────┐
│            Browser (Three.js)             │
│  Panorama spheres • Viz engine • Chat    │
├──────────────────────────────────────────┤
│         ESP32 Agents (camera IS agent)   │
│  PTZ servos • Motion detection • ESP-NOW │
├──────────────────────────────────────────┤
│         GPU Vector DB (modular)          │
│  WebGPU • CUDA • Metal • Vulkan • WASM   │
├──────────────────────────────────────────┤
│              PLATO Knowledge             │
│  Tiles • Lessons • Agent memory          │
└──────────────────────────────────────────┘
```

---

## Quick Start

```bash
# Serve locally
python3 -m http.server 8888
# → http://localhost:8888

# Or just open index.html in any browser
```

### Controls

| Key | Action |
|-----|--------|
| Drag mouse | Look around |
| WASD / Arrow keys | Quick direction |
| 1-9 | Warp to room number |
| Side panel ☰ | Walk, warp, cameras, alarms |
| 🎨 button | Open design panel |
| 💬 button | Open chat with agent |

---

## Research Library

11 documents, ~32,000 words. All in [research/](research/):

| Doc | Focus | Key Insight |
|-----|-------|-------------|
| [Design Synthesis](research/vessel-room-navigation-design.md) | Full architecture | 9 room types, navigation semantics, alarm routing |
| [Camera Architecture](research/camera-architecture-for-vessel-rooms.md) | 5 cam types × 5 modes | Sensor fusion, PTZ API, offline degradation |
| [Topology Analysis](research/vessel-room-topology-analysis.md) | Formal graph theory | Laman rigidity E=14<15, add F↔ER edge |
| [Room Graph Theory](research/room-graph-brainstorm.md) | LOD, caching, federation | 3-tier bandwidth, room inheritance |
| [Archeology](research/vessel-room-archeology.md) | 1986→1996→2006→2036→2046 | 1986 clipboard was genius — digital must match |
| [UX Flows](research/vessel-room-ux-flows.md) | Human + agent patterns | 3-second alarm rule, glance/stare model |
| [ESP32 Agent](research/vessel-room-esp32-agent.md) | Camera IS the agent | JSON/WebSocket, ESP-NOW mesh, 10μA deep sleep |
| [Viz Engine](research/vessel-room-visualization-engine.md) | Prompt → 3D mockups | Scene compiler, primitives library, simulation timeline |
| [GPU Vector DB](research/vessel-room-gpu-vectordb.md) | Modular compute layer | CUDA/WebGPU/Vulkan/Metal/WASM backends, auto-detect |
| [Rooms Make Models Smart](research/rooms-make-models-smart.md) | Constraint theory | Room structure > model size. ESP32 beats 70B LLM. |
| [INDEX](research/vessel-room-navigation-INDEX.md) | Master index | 32K words mapped across 9 documents |

---

## Live Demo

**https://superinstance.github.io/vessel-room-navigator/**

Open in any modern browser. Click, drag, warp, design. No install, no server.

---

## License

Cocapn — Keeper fleet infrastructure.
