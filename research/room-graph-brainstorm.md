# Navigable 3D Web Space for Fishing Vessels: Room Graph Theory & System Evolution

## Introduction
The concept of a navigable 3D web space for a fishing vessel—combining ScummVM’s point-and-click room traversal with Street View’s immersive camera views—isn’t just a novelty for remote vessel monitoring. For Casey’s Cocapn fleet, this system is a digital twin optimized for the harsh realities of offshore fishing: limited satellite bandwidth, fatigued crew, and the constant need to iterate on vessel operations, training, and emergency response. Rooted in room graph theory and adapted to the physical constraints of a fishing boat, this system transforms static vessel documentation into a dynamic, living topology that evolves with the fleet.

## 1. Room Graph as Topology: Laman Rigidity & Crew Training
To ground this system in mathematical first principles, let’s define a baseline vessel with 9 functional rooms (V=9): 1. Crow’s Nest, 2. Wheelhouse, 3. Galley, 4. Crew Quarters, 5. Port Engine Room, 6. Starboard Engine Room, 7. Forward Fishing Deck, 8. Aft Fishing Deck, 9. Fuel/Water Storage. According to Laman’s rigidity theorem, a minimally rigid 2D graph requires exactly `E=2V-3` edges—for 9 rooms, that’s 15 unique walkable adjacencies (physical hallways, stairs, or hatches that let crew move directly between two spaces).

Our current vessel’s graph has ~14 physical walkable edges, meaning we’re one edge short of full rigidity. Adding a single extra walkable edge (e.g., a direct shortcut from Crew Quarters to Forward Fishing Deck, normally only accessible via the Galley) creates an over-constrained graph, which for this system has two key benefits:
- **Emergency Shortcuts**: Crew in a hurry can skip the proper physical path for rapid movement between spaces.
- **Training Aids**: Greenhorns learning the vessel’s layout can practice both the official physical routes and the over-constrained shortcuts, building muscle memory for high-stakes situations. The 30 additional warp edges (non-physical, one-tap traversal) further expand the graph without breaking its underlying rigidity, as they’re optional and only used for convenience, not mandatory physical movement.

## 2. Room Compression: Bandwidth Optimization for Offshore Voyages
Offshore satellite connections typically range from 128 kbps to 2 Mbps, with frequent dropouts that make full-resolution digital twins unusable. The system solves this with a tiered room level-of-detail (LOD) system:
- **LOD 0 (Full Fidelity)**: 4 camera views, 360° panorama, all instrumentation gauges, real-time overlays (trawl position, weather data, crew locations), and full interactive navigation. Used when in port or within 50 nautical miles of shore, where bandwidth is abundant.
- **LOD 1 (Compressed)**: 2 cropped camera views, reduced-resolution panorama, only critical gauges (engine temp, oil pressure, fuel level), and simplified navigation controls. Used for moderate offshore bandwidth.
- **LOD 2 (Minimal)**: Direction selector dropdown (forward, aft, port, starboard) paired with a single static camera snapshot, no real-time overlays. Used when bandwidth is extremely limited (less than 256 kbps) or during satellite dropouts.

For example, the Port Engine Room at LOD 0 shows live feeds of each cylinder head temp, the oil separator, and access hatches; at LOD 2, it’s just a dropdown to select between port and starboard engine data, with a single still frame of the engine bank. Room compression isn’t just visual: the system serializes only critical state data (temperature, pressure, crew location) instead of transmitting full 3D meshes, reducing payload size by up to 90% compared to a full digital twin.

## 3. Room Caching: Prioritizing Access for Critical & Frequent Use
To minimize latency and bandwidth usage during offshore voyages, the system implements a weighted caching policy tailored to fleet operations:
- **Adjacency Priority**: Rooms adjacent to the user’s current room are pre-loaded automatically. If a crew member is in the Wheelhouse, the system pre-loads the Crow’s Nest, Galley, Forward Fishing Deck, and Fuel Storage rooms.
- **Alarm Priority**: Any room with an active alarm (engine temp spike, low fuel, fire alert) is pre-loaded immediately, regardless of adjacency. For example, if the Port Engine Room triggers a high-temp alert, the system pulls up that room’s feed before the user even requests it.
- **Usage Weight**: Rooms with high historical usage (Wheelhouse, Galley, Crew Quarters) are retained in cache even if they’re not adjacent or recently visited.
- **LRU Eviction**: When cache limits are reached, least recently used rooms are evicted first, unless they have alarm priority or high usage weight.

For long voyages, the system can cache all rooms when satellite bandwidth is stable, ensuring full access to the vessel’s digital twin even during complete satellite dropouts.

