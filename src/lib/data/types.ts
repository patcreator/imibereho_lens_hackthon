export type GeographicLevel = "national" | "residence" | "province" | "district";

export type SurveyEstimate = {
  area: string;
  level: GeographicLevel;
  monetaryPovertyRate: number | null;
  standardError: number | null;
  confidenceInterval95: { lower: number | null; upper: number | null };
  coefficientOfVariation: number | null;
  designEffect: number | null;
};

export type DistrictEstimate = SurveyEstimate & { level: "district" };

export type MpiEstimate = {
  area: string;
  populationShare: number | null;
  mpiIncidence: number | null;
  mpiIntensity: number | null;
  mpiM0: number | null;
};

export type Eicv7OfficialData = {
  generatedAt: string;
  country: string;
  survey: string;
  surveyPeriod: string;
  reportingPeriod: string;
  source: {
    organization: string;
    mainIndicatorsReportUrl: string;
    povertyProfileUrl: string;
    mpiReportUrl: string;
    importedAt: string;
    sourceFiles: Array<{
      fileName: string;
      sourceUrl: string;
      format: string;
      sha256: string;
      sourceTables: string[];
    }>;
    limitations: string[];
  };
  monetaryPovertyAreas: SurveyEstimate[];
  districts: DistrictEstimate[];
  extremePovertyAreas: Array<{
    area: string;
    level: GeographicLevel;
    extremePovertyRate: number | null;
    standardError: number | null;
    confidenceInterval95: { lower: number | null; upper: number | null };
    coefficientOfVariation: number | null;
    designEffect: number | null;
  }>;
  modeled2017: Array<{
    area: string;
    modelled2017PovertyRate: number | null;
    actual2024PovertyRate: number | null;
    modeledChangePercentagePoints: number | null;
    status: string;
  }>;
  mpiAreas: MpiEstimate[];
  methodology: {
    monetaryPoverty: string;
    extremePoverty: string;
    mpi: string;
    denominator: string;
  };
};

export type IndicatorSource = {
  id: string;
  name: string;
  sourceOrganization: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceFile?: string;
  reportingPeriod: string;
  surveyPeriod: string;
  geography: string;
  denominator: string;
  definition: string;
  unit: string;
  value: number;
  valueLabel?: string;
  limitations?: string[];
};
