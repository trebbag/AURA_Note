interface WorkspacePageProps {
  params: Promise<{ appointmentId: string }>;
}

const panels = [
  { label: 'Visit Context', state: 'ready', detail: 'Synthetic standalone visit context and disabled integration state.' },
  { label: 'Visit Controls', state: 'blocked', detail: 'Timer controls deepen in WO-004.' },
  { label: 'Note Editor', state: 'blocked', detail: 'Start Visit and run the timer before documenting.' },
  { label: 'Visit Selections', state: 'empty', detail: 'Selected codes/items panel arrives in WO-005.' },
  { label: 'Suggestions', state: 'empty', detail: 'Deterministic suggestion cards arrive in WO-005.' },
  { label: 'Transcript', state: 'empty', detail: 'Mock transcript scaffold arrives in WO-004.' },
  { label: 'Compliance & Quality Review', state: 'empty', detail: 'Compliance drawer arrives in WO-005.' },
  { label: 'History Gap Review', state: 'empty', detail: 'History Gap drawer arrives in WO-005.' }
];

export default async function DocumentationWorkspacePage({ params }: WorkspacePageProps) {
  const { appointmentId } = await params;

  return (
    <main className="workspace-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Documentation Workspace</p>
          <h1>Workspace Shell</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note/schedule">Schedule</a>
          <a href="/aura-note/drafts">Draft Notes</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
        </nav>
      </header>

      <section className="workspace-topline">
        <div>
          <h2>{appointmentId}</h2>
          <p>safe-patient-demo-001 / Chronic follow-up / clinician-demo-001</p>
        </div>
        <dl>
          <div>
            <dt>Visit</dt>
            <dd>not_started</dd>
          </div>
          <div>
            <dt>Timer</dt>
            <dd>not_started</dd>
          </div>
          <div>
            <dt>Recording</dt>
            <dd>not_started</dd>
          </div>
        </dl>
      </section>

      <section className="controls-bar" aria-label="Visit controls">
        <button type="button">Start Visit</button>
        <button type="button" disabled>
          Pause
        </button>
        <button type="button" disabled>
          Resume
        </button>
        <button type="button" disabled>
          Stop
        </button>
        <button type="button" disabled>
          Finalize Note
        </button>
      </section>

      <section className="workspace-grid">
        <article className="editor-pane">
          <div>
            <p className="eyebrow">Editor</p>
            <h2>Locked</h2>
          </div>
          <textarea
            aria-label="Locked documentation editor"
            rows={14}
            value="The editor is locked until the visit timer is running or an approved recording exception is active."
            readOnly
          />
        </article>

        <aside className="workspace-panels" aria-label="Workspace panels">
          {panels.map((panel) => (
            <article key={panel.label} className={`panel-row state-${panel.state}`}>
              <div>
                <strong>{panel.label}</strong>
                <span>{panel.state}</span>
              </div>
              <p>{panel.detail}</p>
            </article>
          ))}
        </aside>
      </section>
    </main>
  );
}
