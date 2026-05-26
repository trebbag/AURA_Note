export default function StatusPage() {
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Status</h1>
      <p>CP-0 web shell ready. API and worker integrations remain scaffolded until later work orders.</p>
      <dl>
        <dt>Checkpoint</dt>
        <dd>CP-0 repository foundation and domain skeleton</dd>
        <dt>Mode</dt>
        <dd>Standalone-first with ClinicOS adapter boundary</dd>
        <dt>Data posture</dt>
        <dd>Synthetic fixtures only</dd>
      </dl>
    </main>
  );
}
