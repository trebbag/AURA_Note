import { FinalizedNoteClient } from './finalized-note-client';

interface FinalizedNotePageProps {
  params: Promise<{ noteId: string }>;
}

export default async function FinalizedNotePage({ params }: FinalizedNotePageProps) {
  const { noteId } = await params;

  return <FinalizedNoteClient noteId={noteId} />;
}
