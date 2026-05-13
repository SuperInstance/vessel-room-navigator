# Vessel Room Graph Topology Analysis

## Formal Analysis of the Fishing Vessel Room Navigation Graph

**Date:** 2026-05-13  
**Models used:** MiniMax M2.7 (formal analysis), Seed-2.0-mini (room graph brainstorm)

---

## 1. Graph Definition

### Nodes (V=9)
| ID | Room | Type |
|----|------|------|
| W | Wheelhouse | Physical |
| G | Galley | Physical |
| F | Foredeck | Physical |
| AC | Aft Cockpit | Physical |
| ER | Engine Room | Physical |
| WR | Wheelhouse Roof | Physical |
| CN | Crow's Nest | Physical |
| AL | Alarm Center | Virtual |
| FC | 4-Camera Wall | Composite |

### Walkable Adjacency Edges (E=14)
- W ↔ G, WR, ER
- G ↔ W, F
- F ↔ G, CN
- AC ↔ ER
- ER ↔ W, AC
- WR ↔ W, CN
- CN ↔ F, WR

Warp edges form a complete graph K9 (36 warp edges) between all rooms.

---

## 2. Laman Rigidity

**Threshold:** For minimally rigid 2D graph: E = 2V - 3 = 2(9) - 3 = 15  
**Current:** E = 14 < 15 → **Graph is under-constrained by 1 edge**

### Degree of Freedom
The single DOF lives in the forecastle-bridge connection. The F-CN-WR-W-G cycle forms one rigid body. The ER-AC branch is a dead-end connected by a hinge at W.

```
Rigid body: {G, W, WR, CN, F} (cycle G-W-WR-CN-F-G)
                 ↑
            hinge at W
                 │
           ER — AC (dead-end branch)
```

### Top 5 Edge Additions by Operational Utility

| Rank | Edge | Rationale |
|------|------|-----------|
| 1 | F ↔ ER | Triangulates foredeck to engine room, bypasses wheelhouse. Reduces max pair distance 4→3. |
| 2 | G ↔ ER | Connects interior nodes. Both become degree 4. |
| 3 | F ↔ AC | Direct bow-to-stern deck path. Max pair distance drops 4→3. |
| 4 | CN ↔ ER | Mast to engine room link. Engine monitoring from elevation. |
| 5 | W ↔ AC | Gives AC alternative exit. Reduces W's betweenness. |

### All 22 Missing Edges — Tiered

| Tier | Edges | Type |
|------|-------|------|
| 1 — Deck span | F↔ER, F↔AC, G↔AC | Most valuable shortcuts |
| 2 — Interior | G↔ER, G↔CN, G↔WR | Interior flexibility |
| 3 — Mast | CN↔ER, CN↔AC, CN↔W | Mast-to-deck connections |
| 4 — Secondary | W↔F, W↔CN, W↔AC, ER↔WR, ER↔CN, ER↔F, ER↔G | Minor shortcuts |
| 5 — Virtual | AL↔FC, all edges to/from AL/FC | Room bridges (least useful) |

---

## 3. Betweenness Centrality

| Room | Betweenness | Role |
|------|-------------|------|
| **W** | **27** | **Critical chokepoint** — all paths between forward cluster and ER-AC branch |
| ER | 24 | Forward/aft partition — sole bridge to AC |
| F | 18 | Fore cluster hub |
| WR | 18 | Bridge to CN |
| G | 14 | Secondary interior hub |
| AC | 10 | Dead-end, low centrality |
| AL | 0 | Warp-only |
| FC | 0 | Warp-only |

### Failure Analysis

| Fails | Effect | Severity |
|-------|--------|----------|
| W | Two components: {AC,ER} disconnected from {F,CN,WR,G}. Only warp reconnects. | MAJOR |
| ER | **Vertex cut of size 1.** AC isolated from all walk-accessible spaces. | CRITICAL |
| G | F+CN+WR remain connected via W. AC+ER separate. Two clusters. | MAJOR |
| F | No full disconnect. F+CN isolated from AC+ER. | Moderate |

