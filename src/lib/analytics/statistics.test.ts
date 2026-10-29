import { describe, expect, it } from "vitest";
import {
  calculatePercentage,
  frequencyDistribution,
  groupedMean,
  median,
  parseNumeric,
  pearsonCorrelation,
  summarizeNumeric,
  weightedMean,
} from "@/lib/analytics/statistics";


describe("descriptive statistics", () => {
  it("parses numeric strings and reports missing values", () => {
    expect(parseNumeric(" 1,250 ")).toBe(1250);
    expect(parseNumeric("12.5%")).toBe(12.5);
    expect(parseNumeric("not a number")).toBeNull();
    expect(summarizeNumeric(["1", "2", null, ""])).toMatchObject({
      count: 4,
      validCount: 2,
      missingCount: 2,
      mean: 1.5,
      median: 1.5,
      min: 1,
      max: 2,
    });
  });

  it("calculates median, percentages and weighted means", () => {
    expect(median([8, 2, 5, 3])).toBe(4);
    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(25, 0)).toBeNull();
    expect(weightedMean([1, 0, 1], [1, 2, 3])).toBeCloseTo(2 / 3);
    expect(weightedMean([10, 20], [0, -2])).toBeNull();
  });

  it("returns weighted frequency shares that sum to 100", () => {
    const frequencies = frequencyDistribution(["a", "b", "a", null], [1, 2, 3, 99]);
    expect(frequencies).toHaveLength(2);
    expect(frequencies[0]).toMatchObject({ value: "a", count: 4, percent: 4 / 6 * 100 });
    expect(frequencies.reduce((sum, item) => sum + (item.percent ?? 0), 0)).toBeCloseTo(100);
  });

  it("groups descriptive means and calculates Pearson correlation", () => {
    const rows = [
      { group: "A", value: 1, weight: 1 },
      { group: "A", value: 3, weight: 3 },
      { group: "B", value: 8, weight: 2 },
    ];
    const grouped = groupedMean(rows, "group", "value", "weight");
    expect(grouped.find((entry) => entry.group === "A")?.mean).toBeCloseTo(2.5);
    expect(pearsonCorrelation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(pearsonCorrelation([1, 1, 1], [1, 2, 3])).toBeNull();
  });
});
