# Unified Room Theory — Synthesis

**The vessel room system and FM's FLUX runtime are one architecture.**
Same loop. Same structure. The agent doesn't care if the room is a physical
space or a code primitive. It just navigates rooms.

---

## The One Pattern

```
Every room, in any domain:
┌─────────────────────────────────────────┐
│  PROBE    →  what's here?              │
│  DISCOVER →  what are the options?     │
│  TEST     →  which works best?         │
│  PICK     →  use the winner           │
│  REMEMBER →  save for next time       │
└─────────────────────────────────────────┘
```

This is the only agent pattern that matters. Everything else is a room.

---

## Unified Room Definition

```javascript
// One Room type for ALL domains
interface Room {
  id: string;
  domain: 'physical' | 'code' | 'design' | 'knowledge';
  
  // What can you do here?
  capabilities: Capability[];
  // A capability is: a camera, an implementation, a layout option, a fact
  
  // How do you test each capability?
  benchmark: (capability) => Score;
  // Score = { latency, accuracy, cost, confidence }
  
  // Who is this room connected to?
  adjacencies: string[]; // Room IDs you can reach
  
  // What does this room know?
  knowledge: PLATOTile[];
  
  // What should the agent remember?
  memory: { capability: string, score: Score, timestamp: number }[];
}
```

---

## Cross-Domain Roaming

An agent can walk from a physical room to a code room to a knowledge room:

```
Casey's boat                    FM's compiler                     PLATO
─────────────                   ────────────                      ──────
Wheelhouse ──── walk ────►  norm primitive ──── walk ────►  engine temp tiles
  Camera: PTZ                    Impl: Python                     Q: normal range?
  Camera: thermal                Impl: C                         Q: symptoms?
  Camera: radar                  Impl: Fortran                    Q: procedure?
  └── test each ──┐             └── test each ──┐               └── search ──┐
                   ▼                            ▼                            ▼
             Winner: radar               Winner: Python              Winner: tile #42
             (best for nav)              (84ns, FFI cost)            (confidence 0.91)
```

One agent. One loop. Three domains. Zero modality switching.

---

## Unified Agent Loop

```javascript
class RoomAgent {
  async navigate(roomId, goal) {
    const room = await this.loadRoom(roomId);
    
    // 1. PROBE — what's here?
    const capabilities = room.capabilities;
    
    // 2. DISCOVER — what are the options?
    const options = await Promise.all(
      capabilities.map(c => this.discover(c))
    );
    
    // 3. TEST — which works best for this goal?
    const scores = await Promise.all(
      options.map(o => room.benchmark(o, goal))
    );
    
    // 4. PICK — use the winner
    const winner = scores.sort((a, b) => b.score - a.score)[0];
    await this.execute(winner.capability, goal);
    
    // 5. REMEMBER — save for next time
    await room.memory.push({
      capability: winner.capability.id,
      score: winner.score,
      goal,
      timestamp: Date.now()
    });
    
    // 6. Optionally walk to an adjacent room
    if (winner.nextRoom) {
      await this.navigate(winner.nextRoom, goal);
    }
  }
}
```

---

## Domain-Specific Room Implementations

### Physical Room (Vessel)
```javascript
// A wheelhouse room
const room = {
  id: "wheelhouse",
  domain: "physical",
  capabilities: [
    { id: "ptz_cam", type: "camera", label: "PTZ Lookout", modes: ["pan", "tilt", "zoom", "track"] },
    { id: "thermal_cam", type: "camera", label: "Thermal", modes: ["monitor", "hotspot"] },
    { id: "radar", type: "display", label: "Radar", modes: ["nav", "weather"] },
  ],
  benchmark: async (cap, goal) => {
    if (goal === "navigation") return { capability: cap, score: cap.id === "radar" ? 0.95 : 0.6 };
    if (goal === "lookout") return { capability: cap, score: cap.id === "ptz_cam" ? 0.9 : 0.5 };
    if (goal === "engine_monitor") return { capability: cap, score: cap.id === "thermal_cam" ? 0.93 : 0.3 };
  },
  adjacencies: ["galley", "engine_room", "wheelhouse_roof"],
};
```

### Code Primitive Room (FLUX Runtime)
```javascript
// A norm primitive room
const room = {
  id: "norm",
  domain: "code",
  capabilities: [
    { id: "python", type: "implementation", lang: "Python", lines: 3 },
    { id: "c_ctypes", type: "implementation", lang: "C", ffi: true },
    { id: "fortran", type: "implementation", lang: "Fortran", simd: true },
    { id: "zig", type: "implementation", lang: "Zig" },
    { id: "nim", type: "implementation", lang: "Nim", compiled: true },
  ],
  benchmark: async (cap, goal) => {
    // Run 1000 iterations, measure
    const latency = await measureLatency(cap);
    // FFI overhead penalty if applicable
    const score = 1 / (latency + (cap.ffi ? 300 : 0)); // ns
    return { capability: cap, score };
  },
  adjacencies: ["check", "bloom", "fold", "snap"], // Dependencies
};
```

