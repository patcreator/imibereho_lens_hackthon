"use client";

import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, ZoomControl, useMap } from "react-leaflet";
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { eicv7 } from "@/lib/data/official";
import { rwandaBoundaryMetadata } from "@/lib/data/boundary-metadata";
import { formatPercent } from "@/lib/utils";

type BoundaryFeature = {
  type: "Feature";
  properties: { shapeName?: string; shapeID?: string; [key: string]: unknown };
  geometry: unknown;
};
type BoundaryCollection = { type: "FeatureCollection"; features: BoundaryFeature[] };

const nationalRate = eicv7.monetaryPovertyAreas.find((item) => item.level === "national")?.monetaryPovertyRate ?? 27.4;

function fillForRate(rate: number | undefined) {
  if (rate === undefined) return "#dce6df";
  if (rate < 15) return "#cde4d2";
  if (rate < 25) return "#9ccaa8";
  if (rate < 35) return "#e7bd6c";
  return "#ca8054";
}

function FitRwandaBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([[-2.84, 28.85], [-1.04, 30.91]], { padding: [12, 12], animate: false });
  }, [map]);
  return null;
}

export function RwandaPovertyMap({ height = 440 }: { height?: number }) {
  const [boundaries, setBoundaries] = useState<BoundaryCollection | null>(null);
  const [selectedName, setSelectedName] = useState("Nyamagabe");
  const [error, setError] = useState("");
  const estimates = useMemo(() => new Map(eicv7.districts.map((item) => [item.area, item])), []);
  const selected = estimates.get(selectedName);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/rwanda-adm2-geoboundaries.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("Boundary file could not be loaded.");
        return response.json() as Promise<BoundaryCollection>;
      })
      .then((data) => { if (!cancelled) setBoundaries(data); })
      .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Boundary file could not be loaded."); });
    return () => { cancelled = true; };
  }, []);

  const styleFeature = (feature?: BoundaryFeature): PathOptions => {
    const name = feature?.properties.shapeName ?? "";
    const rate = estimates.get(name)?.monetaryPovertyRate ?? undefined;
    const isSelected = name === selectedName;
    return {
      fillColor: fillForRate(rate ?? undefined),
      weight: isSelected ? 2.4 : 0.8,
      opacity: 1,
      color: isSelected ? "#183e2f" : "#ffffff",
      dashArray: isSelected ? undefined : "",
      fillOpacity: isSelected ? 0.92 : 0.78,
    };
  };

  const onEachFeature = (feature: BoundaryFeature, layer: Layer) => {
    const name = feature.properties.shapeName ?? "Unknown district";
    const estimate = estimates.get(name);
    const value = estimate?.monetaryPovertyRate;
    const lower = estimate?.confidenceInterval95.lower;
    const upper = estimate?.confidenceInterval95.upper;
    const interval = lower !== null && lower !== undefined && upper !== null && upper !== undefined
      ? `<div style="color:#64756d;margin-top:3px">95% CI ${lower.toFixed(1)}–${upper.toFixed(1)}%</div>`
      : "";
    if ("bindTooltip" in layer && typeof layer.bindTooltip === "function") {
      layer.bindTooltip(`<strong>${name}</strong><div>${formatPercent(value, 1)} monetary poverty</div>${interval}`, { sticky: true, direction: "top" });
    }
    if ("on" in layer && typeof layer.on === "function") {
      layer.on({
        click: () => setSelectedName(name),
        mouseover: (event: LeafletMouseEvent) => {
          const target = event.target as { setStyle?: (options: PathOptions) => void };
          target.setStyle?.({ weight: 2, color: "#315c49", fillOpacity: 1 });
        },
        mouseout: (event: LeafletMouseEvent) => {
          const target = event.target as { setStyle?: (options: PathOptions) => void };
          target.setStyle?.(styleFeature(feature));
        },
      });
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">District view · EICV7</div>
          <CardTitle className="mt-1.5 text-[15px] font-semibold">Monetary poverty by district</CardTitle>
          <p className="mt-1 text-[11px] text-muted-foreground">Click an area for its published estimate and 95% confidence interval.</p>
        </div>
        <Badge variant="secondary" className="shrink-0 rounded-full text-[10px]">30 districts</Badge>
      </CardHeader>
      <CardContent className="px-3 pb-4 sm:px-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_205px]">
          <div className="relative overflow-hidden rounded-2xl border border-border/80" style={{ height }}>
            {boundaries ? (
              <MapContainer center={[-1.95, 30.05]} zoom={8} minZoom={7} maxZoom={10} zoomControl={false} scrollWheelZoom={false} style={{ width: "100%", height: "100%" }}>
                <FitRwandaBounds />
                <ZoomControl position="topright" />
                <GeoJSON data={boundaries as never} style={(feature) => styleFeature(feature as BoundaryFeature)} onEachFeature={onEachFeature} />
              </MapContainer>
            ) : (
              <div className="flex h-full items-center justify-center bg-muted/60 p-6 text-center text-sm text-muted-foreground">
                {error || "Loading verified district boundaries…"}
              </div>
            )}
            <div className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-lg border border-border/70 bg-card/95 px-3 py-2 text-[10px] font-semibold shadow-sm">
              NISR EICV7 · 2023/24
            </div>
          </div>
          <aside className="flex flex-col justify-between gap-5 rounded-xl border border-border/70 bg-muted/30 p-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Selected district</div>
              <div className="mt-2 text-[15px] font-semibold">{selectedName}</div>
              <div className="mt-1 font-display text-[30px] font-semibold tracking-tight text-primary">{formatPercent(selected?.monetaryPovertyRate, 1)}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">National estimate: {formatPercent(nationalRate, 1)}</div>
              <div className="mt-3 rounded-lg bg-card p-3 text-[10px] leading-relaxed text-muted-foreground">
                95% confidence interval<br />
                <span className="font-semibold text-foreground">{formatPercent(selected?.confidenceInterval95.lower, 1)} – {formatPercent(selected?.confidenceInterval95.upper, 1)}</span>
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Rate bands</div>
              <div className="space-y-1.5 text-[10px] text-muted-foreground">
                {[
                  ["< 15%", "#cde4d2"], ["15–24.9%", "#9ccaa8"], ["25–34.9%", "#e7bd6c"], ["≥ 35%", "#ca8054"],
                ].map(([label, color]) => <div key={label} className="flex items-center gap-2"><span className="size-3 rounded-sm" style={{ background: color }} />{label}</div>)}
              </div>
            </div>
          </aside>
        </div>
        <div className="mt-3 flex flex-col gap-1.5 text-[10px] leading-relaxed text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
          <span>{rwandaBoundaryMetadata.source} · {rwandaBoundaryMetadata.administrativeLevel} · boundary year {rwandaBoundaryMetadata.boundaryYear} · {rwandaBoundaryMetadata.license}</span>
          <span>Source estimate: NISR, Table A9.23</span>
        </div>
      </CardContent>
    </Card>
  );
}
