"use client";

import { useRef, useState, type PointerEvent, type MouseEvent, type FormEvent } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Move, Layers } from "lucide-react";
import type { TacticalUnit, ActivityMarker as Activity, MapStatus } from "../../types/scenario";
import { MAP_WIDTH, MAP_HEIGHT, DEFAULT_ZONES, clampPoint, gridReference, type Point, type MapZone } from "../../lib/mapGeometry";
import { TacticalTerrain } from "./TacticalTerrain";
import { TacticalGrid } from "./TacticalGrid";
import { TacticalZones } from "./TacticalZones";
import { TeamMarker } from "./TeamMarker";
import { ActivityMarker } from "./ActivityMarker";
import { MapLegend } from "./MapLegend";

export interface TacticalMapProps {
  units: TacticalUnit[];
  activityMarkers?: Activity[];
  zones?: MapZone[];
  mapStatus?: MapStatus;
  mapLastUpdated?: string;
  onUnitSelect?: (unit: TacticalUnit) => void;
  onUnitMove?: (id: string, destination: Point) => void;
  movementEnabled?: boolean;
  className?: string;
}
const statusStyles: Record<MapStatus,string> = {
  current:"border-[#C4DAC0] bg-[#EEF3E8] text-[#3A6B30]",
  outdated:"border-[#E8D4B0] bg-[#FDF3E3] text-[#8A5C2A]",
  unavailable:"border-[#E8C4C0] bg-[#FAF0EF] text-[#A94A3F]",
};
const control = "rounded border border-[#D9D8CE] bg-white p-2 text-[#344438] hover:bg-[#EEF3E8] focus-visible:outline-2 focus-visible:outline-[#556B3F] disabled:opacity-40";

