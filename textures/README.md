# textures/ — Room Panoramas and Camera Feeds

> *The windows. Every room rendered as a 360° sphere.*

AI-generated panoramic textures for the 9 rooms of F/V EILEEN, plus camera feed textures for dashboards and instruments.

## Panoramas (1792×1024)

| File | Room | View |
|------|------|------|
| [`pano_wheelhouse.jpg`](pano_wheelhouse.jpg) | Wheelhouse | Engine dash, radar, nav display, helm controls |
| [`pano_galley.jpg`](pano_galley.jpg) | Galley | Warm kitchen, porthole view, mess table |
| [`pano_foredeck.jpg`](pano_foredeck.jpg) | Foredeck | Bow rail, open ocean, anchor winch |
| [`pano_aft_cockpit.jpg`](pano_aft_cockpit.jpg) | Aft Cockpit | Stern cam, fishing deck, nav display |
| [`pano_engine_room.jpg`](pano_engine_room.jpg) | Engine Room | Diesel engine, thermal camera targets, gauges |
| [`pano_wheelhouse_roof.jpg`](pano_wheelhouse_roof.jpg) | Wheelhouse Roof | 360° panorama, radar antenna, sky |
| [`pano_crows_nest.jpg`](pano_crows_nest.jpg) | Crow's Nest | PTZ gunnery station, elevated view |

## Camera Textures

| File | Camera | Type |
|------|--------|------|
| [`cam_gunnery.jpg`](cam_gunnery.jpg) | Gunnery PTZ | Optical |
| [`cam_radar.jpg`](cam_radar.jpg) | Radar Display | Overlay |
| [`cam_thermal.jpg`](cam_thermal.jpg) | Engine Thermal | Thermal imaging |

Generated with [FLUX-1-schnell](https://github.com/SuperInstance/AI-Writings/tree/main/prose). These are also duplicated in [`docs/textures/`](../docs/textures/) for the deployed site.

## Fleet Connections

- [vessel-agent-system](https://github.com/SuperInstance/vessel-agent-system) — Live telemetry that these rooms visualize
- [hermes-avatar](https://github.com/SuperInstance/hermes-avatar) — The camera feeds as perception endpoints
- [cocapn-dashboard](https://github.com/SuperInstance/cocapn-dashboard) — The bioluminescent fleet dashboard
- [vibe-protocol](https://github.com/SuperInstance/vibe-protocol) — Vibes in these rooms become signals
- [AI-Writings](https://github.com/SuperInstance/AI-Writings/tree/main/prose) — The boat rendered in prose

---

[← Back to Vessel Room Navigator](../README.md)