## 4. Route Search Across Time: Locating Historical Events & Positions
One of the most powerful features of the system is semantic room search across time, which solves a common pain point for fishing fleet operators: locating where a critical event occurred days or hours earlier. For example:
- A greenhorn asks, “Where was that strange water leak on the aft deck at 0200 UTC last night?” The system searches all room history logs, finds the Aft Fishing Deck room’s camera feed from 0200 UTC, and warps the user directly to that room at the exact time, with the leak visible in the camera feed.
- A captain queries, “Which room had the fishing net tangled at 1400 UTC yesterday?” The system searches the Forward Fishing Deck’s inventory and movement logs, warps the captain to that room at 1400 UTC, and overlays the tangled net in the camera feed.

Room search also supports timestamped URLs: `/boat/cocapn-42/aft-deck?time=2026-05-12T02:00:00Z` allows crew to share historical room views with other members of the fleet, even across multiple vessels.

## 5. Dynamic Room Creation: Adapting to Emergency & Dynamic Events
Fishing vessels face constant dynamic events—engine malfunctions, gear tangles, weather alerts—that require rapid access to specialized information. The system handles these by creating temporary rooms or adding overlays to existing rooms:
- **Temporary Emergency Rooms**: For critical events (engine fire, flooding, man overboard), the system spawns a temporary room with critical alerts, step-by-step emergency procedures, live camera feeds of the affected area, and direct links to the ship’s radio and distress signals. For example, a Port Engine Fire alert spawns a `Port Engine Fire Emergency` room that includes a video of the extinguishment procedure, a live feed of the engine room, and a one-tap button to call the coast guard.
- **Overlays for Minor Alarms**: For less critical events (low fuel, clogged filter, broken camera), the system adds an overlay to the existing room instead of creating a new one. For example, a low-fuel alert in the Fuel Storage room adds a red flashing banner over the fuel gauge and a popup with the nearest fuel stop coordinates.

Temporary rooms expire automatically once the event is resolved: once the Port Engine Fire is extinguished, the emergency room is deleted, and the engine room returns to its normal state. These ephemeral rooms do not alter the permanent room graph’s rigidity, as they’re not part of the underlying adjacency structure.

## 6. Room as a URL: Shareable, Memorable, & Time-Stamped
Every room in the system has a unique, memorable URL that follows a standard naming convention using fishing-specific terminology, aligned with Casey’s focus on accessible, fleet-wide communication:
- Permanent rooms: `/boat/{vessel-name}/{room-name}`, e.g., `/boat/cocapn-42/wheelhouse`, `/boat/cocapn-42/galley`.
- Time-stamped rooms: `/boat/{vessel-name}/{room-name}?time={timestamp}`, e.g., `/boat/cocapn-42/engine-port?time=2026-05-13T04:00:00Z` for the Port Engine Room at 0400 UTC yesterday.
- Temporary emergency rooms: `/boat/{vessel-name}/emergency/{event-type}-{timestamp}`, e.g., `/boat/cocapn-42/emergency/port-engine-fire-202605130415`.

Memorable URLs make it easy for crew to share information: a deckhand can send a link to the `aft-deck` room to a mate, saying, “The net is tangled there now—check the camera.” The system also supports deep linking: clicking a room URL in a chat app or email warps the user directly to that room, no extra navigation required.

## 7. Room Versioning: Tracking Changes & Training for Refits
Fishing vessels are constantly evolving: new gauges are added, cameras are replaced, and equipment is repositioned. Room versioning tracks every change to a room’s layout, cameras, and instrumentation:
- Each time a change is made to a room (e.g., replacing a broken camera in the Crow’s Nest, adding a new radar gauge in the Wheelhouse), the system creates a new version of that room.
- Users can diff two versions of a room to see exactly what changed: “Last month, the Wheelhouse had 3 gauges; now it has 5—two new radar and GPS gauges were added on the port side.”
- Room versioning is a critical training tool for greenhorns: they can practice navigating both the old and new versions of a vessel’s rooms, preparing them for refitted boats without having to wait for a physical demonstration.
- The system also supports rollback to a previous version of a room, which is useful if new equipment malfunctions: temporarily revert to the old gauge’s data until the new equipment is repaired.

## 8. Offline Rooms: Surviving Satellite Dropouts
Satellite dropouts are common in deep offshore waters, where radio signals are blocked by weather and distance. The system handles this with offline rooms:
- When satellite connectivity is lost, all rooms switch to offline mode, displaying the last known state of each camera and instrumentation.
- Offline rooms include a warning banner: “Offline: Last updated 5 minutes ago” to alert users that the data is stale.
- Limited offline functionality: users can still navigate to rooms that have been cached locally, but cannot access rooms that haven’t been pre-loaded. For example, if a crew member is in the Wheelhouse when satellite drops, they can still view the Galley, Crow’s Nest, and Forward Fishing Deck if those rooms were cached earlier, but cannot access the Engine Rooms if they weren’t.
- Offline rooms log all user actions and events locally, syncing the data to the cloud once satellite connectivity is restored. This ensures that no data is lost during dropouts.

