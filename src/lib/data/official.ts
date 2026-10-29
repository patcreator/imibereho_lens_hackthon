import eicv7Json from "@/lib/data/eicv7-verified.json";
import type { Eicv7OfficialData, GeographicLevel, IndicatorSource } from "@/lib/data/types";
import { finscopeIndicators, finscopeSource } from "@/lib/data/finscope-2024";

export const eicv7 = eicv7Json as Eicv7OfficialData;

const monetaryNational = eicv7.monetaryPovertyAreas.find((row) => row.level === "national");
const mpiNational = eicv7.mpiAreas.find((row) => row.area === "National");

export const eicv7Indicators: IndicatorSource[] = [
  {
    id: "eicv7-monetary-poverty",
    name: "Monetary poverty rate",
    sourceOrganization: "National Institute of Statistics of Rwanda (NISR)",
    sourceTitle: "EICV7 Main Indicators Report 2023/24",
    sourceUrl: eicv7.source.mainIndicatorsReportUrl,
    sourceFile: "EICV7_Tables_MainIndicatorReport.xlsx · Table A9.23",
    reportingPeriod: eicv7.reportingPeriod,
    surveyPeriod: eicv7.surveyPeriod,
    geography: "Rwanda, national",
    denominator: "Population; person-level estimate",
    definition: eicv7.methodology.monetaryPoverty,
    unit: "percent of population",
    value: monetaryNational?.monetaryPovertyRate ?? 27.4,
    valueLabel: "27.4%",
    limitations: ["Published estimate, reproduced from NISR tables. See the 95% confidence interval and definition."],
  },
  {
    id: "eicv7-mpi-incidence",
    name: "Multidimensional poverty incidence (H)",
    sourceOrganization: "National Institute of Statistics of Rwanda (NISR)",
    sourceTitle: "EICV7 Multidimensional Poverty Thematic Report",
    sourceUrl: eicv7.source.mpiReportUrl,
    sourceFile: "EICV7_Tables_MPI.xlsx · Table B.5",
    reportingPeriod: eicv7.reportingPeriod,
    surveyPeriod: eicv7.surveyPeriod,
    geography: "Rwanda, national",
    denominator: "Population; person-level estimate",
    definition: eicv7.methodology.mpi,
    unit: "percent of population",
    value: mpiNational?.mpiIncidence ?? 30.5,
    valueLabel: "30.5%",
    limitations: ["MPI incidence is a different measure from monetary poverty; it is not a substitute for the monetary headcount."],
  },
  {
    id: "eicv7-extreme-poverty",
    name: "Extreme poverty rate",
    sourceOrganization: "National Institute of Statistics of Rwanda (NISR)",
    sourceTitle: "EICV7 Main Indicators Report 2023/24",
    sourceUrl: eicv7.source.mainIndicatorsReportUrl,
    sourceFile: "EICV7_Tables_MainIndicatorReport.xlsx · Table 9.2",
    reportingPeriod: eicv7.reportingPeriod,
    surveyPeriod: eicv7.surveyPeriod,
    geography: "Rwanda, national",
    denominator: "Population; person-level estimate",
    definition: eicv7.methodology.extremePoverty,
    unit: "percent of population",
    value: eicv7.extremePovertyAreas.find((row) => row.level === "national")?.extremePovertyRate ?? 5.4,
    valueLabel: "5.4%",
  },
];

export const officialIndicators: IndicatorSource[] = [...eicv7Indicators, ...finscopeIndicators];

export const provinces = ["City of Kigali", "Southern", "Western", "Northern", "Eastern"] as const;
export type Province = (typeof provinces)[number];

export const provincePoverty = eicv7.monetaryPovertyAreas.filter((row) => row.level === "province");
export const residencePoverty = eicv7.monetaryPovertyAreas.filter((row) => row.level === "residence");
export const provinceMpi = eicv7.mpiAreas.filter((row) => provinces.includes(row.area as Province));

export function getEstimate(area: string, level?: GeographicLevel) {
  return eicv7.monetaryPovertyAreas.find((row) => row.area === area && (!level || row.level === level));
}

export const verifiedDatasetCount = 2;
export const availableGeographicAreas = eicv7.districts.length;
export { finscopeIndicators, finscopeSource };
