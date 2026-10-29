import { DataExplorer } from "@/components/data-explorer";

export default async function DatasetExplorerPage({ params }: { params: Promise<{ datasetId: string }> }) {
  const { datasetId } = await params;
  return <DataExplorer key={datasetId} datasetId={datasetId} />;
}
