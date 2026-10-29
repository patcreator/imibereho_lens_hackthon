"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eicv7 } from "@/lib/data/official";
import { downloadCsv } from "@/lib/utils";

export function ExportOfficialPovertyButton() {
  const exportRows = () => downloadCsv("rwanda-eicv7-monetary-poverty-districts.csv", eicv7.districts.map((row) => ({
    district: row.area,
    monetary_poverty_rate_percent: row.monetaryPovertyRate,
    standard_error_percentage_points: row.standardError,
    ci95_lower_percent: row.confidenceInterval95.lower,
    ci95_upper_percent: row.confidenceInterval95.upper,
    coefficient_of_variation_percent: row.coefficientOfVariation,
    design_effect: row.designEffect,
    survey_period: eicv7.surveyPeriod,
    reporting_period: eicv7.reportingPeriod,
    source_table: "NISR EICV7 Main Indicators Report, Table A9.23",
  })));

  return <Button onClick={exportRows} size="sm" className="rounded-xl"><Download className="mr-1.5 size-3.5" />Download CSV</Button>;
}
