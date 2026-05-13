# ESP32-CAM Agent Architecture

**The camera IS the agent.** The agent runs on the ESP32 hardware itself — not on a server talking to a camera. The ScummVM room system is the human interface to that embedded agent.

---

## 1. Core Architecture

```
┌──────────────────────────────────────────────────────┐
│                   ROOM SERVER                         │
│  ┌──────────────────────────────────────────────┐    │
│  │  ScummVM UI (Three.js panoramic rooms)       │    │
│  │  Chat Bot Panel (LLM)                        │    │
│  │  Voice Control (STT → command)               │    │
│  │  Agent Whisper Bus                            │    │
│  │  PLATO Knowledge Filing                       │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────┬───────────────────────────────────┘
                   │ WiFi / MQTT / WebSocket
                   │ JSON protocol
                   ▼
┌──────────────────────────────────────────────────────┐
│              ESP32-CAM AGENT (×N cameras)             │
│  ┌──────────────────────────────────────────────┐    │
│  │  Camera Driver (OV2640/OV5640)              │    │
│  │  MJPEG Streamer                             │    │
│  │  Agent Firmware (C++ / MicroPython)         │    │
│  │  - JSON command parser                      │    │
│  │  - PTZ servo control (GPIO → servos)        │    │
│  │  - Motion detection (frame diff)            │    │
│  │  - Status reporting (temp, WiFi, state)     │    │
│  │  - Hard-coded control logic                 │    │
│  │  WiFi/ESP-NOW mesh                          │    │
│  └──────────────────────────────────────────────┘    │
│  Sensors: GPIO pins, I2C (temp/humidity),           │
│  PIR (motion), servo PWM                            │
└──────────────────────────────────────────────────────┘
```

### Key insight: The ESP32 runs the agent. The room server runs the human interface. They communicate via JSON.

---

## 2. ESP32 Agent Firmware

### Hardware Layer
- **SoC:** ESP32-S3 (dual-core Xtensa LX7 @ 240MHz)
- **PSRAM:** 8MB (for frame buffering)
- **Camera:** OV5640 (5MP) or OV2640 (2MP)
- **PTZ:** 2× servo motors (pan/tilt) via GPIO PWM
- **Connectivity:** WiFi 2.4GHz + Bluetooth 5.0
- **Extra sensors via I2C:** BME280 (temp/pressure/humidity), MPU6050 (accelerometer for vibration monitoring)
- **Power:** 5V via USB or 3.7V LiPo (ESP32 deep sleep: 10μA)

### Firmware Architecture
```
┌─────────────────────────────────────────┐
│  Application Layer                      │
│  ├─ JSON Command Parser                 │
│  ├─ Camera Control (mode, res, fps)     │
│  ├─ PTZ Servo Control (pan, tilt, abs) │
│  ├─ Motion Detection (frame diff)       │
│  ├─ Status Reporter (heartbeat)         │
│  └─ Stream Controller (MJPEG/JPEG)     │
├─────────────────────────────────────────┤
│  Communication Layer                    │
│  ├─ WebSocket Client                    │
│  ├─ MQTT Client (optional fallback)     │
│  ├─ HTTP Server (config endpoint)       │
│  └─ ESP-NOW (mesh, multi-camera sync)   │
├─────────────────────────────────────────┤
│  Hardware Abstraction Layer             │
│  ├─ Camera Driver (esp32-camera)        │
│  ├─ Servo Driver (ESP32 LEDC PWM)       │
│  ├─ I2C Sensor Bus                      │
│  └─ WiFi/Network Stack                  │
└─────────────────────────────────────────┘
```

### Command Protocol (ESP32 ↔ Room Server)

All communication is JSON over WebSocket.

#### Room Server → ESP32 Commands

