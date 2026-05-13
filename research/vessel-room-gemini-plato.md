# Gemini Nano + PLATO = Fully Intelligent Edge Agent

**The stack:** Google's embedded Gemini model (browser-native, ~1.8B params)  
+ PLATO tiles (structured knowledge) + Room structure (constraint boundaries)  
= An intelligent agent that runs entirely on-device, zero cloud, zero cost, fully offline.

---

## Why This Works

Three things that individually are limited, but together are transformative:

| Component | Alone | Together |
|-----------|-------|----------|
| **Gemini Nano** | Tiny model, limited reasoning | Constrained by room structure, only needs to navigate what's relevant |
| **PLATO tiles** | Static knowledge, no reasoning | Structured and navigable — the model knows where to find answers |
| **Room graph** | Empty shells without data | Provides the navigation UI and constraint boundaries |

They form a triangle:

```
          Gemini Nano (reasoning)
              ↙           ↘
    PLATO tiles ──────── Room graph
    (knowledge)         (constraints)
```

The model reasons. PLATO provides facts. Rooms provide context.
Each compensates for what the others lack.

---

## How It Works

### 1. Browser-Native Gemini (Chrome Built-in AI)

Chrome 126+ ships Gemini Nano as a built-in model. No download, no API key:

```javascript
// Check availability
const canUse = await ai.canCreateTextSession();

// Create a session
const session = await ai.createTextSession();

// Prompt with room context + PLATO tile
const result = await session.prompt(`
  You are in the ${room.name}. 
  ${room.description}
  Cameras: ${room.cameras.map(c => c.label).join(', ')}
  Adjacent rooms: ${room.adjacent.join(', ')}
  
  PLATO knowledge:
  ${relevantTiles.map(t => `- ${t.question}: ${t.answer}`).join('\n')}
  
  User asks: "${userQuery}"
`);
```

**Requirements:** Chrome 126+ on desktop, Chrome 128+ on Android.  
**Model size:** ~1.8B parameters, ~1.7GB download (one-time, cached).  
**Performance:** ~50 tokens/s on M1 Mac, ~30 tokens/s on typical laptop.  
**Privacy:** Runs entirely on-device. Zero data leaves the browser.

### 2. PLATO as Knowledge Graph

PLATO tiles become the model's knowledge base. Each tile is a fact the model can
navigate and cite:

```javascript
// Relevant tiles found via WebGPU vector search
const tiles = await vectorDB.search(userQuery, 5);
// → [
//   {q: "engine temp normal range", a: "140-200°F"},
//   {q: "fuel filter clog symptoms", a: "RPM fluctuation, black smoke"},
//   {q: "crow's nest PTZ controls", a: "Pan: 0-360°, Tilt: -45 to +90"}
// ]

// Feed into Gemini context
const context = tiles.map(t => `Q: ${t.question}\nA: ${t.answer}`).join('\n\n');
```

The model doesn't need to know everything. It just needs to know where to look.
PLATO is the long-term memory. Gemini is the working memory.

### 3. Room Structure as Constraint

The room defines the scope of what the model should reason about:

```javascript
const roomContext = {
  name: room.name,
  type: room.type,
  cameras: room.cameras.map(c => ({
    label: c.label,
    type: c.type,
    interactive: c.interactive
  })),
  adjacent: room.adjacent.map(id => ({ name: R[id].name })),
  sensors: room.sensors || [],
  dashboards: room.dashboards || []
};
```

A 1.8B model doesn't need to know "what is normal engine temperature" —
the room provides the threshold (normal: <200°F). The model just needs to
compare, format, and respond.

---

## Integration with the Room System

### Chat Panel (Already Built)

The chat panel already exists in the prototype. The upgrade:

```
Before (regex + fallbacks):
  User: "what's the engine temp?"
  Agent: [checks room sensors] "Port: 185°F. Normal."

After (Gemini + PLATO):
  User: "what's the engine temp and should I be worried?"
  Agent: "Port engine at 185°F — well within normal range (<200°F).
          But I notice it's 3°F warmer than 30 minutes ago. 
          PLATO tile #442 says a gradual rise can indicate early 
          fouling. Might want to check the cooling intake next 
          time you're in the engine room."
```

