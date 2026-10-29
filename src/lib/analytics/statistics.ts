export type DataRow = Record<string, unknown>;

export function isMissing(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

export function parseNumeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replaceAll(",", "");
  if (!trimmed) return null;
  const percent = trimmed.endsWith("%") ? trimmed.slice(0, -1) : trimmed;
  const parsed = Number(percent);
  return Number.isFinite(parsed) ? parsed : null;
}

export function median(values: number[]): number | null {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function summarizeNumeric(values: unknown[]) {
  const parsed = values.map(parseNumeric).filter((value): value is number => value !== null);
  const total = values.length;
  const sum = parsed.reduce((acc, value) => acc + value, 0);
  return {
    count: total,
    validCount: parsed.length,
    missingCount: total - parsed.length,
    missingPercent: total ? ((total - parsed.length) / total) * 100 : 0,
    min: parsed.length ? Math.min(...parsed) : null,
    max: parsed.length ? Math.max(...parsed) : null,
    mean: parsed.length ? sum / parsed.length : null,
    median: median(parsed),
  };
}

export function summarizeRows(rows: DataRow[]) {
  const columnNames = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const columns = columnNames.map((column) => {
    const values = rows.map((row) => row[column]);
    const validValues = values.filter((value) => !isMissing(value));
    const numericValues = values.map(parseNumeric).filter((value): value is number => value !== null);
    const frequencies = new Map<string, number>();
    for (const value of validValues) {
      const label = String(value);
      frequencies.set(label, (frequencies.get(label) ?? 0) + 1);
    }
    const type = numericValues.length === validValues.length && validValues.length > 0
      ? "numeric"
      : validValues.some((value) => value instanceof Date)
        ? "date"
        : "categorical";
    return {
      name: column,
      type,
      rowCount: values.length,
      missingCount: values.length - validValues.length,
      missingPercent: values.length ? ((values.length - validValues.length) / values.length) * 100 : 0,
      uniqueCount: frequencies.size,
      numeric: type === "numeric" ? summarizeNumeric(values) : null,
      topValues: [...frequencies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([value, count]) => ({ value, count })),
    };
  });
  const seen = new Set<string>();
  let duplicateRows = 0;
  for (const row of rows) {
    const key = JSON.stringify(row, Object.keys(row).sort());
    if (seen.has(key)) duplicateRows += 1;
    else seen.add(key);
  }
  return { rowCount: rows.length, columnCount: columnNames.length, duplicateRows, columns };
}

export function weightedMean(values: unknown[], weights: unknown[]): number | null {
  if (values.length !== weights.length) throw new Error("Values and weights must have the same length.");
  let weightedTotal = 0;
  let weightTotal = 0;
  for (let index = 0; index < values.length; index += 1) {
    const value = parseNumeric(values[index]);
    const weight = parseNumeric(weights[index]);
    if (value === null || weight === null || weight <= 0) continue;
    weightedTotal += value * weight;
    weightTotal += weight;
  }
  return weightTotal > 0 ? weightedTotal / weightTotal : null;
}

export function calculatePercentage(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

export function groupedMean(rows: DataRow[], groupField: string, valueField: string, weightField?: string) {
  const grouped = new Map<string, { values: unknown[]; weights: unknown[] }>();
  for (const row of rows) {
    const group = row[groupField];
    if (isMissing(group)) continue;
    const key = String(group);
    const entry = grouped.get(key) ?? { values: [], weights: [] };
    entry.values.push(row[valueField]);
    if (weightField) entry.weights.push(row[weightField]);
    grouped.set(key, entry);
  }
  return [...grouped.entries()].map(([group, entry]) => ({
    group,
    count: entry.values.filter((value) => !isMissing(value)).length,
    mean: weightField ? weightedMean(entry.values, entry.weights) : summarizeNumeric(entry.values).mean,
  }));
}

export function frequencyDistribution(values: unknown[], weights?: unknown[]) {
  if (weights && values.length !== weights.length) throw new Error("Values and weights must have the same length.");
  const counts = new Map<string, number>();
  let total = 0;
  values.forEach((value, index) => {
    if (isMissing(value)) return;
    const key = String(value);
    const weight = weights ? parseNumeric(weights[index]) : 1;
    if (weight === null || weight <= 0) return;
    counts.set(key, (counts.get(key) ?? 0) + weight);
    total += weight;
  });
  return [...counts.entries()].map(([value, count]) => ({
    value,
    count,
    percent: total ? (count / total) * 100 : null,
  })).sort((a, b) => b.count - a.count);
}

export function pearsonCorrelation(xValues: unknown[], yValues: unknown[]): number | null {
  if (xValues.length !== yValues.length) throw new Error("Both series must have the same length.");
  const pairs = xValues.map((x, index) => [parseNumeric(x), parseNumeric(yValues[index])] as const)
    .filter((pair): pair is readonly [number, number] => pair[0] !== null && pair[1] !== null);
  if (pairs.length < 2) return null;
  const meanX = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length;
  const meanY = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length;
  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;
  for (const [x, y] of pairs) {
    numerator += (x - meanX) * (y - meanY);
    denominatorX += (x - meanX) ** 2;
    denominatorY += (y - meanY) ** 2;
  }
  const denominator = Math.sqrt(denominatorX * denominatorY);
  return denominator ? numerator / denominator : null;
}
