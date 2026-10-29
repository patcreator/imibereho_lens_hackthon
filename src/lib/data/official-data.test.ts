import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import eicv7 from "@/lib/data/eicv7-verified.json";

describe("verified source snapshot", () => {
  it("keeps key national values and provenance", () => {
    const national = eicv7.monetaryPovertyAreas.find((row) => row.level === "national");
    const mpi = eicv7.mpiAreas.find((row) => row.area === "National");
    expect(national?.area).toBe("Rwanda");
    expect(national?.monetaryPovertyRate).toBeCloseTo(27.362976, 5);
    expect(national?.confidenceInterval95.lower).toBeCloseTo(26.3896, 3);
    expect(mpi?.mpiIncidence).toBe(30.5);
    expect(eicv7.districts).toHaveLength(30);
    expect(eicv7.source.sourceFiles).toHaveLength(2);
    expect(eicv7.source.sourceFiles.every((file) => /^[a-f0-9]{64}$/.test(file.sha256))).toBe(true);
  });

  it("matches each district estimate to the bundled ADM2 geometry name", () => {
    const geo = JSON.parse(readFileSync(resolve(process.cwd(), "public/data/rwanda-adm2-geoboundaries.geojson"), "utf8")) as {
      features: Array<{ properties?: { shapeName?: string } }>;
    };
    const boundaryNames = new Set(geo.features.map((feature) => feature.properties?.shapeName));
    expect(geo.features).toHaveLength(30);
    expect(eicv7.districts.map((district) => district.area).filter((name) => !boundaryNames.has(name))).toEqual([]);
  });
});