The difference isn't the facts (both know the temperature). It's the reasoning
(Gemini connects the trend to PLATO knowledge to actionable advice).

### Viz Engine

```
User: "design a new aft deck layout for pot fishing"
  → Gemini parses the prompt → generates scene description
  → Viz engine renders 3D mockup
  → User walks through, gives feedback
  → Gemini refines the scene description based on feedback
  → Viz engine re-renders
```

### Voice Commands

```
User speaks: "show me the engine room from yesterday's alarm"
  → Browser STT (Web Speech API)
  → Gemini parses: room="engine_room", time="yesterday", event="alarm"
  → PLATO search: "engine room alarm 2026-05-12"
  → Returns tile with timestamp, temp readings, actions taken
  → Room loads with the relevant data highlighted
```

### Autonomous Agent Loop

```
Every 30 seconds:
  1. Check all room sensors
  2. If any sensor approaches threshold:
     a. Gemini evaluates: "port temp 198°F, trending up"
     b. PLATO search: recent temp trends for port engine
     c. Decide: alert user or wait
     d. If alert: compose message + warp recommendation
```

---

## The Triad: Model + Knowledge + Structure

```
                         GEMINI NANO
                      (on-device reasoning)
                             │
               ┌─────────────┼─────────────┐
               │             │             │
               ▼             ▼             ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │  PLATO   │ │  ROOM    │ │  VECTOR  │
         │  TILES   │ │  GRAPH   │ │   DB     │
         │ (facts)  │ │(context) │ │(search)  │
         └──────────┘ └──────────┘ └──────────┘
```

| Layer | What | Size | Updates |
|-------|------|------|---------|
| **Gemini Nano** | Reasoning engine | 1.8B params | Browser updates |
| **PLATO tiles** | Knowledge base | Unlimited | Agent-filed, human-curated |
| **Room graph** | Spatial context | 9 rooms | Layout changes |
| **Vector DB** | Semantic search | 10K-1M vectors | Every interaction |

---

## Cost Comparison

| Solution | Monthly Cost | Offline? | Privacy | Knowledge |
|----------|-------------|----------|---------|-----------|
| ChatGPT / Claude API | $20-200/mo | ❌ | ❌ (data to cloud) | General |
| Local LLM (llama.cpp) | $0 | ✅ | ✅ | General |
| **Gemini Nano + PLATO** | **$0** | **✅** | **✅** | **Yours** |
| ESP32 rule-based | $0 | ✅ | ✅ | Hard-coded |

Gemini Nano is free, private, and persistent. PLATO makes it knowledgeable
about YOUR boat, not just general facts.

---

## Implementation Path

### Phase 1: Browser Detection
```javascript
// Check if Gemini Nano is available
const available = await ai?.canCreateTextSession() === 'readily';
// If not → fall back to current regex/fallback system
```

### Phase 2: PLATO-Aware Prompting
```javascript
// Build prompt from room context + relevant PLATO tiles
const response = await session.prompt(buildPrompt(room, tiles, query));
```

### Phase 3: Autonomous Operation
```javascript
// Periodic agent loop using Gemini + PLATO
setInterval(async () => {
  const status = await checkRoomStatus();
  const tiles = await searchPLATO(status.anomalies);
  const decision = await gemini.decide(status, tiles);
  if (decision.alert) notifyUser(decision);
}, 30000);
```

### Phase 4: Learning
- User feedback saved as PLATO tiles
- Gemini's effective prompts cached
- Room-specific behavior learned over time

---

## The Takeaway

**Gemini Nano is the reasoning engine. PLATO is the memory. Rooms are the context.**

None of the three is sufficient alone. Together they form an intelligent edge agent
that knows your boat, works offline, costs nothing, and improves over time.

And it runs in a browser tab.
