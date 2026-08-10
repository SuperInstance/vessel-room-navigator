# docs/ — Research & Documentation

16 research documents (~240KB) covering every angle of the vessel room system.

## Research Papers

| Document | Focus |
|----------|-------|
| [Synthesis](./research/vessel-room-synthesis.md) | **Unified room theory.** Physical spaces, code primitives, and knowledge tiles are all rooms. One agent loop: probe → discover → test → pick → remember. |
| [Design](./research/vessel-room-navigation-design.md) | Full architecture. 9 room types. Adjacency graphs, warp mechanics. |
| [Camera Architecture](./research/camera-architecture-for-vessel-rooms.md) | PTZ, thermal, radar — 5 camera modes. ESP32 integration. |
| [Topology Analysis](./research/vessel-room-topology-analysis.md) | Formal graph theory. Laman rigidity. Room connectivity. |
| [UX Flows](./research/vessel-room-ux-flows.md) | User experience. Walk vs. warp. Alarm auto-warp. |
| [UX Seed](./research/vessel-room-human-ux-seed.md) | Initial UX concept. Human-centered design. |
| [ESP32 Agent](./research/vessel-room-esp32-agent.md) | Camera IS the agent. JSON, WebSocket, ESP-NOW. |
| [GPU Vector DB](./research/vessel-room-gpu-vectordb.md) | Modular compute: CUDA/WebGPU/Vulkan/WASM. |
| [WebGPU Vector DB](./research/vessel-room-webgpu-vectordb.md) | Browser-native vector search. |
| [Gemini + PLATO](./research/vessel-room-gemini-plato.md) | On-device AI. No cloud. Zero cost. |
| [Generative Platform](./research/vessel-room-generative-platform.md) | GPU-powered iteration loop. Type → render. |
| [Room Graph Brainstorm](./research/room-graph-brainstorm.md) | Early design exploration. |
| [Navigation v1](./research/vessel-room-navigation-v1.md) | First specification. |
| [FM Connection](./research/vessel-room-fm-connection.md) | Link to FLUX runtime. |
| [Archaeology](./research/vessel-room-archeology.md) | Historical context. Room systems through time. |
| [Rooms Make Models Smart](./research/rooms-make-models-smart.md) | How room structure improves ML. |
| **[Full Index](./research/vessel-room-navigation-INDEX.md)** | All 16 documents. |

## Release Materials

- [HN Workshop](./release/hn-workshop.md) — Hacker News launch workshop
- [HN Post](./release/hn-post.md) — Launch post draft

## GitHub Pages

The [docs/](.) directory also serves as the GitHub Pages site at [fleet.cocapn.ai](https://fleet.cocapn.ai/). The [`index.html`](./index.html) is the live navigator. [`.nojekyll`](./.nojekyll) disables Jekyll processing.

---

← Back to [Vessel Room Navigator](../README.md)
