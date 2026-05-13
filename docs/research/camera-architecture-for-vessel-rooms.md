# Camera System Architecture for Fishing Vessel Room Navigation

## Domain Model

Cameras are **first-class objects** embedded in rooms within a 3D navigable web space. Every room is a panoramic webpage. Cameras are not external dependencies — they are room members with identity, state, and behavior that mutate the room's presentation layer.

### Core Entity: `Camera`

```typescript
interface Camera {
  id: string;                    // UUID, stable across sessions
  label: string;                 // Human-readable name
  type: CameraType;              // ptz | thermal | dashboard | quilted | composite
  url: string;                   // Stream source (RTSP, WebRTC, HLS, or virtual/data overlay URI)
  mode: CameraMode;              // gunnery | monitor | lookout | nav | panorama
  interactive: boolean;          // Can human manipulate this camera?
  presets: PTZPreset[];          // Named positions (PTZ only, empty for others)
  roomId: string;                // FK to parent room
  offlineState: OfflineState;    // Current connectivity state
  createdAt: number;             // Epoch ms
  updatedAt: number;             // Epoch ms
}

type CameraType = 'ptz' | 'thermal' | 'dashboard' | 'quilted' | 'composite';
type CameraMode = 'gunnery' | 'monitor' | 'lookout' | 'nav' | 'panorama';

interface PTZPreset {
  id: string;
  label: string;                 // e.g. "Bow Starboard", "Crow's Nest Aft"
  pan: number;                   // Degrees, 0-360
  tilt: number;                  // Degrees, -90 to +90
  zoom: number;                  // Ratio, 1.0 = 1x, 20.0 = 20x
  focus?: number;                // Optional focus distance
  irMode?: boolean;              // Night vision toggle for this preset
}
```

### Room-to-Camera Relationship

A room declares its expected camera layout in its template definition:

```typescript
interface RoomTemplate {
  id: string;
  label: string;                       // "Wheelhouse", "Crow's Nest", "Engine Room"
  viewportLayout: ViewportLayout;      // How cameras are arranged
  defaultMode: CameraMode;             // Room's primary operational mode
  allowedModes: CameraMode[];          // Modes user can switch to
  cameraSlots: CameraSlot[];           // Slots cameras can be assigned to
  ambientOverlays: OverlayLayer[];     // Non-camera data layers (radar, depth)
}

interface CameraSlot {
  slotId: string;                      // e.g. "main", "port_upper", "stbd_lower"
  position: ViewportPosition;          // corner-1 | corner-2 | corner-3 | corner-4 | center
  requiredType?: CameraType;           // Some slots require specific type
  defaultSize: ViewportSize;           // default dimensions in viewport grid
}

interface ViewportLayout {
  type: 'grid' | 'single' | 'overlay-grid' | 'composite';
  rows: number;
  cols: number;
  gutterSize: number;                  // px between viewports
  cornerQuickPeek: boolean;            // Show 4 glance viewports?
  centerStareSlot: { row: number; col: number };  // Which cell is the "stare" zone
}
```

---

## 1. Camera Types in Detail

### 1.1 PTZ Camera — Pan/Tilt/Zoom

PTZ cameras are the workhorses of vessel navigation. They live in the crow's nest, on the mast, and at strategic deck positions.

#### Full PTZ Control API

```typescript
interface PTZCameraAPI {
  // Movement
  panAbsolute(degrees: number): Promise<void>;     // 0-360 absolute heading
  panRelative(delta: number): Promise<void>;        // +/- degrees from current
  tiltAbsolute(degrees: number): Promise<void>;     // -90 to +90
  tiltRelative(delta: number): Promise<void>;       // +/- from current
  zoomTo(factor: number): Promise<void>;            // 1.0 = 1x, 20.0 = 20x
  zoomStep(direction: 'in' | 'out', steps?: number): void; // Smooth zoom

  // Presets
  recallPreset(presetId: string): Promise<void>;    // Snap to saved position
  savePreset(label: string): Promise<PTZPreset>;    // Save current position
  deletePreset(presetId: string): Promise<void>;
  listPresets(): PTZPreset[];

  // Modes
  setMode(mode: CameraMode): void;                  // Gunnery changes UI overlay
  getMode(): CameraMode;

  // Gunnery-specific (mode === 'gunnery')
  acquireLock(objectId: string): void;              // Lock reticle on detected object
  releaseLock(): void;
  setReticleStyle(type: 'crosshair' | 'circle' | 'mil-dot'): void;
  getReticleBearing(): { pan: number; tilt: number; distance: number };

  // Auto-tracking (hardware dependent)
  enableAutoTrack(): void;                          // PTZ follows detected movement
  disableAutoTrack(): void;
  getTrackedObject(): { id: string; bearing: number; velocity: number } | null;

  // Status
  getStatus(): PTZStatus;
}
```