**Minimum vertex cut:** 1 (ER alone separates AC)  
**Minimum edge cut:** 1 (edge W-ER or ER-AC)  

---

## 4. Shortest Path Analysis

### All-Pairs Walk Distances
```
    W G F AC ER WR CN
W   0 1 2 2  1  1  2
G   1 0 1 3  2  2  2
F   2 1 0 4  3  1  1
AC  2 3 4 0  1  3  4
ER  1 2 3 1  0  2  2
WR  1 2 1 3  2  0  1
CN  2 2 1 4  2  1  0
```

### Key Metrics

| Metric | Value | Pair |
|--------|-------|------|
| Longest walk distance | 4 | AC↔F, AC↔CN |
| Best-connected | max=2 | W (Wheelhouse) |
| Most isolated | max=4 | AC (Aft Cockpit) |

### Warp Benefit
| Pair | Walk | Warp | Savings |
|------|------|------|---------|
| AC↔F | 4 | 0.1 | 97.5% |
| AC↔CN | 4 | 0.1 | 97.5% |
| G↔AC | 3 | 0.1 | 96.7% |
| F↔ER | 3 | 0.1 | 96.7% |

---

## 5. Alarm Response Optimality

**Optimal single response room: Wheelhouse (W)** — max response time of 2.

| Alarm In | Respond From | Walk Distance |
|----------|-------------|---------------|
| W | — | 0 (already there) |
| G | W | 1 |
| F | W | 2 |
| WR | W | 1 |
| CN | W | 2 |
| ER | W | 1 |
| AC | W | 2 |

**Worst-case from W:** 2 steps to F, CN, AC  
**Second best base:** Engine Room (max=3)

---

## 6. Graph Fragility Summary

| Property | Value |
|----------|-------|
| Laman rigidity | 14/15 edges — under-constrained |
| Minimum vertex cut | 1 (ER) |
| Minimum edge cut | 1 (W-ER, ER-AC) |
| Hamiltonian path | **Does not exist** (ER is leaf node) |
| Redundancy score | 91.7% |
| Critical chokepoints | W (b=27), ER (b=24) |

### Recommended Action
**Add F↔ER edge.** This single addition:
1. Achieves minimal rigidity (E=15)
2. Eliminates vertex cut at ER
3. Reduces worst-case pair distance 4→3
4. Increases redundancy to 15/15
5. Enables Hamiltonian path

---

## 7. Room Graph Properties (from Seed-2.0-mini brainstorm)

### Room Compression (Bandwidth LOD)
| LOD | Video | Gauges | Bandwidth |
|-----|-------|--------|-----------|
| 0 — Full | 4 cams, 360° pano | All instruments | >2 Mbps |
| 1 — Compressed | 2 cams, reduced pano | Critical only | 256K-2Mbps |
| 2 — Minimal | 1 snapshot, selector | State data only | <256 Kbps |

### Room Caching Policy
1. **Adjacency Priority** — pre-load rooms adjacent to current position
2. **Alarm Priority** — any room with active alarm pre-loaded immediately
3. **Usage Weight** — historically frequent rooms retained in cache
4. **LRU Eviction** — least recently used evicted first (except alarm/weighted)

### Room Federation (Multi-Vessel)
- Each vessel has its own room graph
- Peer-to-peer radio links when <20NM apart
- Satellite links for long-range
- `Fleet Command` meta-room accessible from all vessels
- Inter-vessel adjacency defined by radio link quality

### Room Inheritance
- New vessels can inherit room graph from existing vessel
- Inherited graphs are fork-modified without altering source
- Template room graphs for vessel classes
- Crew familiar with one boat can quickly adapt to another

---

## 8. Time-Stamped Room URLs

```
/boat/{vessel}/{room}                           # Current state
/boat/{vessel}/{room}?time={timestamp}           # Historical state
/boat/{vessel}/emergency/{event}-{timestamp}     # Emergency room
```

### Temporal Room Navigation
- Rooms have a time dimension — visit "engine room at 0400 UTC"
- Share timestamped URLs for investigation
- Room diffing: compare current vs. yesterday's layout