```json
// Pan/Tilt absolute
{"cmd":"ptz","pan":90,"tilt":-15}

// Pan/Tilt relative
{"cmd":"ptz_rel","pan":5,"tilt":-2}

// Zoom (digital crop)
{"cmd":"zoom","level":2.0}

// Go to preset
{"cmd":"preset","id":"lookout"}

// Save current position as preset
{"cmd":"preset_save","id":"engine_monitor"}

// Set camera mode
{"cmd":"mode","mode":"monitor"}  // monitor | gunnery | lookout | panorama

// Set resolution/framerate
{"cmd":"cam_config","resolution":"VGA","fps":15}

// Start motion detection
{"cmd":"motion_detect","enable":true,"sensitivity":3}

// Ping/status request
{"cmd":"status"}

// OTAs update firmware
{"cmd":"ota","url":"http://server/firmware.bin"}

// Direct GPIO control
{"cmd":"gpio","pin":4,"value":1}

// I2C sensor read
{"cmd":"sensor_read","sensor":"bme280"}

// Set LED (flash/indicator)
{"cmd":"led","r":255,"g":0,"b":0,"duration_ms":500}
```

#### ESP32 → Room Server Responses

```json
// Command acknowledgment
{"ack":true,"cmd":"ptz","seq":42,"status":"ok"}

// Error
{"ack":false,"cmd":"ptz","seq":42,"error":"pan_limit_exceeded","pan_max":180}

// Status report (sent periodically or on request)
{
  "type":"status",
  "agent_id":"cn_ptz_01",
  "room":"crow_nest",
  "uptime":86400,
  "wifi_rssi":-67,
  "free_heap":204800,
  "camera":{"resolution":"VGA","fps":15,"mode":"monitor"},
  "ptz":{"pan":90,"tilt":-15,"zoom":1.0},
  "sensors":{
    "temp":28.5,
    "humidity":65,
    "pressure":1013.2,
    "vibration":0.02
  },
  "motion_detected":false
}

// Motion alert
{
  "type":"motion",
  "agent_id":"cn_ptz_01",
  "room":"crow_nest",
  "timestamp":1778646000,
  "frame":"/stream/snapshot_1778646000.jpg",
  "confidence":0.87,
  "bbox":{"x":120,"y":80,"w":200,"h":150}
}

// Temperature alert
{
  "type":"alert",
  "agent_id":"er_thermal_01",
  "room":"engine_room",
  "severity":"critical",
  "sensor":"thermal",
  "value":215.0,
  "threshold":200.0,
  "timestamp":1778646000
}
```

### Agent State Machine

```
                     ┌──────────┐
                     │  SLEEP   │ ← deep sleep, 10μA
                     └────┬─────┘
                          │ wake (timer / PIR / button)
                          ▼
                     ┌──────────┐
          ┌─────────►│   INIT   │
          │          └────┬─────┘
          │               │ WiFi connect, camera init
          │               ▼
          │          ┌──────────┐
          │          │  STANDBY │ ← connected, streaming configurable
          │          └────┬─────┘
          │               │
          │    ┌──────────┼──────────┐
          │    ▼          ▼          ▼
          │ ┌──────┐ ┌───────┐ ┌────────┐
          │ │MONITOR│ │SCAN   │ │GUNNERY │ ← PTZ active modes
          │ └──────┘ └───────┘ └────────┘
          │    │          │         │
          │    └──────────┼─────────┘
          │               │
          │          ┌────▼────┐
          │          │ ALERT   │ ← motion/temp/event detected
          │          └────┬────┘
          │               │ alert sent, wait for ack
          │               ▼
          │          ┌──────────┐
          │          │ RECOVERY │ ← reset mode after alert
          │          └────┬─────┘
          │               │ return to previous mode
          │               ▼
          │          ┌──────────┐
          │          │ STANDBY  │
          │          └────┬─────┘
          │               │
          └───────────────┘
                          │ OTA: any state → OTA mode
                          ▼
                     ┌──────────┐
                     │   OTA    │ ← firmware update
                     └──────────┘
```

### Motion Detection (On-ESP32)

Lightweight frame differencing — no server needed:

```
1. Grab frame (JPEG → RGB565 via camera driver)
2. Downsample to 160×120
3. Convert to grayscale
4. Compare with previous frame (pixel-wise diff)
5. Count pixels above threshold
6. If count > sensitivity threshold → MOTION event
7. Send alert with bounding box of changed region

Performance: ~30ms per frame (30 FPS motion detection)
No external ML needed for basic detection.
```

### Auto-Tracking (PTZ Follow)

ESP32-level auto-track without server round-trip:

```
1. Motion detected at (cx, cy) in frame
2. If motion persists for 5 frames:
3.   Calculate offset from frame center
4.   Send PTZ correction: pan -= (cx - frame_cx) * kp
5.   Corrections applied at 2Hz to avoid servo jitter
6. If no motion for 30 frames → stop tracking
```