#### Gunnery Mode Interaction Pattern

When the PTZ camera enters **gunnery mode** (typically from the crow's nest room):

1. A reticle overlay activates — default Mil-Dot, toggleable to crosshair or circle
2. Pan/tilt controls gain fine-grained sensitivity via mouse drag or scroll wheel
3. The zoom slider appears as a vertical rail on the viewport's right edge
4. An "ACQUIRE" button appears at the bottom-center of the viewport
5. When the user presses ACQUIRE, the camera locks reticle position, captures the current pan/tilt/zoom as a tactical waypoint, and overlays a bearing line on the room's 3D panorama
6. The bearing line persists in the room until dismissed, allowing crew to mark targets for later reference

**API Data Format for Gunnery Lock:**

```json
{
  "action": "gunnery.acquire",
  "camera_id": "ptz-crows-nest-01",
  "timestamp": 1747094400000,
  "reticle_position": { "pan": 142.7, "tilt": -12.3 },
  "zoom": 8.5,
  "bearing": {
    "true_north_degrees": 142.7,
    "distance_estimate_m": 4300,
    "target_label": "WAYPOINT-001"
  }
}
```

### 1.2 Thermal Camera — False Color & Hotspot Detection

Thermal cameras overlay infrared data directly onto the room's panoramic view. The architecture maintains two parallel streams: the optical feed (from a companion visible-light camera when available) and the thermal data stream.

#### Thermal Data Pipeline

```
Raw IR Sensor → Frame Grabber → Temperature Map (16-bit grayscale, 640x480 or 320x240)
                                  │
                                  ├──→ Color Mapping (ironbow/white-hot/black-hot/rainbow)
                                  │         ↓
                                  │    Colorized Frame (8-bit RGB)
                                  │
                                  ├──→ Hotspot Detection (threshold > 200°C)
                                  │         ↓
                                  │    Bounding circles + centroid coordinates
                                  │
                                  ├──→ Temperature Readout (per-pixel cursor query)
                                  │
                                  └──→ Optical Registration (align thermal to room panorama)
```

#### Overlaying Thermal on 3D Room View

```typescript
interface ThermalOverlayLayer {
  // The base thermal image rendered at 50% opacity over the room panorama
  baseLayer: {
    imageUrl: string;             // Colorized thermal frame as WebP
    opacity: number;              // 0.0 - 1.0, user-adjustable slider
    colormap: 'ironbow' | 'white-hot' | 'black-hot' | 'rainbow';
    registrationMatrix: number[]; // 3x3 homography to align with room panorama
  };

  // Hotspot circles rendered as HTML5 Canvas overlays on the room
  hotspots: Array<{
    id: string;
    centroid: { x: number; y: number };  // Position in viewport pixel coords
    radiusPx: number;                     // Size of hotspot circle
    maxTemperature: number;               // Celsius
    label: string;                        // Auto-generated: "HOTSPOT-200°C-PORT"
    color: string;                        // Destructive red (#FF2200)
    pulseAnimation: boolean;              // Pulsing ring to draw attention
    lastUpdated: number;                  // Epoch ms
  }>;

  // Cursor temperature readout
  cursorReadout: {
    enabled: boolean;
    position: { x: number; y: number } | null;
    temperature: number | null;           // °C at cursor
    formatted: string;                    // "213.7 °C"
  };
}
```

#### Hotspot Detection Algorithm (Pseudocode)

```
FUNCTION detectHotspots(thermalFrame: Uint16Array, width: number, height: number, threshold: number = 200):
    hotspots = []
    // 1. Adaptive threshold: Otsu's method on temperatures above threshold
    binary = otsuThreshold(thermalFrame, threshold)
    
    // 2. Connected components on binary mask
    components = connectedComponents(binary)
    
    // 3. For each component >= minArea (50 pixels):
    FOR component IN components WHERE component.area >= 50:
        centroid = component.calculateCentroid()
        maxTemp = component.calculateMaxTemperature()
        radius = sqrt(component.area / PI)
        boundingCircle = { centroid, radius }
        
        hotspots.push({
            id: generateUUID(),
            centroid,
            radiusPx: radius / 2,  // Compensate for viewport scale
            maxTemperature: maxTemp,
            color: temperatureToColor(maxTemp),
            pulseAnimation: maxTemp > 250  // Extreme danger = pulsing
        })
    
    // 4. Non-maximum suppression: merge overlapping hotspots
    RETURN nms(hotspots)
```

### 1.3 Quilted Panorama — Directional Stitching

A quilted panorama combines 4 directional cameras (forward, aft, port, starboard) into a seamless 360° view. This is the default viewport type for open deck rooms and the wheelhouse's primary visual feed.

#### Edge Blending Algorithm

Each of the 4 camera feeds has a 180° field of view. Adjacent cameras overlap by ~20° on each side. The blending algorithm:

```
FUNCTION blendQuiltEdges(
    images: CameraFrame[4],    // Forward, Port, Aft, Starboard
    overlapDeg: number = 20
):
    // 1. Cylindrical projection of each frame
    cylinders = images.map(projectToCylinder, radius = 800px)
    
    // 2. For each overlap region (forward-port boundary, etc.):
    //    - Blend zone is overlapDeg / 2 on each side of boundary
    //    - Multi-band blending: seperate low/high frequency
    //    - Low freq: linear crossfade over blend zone
    //    - High freq: Laplacian pyramid blend for detail preservation
    
    // 3. Gain compensation to normalize brightness/color across cameras
    gain = calculateGainCompensation(cylinders)
    compensated = applyGain(cylinders, gain)
    
    // 4. For the forward camera (index 0), compensate for parallax
    //    - Depth-aware warping using optical flow between adjacent frames
    parallaxCorrected = correctParallaxNearFar(compensated, opticalFlowMap)
    
    // 5. Stitch into equirectangular projection
    RETURN stitchEquirectangular(parallaxCorrected)
```

#### Parallax Compensation

Near objects (boom poles, railings within 5m) and far objects (horizon, other vessels) move differently between adjacent cameras. The parallax compensator:

1. Computes dense optical flow between overlapping regions of adjacent cameras
2. Clusters flow vectors into near/far layers using disparity thresholding
3. Warps the near layer in each camera to align with the adjacent camera's perspective
4. The far layer (horizon) requires only cylindrical projection with no additional warp
5. Result: a single 360° panorama where both railings and horizon are seam-free

**Edge case:** If optical flow fails (e.g., pure fog or flat water at night), fall back to linear crossfade blending in the overlap zone — no parallax correction, but no visible seam artifacts either.

### 1.4 Dashboard Camera — Gauges as Vision

A "dashboard camera" is not a visual camera at all. It's a **data overlay layer** that projects real-time vessel instrumentation into the room view.

```typescript
interface DashboardCamera {
  // Inherits Camera base fields
  type: 'dashboard';
  
  // Dashboard-specific
  gauges: GaugeDef[];
  dataSources: DataSourceRef[];
}

interface GaugeDef {
  id: string;
  type: 'analog' | 'digital' | 'bar' | 'trend-line' | 'compass';
  label: string;
  unit: string;
  sourcePath: string;            // Path into the vessel telemetry data tree
  position: { x: number; y: number };  // % position in the viewport
  size: { width: number; height: number };
  min: number;                   // Gauge range min
  max: number;                   // Gauge range max
  warningThreshold: number;      // Yellow zone
  dangerThreshold: number;       // Red zone
  formatFn?: string;             // Client-side formatting: "rpm", "temp", "fuel", "depth"
}

interface DataSourceRef {
  id: string;                    // MQTT topic or CAN bus channel
  protocol: 'mqtt' | 'nmea0183' | 'nmea2000' | 'canbus' | 'simulated';
  path: string;                  // e.g. "engine/main/rpm", "nav/gps/speed_over_ground"
  updateRate: number;            // ms between updates
  lastValue: any;
  staleAfter: number;            // ms after which value is considered stale
}
```

#### Example Dashboard for Wheelhouse

A wheelhouse room configured with a dashboard camera might show:
- **Center-top**: Compass rose (heading from GPS, updates at 10Hz)
- **Left column**: Engine RPM analog gauge, Oil pressure bar, Coolant temp trend-line
- **Right column**: Depth sounder digital readout, Fuel level bar, Speed over ground
- **Bottom strip**: 6-hour trend lines for RPM, temp, fuel consumption
- **Background opacity**: 40%, so the room panorama is still visible behind gauges

### 1.5 Composite Feed — Camera-in-Room

A composite camera places another room's camera feed onto a virtual display surface within the current room. This is equivalent to having a monitor in the wheelhouse showing the engine room's thermal view.

```typescript
interface CompositeFrame {
  type: 'composite';
  sourceCameraId: string;          // Which camera is being sourced
  sourceRoomId: string;            // Which room that camera lives in
  displayShape: 'flat' | 'curved' | 'screen';   // Virtual monitor shape
  displayPosition: {               // Where in the room the virtual display sits
    azimuth: number;               // Degrees from room forward
    elevation: number;             // Degrees up/down
    width: number;                 // Angular width of virtual display
    height: number;                // Angular height
  };
  interactive: boolean;            // Can user manipulate the source camera through this composite?
  latencyMs: number;               // Current roundtrip latency
}
```

**Interaction pattern:** When `interactive: true`, clicking the composite viewport "pierces" through to the source camera's controls. The user can pan/tilt/zoom the source PTZ camera from within the composite frame, while still being in the originating room's panorama. A subtle border glow indicates the composite is "active" — user is now controlling that remote camera.

---

## 2. Camera Viewports

### 2.1 The Corner-Glance / Center-Stare Model

Every room supports a 5-zone viewport system:

```
┌─────────────────────────────────────┐
│ ┌──────┐              ┌──────┐     │
│ │ Glance 1 │              │ Glance 2 │     │
│ └──────┘              └──────┘     │
│                                     │
│           CENTER STARE              │
│         (Primary Viewport)          │
│                                     │
│ ┌──────┐              ┌──────┐     │
│ │ Glance 3 │              │ Glance 4 │     │
│ └──────┘              └──────┘     │
└─────────────────────────────────────┘
```

**Glance viewports** (corner-1 through corner-4):
- Small (20% of room width each)
- Show a thumbnail stream with camera label overlay
- Auto-update at reduced frame rate (5 FPS vs 30 FPS full)
- Click = promotes glance to center stare
- Title/status bar shows camera label, type icon, and connection quality indicator

**Center stare viewport** (the primary zone):
- 60% of room width, centered
- Full resolution, full framerate
- Contains all interactive controls (PTZ, mode switching, overlays)
- When a glance viewport is clicked, the center viewport expands to show its previous content in the clicked glance position (swap animation: 300ms slide transition)

### 2.2 Room-Specific Viewport Layouts

Each room template customizes the glance/stare model:

#### Crow's Nest (Gunnery Ready)
```
┌─────────────────────────────────────┐
│           CENTER STARE              │
│     (Primary PTZ, Large, 80%)      │
│     Reticle overlay active          │
│     Zoom rail on right edge         │
│                                     │
│                         ┌──────┐    │
│                         │ Glance 1 │    │
│                         │ Thermal│    │
│                         └──────┘    │
└─────────────────────────────────────┘
```
Single large center viewport with one small thermal glance in the corner. The PTZ dominates because the crow's nest operator needs maximum situational awareness in one direction. The thermal glance is always present for night/all-weather detection.

#### Engine Room (Thermal Grid)
```
┌─────────────────────────────────────┐
│ ┌──────────┐  ┌──────────┐         │
│ │ Thermal 1 │  │ Thermal 2 │         │
│ │ (Main Eng)│  │ (Aux Eng) │         │
│ └──────────┘  └──────────┘         │
│ ┌──────────┐  ┌──────────┐         │
│ │ Thermal 3 │  │ Dashboard│         │
│ │ (Gen Set) │  │ (Gauges)  │         │
│ └──────────┘  └──────────┘         │
└─────────────────────────────────────┘
```
The engine room uses a 2x2 grid of full viewports — no glance/stare distinction. All four quadrants are equally important. The fourth quadrant is a dashboard overlay showing engine metrics alongside the thermal feed. Each thermal viewport has an independent hotspot overlay layer.

#### Wheelhouse (Command Center)
```
┌─────────────────────────────────────┐
│ ┌────┐      CENTER STARE      ┌───┐│
│ │RADAR│     (Primary Nav)     │AIS ││
│ │Overlay│                        │Ovly││
│ └────┘                          └───┘│
│                                     │
│ ┌────────┐  ┌────────┐  ┌────────┐ │
│ │Dashboard│  │ Composite│  │ Thermal│ │
│ │Gauges  │  │ Engine  │  │ Bow    │ │
│ └────────┘  └────────┘  └────────┘ │
└─────────────────────────────────────┘
```
The wheelhouse has the most complex layout: a dashboard overlay painting directly on the center panorama, two glance viewports for glance (radar overlay and AIS overlay), plus three bottom-dock viewports for persistent monitoring. The center viewport shows the forward-facing panorama with bearing lines, waypoint markers, and AIS targets rendered directly into the 3D room view.

#### Anchor Room / Galley / Berth (Panoramic)
All other rooms use the default 4-corner glance + center stare layout with standard camera assignments.

### 2.3 Viewport-to-Camera Routing

When a viewport is configured with a camera, the data flow is:

```
RoomViewport
  ├── assigns Camera (by id or by slot)
  │     └── Camera.getStream() → MediaStream (WebRTC or MSE)
  │           └── FramePipeline
  │                 ├── Decoder (H.264/H.265/VP9 → raw frames)
  │                 ├── OverlayEngine (thermal hotspots, reticles, bearing lines)
  │                 ├── Downscaler (for glance viewports: 1/4 resolution)
  │                 └── Compositor (blend into viewport canvas)
  │
  ├── ControlChannel (WebSocket or DataChannel)
  │     └── CameraControlAPI (commands → camera → responses)
  │
  └── StatusChannel
        └── CameraHealth (online/offline/latency/fps)
```

When a user clicks a glance viewport, the swap works as follows:

1. Target camera from glance is promoted to full center resolution
2. Current center camera is demoted to the clicked glance's slot (downscaled)
3. Client-side transition: crossfade duration 200ms
4. The previous center camera's controls (reticle, mode, presets) transfer to the new center
5. Status: the same — the control channel migrates seamlessly

---

## 3. Sensor Fusion

### 3.1 Optical + Thermal Overlay

The most common fusion pattern: overlay thermal data onto the optical view so the operator sees visible details AND heat signatures in one frame.

```typescript
interface FusionPipelineOpticalThermal {
  // Registration: require both cameras sharing the same optical axis
  opticalCamera: CameraRef;
  thermalCamera: CameraRef;
  
  // Calibration data (captured during installation)
  calibration: {
    homographyMatrix: number[];   // 3x3: thermal → optical alignment
    opticalFOV: { h: number; v: number };
    thermalFOV: { h: number; v: number };
    thermalCenterOffset: { x: number; y: number }; // Pixels thermal is offset from optical center
  };
  
  // Fusion modes
  mode: 'picture-in-picture' | 'overlay-alpha' | 'side-by-side' | 'difference';
  
  // Alpha blend slider (for overlay mode)
  alpha: number;  // 0 = pure optical, 1 = pure thermal
  
  // Hotspot circle visibility
  showHotspots: boolean;
  hotspotThreshold: number;  // °C
}
```

**Implementation in the client:**

The optical frame is the base layer. The thermal frame is registered to the optical frame via the homography matrix, then composited with the selected alpha. Hotspot circles (anti-aliased, with pulsing glow animation) are drawn on a third canvas layer above everything.

### 3.2 Camera + Radar/AIS Overlay

Radar and AIS data render as floating annotation tags in the camera viewport, keyed to bearing from the vessel.

```typescript
interface RadarAISOverlay {
  targets: AISOverlayTarget[];
  radarReturns: RadarReturn[];
}

interface AISOverlayTarget {
  mmsi: number;                  // Unique vessel identifier
  name: string;                  // Vessel name from AIS
  bearing: number;               // Degrees from vessel forward
  range: number;                 // Nautical miles
  bearingInRoom: number;         // Degrees in room panorama (compensated for vessel heading)
  speedKnots: number;
  courseDegrees: number;
  cpa: number;                   // Closest Point of Approach (nm)
  tcpa: number;                  // Time to CPA (minutes)
  risk: 'safe' | 'caution' | 'danger';  // Collision risk assessment
  tagPosition: { x: number; y: number }; // Pixel position in viewport
  lastUpdated: number;
}
```

**Rendering in the Room Panorama:**

When the operator is viewing the wheelhouse panorama, AIS targets appear as floating tags at their true bearing in the 360° view. Each tag shows:
- MMSI (hover expands to full vessel info card)
- Speed vector arrow (length proportional to speed, direction = course)
- CPA/TCPA in small text
- Color: GREEN (safe, CPA > 2nm), YELLOW (caution, CPA 1-2nm), RED (danger, CPA < 1nm)
- Click on tag → pans PTZ camera to that bearing (if PTZ is assigned to center viewport)

**Radar returns** render as a translucent sweep overlay at the bottom of the viewport, a la traditional radar presentation but semi-transparent and aligned to the room's forward direction.

### 3.3 Camera + Depth Sounder Overlay

```typescript
interface DepthSounderOverlay {
  depthMeters: number;
  depthFeet: number;
  bottomType: 'mud' | 'sand' | 'rock' | 'unknown';
  waterTemp: number;             // Surface temperature
  waveform: number[];            // Last 60 seconds of depth readings (for trend line)
  alarm: { isActive: boolean; threshold: number; type: 'shoaling' | 'rapid-change' };
  
  // Position in viewport
  displayMode: 'corner-widget' | 'floating-hud' | 'dashboard-gauge';
}
```

The depth sounder data overlays as a floating HUD element in the panorama. When depth drops below the configured threshold (e.g., 5 meters in a fishing zone), the overlay pulses red and the room spawns a depth alarm annotation on the nearest glance viewport.

### 3.4 Multi-Spectral Compositing

In specialized rooms (e.g., a "Combat Information Center" variant for military or high-endurance vessels), multiple spectral bands composite together:

```
Composite Layer Stack (bottom to top):
  1. Optical panorama (base) — visible light
  2. Thermal overlay (α-blended, user adjustable 0-100%)
  3. Radar returns (translucent sweep at viewport bottom)
  4. AIS target tags (floating at bearing)
  5. Depth sounder readout (corner widget)
  6. Navigation waypoints and course line (vector overlay)
  7. Hotspot circles (always on top, pulsing)
  8. PTZ reticle (active only in gunnery mode)
  9. Dashboard gauges (configurable transparency)
```

Each layer is independently toggleable via a layer manager panel docked to the room's sidebar. The layer manager shows an opacity slider and a visibility toggle per layer. This compositing happens in a single WebGL canvas using a shader chain, not multiple stacked DOM elements — ensures zero compositor overhead regardless of layer count.

---

## 4. Camera Events → Room Mutations

Cameras are sensors. When a camera detects something, the room responds dynamically.

### Event System

```typescript
interface CameraEvent {
  type: CameraEventType;
  cameraId: string;
  roomId: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'alert' | 'critical';
  payload: any;
}

type CameraEventType = 
  | 'motion_detected'
  | 'hotspot_detected'
  | 'temperature_critical'
  | 'object_tracked'
  | 'object_lost'
  | 'preset_activated'
  | 'camera_offline'
  | 'camera_online'
  | 'camera_degraded'
  | 'ais_target_entered_zone'
  | 'depth_alarm'
  | 'radar_contact_closing'
  | 'low_light_detected';
```

### Event → Room Mutation Mappings

#### Motion Detected → Motion Trail Overlay
When a PTZ or fixed camera detects motion:

1. The room spawns a **motion trail overlay** — a series of fading translucent circles showing the path of the detected object over the last 5 seconds
2. Trail opacity decays: newest at 80%, oldest at 10%
3. A small "MOTION" indicator appears on the relevant glance viewport's corner
4. If motion persists for >3 seconds, the center viewport auto-pivots to the camera that detected motion (if not already viewing it)
5. The motion trail auto-clears after 15 seconds of no motion events

```json
{
  "type": "motion_detected",
  "motion_trail": [
    {"x": 0.45, "y": 0.50, "t_ms": 0},
    {"x": 0.47, "y": 0.48, "t_ms": 1000},
    {"x": 0.50, "y": 0.45, "t_ms": 2000},
    {"x": 0.48, "y": 0.42, "t_ms": 3000}
  ],
  "bounding_box": {"x": 0.45, "y": 0.40, "w": 0.10, "h": 0.15},
  "confidence": 0.87
}
```

#### Hotspot Detected → Temperature Gauge Overlay

When thermal camera detects >200°C:

1. The room spawns a temperature gauge annotation at the hotspot's bearing in the panorama
2. The gauge shows: current max temperature, temperature trend arrow (↑/↓/→), and time since first detection
3. A persistent gauge annotation survives until temperature drops below 150°C for >30 seconds
4. Critical hotspots (>250°C) cause the room viewport border to pulse red
5. The gauge is interactive: click it opens a detail panel with hotspot history graph

#### Auto-Tracking Active → Tracking Reticle

When PTZ auto-tracks an object:

1. A **tracking indicator** — a pulsing circle — appears at the object's current position in the viewport
2. A **locked reticle** — a diamond shape — follows the object with a subtle 200ms delay
3. The viewport title shows: "TRACKING: [object type/ID]"
4. Bearing and speed overlay on the reticle
5. If the object is within 500m (close range), collision timing overlay appears
6. If tracking is lost (object leaves FOV or covers), a "LOCK LOST" message flashes for 2 seconds, then decays

#### AIS Target Enters Zone → Room Annotation

When an AIS target enters a configurable safety zone (default 2nm radius):

1. The room spawns a floating annotation card for that target at its bearing
2. The card shows: Vessel name, Range, CPA, TCPA, and a small speed arrow
3. The card follows the target across the panorama as bearing changes
4. At CPA < 0.5nm, the card pulses red and the glance quadrant flashes
5. Clicking the card shows full AIS details in a sidebar panel

---

## 5. Offline Camera Behavior

### 5.1 Camera Goes Offline

When a camera stream disconnects (RTSP timeout, WebRTC ICE disconnect, hardware fault):

```typescript
interface OfflineState {
  status: 'online' | 'offline' | 'degraded';
  lastFrameTimestamp: number;        // When the last good frame was received
  lastFrameUrl: string;              // URL to the cached last frame (frozen image)
  offlineReason: string;             // "connection_timeout" | "stream_error" | "hardware_fault"
  reconnectAttempts: number;         // Auto-reconnect retry count
  nextRetryAt: number;              // Epoch ms of next reconnect attempt
  degradedCapabilities: string[];   // GUN: only lost zoom, TEMP: lost color data, etc.
}
```

**Room mutation when camera goes offline:**

1. The glance viewport for that camera freezes on the last received frame
2. A **"STALE" watermark** diagonally across the frozen frame
3. Timestamp overlay: "Last updated: HH:MM:SS UTC"
4. The viewport border turns yellow (offline) or red (hardware fault)
5. The viewport title shows: "[CAMERA NAME] — OFFLINE" with connection indicator
6. The center viewport swaps to the next available camera (if multiple are in the room)
7. If ALL cameras in the room are offline, the room panorama shows a "NO CAMERA FEED" message with the room's last cached 360° frame as a static background
8. Auto-reconnect: attempts retry at intervals: 5s, 15s, 30s, 60s, 120s, 300s (exponential backoff cap at 5 min)

### 5.2 Camera Comes Back Online

When reconnect succeeds:

1. The stale frame dissolves to a live feed (500ms crossfade)
2. The STALE watermark animates away (slide up)
3. The timestamp overlay updates to "LIVE" in green
4. The border returns to its default color
5. A brief "RECONNECTED" flash in the viewport title bar (2 seconds)
6. If any motion events queued during offline, they replay as a fast-forward burst (2x speed replay of the last 5 seconds of detected motion)

### 5.3 Partial Degradation

Not all failures are binary. The system tracks **capability degradation**:

```typescript
interface CameraCapabilities {
  pan: boolean;          // PTZ pan axis functional
  tilt: boolean;         // PTZ tilt axis functional
  zoom: boolean;         // PTZ zoom functional
  color: boolean;        // Color image available
  thermal: boolean;      // Thermal data available (for dual cameras)
  audio: boolean;        // Audio stream functional
  ir: boolean;           // IR/night vision functional
  autoFocus: boolean;    // AF functional
  presets: boolean;      // Preset recall functional
}

interface DegradedState {
  lost: string[];        // e.g. ["zoom", "presets"]
  available: string[];   // e.g. ["pan", "tilt", "color"]
  uxAdaptations: UXAdaptation[];
}

type UXAdaptation = 
  | { type: 'disable_controls'; controls: string[] }     // Gray out zoom slider
  | { type: 'show_warning'; message: string }              // Warning badge on viewport
  | { type: 'restrict_mode'; modes: CameraMode[] }         // Can't enter gunnery without zoom
  | { type: 'fallback_resolution'; resolution: string }    // Drop from 4K to 1080p
  | { type: 'rate_limit'; maxFps: number };                // Cap framerate
```

**UX adaptations by degradation type:**

| Lost Capability | UX Adaptation |
|---|---|
| Zoom | Zoom slider disabled and grayed; gunnery mode restricted (requires zoom for reticle accuracy); warning badge: "ZOOM UNAVAILABLE" |
| Pan | Pan controls disabled; camera locked to current orientation; room marks this camera as fixed-position |
| Tilt | Tilt controls disabled; viewport shows fixed vertical FOV |
| Color (falls to monochrome) | Viewport applies sepia tint by default; user can toggle to true monochrome; color-critical overlays (hotspot colors) use text labels as fallback |
| Auto-focus | Focus slider becomes manual; ring appears around focus zone; user must tap-to-focus |
| Presets (mechanical) | Presets list still shows names but greyed with "MANUAL RECALL ONLY" tooltip; user must pan/tilt manually |
| Thermal (in dual camera) | Falls back to pure optical with no thermal overlay; hotspot layer removed from layer manager |
| Audio | Audio icon hidden; no stream indicator for audio |



## Summary: System Data Flow

```
                ┌──────────────────────────────────────────────────┐
                │                  VESSEL BUS                      │
                │  (NMEA 2000 / MQTT / CAN bus / RTSP streams)     │
                └──────┬──────────┬──────────┬────────────────────┘
                       │          │          │
               ┌───────▼──┐ ┌────▼───┐ ┌───▼────────┐
               │ Camera   │ │ Tele-  │ │ External   │
               │ Streams  │ │ metry  │ │ Data (AIS) │
               └───────┬──┘ └────┬───┘ └───┬────────┘
                       │          │          │
                ┌──────▼──────────▼──────────▼──────┐
                │          MEDIA SERVER              │
                │  (Transcoding, Recording, Caching) │
                │  ┌────────────────────────────┐    │
                │  │  Frame Pipeline:           │    │
                │  │  Decode → Process → Encode │    │
                │  │  (Hotspot detection,       │    │
                │  │   Optical flow, AIS fusion)│    │
                │  └────────────────────────────┘    │
                └──────────────┬─────────────────────┘
                               │
                ┌──────────────▼─────────────────────┐
                │     ROOM RENDERING ENGINE           │
                │  (WebGL Panorama Compositor)        │
                │                                     │
                │  ┌────────────────────────────┐    │
                │  │  Layer Stack (bottom→top):  │    │
                │  │  1. Panorama base layer     │    │
                │  │  2. Thermal overlay         │    │
                │  │  3. Radar sweep             │    │
                │  │  4. AIS tags                │    │
                │  │  5. Depth readout           │    │
                │  │  6. Waypoint overlay        │    │
                │  │  7. Hotspot circles         │    │
                │  │  8. Reticle                 │    │
                │  │  9. Dashboard gauges        │    │
                │  └────────────────────────────┘    │
                └──────────────┬─────────────────────┘
                               │
                ┌──────────────▼─────────────────────┐
                │       CLIENT (Browser/App)          │
                │  RoomViewportManager                │
                │  ├─ GlanceViewports (4 corners)    │
                │  ├─ CenterStareViewport            │
                │  ├─ Controls (PTZ/Mode/Overlays)  │
                │  ├─ CameraEvents→Mutations engine │
                │  └─ OfflineState manager           │
                └────────────────────────────────────┘
```

---

## Appendix: Room Configuration Example (JSON)

```json
{
  "room": {
    "id": "wheelhouse-01",
    "label": "Wheelhouse",
    "template": {
      "viewportLayout": {
        "type": "overlay-grid",
        "rows": 2,
        "cols": 3,
        "cornerQuickPeek": false,
        "centerStareSlot": { "row": 0, "col": 1 },
        "gutterSize": 8
      },
      "defaultMode": "nav",
      "allowedModes": ["nav", "panorama", "monitor"],
      "ambientOverlays": ["radar", "ais", "depth"]
    },
    "cameras": [
      {
        "id": "ptz-wheelhouse-main",
        "label": "Forward PTZ",
        "type": "ptz",
        "url": "rtsp://192.168.1.50:554/stream1",
        "mode": "nav",
        "interactive": true,
        "presets": [
          { "id": "p1", "label": "Bow", "pan": 0, "tilt": -15, "zoom": 1.0 },
          { "id": "p2", "label": "Port Beam", "pan": 270, "tilt": 0, "zoom": 1.0 },
          { "id": "p3", "label": "Stbd Beam", "pan": 90, "tilt": 0, "zoom": 1.0 },
          { "id": "p4", "label": "Horizon Scan", "pan": 180, "tilt": -5, "zoom": 5.0 }
        ],
        "slot": "main"
      },
      {
        "id": "thermal-bow",
        "label": "Bow Thermal",
        "type": "thermal",
        "url": "rtsp://192.168.1.55:554/thermal",
        "mode": "monitor",
        "interactive": false,
        "presets": [],
        "slot": "port_lower"
      },
      {
        "id": "dashboard-main",
        "label": "Engine Dashboard",
        "type": "dashboard",
        "url": "mqtt://vessel-bus/gauges",
        "mode": "monitor",
        "interactive": false,
        "presets": [],
        "slot": "stbd_lower"
      },
      {
        "id": "composite-engine",
        "label": "Engine Room View",
        "type": "composite",
        "url": "",
        "mode": "monitor",
        "interactive": true,
        "presets": [],
        "slot": "center_lower"
      }
    ]
  }
}
```

---

*Document generated for the Cocapn Vessel Navigator architecture. Each camera is a crew member. Every room is a watch station. The architecture treats vision as infrastructure — not an afterthought.*
