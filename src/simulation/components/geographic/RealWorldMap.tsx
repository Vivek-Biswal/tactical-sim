"use client";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./real-world-map.css";
import { loadCesium } from "../../lib/cesiumLoader";
import { geographicOverlay, type GeographicOverlayInput } from "../../lib/geographicOverlay";
import { geoToGrid, gridToGeo, inTrainingGrid } from "../../lib/geography";
import type { TrainingArea } from "../../types/geography";

const control = "rounded border border-[#D9D8CE] bg-white px-2 py-1.5 text-[10px] font-bold text-[#344438] hover:bg-[#EEF3E8] disabled:opacity-40";
const statusStyles = { current: "bg-[#EEF3E8] text-[#3A6B30]", outdated: "bg-[#FDF3E3] text-[#8A5C2A]", unavailable: "bg-[#FAF0EF] text-[#A94A3F]" };

function fitArea(viewer: Cesium.Viewer, C: typeof Cesium, area: TrainingArea) {
  const height = viewer.scene.globe.getHeight(C.Cartographic.fromDegrees(area.longitude, area.latitude)) ?? 0;
  const bounds = new C.BoundingSphere(C.Cartesian3.fromDegrees(area.longitude, area.latitude, height), Math.hypot(area.widthMeters, area.heightMeters) * 0.55);
  viewer.camera.viewBoundingSphere(bounds, new C.HeadingPitchRange(0, C.Math.toRadians(-55), 0));
  viewer.camera.lookAtTransform(C.Matrix4.IDENTITY);
  viewer.scene.requestRender();
}
function markerImage(color: string, airborne: boolean) {
  const shape = airborne
    ? '<path d="M18 3l3 11 12 6v4l-12-3v8l4 3v2l-7-2-7 2v-2l4-3v-8L3 24v-4l12-6z"/>'
    : '<path d="M18 3l14 15-14 15L4 18z"/><path d="M18 11v14m-6-7h12" fill="none" stroke="white" stroke-width="2"/>';
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><g fill="' + color + '" stroke="white" stroke-width="1.5">' + shape + "</g></svg>");
}
export default function RealWorldMap(props: GeographicOverlayInput) {
  const { trainingArea, units, mapStatus = "current", mapLastUpdated, className = "" } = props;
  const area = useMemo(() => ({ id: trainingArea.id, name: trainingArea.name, latitude: trainingArea.latitude, longitude: trainingArea.longitude, widthMeters: trainingArea.widthMeters, heightMeters: trainingArea.heightMeters }), [trainingArea.id, trainingArea.name, trainingArea.latitude, trainingArea.longitude, trainingArea.widthMeters, trainingArea.heightMeters]);
  const container = useRef<HTMLDivElement>(null);
  const sdk = useRef<typeof Cesium | null>(null);
  const latest = useRef(props);
  const interaction = useRef({ selectedId: "", moveMode: false });
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null);
  const [error, setError] = useState("");
  const [terrainStatus, setTerrainStatus] = useState("Loading map");
  const [terrainWarning, setTerrainWarning] = useState("");
  const [imageryWarning, setImageryWarning] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [moveMode, setMoveMode] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [retry, setRetry] = useState(0);
  const unavailable = mapStatus === "unavailable";
  const selected = unavailable ? undefined : units.find(u => u.id === selectedId);
  const selectedGeo = selected ? gridToGeo(selected, area) : undefined;
  const canMove = Boolean(props.onUnitMove && props.movementEnabled && mapStatus === "current" && selected?.faction === "friendly");
  useEffect(() => { latest.current = props; interaction.current = { selectedId, moveMode }; }, [props, selectedId, moveMode]);

  useEffect(() => {
    let disposed = false;
    let instance: Cesium.Viewer | undefined;
    let handler: Cesium.ScreenSpaceEventHandler | undefined;
    let observer: ResizeObserver | undefined;
    const unsubscribers: Array<() => void> = [];
    async function initialize() {
      try {
        const C = await loadCesium();
        if (disposed || !container.current) return;
        sdk.current = C;
        const token = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN?.trim();
        // No default/shared token: a missing token is explicitly shown as an ellipsoid preview.
        C.Ion.defaultAccessToken = token || "";
        instance = new C.Viewer(container.current, {
          animation: false, timeline: false, baseLayerPicker: false, geocoder: false,
          homeButton: false, sceneModePicker: false, navigationHelpButton: false,
          fullscreenButton: false, infoBox: false, selectionIndicator: false,
          baseLayer: false, shouldAnimate: false, requestRenderMode: true,
          maximumRenderTimeChange: Infinity,
        });
        const current = instance;
        current.scene.globe.depthTestAgainstTerrain = true;
        current.scene.globe.baseColor = C.Color.fromCssColorString("#536B53");
        current.scene.screenSpaceCameraController.minimumZoomDistance = 50;
        observer = new ResizeObserver(() => { if (!current.isDestroyed()) { current.resize(); current.scene.requestRender(); } });
        observer.observe(container.current);
        fitArea(current, C, latest.current.trainingArea);
        setViewer(current);
        setError("");
        setTerrainWarning("");
        setImageryWarning("");
        setTerrainStatus(token ? "Connecting to Cesium World Terrain" : "Ellipsoid preview · no terrain token");
        const alive = () => !disposed && !current.isDestroyed();
        // Local low-resolution earth imagery also works without an ion token.
        async function localImagery() {
          const provider = await C.TileMapServiceImageryProvider.fromUrl("/cesium/Assets/Textures/NaturalEarthII");
          if (alive()) current.imageryLayers.addImageryProvider(provider);
        }
        if (token) {
          const timeout = window.setTimeout(() => {
            if (alive()) setTerrainWarning("Terrain is taking longer to load. Check your connection and Cesium ion token.");
          }, 15000);
          unsubscribers.push(() => window.clearTimeout(timeout));
          void C.createWorldTerrainAsync({ requestVertexNormals: true }).then(provider => {
            window.clearTimeout(timeout);
            if (!alive()) return;
            current.terrainProvider = provider;
            setTerrainStatus("Cesium World Terrain");
            setTerrainWarning("");
            unsubscribers.push(provider.errorEvent.addEventListener(() => {
              if (alive()) setTerrainWarning("Some terrain tiles failed to load. Check the terrain service or connection.");
            }));
            current.scene.requestRender();
          }).catch(() => {
            window.clearTimeout(timeout);
            if (alive()) {
              setTerrainStatus("Terrain unavailable · ellipsoid preview");
              setTerrainWarning("Cesium World Terrain could not load. Check the ion token and its access to asset 1. The 2D map is available.");
            }
          });
          void C.IonImageryProvider.fromAssetId(2).then(provider => {
            if (alive()) {
              current.imageryLayers.addImageryProvider(provider);
              unsubscribers.push(provider.errorEvent.addEventListener(() => {
                if (alive()) setImageryWarning("Some imagery tiles failed to load.");
              }));
            }
          }).catch(async () => {
            if (!alive()) return;
            setImageryWarning("World imagery unavailable; using a low-resolution earth basemap.");
            await localImagery().catch(() => { if (alive()) setImageryWarning("Basemap imagery unavailable."); });
          });
        } else {
          setTerrainWarning("Set NEXT_PUBLIC_CESIUM_ION_TOKEN to load Cesium World Terrain. This preview has no elevation relief.");
          void localImagery().catch(() => { if (alive()) setImageryWarning("Basemap imagery unavailable."); });
        }
        unsubscribers.push(current.scene.renderError.addEventListener(() => {
          if (alive()) setError("3D rendering stopped. Retry the 3D view or return to the 2D tactical map.");
        }));
        handler = new C.ScreenSpaceEventHandler(current.scene.canvas);
        handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
          const picked = current.scene.pick(event.position);
          const entity = picked?.id;
          const id = entity instanceof C.Entity && entity.id.startsWith("unit:") ? entity.id.slice(5) : "";
          const input = latest.current;
          if (id) {
            const unit = input.units.find(u => u.id === id);
            if (unit && input.mapStatus !== "unavailable") {
              setSelectedId(id); setMoveMode(false); input.onUnitSelect?.(unit);
            }
            return;
          }
          const chosen = input.units.find(u => u.id === interaction.current.selectedId);
          if (!interaction.current.moveMode || !chosen || chosen.faction !== "friendly" || !input.movementEnabled || input.mapStatus !== "current" || !input.onUnitMove) return;
          const ray = current.camera.getPickRay(event.position);
          const hit = ray && current.scene.globe.pick(ray, current.scene);
          if (!hit) return;
          const cartographic = C.Cartographic.fromCartesian(hit);
          const point = geoToGrid({ longitude: C.Math.toDegrees(cartographic.longitude), latitude: C.Math.toDegrees(cartographic.latitude) }, input.trainingArea);
          if (!inTrainingGrid(point)) { setFeedback("Select a destination inside the training boundary."); return; }
          input.onUnitMove(chosen.id, point);
          setMoveMode(false); setFeedback("Movement order sent to the simulation engine.");
        }, C.ScreenSpaceEventType.LEFT_CLICK);
      } catch {
        if (!disposed) setError("Unable to start the 3D map. Check WebGL support, then retry or return to 2D.");
      }
    }
    void initialize();
    return () => {
      disposed = true;
      observer?.disconnect();
      unsubscribers.forEach(remove => remove());
      handler?.destroy();
      if (instance && !instance.isDestroyed()) instance.destroy();
    };
  }, [retry]);

  useEffect(() => {
    if (viewer && !viewer.isDestroyed() && sdk.current) fitArea(viewer, sdk.current, area);
  }, [viewer, area]);

  useEffect(() => {
    const C = sdk.current;
    if (!viewer || viewer.isDestroyed() || !C) return;
    const overlay = geographicOverlay(props);
    const keep = new Set<string>();
    const position = (longitude: number, latitude: number, height = 0) => C.Cartesian3.fromDegrees(longitude, latitude, height);
    const collection = viewer.entities;
    const upsert = (options: Cesium.Entity.ConstructorOptions) => {
      const id = options.id!;
      keep.add(id);
      const existing = collection.getById(id);
      if (!existing) return collection.add(options);
      const updated = new C.Entity(options);
      if (existing.position instanceof C.ConstantPositionProperty && options.position instanceof C.Cartesian3) existing.position.setValue(options.position);
      else existing.position = updated.position;
      existing.billboard = updated.billboard;
      existing.label = updated.label;
      existing.point = updated.point;
      existing.polyline = updated.polyline;
      existing.polygon = updated.polygon;
      return existing;
    }
    collection.suspendEvents();
    try {
      // Boundary and zones are exercise overlays, not claims about real roads or facilities.
      const corners = [{ x: 0, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 600 }, { x: 0, y: 600 }, { x: 0, y: 0 }].map(p => gridToGeo(p, area));
      upsert({ id: "boundary", polyline: { positions: corners.map(p => position(p.longitude, p.latitude)), width: 3, clampToGround: true, material: C.Color.fromCssColorString("#D8C7A5") } });
      overlay.zones.forEach(zone => upsert({ id: "zone:" + zone.id, polygon: {
        hierarchy: new C.PolygonHierarchy(zone.coordinates.map(p => position(p.longitude, p.latitude))),
        material: C.Color.fromCssColorString(zone.type === "restricted" ? "#A94A3F" : "#B69B63").withAlpha(0.18),

      } }));
      overlay.units.forEach(unit => {
        const color = unit.faction === "friendly" ? "#556B3F" : unit.faction === "hostile" ? "#A94A3F" : "#C18B33";
        upsert({
          id: "unit:" + unit.id, name: unit.name,
          position: position(unit.longitude, unit.latitude, unit.airborne ? unit.altitudeMeters ?? 150 : 0),
          billboard: { image: markerImage(color, unit.airborne), width: 34, height: 34,
            rotation: -C.Math.toRadians(unit.heading ?? 0), heightReference: unit.airborne ? C.HeightReference.RELATIVE_TO_GROUND : C.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Infinity },
          label: { text: unit.name + (mapStatus === "outdated" ? " · last known" : ""), font: "bold 12px sans-serif",
            pixelOffset: new C.Cartesian2(0, -27), fillColor: C.Color.WHITE, showBackground: true,
            backgroundColor: C.Color.fromCssColorString("#263229").withAlpha(0.85),
            heightReference: unit.airborne ? C.HeightReference.RELATIVE_TO_GROUND : C.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Infinity },
        });
        if (unit.destinationGeo) upsert({ id: "route:" + unit.id, polyline: {
          positions: [position(unit.longitude, unit.latitude), position(unit.destinationGeo.longitude, unit.destinationGeo.latitude)],
          clampToGround: true, width: 2, material: new C.PolylineDashMaterialProperty({ color: C.Color.fromCssColorString("#D8C7A5") }),
        } });
      });
      overlay.activities.forEach(marker => upsert({
        id: "activity:" + marker.id, name: marker.label, position: position(marker.longitude, marker.latitude),
        point: { pixelSize: 11, color: C.Color.fromCssColorString(marker.type === "contact_warning" || marker.type === "hostile_jammer" ? "#E1A441" : "#70C9B6"), outlineColor: C.Color.WHITE, outlineWidth: 2, heightReference: C.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Infinity },
        label: { text: marker.label, font: "11px sans-serif", pixelOffset: new C.Cartesian2(0, 20), fillColor: C.Color.WHITE, showBackground: true, backgroundColor: C.Color.fromCssColorString("#263229").withAlpha(0.85), heightReference: C.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Infinity },
      }));
      overlay.events.forEach(event => upsert({
        id: "event:" + event.id, position: position(event.longitude, event.latitude),
        point: { pixelSize: 7, color: C.Color.fromCssColorString("#BDA0D2"), heightReference: C.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Infinity },
        label: { text: event.time + " · " + event.title, font: "10px sans-serif", pixelOffset: new C.Cartesian2(0, 37), fillColor: C.Color.WHITE, heightReference: C.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Infinity },
      }));
      collection.values.slice().forEach(entity => { if (!keep.has(entity.id)) collection.remove(entity); });
    } finally { collection.resumeEvents(); }
    viewer.scene.requestRender();
  }, [viewer, props, area, mapStatus]);

  function submitDestination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canMove || !selected) return;
    const data = new FormData(event.currentTarget);
    const point = geoToGrid({ latitude: Number(data.get("latitude")), longitude: Number(data.get("longitude")) }, area);
    if (!inTrainingGrid(point)) { setFeedback("Destination must be inside the training boundary."); return; }
    props.onUnitMove?.(selected.id, point);
    setMoveMode(false); setFeedback("Movement order sent to the simulation engine.");
  }
  return <section aria-label="Real-world 3D tactical map" className={`real-world-map flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#D9D8CE] bg-[#F7F5EE] ${className}`}>
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9D8CE] bg-white px-3 py-2">
      <div><h2 className="text-[11px] font-black uppercase tracking-widest text-[#344438]">Real-world 3D map</h2><p className="text-[9px] text-[#687066]">{area.name} · SIMULATED EXERCISE OVERLAY</p></div>
      <p role="status" className={`rounded px-2 py-1 text-[10px] font-black ${statusStyles[mapStatus]}`}>{mapStatus.toUpperCase()} <span className="font-normal">{mapLastUpdated}</span></p>
    </header>
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-[10px] text-[#687066]">
      <button type="button" className={control} disabled={!viewer || !!error} onClick={() => { if (viewer && sdk.current && !viewer.isDestroyed()) fitArea(viewer, sdk.current, area); }}>Fit training area</button>
      <span role="status">{terrainStatus}</span><span className="ml-auto font-mono">{area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}</span>
    </div>
    {(terrainWarning || imageryWarning) && <p role="status" className="border-y border-[#E8D4B0] bg-[#FDF3E3] px-3 py-2 text-[10px] text-[#8A5C2A]">{[terrainWarning, imageryWarning].filter(Boolean).join(" ")}</p>}
    <div className="relative min-h-[180px] flex-1">
      <div ref={container} className="absolute inset-0" aria-label="3D terrain canvas" />
      {error && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F7F5EE]/95 p-5 text-center text-sm text-[#A94A3F]"><p>{error}</p><button className={control} onClick={() => { setError(""); setViewer(null); setTerrainStatus("Loading map"); setRetry(n => n + 1); }}>Retry 3D map</button></div>}
      {mapStatus === "outdated" && <p className="pointer-events-none absolute inset-x-3 top-3 rounded bg-[#FDF3E3]/95 p-2 text-center text-[10px] font-bold text-[#8A5C2A]">OUTDATED · Last known positions and activity. Current movement is hidden.</p>}
      {unavailable && <div className="pointer-events-none absolute inset-x-3 top-3 rounded border border-[#E8C4C0] bg-white/95 p-4 text-center text-xs text-[#A94A3F]"><p className="font-black">MAP UNAVAILABLE</p><p className="mt-1">Position and activity feeds are hidden. Geographic terrain remains available.</p></div>}
      {moveMode && canMove && <p role="status" className="pointer-events-none absolute inset-x-3 top-3 rounded bg-[#EEF3E8]/95 p-2 text-center text-xs text-[#344438]">Click a destination inside the training boundary.</p>}
    </div>
    <div className="space-y-2 border-t border-[#D9D8CE] bg-white px-3 py-2 text-[10px] text-[#344438]">
      <div className="flex flex-wrap items-center gap-2"><label className="font-bold">Select simulated unit<select className={control + " ml-2"} value={selected?.id ?? ""} disabled={unavailable} onChange={e => { setSelectedId(e.target.value); setMoveMode(false); const unit = units.find(u => u.id === e.target.value); if (unit) props.onUnitSelect?.(unit); }}><option value="">Choose unit / UAV / contact</option>{!unavailable && units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label><span className="ml-auto">◆ Units · ✈ UAVs · ● Activity · ● Events</span></div>
      {selected && selectedGeo && <><p>{selected.name} · {selected.type} · {selected.status} · {selectedGeo.latitude.toFixed(6)}, {selectedGeo.longitude.toFixed(6)}{mapStatus === "outdated" ? " · last known" : ""}</p>
        <form key={selected.id + area.id + area.latitude + area.longitude} onSubmit={submitDestination} className="flex flex-wrap items-center gap-2">
          <button type="button" className={control} disabled={!canMove || !!error} aria-pressed={moveMode && canMove} onClick={() => setMoveMode(v => !v)}>{moveMode ? "Cancel move" : "Move on terrain"}</button>
          <label>Latitude<input className={control + " ml-1 w-24"} name="latitude" type="number" step="any" required defaultValue={selectedGeo.latitude.toFixed(6)} disabled={!canMove} /></label>
          <label>Longitude<input className={control + " ml-1 w-24"} name="longitude" type="number" step="any" required defaultValue={selectedGeo.longitude.toFixed(6)} disabled={!canMove} /></label>
          <button className={control} disabled={!canMove}>Set geographic destination</button>
        </form></>}
      {feedback && <p role="status">{feedback}</p>}
      <p className="text-[#687066]">Drag to pan · wheel to zoom · Ctrl + drag to tilt. Ground units follow terrain; UAV height is above ground. Routes show their ground projection.</p>
    </div>
  </section>;
}