---

## 3. ScummVM UI — Human Interface to the Agent

### Room View (Three.js)
- Panoramic 3D room shows what the ESP32 cameras see
- Camera viewports are agent panels:
  - Viewport title = agent name ("Crow's Nest PTZ")
  - Status indicator (online/offline/alarmed) as border color
  - Controls appear on hover: pan/tilt/zoom sliders, mode selector
  - Agent chat button opens chat panel for that specific agent

### Camera Controls (Ported from ESP32)
All ESP32 agent controls exposed in the ScummVM UI:

```
┌─────────────────────────────────────────────┐
│  🔭 Crow's Nest PTZ               ● ONLINE │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │           CAMERA FEED                 │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│  ┌──────────┐ ┌─────────────────────────┐   │
│  │  PAN ◄──►│ │  TILT ▲              │   │
│  │  ────●───│ │        ●              │   │
│  │          │ │        ▼              │   │
│  └──────────┘ └─────────────────────────┘   │
│  Zoom: [───●───────────] 2.0x               │
│  Mode: [Monitor ▼]  [Gunnery]  [Scan]      │
│  Presets: [Lookout] [Engine] [Horizon]      │
│  [SAVE PRESET] [🔄 Auto-Track]              │
│  Status: 28.5°C | RSSI -67dBm | 15 FPS     │
│  ┌─────────────────────────────────────────┐│
│  │ 💬 | what do you see ahead?             ││
│  │ Agent: Scanning horizon. One vessel     ││
│  │ detected at 2.1 NM, bearing 285°.       ││
│  │ Tracking now.                           ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### Chat Bot Panel
The panel on the right side of every room that talks to the agent:

**What the human types:**
- "pan left 10 degrees"
- "zoom in on that vessel" 
- "what's the engine temp?"
- "save this as 'horizon_lookout'"
- "go to gunnery mode"
- "track that target"
- "why did you alert?"

**What the agent responds:**
- "Panned 10° port. Now at bearing 275°."
- "Zoomed to 4x. Vessel identified: F/V Northwestern, 2.1 NM."
- "Port engine: 182°F (normal). Starboard: 210°F (elevated)."
- "Preset 'horizon_lookout' saved: pan=90, tilt=-5, zoom=1.5x."
- "Gunnery mode active. Reticle on. ACQUIRE button enabled."
- "Tracking vessel at bearing 285°, speed 12 knots."
- "Alert at 03:14:22 UTC — motion detected in engine room view. Thermal gradient suggests hotspot on port manifold."

### Voice Control Flow
```
Human speaks → Speech-to-Text (server/browser) 
              → parsed as JSON command
              → sent to ESP32 agent via WebSocket
              → agent executes
              → status back to room
              → shown as chat response
              → optionally spoken via TTS

Latency target: <500ms from speech to PTZ movement
```

---

## 4. ESP32 Agent ↔ Agent Communication (ESP-NOW Mesh)

ESP-NOW is a connectionless WiFi protocol — no WiFi AP needed. ESP32 agents talk directly.

### Use Cases
- Multi-camera coordination: "I see motion in sector 3" → "I'll pan to confirm"
- PTZ handoff: tracking a vessel from crow's nest → foredeck → agent signals foredeck agent to pick up track
- Alarm propagation: engine room agent detects fire → broadcasts to ALL agents → each agent adjusts mode
- Battery optimization: sleep agents in inactive rooms wake via ESP-NOW

### ESP-NOW Protocol
```json
// Agent-to-Agent message
{
  "from":"er_thermal_01",
  "to":"broadcast",
  "type":"alert",
  "severity":"critical",
  "message":"temp_spike_port_manifold",
  "value":210,
  "threshold":200
}

