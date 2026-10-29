import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { readSheet } from "read-excel-file/node";

type Cell = string | number | boolean | Date | null;
type Sheet = Cell[][];

const projectRoot = process.cwd();
const mainWorkbook = path.join(projectRoot, "public/data/EICV7_Tables_MainIndicatorReport.xlsx");
const mpiWorkbook = path.join(projectRoot, "public/data/EICV7_Tables_MPI.xlsx");
const outputPath = path.join(projectRoot, "src/lib/data/eicv7-verified.json");

function numeric(value: Cell | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function text(value: Cell | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function checksum(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function isNumericAreaRow(row: Cell[]): boolean {
  return Boolean(text(row[0])) && numeric(row[1]) !== null;
}

async function main() {
  const [mainBytes, mpiBytes] = await Promise.all([readFile(mainWorkbook), readFile(mpiWorkbook)]);
  const [districtSheet, extremeSheet, modeledSheet, mpiSheet] = await Promise.all([
    readSheet(mainWorkbook, "Table A9.23") as Promise<Sheet>,
    readSheet(mainWorkbook, "Table 9.2") as Promise<Sheet>,
    readSheet(mainWorkbook, "Table 9.3") as Promise<Sheet>,
    readSheet(mpiWorkbook, "Table B.5") as Promise<Sheet>,
  ]);

  const districtHeader = districtSheet.findIndex((row) => text(row[0]).toLowerCase() === "district");
  if (districtHeader < 0) throw new Error("Could not find the district section in EICV7 Table A9.23.");

  const areaRows = districtSheet.slice(2, districtHeader).filter(isNumericAreaRow);
  const districts = districtSheet.slice(districtHeader + 1).filter(isNumericAreaRow).map((row) => ({
    area: text(row[0]),
    level: "district" as const,
    monetaryPovertyRate: numeric(row[1]),
    standardError: numeric(row[2]),
    confidenceInterval95: { lower: numeric(row[3]), upper: numeric(row[4]) },
    coefficientOfVariation: numeric(row[5]),
    designEffect: numeric(row[6]),
  }));

  if (districts.length !== 30) {
    throw new Error(`Expected 30 district estimates from EICV7 Table A9.23; found ${districts.length}.`);
  }

  const monetaryPovertyAreas = areaRows.map((row) => {
    const rawArea = text(row[0]);
    const area = rawArea === "Poverty Rate" ? "Rwanda" : rawArea;
    return {
    area,
    level: area === "Rwanda" ? "national" as const : ["Urban", "Rural"].includes(area) ? "residence" as const : "province" as const,
    monetaryPovertyRate: numeric(row[1]),
    standardError: numeric(row[2]),
    confidenceInterval95: { lower: numeric(row[3]), upper: numeric(row[4]) },
    coefficientOfVariation: numeric(row[5]),
    designEffect: numeric(row[6]),
    };
  });

  const extremePovertyAreas = extremeSheet.slice(2).filter(isNumericAreaRow).map((row) => ({
    area: text(row[0]),
    level: text(row[0]) === "Rwanda" ? "national" as const : ["Urban", "Rural"].includes(text(row[0])) ? "residence" as const : "province" as const,
    extremePovertyRate: numeric(row[1]),
    standardError: numeric(row[2]),
    confidenceInterval95: { lower: numeric(row[3]), upper: numeric(row[4]) },
    coefficientOfVariation: numeric(row[5]),
    designEffect: numeric(row[6]),
  }));

  const modeled2017 = modeledSheet
    .filter((row) => isNumericAreaRow(row) && numeric(row[2]) !== null)
    .map((row) => ({
      area: text(row[0]),
      modelled2017PovertyRate: numeric(row[2]),
      actual2024PovertyRate: numeric(row[1]),
      modeledChangePercentagePoints: numeric(row[3]),
      status: "modelled comparison; 2017 is not an observed EICV7 estimate" as const,
    }));

  const mpiAreas = mpiSheet.slice(5).filter((row) => text(row[1]) && numeric(row[3]) !== null).map((row) => ({
    area: text(row[1]),
    populationShare: numeric(row[2]),
    mpiIncidence: numeric(row[3]),
    mpiIntensity: numeric(row[4]),
    mpiM0: numeric(row[5]),
  }));

  const output = {
    generatedAt: new Date().toISOString(),
    country: "Rwanda",
    survey: "EICV7",
    surveyPeriod: "October 2023 to October 2024",
    reportingPeriod: "2023/24",
    source: {
      organization: "National Institute of Statistics of Rwanda (NISR)",
      mainIndicatorsReportUrl: "https://statistics.gov.rw/statistical-publications/poverty-and-social-protection/eicv7-main-indicators-report-202324",
      povertyProfileUrl: "https://statistics.gov.rw/data-sources/surveys/EICV/integrated-household-living-conditions-survey-7-eicv-7/eicv7-poverty-profile-report-202324",
      mpiReportUrl: "https://statistics.gov.rw/data-sources/surveys/EICV/integrated-household-living-conditions-survey-7-eicv-7/eicv7-thematic-report-multidimensional-poverty",
      importedAt: "2026-10-28",
      sourceFiles: [
        {
          fileName: "EICV7_Tables_MainIndicatorReport.xlsx",
          sourceUrl: "https://statistics.gov.rw/sites/default/files/documents/2025-04/EICV7_Tables_MainIndicatorReport.xlsx",
          format: "xlsx",
          sha256: checksum(mainBytes),
          sourceTables: ["Table 9.2", "Table 9.3", "Table A9.23"],
        },
        {
          fileName: "EICV7_Tables_MPI.xlsx",
          sourceUrl: "https://statistics.gov.rw/sites/default/files/documents/2025-07/Tables_and_Figures_EICV7_Multidimensional_Poverty_MPI.xlsx",
          format: "xlsx",
          sha256: checksum(mpiBytes),
          sourceTables: ["Table B.5"],
        },
      ],
      limitations: [
        "Published survey estimates are reproduced from NISR tables; this application does not recalculate EICV7 official estimates from household microdata.",
        "District monetary-poverty estimates include survey standard errors and 95% confidence intervals; small differences should not be over-interpreted.",
        "The 2017 comparator is modelled under the EICV7 methodology and is not a directly observed EICV7 estimate.",
        "The local district boundary layer is geoBoundaries/Open Data Rwanda ADM2 (2012 vintage); it is used for visualization only and does not change the statistical estimates.",
      ],
    },
    monetaryPovertyAreas,
    districts,
    extremePovertyAreas,
    modeled2017,
    mpiAreas,
    methodology: {
      monetaryPoverty: "Headcount poverty rate: share of people whose consumption per adult equivalent is below the EICV7 poverty line. The published EICV7 estimate uses the official survey methodology and weights.",
      extremePoverty: "Extreme headcount poverty uses the official EICV7 extreme-poverty line and methodology.",
      mpi: "Multidimensional poverty incidence (H) uses the Rwanda MPI (Alkire-Foster method), four dimensions and 13 indicators, with k = 33.3% of weighted indicators. It is not interchangeable with monetary poverty.",
      denominator: "Published EICV7 person-level rates are percentages of the population unless the table specifies otherwise.",
    },
  };

  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(projectRoot, outputPath)}`);
  console.log(`Loaded ${monetaryPovertyAreas.length} area rows, ${districts.length} districts, ${mpiAreas.length} MPI rows.`);
  console.log(`Main indicator workbook SHA-256: ${checksum(mainBytes)}`);
  console.log(`MPI workbook SHA-256: ${checksum(mpiBytes)}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown data extraction error");
  process.exitCode = 1;
});
