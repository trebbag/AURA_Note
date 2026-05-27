'use client';

import { useMemo, useState } from 'react';

type AppointmentState = 'scheduled' | 'checked_in' | 'visit_started' | 'cancelled' | 'no_show';
type NoteState = 'shell_created' | 'visit_active';
type Modality = 'in_person' | 'telehealth' | 'phone';
type ScheduleViewMode = 'day' | 'week';

interface StandalonePatient {
  safePatientId: string;
  displayLabel: string;
  status: 'active' | 'inactive';
  preferredModality: Modality;
  chartFreshness: 'current_visit' | 'recent' | 'historical' | 'unknown';
  warning: string;
}

interface ScheduleAppointment {
  appointmentId: string;
  noteId: string;
  safePatientId: string;
  clinicianId: string;
  visitType: string;
  startsAt: string;
  durationMinutes: number;
  modality: Modality;
  reasonForVisit: string;
  appointmentState: AppointmentState;
  noteState: NoteState;
  noteVisibleInDrafts: boolean;
  chartFreshness: StandalonePatient['chartFreshness'];
  chartWarning: string;
}

const initialPatients: StandalonePatient[] = [
  {
    safePatientId: 'safe-patient-demo-001',
    displayLabel: 'Standalone safe-patient-demo-001',
    status: 'active',
    preferredModality: 'in_person',
    chartFreshness: 'recent',
    warning: 'Synthetic standalone chart context only; live EHR completeness is not implied.'
  }
];

const initialAppointments: ScheduleAppointment[] = [
  {
    appointmentId: 'appt-demo-001',
    noteId: 'note-demo-001',
    safePatientId: 'safe-patient-demo-001',
    clinicianId: 'clinician-demo-001',
    visitType: 'Chronic follow-up',
    startsAt: '2026-05-27T14:00',
    durationMinutes: 30,
    modality: 'in_person',
    reasonForVisit: 'Synthetic diabetes and hypertension follow-up',
    appointmentState: 'scheduled',
    noteState: 'shell_created',
    noteVisibleInDrafts: false,
    chartFreshness: 'recent',
    chartWarning: 'Synthetic standalone chart context only; live EHR completeness is not implied.'
  }
];

