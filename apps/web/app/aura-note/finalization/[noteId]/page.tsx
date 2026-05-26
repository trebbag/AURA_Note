import { FinalizationClient } from './finalization-client';

interface FinalizationPageProps {
  params: Promise<{ noteId: string }>;
}

export default async function FinalizationPage({ params }: FinalizationPageProps) {
  const { noteId } = await params;
  return <FinalizationClient noteId={noteId} />;
}
