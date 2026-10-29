export type SavedAnalysis = {
  id: string;
  title: string;
  createdAt: string;
  datasetName: string;
  source: string;
  reportingPeriod: string;
  question?: string;
  summary: string;
  evidence: string[];
  limitations: string[];
};

const STORAGE_KEY = "imibereho-lens:saved-analyses:v1";

export function readSavedAnalyses(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed as SavedAnalysis[] : [];
  } catch {
    return [];
  }
}

export function saveAnalysis(analysis: Omit<SavedAnalysis, "id" | "createdAt">): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  const next: SavedAnalysis[] = [
    { ...analysis, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ...readSavedAnalyses(),
  ].slice(0, 30);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteSavedAnalysis(id: string): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  const next = readSavedAnalyses().filter((item) => item.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
