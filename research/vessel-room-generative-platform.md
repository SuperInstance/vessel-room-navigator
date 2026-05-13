# Rooms as a Generative Development Platform

**The room system is a universal rapid development loop.**  
Prompt → generate → walk through → feedback → iterate → ship.  

With a GPU, rooms become live iterations. The navigation system is the development UI.

---

## The Loop

```
         ┌─────────────┐
         │  PROMPT      │  "design a wheelhouse layout"
         └──────┬───────┘
                ▼
         ┌─────────────┐
         │  GENERATE    │  GPU creates room panorama (FLUX, SD)
         │  panorama    │  + places objects + lays out controls
         └──────┬───────┘
                ▼
         ┌─────────────┐
         │  WALK THROUGH│  User enters room, looks around,
         │  + TEST      │  checks cameras, tests controls
         └──────┬───────┘
                ▼
         ┌─────────────┐
         │  FEEDBACK    │  "too dark" "move the hauler"
         │  + ITERATE   │  "add a thermal cam" "needs more light"
         └──────┬───────┘
                ▼
         ┌─────────────┐
         │  RE-GENERATE │  GPU applies feedback, re-renders
         │  + REFINE    │  loop repeats at interactive speed
         └──────┬───────┘
                ▼
         ┌─────────────┐
         │  SHIP / SAVE │  Export as room config, screenshot,
         │  + DEPLOY    │  or physical build plan
         └─────────────┘
```

**Cycle time per iteration:** 30-120 seconds (depending on GPU).  
**Traditional equivalent:** Days or weeks (hire a designer, build a mockup, etc.)

---

## What the GPU Enables

| GPU | Generate | Iterate | Notes |
|-----|----------|---------|-------|
| RTX 4050 (Forgemaster) | 4K panorama in ~8s | 7/min | Boat hardware |
| RTX 4090 | 4K in ~3s | 20/min | Desktop |
| M4 iPad | 2K in ~10s | 6/min | On-boat tablet |
| Cloud (RunPod/Replicate) | ~2s | 30/min | Paid, uncapped |
| **No GPU** | Pre-made textures | — | What we have now |

With Forgemaster's RTX 4050, a user can generate and refine a new room layout
in under 2 minutes. In an hour, they can explore 30+ design variations.

---

## The Room as an Iteration

Each room version is a datapoint:

```json
{
  "room": "aft_cockpit",
  "version": 7,
  "prompt": "work deck with port hauler, center net bin, starboard controls",
  "generated_by": "FLUX-1-schnell",
  "gpu_time_ms": 3400,
  "feedback": [
    {"user": "casey", "text": "hauler too close to bulwark, move 6in aft", "sentiment": "negative"},
    {"user": "casey", "text": "need more deck clearance aft", "sentiment": "negative"},
    {"user": "casey", "text": "control panel position is perfect", "sentiment": "positive"}
  ],
  "accepted": false,
  "next_prompt": "work deck with port hauler 6in further aft, more deck space, keep starboard controls"
}
```

Over time, the system learns what "good" means for this user. Each iteration
improves the next. The feedback loop is the intelligence.

---

## What You Can Rapidly Develop

### 1. Boat Layouts
```
Prompt: "refit the aft deck for pot fishing"
  → Generate room with pot hauler, bait table, sorting bins
  → Walk through: "too cramped, move bins forward"
  → Regenerate: bins forward, more working room aft
  → Walk through: "better. save as v3."
  → 4 iterations, 8 minutes, done
```

### 2. Emergency Procedures
```
Prompt: "show engine room fire — smoke at port manifold"
  → Generate room with fire VFX, smoke particles, alarm overlays
  → Walk through: "add extinguisher location marker"
  → Regenerate: extinguisher sprite + path overlay
  → Save as training scenario
  → 3 iterations, 6 minutes
```

### 3. Camera System Design
```
Prompt: "crow's nest with PTZ cam, thermal overlay, and auto-track"
  → Generate room with camera mockup + viewport overlays
  → Walk through: "need a wider field of view"
  → Regenerate: wider lens, show FOV cone
  → Save as camera spec
  → 2 iterations, 4 minutes
```

### 4. Crew Training Modules
```
Prompt: "night navigation scenario — vessel approach from port"
  → Generate wheelhouse at night, red-light mode, vessel on radar
  → Walk through: "add AIS overlay with vessel data"
  → Regenerate: AIS callout on identified vessel
  → Save as training module
  → 5 iterations, 10 minutes
```

### 5. Anything, Really
The room system is a **generic spatial development environment**. You're not
limited to boats. The same pipeline generates:

- Factory floor layouts
- Warehouse racking configurations
- Architectural interiors
- Game levels
- UI prototypes (rooms = screens)
- Data center layouts
- Film set designs

Anything that can be a "room" can be generated, walked through, and iterated.

---

## The Feedback Loop IS the Product

The room panorama is ephemeral. It changes every iteration. What persists is:

1. **The room graph** — adjacency, structure, what connects to what
2. **The feedback history** — what the user liked and didn't
3. **The learned preferences** — "Casey prefers warm lighting and wide decks"
4. **The winning configurations** — saved as room configs/templates

Over time, the system gets better at generating things its user will like.
Not because the model improves, but because the feedback corpus grows.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│            USER INTERFACE                    │
│  Room viewer + Chat + Viz panel             │
│  Feedback input (like/dislike/comment)      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          ITERATION ENGINE                    │
│                                              │
│  Prompt Builder ← Feedback History          │
│         │                                    │
│         ▼                                    │
│  GPU Generation (FLUX/SD)                   │
│         │                                    │
│         ▼                                    │
│  Room Assembler (objects + textures)        │
│         │                                    │
│         ▼                                    │
│  Preview Render → User walks through        │
│                                              │
│  Feedback → stored → feeds next prompt      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          KNOWLEDGE BASE                      │
│  Room configs + Feedback + Winning designs  │
│  → PLATO tiles + GPU Vector DB              │
└─────────────────────────────────────────────┘
```

---

## From Monitoring → Generative Platform

| Phase | What you do | With what |
|-------|------------|-----------|
| **v0** (March) | Idea | ScummVM metaphor |
| **v1** (now) | Walk through rooms | Pre-made panoramas, ESP32, chat |
| **v2** (with GPU) | Generate + iterate rooms | FLUX/SD on local GPU, feedback loop |
| **v3** (fleet) | Share + remix rooms | PLATO tile exchange, learned preferences |
| **v4** (anyone) | Develop anything in rooms | Universal spatial dev platform |

---

## The One-Sentence Pitch

**The room system is a generative development environment where the UI is a 3D space you walk through, the iteration cycle is GPU-accelerated, and the feedback loop replaces the design spec.**

With Forgemaster's RTX 4050, one person can design, prototype, and ship a new room layout in under 10 minutes. Without writing a single line of code.
