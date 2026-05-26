export default function HomePage() {
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>AURA Note v1</h1>
      <p>Initial Codex scaffold. Implement work orders sequentially.</p>
      <ul>
        <li>
          <a href="/aura-note/schedule">Schedule Builder</a>
        </li>
        <li>Draft Notes</li>
        <li>Finalized Notes</li>
        <li>Documentation Workspace</li>
        <li>Finalization Wizard</li>
      </ul>
    </main>
  );
}