## 9. Room Federation: Navigating Between Multiple Vessels
Casey’s Cocapn fleet currently operates 7 fishing vessels, each with its own room graph. Room federation allows crew to navigate between vessels, share information, and collaborate across the fleet:
- Each vessel’s room graph is connected via peer-to-peer radio links when vessels are within range (less than 20 nautical miles) or satellite links when they’re farther apart.
- A shared `Fleet Command` meta-room is accessible from all vessels, displaying live feeds of every room across the entire fleet. Crew can warp directly from their own vessel’s Wheelhouse to the Fleet Command room, then to another vessel’s Wheelhouse to ask the captain a question.
- Inter-vessel room adjacents are defined by radio links: for example, `/boat/cocapn-42/wheelhouse` is adjacent to `/boat/cocapn-71/wheelhouse`, allowing crew to warp between the two vessels with a single click.

Room federation also supports shared inventory and maintenance logs: a crew member on Cocapn-42 can view the fishing gear inventory on Cocapn-71, and request to borrow a net if their own nets are damaged.

## 10. Control Room as Meta-Room: The Tactical Hub of the Fleet
The Control Room (or Meta-Room) is a single, unified view of all rooms on a vessel (or across the entire fleet). Unlike the alarm center, which only displays active alerts, the Meta-Room shows a live thumbnail feed of every room, organized by physical location:
- The Meta-Room for a single vessel displays 9 thumbnails, one for each room, arranged in the same layout as the physical boat.
- Users can click on any thumbnail to warp directly to that room, zoom in on a specific area of the boat, or toggle between LOD levels.
- The Meta-Room also includes a global dashboard with all critical alerts across all rooms: red alerts for engine fires, yellow alerts for low fuel, green alerts for normal operations.
- For the fleet-wide Meta-Room, the dashboard displays alerts across all vessels, allowing the captain to monitor the entire fleet from a single interface.

The Meta-Room differs from traditional vessel monitoring systems because it’s interactive: users can not only view the rooms, but also navigate through them, just like they would on the physical boat.

## 11. Room Death & Resurrection: Adapting to Equipment Failures
Fishing vessels are prone to equipment failures: cameras break, gauges malfunction, and hatches jam. The system handles these failures with room death and resurrection, mirroring the physical reality of the vessel:
- **Room Death**: When a camera or sensor fails, the corresponding room loses that functionality. For example, if the Forward Fishing Deck’s forward camera breaks, the Forward Fishing Deck room only has three camera views (aft, port, starboard), and a spiderweb overlay appears where the broken camera was. The room is still functional, but users cannot see the forward direction of the deck.
- **Room Resurrection**: When the broken camera or sensor is replaced, the room springs back to full functionality: the spiderweb overlay disappears, and the fourth camera view is restored.
- **Temporary Room Death**: For critical equipment failures (e.g., a total loss of engine power), the entire Engine Room room goes dark, with a warning banner saying “Unavailable: Total Engine Failure”. Once the engine is repaired, the room returns to normal.

This system ensures that crew are notified immediately of equipment failures, and can still access the remaining functionality of the affected room until repairs are made.

## 12. Room Inheritance: Accelerating New Vessel Builds
When Casey builds a new fishing vessel, he doesn’t have to redesign the room graph from scratch. The system supports room inheritance, allowing him to apply the room graph from an existing vessel to a new one:
- For example, Casey’s new vessel, Cocapn-72, inherits the room graph from his existing vessel, Cocapn-42: the Wheelhouse has the same adjacencies, camera positions, and gauge layout as Cocapn-42’s Wheelhouse.
- Inherited room graphs can be modified without altering the original vessel’s graph: Casey can add new rooms for new equipment (e.g., a new processing room) or remove old rooms that are no longer needed (e.g., a legacy fuel storage locker).
- Room inheritance saves time and money when building new vessels: it eliminates the need to redesign the entire navigation system, and ensures that crew who are familiar with an existing vessel can quickly adapt to a new one.
- The system also supports template room graphs: Casey can create a standard room graph for all of his vessels, ensuring consistency across the fleet.

## Conclusion
This room graph system isn’t just a technical curiosity—it’s a practical tool that aligns with Casey’s dojo model of training and iterative improvement. For greenhorns, it’s a safe, interactive training ground to learn the physical layout of the vessel and practice emergency procedures. For veteran crew, it’s a rapid-response tool that allows them to access critical information quickly, even in the middle of a storm. For the fleet as a whole, it’s a unified system that connects vessels, shares knowledge, and adapts to the constant changes of offshore fishing. By combining room graph theory with the real-world constraints of the fishing industry, this system transforms a static digital twin into a living, evolving tool that grows with the fleet.