export default function ScheduleBuilderPage() {
  const [patients, setPatients] = useState<StandalonePatient[]>(initialPatients);
  const [appointments, setAppointments] = useState<ScheduleAppointment[]>(initialAppointments);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('day');
  const [selectedPatientId, setSelectedPatientId] = useState('safe-patient-demo-001');
  const [patientQuery, setPatientQuery] = useState('safe-patient-demo');
  const [screenState, setScreenState] = useState<'ready' | 'saving' | 'blocked' | 'failed' | 'permission-denied' | 'read-only' | 'demo fixture'>('demo fixture');
  const [form, setForm] = useState({
    safePatientId: 'safe-patient-new-002',
    clinicianId: 'clinician-demo-001',
    visitType: 'AWV plus problem',
    startsAt: '2026-05-27T15:00',
    durationMinutes: 40,
    modality: 'in_person' as Modality,
    reasonForVisit: 'Synthetic wellness visit with problem follow-up'
  });
  const [statusMessage, setStatusMessage] = useState(
    'Standalone Schedule Builder is active with synthetic patient shells. EHR and ClinicOS scheduling are disabled.'
  );

  const filteredPatients = useMemo(
    () => patients.filter((patient) => patient.safePatientId.includes(patientQuery)),
    [patientQuery, patients]
  );
  const selectedPatient = patients.find((patient) => patient.safePatientId === selectedPatientId) ?? patients[0];
  const filteredAppointments = appointments.filter(
    (appointment) => viewMode === 'week' || appointment.startsAt.startsWith('2026-05-27')
  );
  const metrics = useMemo(
    () => ({
      scheduled: appointments.filter((appointment) => appointment.appointmentState === 'scheduled').length,
      checkedIn: appointments.filter((appointment) => appointment.appointmentState === 'checked_in').length,
      activeDrafts: appointments.filter((appointment) => appointment.noteVisibleInDrafts).length,
      blocked: appointments.filter((appointment) => ['cancelled', 'no_show'].includes(appointment.appointmentState)).length
    }),
    [appointments]
  );

  function upsertPatient(safePatientId: string, modality: Modality) {
    setPatients((current) => {
      if (current.some((patient) => patient.safePatientId === safePatientId)) return current;
      return [
        ...current,
        {
          safePatientId,
          displayLabel: `Standalone ${safePatientId}`,
          status: 'active',
          preferredModality: modality,
          chartFreshness: 'unknown',
          warning: 'New synthetic patient shell requires chart context source freshness review.'
        }
      ];
    });
  }

  function createAppointment() {
    setScreenState('saving');
    const sequence = appointments.length + 1;
    const appointmentId = `appt-demo-${String(sequence).padStart(3, '0')}`;
    const noteId = `note-demo-${String(sequence).padStart(3, '0')}`;
    upsertPatient(form.safePatientId, form.modality);
    setSelectedPatientId(form.safePatientId);
    setAppointments((current) => [
      ...current,
      {
        appointmentId,
        noteId,
        ...form,
        appointmentState: 'scheduled',
        noteState: 'shell_created',
        noteVisibleInDrafts: false,
        chartFreshness: 'unknown',
        chartWarning: 'New synthetic chart context snapshot requires source freshness review.'
      }
    ]);
    setScreenState('ready');
    setStatusMessage(`Created ${appointmentId} with one linked inactive note shell ${noteId} and standalone patient linkage.`);
  }

  function updateAppointmentStatus(appointmentId: string, appointmentState: AppointmentState) {
    setAppointments((current) =>
      current.map((appointment) => {
        if (appointment.appointmentId !== appointmentId) return appointment;
        if (appointmentState === 'visit_started') {
          return { ...appointment, appointmentState, noteState: 'visit_active', noteVisibleInDrafts: true };
        }
        return { ...appointment, appointmentState };
      })
    );
    setScreenState(appointmentState === 'cancelled' || appointmentState === 'no_show' ? 'blocked' : 'ready');
    setStatusMessage(`Updated ${appointmentId} to ${appointmentState}. Audit and domain-event contracts cover this transition.`);
  }

  function markPatientInactive() {
    if (!selectedPatient) return;
    setPatients((current) =>
      current.map((patient) => (patient.safePatientId === selectedPatient.safePatientId ? { ...patient, status: 'inactive' } : patient))
    );
    setScreenState('read-only');
    setStatusMessage(`${selectedPatient.safePatientId} is inactive for this synthetic standalone fixture.`);
  }

  return (
    <main className="schedule-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Schedule Builder</p>
          <h1>Standalone Patient And Schedule Workspace</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note/drafts">Draft Notes</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
          <a href="/status">Status</a>
        </nav>
      </header>

      <section className="status-band" aria-live="polite">
        <p>{statusMessage}</p>
        <dl>
          <div>
            <dt>Screen State</dt>
            <dd>{screenState}</dd>
          </div>
          <div>
            <dt>Scheduled</dt>
            <dd>{metrics.scheduled}</dd>
          </div>
          <div>
            <dt>Checked In</dt>
            <dd>{metrics.checkedIn}</dd>
          </div>
          <div>
            <dt>Drafts</dt>
            <dd>{metrics.activeDrafts}</dd>
          </div>
          <div>
            <dt>Blocked</dt>
            <dd>{metrics.blocked}</dd>
          </div>
        </dl>
      </section>

      <section className="builder-grid">
        <aside className="appointment-form" aria-label="Standalone patient shell">
          <h2>Patient Shell</h2>
          <label>
            Search Safe ID
            <input value={patientQuery} onChange={(event) => setPatientQuery(event.target.value)} />
          </label>
          <div className="compact-list" aria-label="Patient search results">
            {filteredPatients.length === 0 ? (
              <p className="empty-state">No synthetic patient shell found.</p>
            ) : (
              filteredPatients.map((patient) => (
                <button
                  type="button"
                  key={patient.safePatientId}
                  className={patient.safePatientId === selectedPatientId ? 'selected-row' : 'text-row'}
                  onClick={() => setSelectedPatientId(patient.safePatientId)}
                >
                  {patient.safePatientId}
                </button>
              ))
            )}
          </div>
          {selectedPatient ? (
            <div className="patient-context" aria-label="Selected patient context">
              <strong>{selectedPatient.displayLabel}</strong>
              <span>Status: {selectedPatient.status}</span>
              <span>Preferred: {selectedPatient.preferredModality.replace('_', ' ')}</span>
              <span>Chart freshness: {selectedPatient.chartFreshness}</span>
              <small>{selectedPatient.warning}</small>
              <button type="button" onClick={markPatientInactive}>
                Mark Inactive
              </button>
            </div>
          ) : null}
        </aside>

        <form
          className="appointment-form"
          onSubmit={(event) => {
            event.preventDefault();
            createAppointment();
          }}
        >
          <h2>New Appointment</h2>
          <label>
            Safe Patient ID
            <input value={form.safePatientId} onChange={(event) => setForm({ ...form, safePatientId: event.target.value })} required />
          </label>
          <label>
            Clinician ID
            <input value={form.clinicianId} onChange={(event) => setForm({ ...form, clinicianId: event.target.value })} required />
          </label>
          <label>
            Visit Type
            <select value={form.visitType} onChange={(event) => setForm({ ...form, visitType: event.target.value })}>
              <option>Chronic follow-up</option>
              <option>AWV plus problem</option>
              <option>TCM</option>
              <option>Urgent</option>
              <option>New patient</option>
              <option>Procedure</option>
              <option>Telehealth</option>
            </select>
          </label>
          <label>
            Start Time
            <input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} required />
          </label>
          <label>
            Duration
            <input
              type="number"
              min={5}
              max={480}
              value={form.durationMinutes}
              onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })}
              required
            />
          </label>
          <fieldset>
            <legend>Modality</legend>
            {(['in_person', 'telehealth', 'phone'] as const).map((modality) => (
              <label key={modality} className="radio-row">
                <input type="radio" name="modality" checked={form.modality === modality} onChange={() => setForm({ ...form, modality })} />
                {modality.replace('_', ' ')}
              </label>
            ))}
          </fieldset>
          <label>
            Reason
            <textarea value={form.reasonForVisit} onChange={(event) => setForm({ ...form, reasonForVisit: event.target.value })} rows={3} />
          </label>
          <button type="submit">Create Appointment + Note Shell</button>
        </form>

        <section className="schedule-list" aria-label={`${viewMode} schedule`}>
          <div className="list-toolbar">
            <h2>{viewMode === 'day' ? 'Day Schedule' : 'Week Schedule'}</h2>
            <div className="segmented-control" aria-label="Schedule view mode">
              <button type="button" className={viewMode === 'day' ? 'selected-row' : 'text-row'} onClick={() => setViewMode('day')}>
                Day
              </button>
              <button type="button" className={viewMode === 'week' ? 'selected-row' : 'text-row'} onClick={() => setViewMode('week')}>
                Week
              </button>
            </div>
          </div>
          {filteredAppointments.length === 0 ? <p className="empty-state">No appointments in this schedule view.</p> : null}
          {filteredAppointments.map((appointment) => (
            <article key={appointment.appointmentId} className="appointment-row">
              <div className="appointment-main">
                <strong>{appointment.safePatientId}</strong>
                <span>{appointment.visitType}</span>
                <span>
                  {appointment.startsAt} / {appointment.durationMinutes} min / {appointment.modality.replace('_', ' ')}
                </span>
                <small>{appointment.reasonForVisit}</small>
                <small>Chart context: {appointment.chartFreshness} / {appointment.chartWarning}</small>
              </div>
              <dl className="state-grid">
                <div>
                  <dt>Appointment</dt>
                  <dd>{appointment.appointmentState}</dd>
                </div>
                <div>
                  <dt>Note</dt>
                  <dd>{appointment.noteState}</dd>
                </div>
                <div>
                  <dt>Shell</dt>
                  <dd>{appointment.noteId}</dd>
                </div>
                <div>
                  <dt>Draft Visible</dt>
                  <dd>{appointment.noteVisibleInDrafts ? 'yes' : 'no'}</dd>
                </div>
              </dl>
              <div className="action-row" aria-label={`Actions for ${appointment.appointmentId}`}>
                <button
                  type="button"
                  disabled={appointment.appointmentState !== 'scheduled'}
                  onClick={() => updateAppointmentStatus(appointment.appointmentId, 'checked_in')}
                >
                  Check In
                </button>
                <button
                  type="button"
                  disabled={appointment.appointmentState === 'cancelled' || appointment.appointmentState === 'no_show'}
                  onClick={() => updateAppointmentStatus(appointment.appointmentId, 'visit_started')}
                >
                  Start Visit
                </button>
                <button
                  type="button"
                  disabled={appointment.appointmentState === 'visit_started'}
                  onClick={() => updateAppointmentStatus(appointment.appointmentId, 'cancelled')}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={appointment.appointmentState === 'visit_started'}
                  onClick={() => updateAppointmentStatus(appointment.appointmentId, 'no_show')}
                >
                  No Show
                </button>
                <a className="button-link" href={`/aura-note/workspace/${appointment.appointmentId}`}>
                  Open Workspace
                </a>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
