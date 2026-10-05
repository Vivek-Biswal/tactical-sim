# India training maps

The Training Maps page (`/maps`) provides single-browser practice. Shared multiplayer exercises use `/training`. Both use the same catalog: `backend/app/data/training_areas.json`. The catalog is imported by the TypeScript frontend and loaded by FastAPI.

## Locations

| Terrain | Training location | Geography reference |
| --- | --- | --- |
| Hills | Nilgiri Hills, Tamil Nadu | [Incredible India](https://www.incredibleindia.gov.in/en/tamil-nadu/coimbatore/weekend-getaways-from-coimbatore) |
| Mountain | Auli, Uttarakhand | [Incredible India](https://www.incredibleindia.gov.in/en/uttarakhand/badrinath/auli) |
| Mountain range | Aravalli near Mount Abu, Rajasthan | [Incredible India](https://www.incredibleindia.gov.in/en/rajasthan) |
| Valley | Spiti Valley, Himachal Pradesh | [Incredible India](https://www.prod.incredibleindia.gov.in/content/incredible-india-v2/en/destinations/spiti-valley.html) |
| Volcano island | Barren Island, Andaman & Nicobar Islands | [Andaman Tourism](https://tourism.andamannicobar.gov.in/userpages/admin/docuploads/1762838142_Heritage%20Site.pdf) |
| Sea and coast | Arabian Sea near Kochi, Kerala | [Incredible India](https://www.incredibleindia.gov.in/en/kerala/kochi) |
| River | Brahmaputra near Guwahati, Assam | [Incredible India](https://www.incredibleindia.gov.in/en/assam/guwahati) |
| Lake | Chilika Lake, Odisha | [Chilika Development Authority](https://www.chilika.com/) |
| Desert | Thar near Jaisalmer, Rajasthan | [Incredible India](https://www.incredibleindia.gov.in/en/rajasthan/jaisalmer) |
| Forest | Western Ghats near Munnar, Kerala | [Incredible India](https://www.incredibleindia.gov.in/en/kerala/munnar) |

Coordinates identify configurable demo footprints around these locations. SVG terrain, land/water masks, roads, patrol routes, zones and markers are simplified exercise diagrams, not surveyed geography. The 3D basemap uses real-world terrain; its tactical overlay remains simulated. Movement boundaries use the same schematic masks in either view and may not follow the real shoreline. No real military units, bases, orders or operational intelligence are represented.

## How to practise

1. Open **Training Maps** from the sidebar.
2. Choose terrain and a force before starting. Ground environments offer Army, Air Force and joint profiles. Coastal, river and lake environments also offer Navy. The volcano island offers Navy, Air Force and offshore joint profiles.
3. Press **Start practice**. Units follow simulated patrol or flight routes using the exercise clock. Pause/resume and speed controls affect all movement.
4. Switch between **2D Tactical Map** and **3D Real-World Map**. Select a friendly unit, choose **Move unit**, and select a destination. Boats stay on the schematic water surface and ground teams stay on land; aircraft can cross both. A manual destination replaces that unit's automatic patrol.
5. Try **Position updates**: Current updates markers, Outdated freezes last-known markers, and Unavailable hides them. The engine can continue moving while your information is degraded.
6. Reset to change terrain or force. Export the practice review before refresh. For multiplayer, choose **Create a shared exercise** and configure the same area there.

## Implementation

Existing FastAPI exercise sessions remain authoritative for shared rooms. The existing local engine serves browser-only practice. No map runs its own simulation clock. Both map renderers read the same state, including the withheld/stale feed, altitude, heading, destination and event positions. Map switching does not reset an exercise.

Known presets include geographic bounds, supported force profiles, schematic surface polygons and patrol waypoints. Ground, air and water units retain existing Alpha/Bravo/Charlie IDs so participant controls, radio roles and decision/AAR flows continue to work. The instructor may change an area only before starting; reset retains the selected area/force. Training-area metadata is included in decisions and AARs, and database checkpoints preserve unit patrol state.

Unit speeds are training grid units per simulation second. Air heights are rendering metadata; there is no aerodynamics, ocean-current, bathymetry, collision, terrain-following route planner or live hazard model. Sea markers use water/terrain display heights, not a naval navigation model.

Cesium World Terrain requires the existing public `NEXT_PUBLIC_CESIUM_ION_TOKEN`, with access to terrain asset 1 and the deployment's allowed URL. Without a token, the UI identifies an ellipsoid preview; SVG training continues to work. Real terrain imagery needs internet. These changes do not add a Cesium subscription or change deployment credentials.

To add a location, extend the catalog with an Indian demo center, footprint, supported profiles, surface geometry and valid closed patrol routes, then run the backend and map verification checks. The catalog is checked at build/runtime; do not change a preset's bounds during an exercise.
