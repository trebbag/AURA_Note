'use client';

import { useMemo, useState } from 'react';

type AppointmentState = 'scheduled' | 'visit_started';
type NoteState = 'shell_created' | 'visit_active';
type Modality = 'in_person' | 'telehealth' | 'phone';

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
}

const initialAppointments: ScheduleAppointment[] = [
  {
    appointmentId: 'appt-demo-001',
    noteId: 'note-demo-001',
    safePatientId: 'safe-patient-demo-001',
    clinicianId: 'clinician-demo-001',
    visitType: 'Chronic follow-up',
    startsAt: '2026-05-26T14:00',
    durationMinutes: 30,
    modality: 'in_person',
    reasonForVisit: 'Synthetic diabetes and hypertension follow-up',
    appointmentState: 'scheduled',
    noteState: 'shell_created',
    noteVisibleInDrafts: false
  }
];

export default function ScheduleBuilderPage() {
  const [appointments, setAppointments] = useState<ScheduleAppointment[]>(initialAppointments);
  const [form, setForm] = useState({
    safePatientId: 'safe-patient-new-002',
    clinicianId: 'clinician-demo-001',
    visitType: 'AWV plus problem',
    startsAt: '2026-05-26T15:00',
    durationMinutes: 40,
    modality: 'in_person' as Modality,
    reasonForVisit: 'Synthetic wellness visit with problem follow-up'
  });
  const [statusMessage, setStatusMessage] = useState('Standalone Schedule Builder is active. EHR and ClinicOS scheduling are disabled.');

  const metrics = useMemo(
    () => ({
      scheduled: appointments.filter((appointment) => appointment.appointmentState === 'scheduled').length,
      activeDrafts: appointments.filter((appointment) => appointment.noteVisibleInDrafts).length,
      noteShells: appointments.length
    }),
    [appointments]
  );

  function createAppointment() {
    const sequence = appointments.length + 1;
    const appointmentId = `appt-demo-${String(sequence).padStart(3, '0')}`;
    const noteId = `note-demo-${String(sequence).padStart(3, '0')}`;

    setAppointments((current) => [
      ...current,
      {
        appointmentId,
        noteId,
        ...form,
        appointmentState: 'scheduled',
        noteState: 'shell_created',
        noteVisibleInDrafts: false
      }
    ]);
    setStatusMessage(`Created ${appointmentId} with one linked inactive note shell ${noteId}.`);
  }

  function startVisit(appointmentId: string) {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.appointmentId === appointmentId
          ? {
              ...appointment,
              appointmentState: 'visit_started',
              noteState: 'visit_active',
              noteVisibleInDrafts: true
            }
          : appointment
      )
    );
    setStatusMessage(`Started ${appointmentId}. The note shell is now visible in Draft Notes and editor activation belongs to WO-004.`);
  }

  return (
    <main className="schedule-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Schedule Builder</p>
          <h1>Standalone Appointment-to-Note Lifecycle</h1>
        </div>
        <a href="/status">Status</a>
      </header>

      <section className="status-band" aria-live="polite">
        <p>{statusMessage}</p>
        <dl>
          <div>
            <dt>Scheduled</dt>
            <dd>{metrics.scheduled}</dd>
          </div>
          <div>
            <dt>Note Shells</dt>
            <dd>{metrics.noteShells}</dd>
          </div>
          <div>
            <dt>Drafts</dt>
            <dd>{metrics.activeDrafts}</dd>
          </div>
        </dl>
      </section>

      <section className="builder-grid">
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
            <input
              value={form.safePatientId}
              onChange={(event) => setForm({ ...form, safePatientId: event.target.value })}
              required
            />
          </label>
          <label>
            Clinician ID
            <input
              value={form.clinicianId}
              onChange={(event) => setForm({ ...form, clinicianId: event.target.value })}
              required
            />
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
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
              required
            />
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
                <input
                  type="radio"
                  name="modality"
                  checked={form.modality === modality}
                  onChange={() => setForm({ ...form, modality })}
                />
                {modality.replace('_', ' ')}
              </label>
            ))}
          </fieldset>
          <label>
            Reason
            <textarea
              value={form.reasonForVisit}
              onChange={(event) => setForm({ ...form, reasonForVisit: event.target.value })}
              rows={3}
            />
          </label>
          <button type="submit">Create Appointment + Note Shell</button>
        </form>

        <section className="schedule-list" aria-label="Daily schedule">
          <h2>Daily Schedule</h2>
          {appointments.map((appointment) => (
            <article key={appointment.appointmentId} className="appointment-row">
              <div className="appointment-main">
                <strong>{appointment.safePatientId}</strong>
                <span>{appointment.visitType}</span>
                <span>
                  {appointment.startsAt} / {appointment.durationMinutes} min / {appointment.modality.replace('_', ' ')}
                </span>
                <small>{appointment.reasonForVisit}</small>
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
              <button
                type="button"
                disabled={appointment.appointmentState !== 'scheduled' || appointment.noteState !== 'shell_created'}
                onClick={() => startVisit(appointment.appointmentId)}
              >
                Start Visit
              </button>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
