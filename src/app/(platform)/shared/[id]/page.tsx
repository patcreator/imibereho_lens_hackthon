import { SharedAnalysisViewer } from "@/components/shared-analysis-viewer";

export default async function SharedAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SharedAnalysisViewer key={id} id={id} />;
}