### Knowledge Room (PLATO)
```javascript
// A room of related PLATO tiles
const room = {
  id: "engine_temp_knowledge",
  domain: "knowledge",
  capabilities: [
    { id: "tile_42", type: "fact", question: "normal temp range?", confidence: 0.91 },
    { id: "tile_58", type: "fact", question: "overheat procedure?", confidence: 0.87 },
    { id: "tile_103", type: "fact", question: "fuel filter clog?", confidence: 0.79 },
  ],
  benchmark: async (cap, goal) => {
    // Relevance to goal via vector search
    const relevance = await vectorSimilarity(cap.question, goal);
    return { capability: cap, score: relevance * cap.confidence };
  },
  adjacencies: ["engine_room", "fuel_system_knowledge", "maintenance_logs"],
};
```

---

## The Synthesized System

```
┌──────────────────────────────────────────────────────────────────┐
│                     UNIFIED ROOM SYSTEM                           │
│                                                                  │
│  ┌─────────────────┐  ┌────────────────┐  ┌───────────────────┐ │
│  │ Physical Rooms   │  │ Code Primitives│  │ Knowledge Rooms   │ │
│  │ (Vessel spaces)  │  │ (FLUX runtime) │  │ (PLATO tiles)     │ │
│  ├─────────────────┤  ├────────────────┤  ├───────────────────┤ │
│  │ Wheelhouse      │  │ norm           │  │ engine temp       │ │
│  │ Engine Room     │  │ check          │  │ fuel system       │ │
│  │ Crow's Nest     │  │ bloom          │  │ maintenance       │ │
│  │ Foredeck        │  │ fold           │  │ emergency proc    │ │
│  │ Aft Cockpit     │  │ snap           │  │ training modules  │ │
│  └─────────────────┘  └────────────────┘  └───────────────────┘ │
│                       ↕        ↕        ↕                         │
│              ┌────────────────────────────────────┐               │
│              │         ONE AGENT LOOP              │               │
│              │  probe → discover → test → pick →  │               │
│              │  remember → walk to next room       │               │
│              └────────────────────────────────────┘               │
│                       ↕        ↕        ↕                         │
│              ┌────────────────────────────────────┐               │
│              │    UNIVERSAL MEMORY (PLATO)         │               │
│              │  Every room's winner, every score,  │               │
│              │  every timestamp — searchable        │               │
│              └────────────────────────────────────┘               │
│                       ↕                                           │
│              ┌────────────────────────────────────┐               │
│              │    MODULAR GPU COMPUTE LAYER       │               │
│              │  WebGPU / CUDA / Metal / Vulkan /   │               │
│              │  WASM — whichever is fastest here   │               │
│              └────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
```

---

## What This Unlocks

### FM navigates Casey's boat
```
FM's agent walks into the engine room:
  → Probes capabilities: thermal cams, temp sensors
  → Runs its benchmark loop on each
  → Picks the thermal camera as best for "monitor port engine"
  → Remembers: "engine_room / thermal_cam → winner for monitoring"
  → Walks to adjacent room: wheelhouse
  → Reports findings on the dashboard
```

### Casey's agent navigates FM's compiler
```
Vessel agent walks into the norm primitive:
  → Probes capabilities: Python, C, Fortran, Zig
  → Benchmarks each
  → Picks Python (84ns, FFI cost too high for C)
  → Remembers: "norm / python → winner for short arrays"
  → Walks to adjacent primitive: check
  → Applies same pattern
```

### Both agents share PLATO
```
FM learns: "AVX2 batch norm is fastest for arrays >100 elements"
  → Files PLATO tile: norm_avx2_batch, confidence 0.94
  
Casey's agent searches PLATO:
  → "Is there a way to speed up radar processing?"
  → Finds FM's tile: "batch norm with AVX2"
  → Routes radar frames through FM's optimizer
  → Radar updates 3x faster
```

---

## The One-Sentence Synthesis

**Everything is a room. Every room has capabilities. The agent's only job is to
probe → test → pick → remember. The structure of the room graph IS the intelligence.**

FM's primitives, Casey's vessel spaces, PLATO's knowledge tiles —
same architecture, same loop, same agent.
