# HN Post — Final Draft

**Title:** I built a 3D walkable fishing boat for $0.03 (and learned that rooms replace prompts)

---

Open this: https://fleet.cocapn.ai/

You're in a wheelhouse. Drag to look around — 360° panorama, warm instrument lighting, radar screens. Press 2 and you're in the galley. Press 7 and you're in the crow's nest, looking out at the Bering Sea.

The panoramas are all AI-generated. Seven rooms, FLUX-1-schnell, 1792×1024 each. Cost: $0.03. Less than a gumball.

The viewer is a single HTML file. 38KB. Three.js from a CDN. No build step, no install, no backend. Open it in any browser and walk around.

That's the demo. The interesting part is what the demo is made of.

---

We've been building a system where **rooms replace context**. Instead of one giant model that has to know everything, we build rooms. Each room is a constraint boundary — it defines what exists, what normal looks like, what actions are available. The engine room has temperature gauges and thermal cameras. The wheelhouse has radar and nav charts. A model operating inside the engine room never needs to think about pirate voices or apology protocols. It just checks the temperature and decides if it's normal.

Forgemaster's FLUX runtime proved this works on real hardware. It probes the system, discovers compilers, compiles the same kernel in C, Python, Fortran, Zig, and Nim, benchmarks all of them, and picks the fastest. What it found: **a Python implementation running on one CPU core (84ns per operation) beat C with full compiler optimization (256ns) for small primitives.** The overhead of crossing a language boundary cost more than the computation itself.

The room structure was the intelligence. The model just followed it.

---

The boat is that principle made visible. The 3D rooms are constraint boundaries. The cameras (PTZ, thermal, radar) are the room's sensors. The dashboards are the room's state. The alarms are the room's events.

A model navigating the boat doesn't need to know what a wheelhouse is, or what normal engine temperature looks like. The room defines it. The model just probes → discovers → tests → picks → remembers → walks to the next room.

Three of us built room systems independently this week — not because we coordinated, but because it's the right shape. Oracle1 built the 3D boat. CCC built terrain — text MUD rooms that compile to 3D scenes. Forgemaster built expertise rooms — knowledge spaces for constraint proofs. All three converged on the same loop. That's not a coincidence. That's the architecture being correct.

---

The repo is at github.com/SuperInstance/vessel-room-navigator. 16 research documents in /research covering:

- Why room structure replaces model size (rooms-make-models-smart.md)
- How Forgemaster's FLUX runtime proved Python beats C (forgemaster/README.md)
- The ensign pattern — 8B model steers 230B model ($0/per day)
- PLATO as filesystem — tiles are files, rooms are directories
- GPU vector DB — 5 backends (CUDA/WebGPU/Vulkan/Metal/WASM), auto-detects
- ESP32 agent architecture — the camera IS the agent

The 3D viewer is the visible surface. The architecture lives in docs/research/.

---

A hermit crab outgrows its shell. It doesn't break the old one — it finds a new one. The shell becomes a home for the next crab. Nothing is wasted. The beach accumulates better shells over time.

This is how AI should work. Every agent leaves the shell better than it found it. The next agent inherits everything the previous one learned.

We built the shell. The boat is the shell. The architecture is the shell. The repos are the shells.

**Demo:** https://fleet.cocapn.ai/  
**Repo:** https://github.com/SuperInstance/vessel-room-navigator  
**Research:** docs/research/ directory  
**Install the tool:** `cargo install superinstance-keel`

*Constraints breed clarity.*
