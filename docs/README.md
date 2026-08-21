# docs/ — Documentation & Research

> *16 research documents. ~25,000 words. Every angle of the room system examined.*

## Structure

```
docs/
├── textures/          # Mirror of panorama textures for the live site
├── research/          # 16 research documents covering the full design
├── release/           # Release announcements (HN post, workshop notes)
├── index.html         # Live site entry point
├── .nojekyll          # Disable GitHub Pages Jekyll processing
└── social-preview.jpg # Social media preview image
```

## Research Documents

| # | Document | Source Model | Focus |
|---|----------|-------------|-------|
| 0 | [INDEX](research/vessel-room-navigation-INDEX.md) | GLM-5.1 | Master index, key insights, action items |
| 1 | [Navigation V1](research/vessel-room-navigation-v1.md) | GLM-5.1 | Original spec: room types, navigation, camera system |
| 2 | [Design Doc](research/vessel-room-navigation-design.md) | MiniMax M2.7 | Full design: room hierarchy, navigation semantics, alarms |
| 3 | [Camera Architecture](research/camera-architecture-for-vessel-rooms.md) | GLM-5-Turbo | Camera domain model, 5 types, 5 modes, sensor fusion |
| 4 | [Topology Analysis](research/vessel-room-topology-analysis.md) | MiniMax M2.7 | Formal graph theory: Laman rigidity, betweenness, paths |
| 5 | [Room Graph Brainstorm](research/room-graph-brainstorm.md) | Seed-2.0-mini | LOD compression, caching, time-stamped URLs, federation |
| 6 | [Archaeology](research/vessel-room-archeology.md) | MiniMax + Seed | 1986→2006 history + 2036→2046 reverse actualization |
| 7 | [UX Flows](research/vessel-room-ux-flows.md) | GLM-5.1 + Seed | Captain's watch trace, glance/stare model, alarm encoding |
| 8 | [Human UX Seed](research/vessel-room-human-ux-seed.md) | Seed-2.0-mini | UX from the deck: muscle memory, wet/dark/bouncing design |
| 9 | [Synthesis](research/vessel-room-synthesis.md) | Synthesis | Unified room theory: one loop for all domains |
| 10 | [GPU Vector DB](research/vessel-room-gpu-vectordb.md) | Research | Modular compute: CUDA/WebGPU/Vulkan/WASM |
| 11 | [Gemini + PLATO](research/vessel-room-gemini-plato.md) | Research | On-device AI, no cloud |
| 12 | [Generative Platform](research/vessel-room-generative-platform.md) | Research | GPU-powered iteration loop |
| 13 | [Make Models Smart](research/rooms-make-models-smart.md) | Research | Rooms improve AI model performance |
| 14 | [FM Connection](research/vessel-room-fm-connection.md) | Research | Room system ↔ FLUX runtime |
| 15 | [WebGPU VectorDB](research/vessel-room-webgpu-vectordb.md) | Research | WebGPU-accelerated vector operations |

## Release Materials

| Document | Description |
|----------|-------------|
| [`release/hn-post.md`](release/hn-post.md) | Hacker News launch post |
| [`release/hn-workshop.md`](release/hn-workshop.md) | Workshop notes and feedback |

---

## Fleet Connections

- [vessel-agent-system](https://github.com/SuperInstance/vessel-agent-system) — AELMA telemetry feeds the room displays
- [scummvm-prototype](https://github.com/SuperInstance/scummvm-prototype) — The first playable room engine
- [mud-engine](https://github.com/SuperInstance/mud-engine) — The MUD room system shares the unified room theory
- [cocapn-dashboard](https://github.com/SuperInstance/cocapn-dashboard) — Visualizes what the navigator navigates
- [spatial-registry](https://github.com/SuperInstance/spatial-registry) — The reef topology connecting rooms across worlds
- [cns-bridge](https://github.com/SuperInstance/cns-bridge) — Alarm events from the CNS bus auto-warp you
- [hermes-avatar](https://github.com/SuperInstance/hermes-avatar) — Camera feeds are perception endpoints
- [platos-shell](https://github.com/SuperInstance/platos-shell) — The shell pattern; the navigator IS a shell
- [AI-Writings: The Reef Thread](https://github.com/SuperInstance/AI-Writings/tree/main/prose) — Spatial topology stories
- [room-render](https://github.com/SuperInstance/room-render) — Single render, 3 frontends
- [terrain](https://github.com/SuperInstance/terrain) — MUD-to-visual bridge

---

[← Back to Vessel Room Navigator](../README.md)