// Agent coordination
{
  "from":"cn_ptz_01",
  "to":"fd_ptz_01",
  "type":"track_handoff",
  "target":{"bearing":285,"range":2.1,"speed":12},
  "timestamp":1778646000
}
```

### Grouping Agents
ESP-NOW supports multicast groups. Room system can group agents:
- `engine_monitoring_group` — all engine room cameras
- `deck_operations_group` — foredeck + aft cockpit + crow's nest
- `interior_group` — wheelhouse + galley
- `fleet_alarm_group` — ALL agents, for critical events

---

## 5. Power & Deployment

### Power Budget (ESP32-CAM + PTZ servos)
| State | Power | Notes |
|-------|-------|-------|
| Deep sleep | 10μA @ 3.7V | Timer wake, PIR wake |
| Standby (WiFi connected) | 75mA | Camera off, waiting for command |
| Streaming VGA@15fps | 180mA | Typical operational mode |
| Streaming + PTZ active | 500mA | Servos drawing ~300mA peak |
| OTA update | 250mA | WiFi active, flash writing |

### Power Options
- **Hardwired:** 5V USB from vessel's 12V system (recommended for permanent mounts)
- **Battery:** 18650 Li-Ion (3.7V, 3400mAh) → ~10 hours continuous streaming
- **Solar:** 5W panel + TP4056 charger → indefinite in daylight
- **PoE:** ESP32-POE-ISO (IEEE 802.3af) for outdoor cams

### Placement Guide
| Room | Cam Type | Power | ESP-NOW? | Notes |
|------|----------|-------|----------|-------|
| Wheelhouse | Dashboard (data only) | USB | No | Always-on |
| Engine Room | Thermal | Hardwired | Yes | Critical monitoring |
| Crow's Nest | PTZ | Hardwired | Yes | Mast run |
| Foredeck | PTZ | Hardwired | Yes | Exterior |
| Aft Cockpit | PTZ | Hardwired | Yes | Exterior |
| Galley | Fixed | Battery | No | Low priority |
| Wheelhouse Roof | Quilted (4×) | Hardwired | Yes | Pano stitch |
| Bilge | Flood sensor | Battery+ESP-NOW | Yes | Deep sleep, wake on water |

---

## 6. Agent Capability Matrix

### What the ESP32 Does Onboard
- ✅ MJPEG streaming (VGA@15fps, 800kB/s)
- ✅ JSON command parsing and execution
- ✅ PTZ servo control (absolute, relative, presets)
- ✅ Motion detection (frame differencing)
- ✅ Temperature/humidity/pressure sensing (I2C)
- ✅ Status reporting (heartbeat every 10s)
- ✅ ESP-NOW mesh communication
- ✅ OTA firmware updates
- ✅ Deep sleep with timer/wake
- ✅ LED indicator control

### What the ESP32 Cannot Do Onboard
- ❌ Object detection / classification (too little RAM)
- ❌ Large vocabulary speech recognition
- ❌ Persistent storage of hours of video
- ❌ Heavy image processing (no GPU)
- ❌ Running LLM

### What Gets Offloaded to the Room Server
- ✅ Object detection (YOLO-nano on server GPU)
- ✅ Speech-to-text (Whisper or browser native)
- ✅ LLM chat (via OpenClaw models)
- ✅ Video recording (NVR on server)
- ✅ PLATO knowledge filing
- ✅ Multi-camera coordination (beyond basic ESP-NOW)
- ✅ Composite panorama stitching
- ✅ Fleet-wide alarm routing

---

## 7. JSON Protocol Reference

### ESP32 Agent Command Set (Room Server → ESP32)

| Command | Parameters | Description |
|---------|-----------|-------------|
| `ptz` | pan, tilt | Absolute PTZ position (degrees) |
| `ptz_rel` | pan, tilt | Relative PTZ movement |
| `zoom` | level | Digital zoom (1.0-4.0) |
| `preset` | id | Go to named preset |
| `preset_save` | id | Save current position as preset |
| `preset_list` | — | List all saved presets |
| `mode` | mode | Set camera mode |
| `cam_config` | resolution, fps, quality | Camera settings |
| `motion_detect` | enable, sensitivity | Toggle/configure motion detection |
| `status` | — | Full status report |
| `sensor_read` | sensor | Read I2C sensor |
| `gpio` | pin, value | Direct GPIO control |
| `led` | r, g, b, duration_ms | RGB LED control |
| `ota` | url | Firmware update from URL |
| `restart` | — | Soft reset |
| `sleep` | duration_s | Deep sleep for N seconds |

### ESP32 Agent Event Stream (ESP32 → Room Server)

| Event | Fields | Trigger |
|-------|--------|---------|
| `ack` | cmd, seq, status, error | Response to command |
| `status` | full status object | Heartbeat or on request |
| `motion` | confidence, bbox, frame url | Motion detected |
| `alert` | severity, sensor, value, threshold | Sensor threshold exceeded |
| `track` | bearing, range, speed, locked | Auto-tracking update |
| `error` | code, message, recoverable | System error |
| `wifi_status` | rssi, ip, connected | WiFi state change |
| `battery` | level, voltage, charging | Battery state (if battery powered) |
| `boot` | version, uptime, reason | On startup |

---

## 8. ScummVM ↔ ESP32 Integration Points

### Room Load Flow
```
1. Human warps to Crow's Nest room
2. Room system identifies agents in this room: ["cn_ptz_01"]
3. System opens WebSocket to each agent
4. Agent status loads: pan/tilt/zoom, mode, sensors
5. UI renders viewport with current camera feed
6. Controls populate from agent's capabilities
7. Chat panel connects to agent via LLM gateway
8. All ready in <2 seconds
```

### Command Flow (Human → Agent)
```
Human clicks pan-left button
  → UI sends {"cmd":"ptz_rel","pan":-5} via WebSocket
  → ESP32 receives, validates, executes
  → ESP32 sends back {"ack":true,"cmd":"ptz_rel","seq":42,"status":"ok","pan":85,"tilt":-15}
  → UI updates PTZ position indicator
  → Chat panel shows: "Panned 5° port. Now at bearing 085°."
