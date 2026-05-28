export default function HomePage() {
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>AURA Note v1</h1>
      <p>Initial Codex scaffold. Implement work orders sequentially.</p>
      <ul>
        <li>
          <a href="/aura-note/schedule">Schedule Builder</a>
        </li>
        <li>
          <a href="/aura-note/drafts">Draft Notes</a>
        </li>
        <li>
          <a href="/aura-note/finalized">Finalized Notes</a>
        </li>
        <li>
          <a href="/aura-note/workspace/appt-demo-001">Documentation Workspace</a>
        </li>
        <li>
          <a href="/aura-note/coaching">Coaching and Analytics</a>
        </li>
        <li>
          <a href="/aura-note/integrations/ehr">EHR Sandbox Integration</a>
        </li>
        <li>
          <a href="/aura-note/integrations/clinicos">ClinicOS Integration</a>
        </li>
        <li>
          <a href="/aura-note/ai-governance">AI Governance</a>
        </li>
        <li>
          <a href="/aura-note/support/status">Support Hardening Status</a>
        </li>
        <li>
          <a href="/aura-note/runtime-integration">Frontend Runtime Integration Evidence</a>
        </li>
        <li>Finalization Wizard</li>
      </ul>
    </main>
  );
}