export function TacticalMap({units,activityMarkers=[],zones=DEFAULT_ZONES,mapStatus="current",mapLastUpdated="No update timestamp supplied",onUnitSelect,onUnitMove,movementEnabled=false,className=""}:TacticalMapProps) {
  const [selection,setSelection]=useState<{type:"unit"|"activity";id:string}|null>(null);
  const [zoom,setZoom]=useState(1);
  const [center,setCenter]=useState<Point>({x:400,y:300});
  const [cursor,setCursor]=useState<Point|null>(null);
  const [showGrid,setShowGrid]=useState(true);
  const [showZones,setShowZones]=useState(true);
  const [moveMode,setMoveMode]=useState(false);
  const svgRef=useRef<SVGSVGElement>(null);
  const drag=useRef<{id:number;start:Point;center:Point;dragged:boolean}|null>(null);
  const dragged=useRef(false);
  const unavailable=mapStatus==="unavailable";
  const stale=mapStatus==="outdated";
  const selectedUnit=!unavailable && selection?.type==="unit" ? units.find(u=>u.id===selection.id) : undefined;
  const selectedActivity=!unavailable && selection?.type==="activity" ? activityMarkers.find(m=>m.id===selection.id) : undefined;
  const canMove=!!onUnitMove && movementEnabled && mapStatus==="current" && selectedUnit?.faction==="friendly";
  const viewWidth=MAP_WIDTH/zoom, viewHeight=MAP_HEIGHT/zoom;
  const constrain=(p:Point,scale=zoom):Point=>({x:Math.max(MAP_WIDTH/scale/2,Math.min(MAP_WIDTH-MAP_WIDTH/scale/2,p.x)),y:Math.max(MAP_HEIGHT/scale/2,Math.min(MAP_HEIGHT-MAP_HEIGHT/scale/2,p.y))});
  function changeZoom(value:number) { const next=Math.max(1,Math.min(3,value));setZoom(next);setCenter(constrain(center,next)); }
  function mapPoint(clientX:number,clientY:number):Point|null {
    const matrix=svgRef.current?.getScreenCTM();
    if(!matrix)return null;
    const p=new DOMPoint(clientX,clientY).matrixTransform(matrix.inverse());
    return clampPoint(p);
  }
  function selectUnit(unit:TacticalUnit) {setSelection({type:"unit",id:unit.id});setMoveMode(false);onUnitSelect?.(unit);}
  function onPointerDown(e:PointerEvent<SVGSVGElement>) {
    if(e.button!==0 || (e.target as Element).closest("[data-marker]"))return;
    dragged.current=false;
    drag.current={id:e.pointerId,start:{x:e.clientX,y:e.clientY},center,dragged:false};
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e:PointerEvent<SVGSVGElement>) {
    setCursor(mapPoint(e.clientX,e.clientY));
    const start=drag.current;
    if(!start||start.id!==e.pointerId||moveMode)return;
    const dx=e.clientX-start.start.x,dy=e.clientY-start.start.y;
    if(Math.hypot(dx,dy)>4)start.dragged=true;
    if(!start.dragged)return;
    const matrix=e.currentTarget.getScreenCTM();if(!matrix)return;
    setCenter(constrain({x:start.center.x-dx/matrix.a,y:start.center.y-dy/matrix.d}));
  }
  function onPointerEnd(e:PointerEvent<SVGSVGElement>) {
    dragged.current=!!drag.current?.dragged;
    drag.current=null;
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function onMapClick(e:MouseEvent<SVGSVGElement>) {
    if(dragged.current){dragged.current=false;return;}
    if(moveMode&&canMove&&selectedUnit){const p=mapPoint(e.clientX,e.clientY);if(p)onUnitMove?.(selectedUnit.id,p);setMoveMode(false);}
    else {setSelection(null);setMoveMode(false);}
  }
  function submitCoordinates(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!canMove||!selectedUnit)return;
    const data=new FormData(e.currentTarget),x=Number(data.get("x")),y=Number(data.get("y"));
    if(Number.isFinite(x)&&Number.isFinite(y))onUnitMove?.(selectedUnit.id,clampPoint({x,y}));
    setMoveMode(false);
  }
  return <section aria-label="Interactive tactical map" className={`flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#D9D8CE] bg-[#F7F5EE] ${className}`}>
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9D8CE] bg-white px-3 py-2">
      <div><h2 className="text-[11px] font-black uppercase tracking-widest text-[#344438]">Tactical map</h2><p className="text-[9px] text-[#687066]">SECTOR 7 · OBSIDIAN RIDGE · FICTIONAL LOCAL GRID</p></div>
      <div role="status" className={`rounded border px-2 py-1 text-[10px] font-black ${statusStyles[mapStatus]}`}><span>{mapStatus.toUpperCase()}</span><span className="ml-2 font-normal">{mapLastUpdated}</span></div>
    </header>
    <div className="flex flex-wrap items-center gap-2 border-b border-[#D9D8CE] px-3 py-2 text-[10px] text-[#687066]">
      <button type="button" aria-label="Zoom in" onClick={()=>changeZoom(zoom+0.25)} disabled={zoom>=3} className={control}><ZoomIn size={14}/></button>
      <button type="button" aria-label="Zoom out" onClick={()=>changeZoom(zoom-0.25)} disabled={zoom<=1} className={control}><ZoomOut size={14}/></button>
      <button type="button" aria-label="Reset map view" onClick={()=>{setZoom(1);setCenter({x:400,y:300});}} className={control}><RotateCcw size={14}/></button>
      <span className="font-mono">{Math.round(zoom*100)}%</span>
      <button type="button" aria-pressed={showGrid} onClick={()=>setShowGrid(v=>!v)} className={control}>Grid</button>
      <button type="button" aria-pressed={showZones} onClick={()=>setShowZones(v=>!v)} className={`${control} flex items-center gap-1`}><Layers size={12}/>Zones</button>
      <span className="ml-auto font-mono">{cursor?`${gridReference(cursor)} · ${Math.round(cursor.x)}, ${Math.round(cursor.y)}`:"Drag to pan · arrows to pan · +/− to zoom"}</span>
    </div>
    <div className="relative min-h-[180px] flex-1 overflow-hidden">
      <svg ref={svgRef} viewBox={`${center.x-viewWidth/2} ${center.y-viewHeight/2} ${viewWidth} ${viewHeight}`} tabIndex={0} role="group" aria-label="Tactical map canvas. Select a marker for details. Drag to pan or use arrow keys."
        className={`h-full w-full touch-none select-none ${moveMode&&canMove?"cursor-crosshair":"cursor-grab active:cursor-grabbing"}`}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onPointerLeave={()=>setCursor(null)} onClick={onMapClick}
        onKeyDown={e=>{
          if(e.key==="Escape"){setSelection(null);setMoveMode(false);}
          else if(e.key==="+"||e.key==="="){e.preventDefault();changeZoom(zoom+0.25);}
          else if(e.key==="-"){e.preventDefault();changeZoom(zoom-0.25);}
          else if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();setCenter(constrain({x:center.x+(e.key==="ArrowRight"?40:e.key==="ArrowLeft"?-40:0)/zoom,y:center.y+(e.key==="ArrowDown"?40:e.key==="ArrowUp"?-40:0)/zoom}));}
        }}>
        <rect width={800} height={600} fill="#F7F5EE"/>
        <TacticalTerrain/>
        {showZones&&<TacticalZones zones={zones}/>}
        {showGrid&&<TacticalGrid/>}
        {!unavailable && <>
          {units.filter(u=>u.destination).map(u=><g key={`route-${u.id}`} className="pointer-events-none"><line x1={u.x} y1={u.y} x2={u.destination!.x} y2={u.destination!.y} stroke="#556B3F" strokeDasharray="5 5"/><circle cx={u.destination!.x} cy={u.destination!.y} r={6} fill="none" stroke="#556B3F"/></g>)}
          {activityMarkers.map(marker=><ActivityMarker key={marker.id} marker={marker} selected={selection?.id===marker.id} isStale={stale} onSelect={()=>{setSelection({type:"activity",id:marker.id});setMoveMode(false);}}/>)}
          {units.map(unit=><TeamMarker key={unit.id} unit={unit} isSelected={selection?.id===unit.id} isStale={stale} onSelect={()=>selectUnit(unit)}/>)}
        </>}
      </svg>
      {stale&&<p className="pointer-events-none absolute inset-x-3 top-3 rounded border border-[#E8D4B0] bg-[#FDF3E3]/95 p-2 text-center text-[10px] font-bold text-[#8A5C2A]">OUTDATED · Last known positions and activity. Current movement is not visible.</p>}
      {unavailable&&<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#F7F5EE]/75"><div className="mx-4 rounded border border-[#E8C4C0] bg-white p-5 text-center text-[#A94A3F]"><p className="font-black">MAP UNAVAILABLE</p><p className="mt-2 text-xs">No position or activity feed. Static terrain remains available.</p></div></div>}
      {moveMode&&canMove&&<p role="status" className="pointer-events-none absolute inset-x-3 top-3 rounded border border-[#C4DAC0] bg-[#EEF3E8] p-2 text-center text-xs text-[#344438]">Select a destination on the map · Escape cancels</p>}
      <div className="pointer-events-none absolute right-3 bottom-3 text-center font-mono text-xs font-bold text-[#344438]">N<br/>↑</div>
    </div>
    {(selectedUnit||selectedActivity)&&<div className="border-t border-[#D9D8CE] bg-white px-3 py-2 text-xs text-[#344438]">
      <div className="flex items-start justify-between gap-2"><div><p className="font-black">{selectedUnit?.name||selectedActivity?.label}</p><p className="mt-1 text-[10px] capitalize text-[#687066]">{selectedUnit?`${selectedUnit.faction} · ${selectedUnit.type} · ${selectedUnit.status} · comms ${selectedUnit.communicationStatus||"unknown"}`:`${selectedActivity?.type.replaceAll("_"," ")} · ${selectedActivity?.status}`}{stale?" · Last known":""}</p></div><button type="button" className={control} aria-label="Close marker details" onClick={()=>{setSelection(null);setMoveMode(false);}}>×</button></div>
      {selectedUnit&&<form key={selectedUnit.id} onSubmit={submitCoordinates} className="mt-2 flex flex-wrap items-end gap-2">
        <button type="button" className={`${control} flex items-center gap-1 text-[10px] font-bold`} disabled={!canMove} aria-pressed={moveMode&&canMove} onClick={()=>setMoveMode(v=>!v)}><Move size={12}/>{moveMode?"Cancel move":"Move team"}</button>
        <label className="text-[10px]">Destination X<input aria-label="Destination X" name="x" type="number" required min={0} max={800} defaultValue={Math.round(selectedUnit.x)} disabled={!canMove} className="ml-1 w-16 rounded border border-[#D9D8CE] p-1"/></label>
        <label className="text-[10px]">Y<input aria-label="Destination Y" name="y" type="number" required min={0} max={600} defaultValue={Math.round(selectedUnit.y)} disabled={!canMove} className="ml-1 w-16 rounded border border-[#D9D8CE] p-1"/></label>
        <button type="submit" disabled={!canMove} className={`${control} text-[10px] font-bold`}>Set destination</button>
        {!canMove&&<p className="text-[10px] text-[#687066]">Movement requires a running exercise, a current map and a friendly team.</p>}
      </form>}
    </div>}
    <MapLegend/>
  </section>;
}