```

### Alert Flow (Agent → Human)
```
ESP32 detects motion
  → Sends {"type":"motion","confidence":0.87,"bbox":{...}}
  → Room system receives, adds to alert queue
  → Notification appears: "Motion detected in Crow's Nest"
  → If critical: auto-warp to crow's nest
  → Chat bot sends: "Alert: I detected motion in my field of view at 04:22 UTC. A vessel appears to be approaching from the port side. Want me to track it?"
```

### Voice Command Flow
```
Human speaks: "crow's nest, pan to vessel at 285"
  → Browser STT converts to text
  → LLM parses: agent="crow's nest", action="pan_to_target", bearing=285
  → If agent PTZ has bearing-relative control: calculate pan angle from current position
  → Send {"cmd":"ptz","pan":calculated} to agent
  → Agent executes, reports status
  → TTS response: "Panning to bearing 285. Vessel in view."
```

---

## 9. Firmware Development

### ESP-IDF (Recommended)
- Full control over camera, WiFi, ESP-NOW
- C/C++, ~100μs interrupt latency
- OTA update built-in
- FreeRTOS for task management

### MicroPython
- Faster prototyping
- Limited by interpreter speed (OK for control, not for streaming decision-loop)
- Use for: PTZ control, sensor reading, command parsing
- Not for: motion detection at 30fps

### Arduino IDE
- Easiest entry
- ESP32 Camera library built-in
- WebSocket libraries available
- Good for prototyping agent commands

### Development Board
```
ESP32-S3-EYE (Espressif official)
- ESP32-S3, 8MB PSRAM
- OV5640 camera
- Microphone (for future voice-on-edge)
- LCD display (debug info on-device)
- $15-20
```

---

## 10. Security

- ESP32 connects to vessel's local WiFi (no internet access)
- WebSocket over WSS (TLS)
- JSON commands authenticated via token in WebSocket handshake
- ESP-NOW uses encrypted packets (AES-128)
- OTA firmware signed (RSA-2048 signature verification)
- Factory reset restores known-good firmware

---

## Architecture Principles

1. **The agent IS the camera.** The ESP32 runs the agent. It's not a camera that an agent uses — it's hardware that IS the agent.
2. **JSON is the API.** Every command, every status report, every alert is JSON. Simple, debuggable, extensible.
3. **ScummVM is just a skin.** The agent doesn't know or care about the UI. It speaks JSON. The room is how humans see it.
4. **ESP-NOW for coordination.** Agents talk to each other without a server. No latency, no single point of failure.
5. **Offload when needed, handle when possible.** Motion detection on ESP32. Object classification on server. Chat on OpenClaw. Each at the right layer.
6. **Chat bot panel is the universal interface.** Type any command, get a human-readable response. Power users use controls, everyone uses chat.
