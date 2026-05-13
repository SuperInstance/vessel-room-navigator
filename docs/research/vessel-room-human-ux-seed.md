# Human UX for Vessel Room Navigation (Seed-2.0-mini Brainstorm)

Creative exploration of how a captain actually uses the room system.

## The 30-Minute Watch Flow

A detailed trace below. This is the daily bread-and-butter, optimized for muscle memory.

### 0:00 — Wake
Soft, low-priority chime rouses from bunk in the Quarters. The room's 360° view looks out over the stern. Half-drawn curtain on forward bulkhead blocks moon glare. Reach for the 2-inch rubberized WHEELHOUSE button mounted to nightstand — warp takes 0.8 seconds, no loading screen.

### 0:05 — At the Wheel
Glance at overlaid radar feed stitched from four mast cameras: tight school of herring 2.1 miles out, 12° off port bow. Turn physical wheel slightly, and panoramic view shifts in real time to match course change, with bright white overlay line showing new heading.

### 0:08 — Engine Check
Tap ENGINE button on wheelhouse control panel. Warp to twin diesel bays. Panoramic view overlaid with big, high-contrast digital readouts right over each gauge: oil temp 182°F (green), exhaust temp 320°F (green), fuel level 78% (green). Tap WHEELHOUSE to return.

### 0:12 — Net Deck
Net tension gauge dipping. Tap NET DECK, warp to stern hauling station. Panoramic shows 120-foot net winched up, blue dots overlaid on crew helmet cameras. Spot frayed section on port side net — send radio call via overlaid CHANNEL 9 dot, then return.

### 0:22 — Coffee
Tap GALLEY, warp to forward galley. Thermos of black coffee still steaming, snack bins stocked with beef jerky and hardtack. Tap back.

### 0:28 — Radio Check
Tap RADIO ROOM, warp to VHF/SSB station. No distress calls.

## Design Principles from the Boat

1. **Muscle memory over menus** — On a real boat, you know where everything is without thinking. The digital version should preserve that: same button positions, same glance patterns, same hand paths.
2. **Glance velocity** — A good operator reads a gauge in 0.2 seconds by position and color, not by reading the number. Rooms should encode information in position and color first, numbers second.
3. **Warp vs Walk** — Walk when you want to feel the boat (routine patrol). Warp when you need information NOW (alarm). The choice is friction vs speed.
4. **Build for wet, dark, and bouncing** — The UI that works in a storm works everywhere. Test every interaction with cold hands and no sleep.
5. **The boat teaches the UI** — A captain already knows where the engine room is. The digital rooms should reinforce that spatial knowledge, not replace it with abstract menus.
6. **Alarms are spatial** — An alarm isn't a popup. It's "something is wrong in THAT room, at THAT location." The room system preserves that spatial context.
7. **Multi-device is real** — Big screen in wheelhouse, tablet on deck, phone in pocket. Each has a different room interaction model. They don't have to show the same thing.
8. **Offshore = offline** — If it doesn't work without internet, it doesn't work.
