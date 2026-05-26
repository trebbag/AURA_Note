interface FinalizedNotePageProps {
  params: Promise<{ noteId: string }>;
}

export default async function FinalizedNotePage({ params }: FinalizedNotePageProps) {
  const { noteId } = await params;

  return (
    <main className="notes-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Finalized Note Viewer</p>
          <h1>Read-Only Final Note</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note/finalized">Finalized Notes</a>
          <a href="/aura-note/drafts">Draft Notes</a>
        </nav>
      </header>

      <section className="read-only-viewer" aria-label="Read-only finalized note">
        <div>
          <h2>{noteId}</h2>
          <p>Final note content is not generated in CP-1. This viewer proves the finalized route is read-only.</p>
        </div>
        <dl className="state-grid">
          <div>
            <dt>Editor</dt>
            <dd>disabled</dd>
          </div>
          <div>
            <dt>Export</dt>
            <dd>deferred</dd>
          </div>
          <div>
            <dt>Transcript</dt>
            <dd>role-limited</dd>
          </div>
          <div>
            <dt>Audit</dt>
            <dd>placeholder</dd>
          </div>
        </dl>
        <button type="button" disabled>
          Editing Disabled
        </button>
      </section>
    </main>
  );
}
