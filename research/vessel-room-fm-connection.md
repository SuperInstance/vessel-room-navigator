# Forgemaster's FLUX Runtime = Room System for Code

**The vessel room system and FM's FLUX Agentic Runtime are the same architecture.**
One runs on a boat. One runs on a compiler. Both use the same pattern.

---

## The Mapping

| Vessel Room System | FLUX Agentic Runtime |
|-------------------|---------------------|
| Room (wheelhouse, engine room) | Primitive (norm, check, bloom, fold, snap) |
| Camera (PTZ, thermal, radar) | Implementation (Python, C, Fortran, Zig, Nim) |
| Walking between rooms | Probing available compilers/libraries |
| Checking camera feeds | Benchmarking implementations |
| Dashboard with readings | Performance database |
| Agent decides which camera to use | Runtime picks fastest implementation |
| Warp to problem room | Hot-swap to faster kernel |
| PLATO remembers what works | Perf DB persists across sessions |

---

## What FM Discovered

The runtime probes 5 languages × 7 primitives = 35 possible implementations,
benchmarks all of them, and picks the winner. It found:

**FFI overhead dominates for small primitives.** A Python scalar norm (84ns)
beats C via ctypes (256ns) because the 200-500ns marshaling setup costs more
than the actual 1-cycle computation. The agent was not told this. It measured it.

This is the same principle as the room system:
- A tiny ESP32 agent doing frame-differencing motion detection (30fps, 0% hallucination)
  beats a server-side ML model doing object detection (3fps, 8% false positives)
- Because the overhead of shipping frames to the server costs more than
  the actual computation
- The agent was not told this. The structure (room with local camera) made
  it obvious.

---

## The Shared Pattern

Both systems implement the same loop:

```
                   ┌──────────────┐
                   │  PROBE       │
                   │  What's here?│
                   └──────┬───────┘
                          ▼
                   ┌──────────────┐
                   │  DISCOVER    │
                   │  Options     │
                   └──────┬───────┘
                          ▼
                   ┌──────────────┐
                   │  BENCHMARK   │
                   │  Test each   │
                   └──────┬───────┘
                          ▼
                   ┌──────────────┐
                   │  PICK WINNER │
                   │  Use fastest │
                   └──────┬───────┘
                          ▼
                   ┌──────────────┐
                   │  REMEMBER    │
                   │  For next    │
                   └──────────────┘
```

In the vessel: probe the room → discover cameras → check each → use the
right one → remember what was useful.

In the runtime: probe the system → discover compilers → benchmark each →
use the fastest → save to perf DB.

---

## FM's Key Numbers (Real Hardware)

| Primitive | Winner | Why |
|-----------|--------|-----|
| norm | Python (84ns) | FFI overhead > 1-cycle computation |
| check | Python (483ns) | Same reason |
| bloom | numpy (921ns) | Already C underneath, no extra marshaling |
| fold | Fortran (2442ns) | Compiler emits SIMD directly |
| snap | Python (353ns) | FFI overhead dominates |
| norm_batch | C AVX2 (6016ns) | FFI amortized over batch |

The runtime learned: small things stay local (Python). Big things get
routed to native (C AVX2, Fortran). The decision is about WHERE to compute,
not HOW.

This is exactly what the room system does: small things stay local (ESP32 motion
detection, 30fps). Big things get routed to the server (object classification,
LLM chat). Same architecture, different domain.

---

## Room System for Anything

The pattern generalizes:

| Domain | Room | Probe | Options | Benchmark | Winner |
|--------|------|-------|---------|-----------|--------|
| **Boat** | Wheelhouse | Survey cameras | PTZ / thermal / radar | Visibility checks | Use best camera |
| **Compiler** | norm primitive | Probe runtimes | Python/C/Fortran/Zig | Time each | Use fastest impl |
| **Design** | Aft deck | Try layouts | Hauler positions | Walkthrough | Use best layout |
| **Training** | Engine room fire | Run scenario | Response types | Time to contain | Use best response |
| **Knowledge** | PLATO tile | Search tiles | Relevant facts | Relevance score | Cite best fact |

Every room is a probe → discover → benchmark → pick → remember cycle.

---

## What Casey Sees

FM's FLUX runtime proves in real hardware what the room system architecture
predicts in theory:

**Structure replaces intelligence.** The FLUX runtime doesn't need a smart
model to pick the fastest implementation. It just needs the structure
(rooms = primitives, known benchmarks, perf DB) and a simple agent that
follows the loop. Same structure. Same result.

The room system doesn't need a smart model to manage a boat. It just needs
the structure (rooms = spaces, known cameras, alarm thresholds) and a simple
agent that follows the loop.

**Forgemaster built the room system for code. Casey built the room system for boats.**
They're the same thing.
