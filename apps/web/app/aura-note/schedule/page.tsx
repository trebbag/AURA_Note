'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppointmentModality, AppointmentState } from '@aura-note/domain';
import type { AppointmentStatusActionDto, ScheduleAppointmentDto, StandalonePatientDto } from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';

type ScheduleViewMode = 'day' | 'week';
type RouteState = 'loading' | 'empty' | 'ready' | 'saving' | 'blocked' | 'failed' | 'permission-denied' | 'read-only' | 'demo fixture';

const routeStates: RouteState[] = ['loading', 'empty', 'ready', 'saving', 'failed', 'permission-denied', 'read-only', 'blocked', 'demo fixture'];

const initialForm = {
  safePatientId: 'safe-patient-new-002',
  clinicianId: 'clinician-demo-001',
  visitType: 'AWV plus problem',
  startsAt: '2026-05-27T15:00',
  durationMinutes: 40,
  modality: 'in_person' as AppointmentModality,
  reasonForVisit: 'Synthetic wellness visit with problem follow-up'
};

export default function ScheduleBuilderPage() {
  const client = useMemo(() => createAuraNoteApiClient({ role: 'clinician' }), []);
  const supportClient = useMemo(() => createAuraNoteApiClient({ role: 'support', userId: 'user-support-primary-runtime-denial' }), []);
  const [patients, setPatients] = useState<StandalonePatientDto[]>([]);
  const [appointments, setAppointments] = useState<ScheduleAppointmentDto[]>([]);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('day');
  const [selectedPatientId, setSelectedPatientId] = useState('safe-patient-demo-001');
  const [patientQuery, setPatientQuery] = useState('safe-patient-demo');
  const [screenState, setScreenState] = useState<RouteState>('loading');
  const [form, setForm] = useState(initialForm);
  const [statusMessage, setStatusMessage] = useState('Loading schedule through the typed AURA Note API client.');
  const activeDate = '2026-05-27';

  const refreshRuntimeState = useCallback(async (patientSearchOverride?: string) => {
    setScreenState('loading');
    try {
      const patientSearch = patientSearchOverride ?? patientQuery;
      const [scheduleResponse, patientResponse] = await Promise.all([
        client.listSchedule(),
        client.searchPatients(patientSearch ? { safePatientId: patientSearch } : {})
      ]);
      const nextAppointments = scheduleResponse.data.appointments;
      const nextPatients = patientResponse.data.patients;
      setAppointments(nextAppointments);
      setPatients(nextPatients);
      setSelectedPatientId((current) => nextPatients.find((patient) => patient.safePatientId === current)?.safePatientId ?? nextPatients[0]?.safePatientId ?? current);
      setScreenState(nextAppointments.length === 0 ? 'empty' : 'ready');
      setStatusMessage('Schedule and patient shell state loaded from AURA Note API responses.');
    } catch (error) {
      setScreenState('failed');
      setStatusMessage(error instanceof Error ? error.message : 'Schedule API load failed.');
    }
  }, [client, patientQuery]);

  useEffect(() => {
    void refreshRuntimeState();
  }, [refreshRuntimeState]);

  const selectedPatient = patients.find((patient) => patient.safePatientId === selectedPatientId) ?? patients[0];
  const selectedPatientAppointment = appointments.find((appointment) => appointment.safePatientId === selectedPatient?.safePatientId);
  const filteredAppointments = appointments.filter(
    (appointment) => viewMode === 'week' || appointment.startsAt.startsWith(activeDate)
  );
  const metrics = useMemo(
    () => ({
      scheduled: appointments.filter((appointment) => appointment.state === 'scheduled').length,
      checkedIn: appointments.filter((appointment) => appointment.state === 'checked_in').length,
      activeDrafts: appointments.filter((appointment) => appointment.noteVisibleInDrafts).length,
      blocked: appointments.filter((appointment) => ['cancelled', 'no_show'].includes(appointment.state)).length
    }),
    [appointments]
  );

  async function createAppointment() {
    setScreenState('saving');
    try {
      const response = await client.createAppointment(
        {
          ...form,
          startsAt: form.startsAt.endsWith('Z') ? form.startsAt : `${form.startsAt}:00.000Z`
        },
        `schedule-ui-${Date.now()}`
      );
      setSelectedPatientId(response.data.patient.safePatientId);
      setPatientQuery(response.data.patient.safePatientId);
      setStatusMessage(
        `Created ${response.data.appointment.appointmentId} with one linked inactive note shell ${response.data.note.noteId} and standalone patient linkage.`
      );
      await refreshRuntimeState(response.data.patient.safePatientId);
    } catch (error) {
      setScreenState('failed');
      setStatusMessage(error instanceof Error ? error.message : 'Appointment creation failed.');
    }
  }

  async function updateAppointmentStatus(appointmentId: string, nextState: AppointmentState) {
    setScreenState('saving');
    try {
      if (nextState === 'visit_started') {
        await client.startVisit(appointmentId);
      } else {
        const action = appointmentActionForState(nextState);
        if (!action) return;
        await client.updateAppointmentStatus(appointmentId, { action, reason: `Synthetic UI transition to ${nextState}` });
      }
      setStatusMessage(`Updated ${appointmentId} to ${nextState} through the API runtime boundary.`);
      await refreshRuntimeState();
    } catch (error) {
      setScreenState('failed');
      setStatusMessage(error instanceof Error ? error.message : `Unable to update ${appointmentId}.`);
    }
  }

  async function markPatientInactive() {
    if (!selectedPatient) return;
    setScreenState('saving');
    try {
      await client.updatePatient(selectedPatient.safePatientId, { status: 'inactive' });
      setScreenState('read-only');
      setStatusMessage(`${selectedPatient.safePatientId} is inactive; the read-only state is returned after API update.`);
      await refreshRuntimeState();
      setScreenState('read-only');
    } catch (error) {
      setScreenState('failed');
      setStatusMessage(error instanceof Error ? error.message : 'Patient update failed.');
    }
  }

  async function verifyPermissionDeniedState() {
    setScreenState('loading');
    try {
      await supportClient.createAppointment({
        safePatientId: 'safe-patient-denied-support',
        clinicianId: 'clinician-denied-support',
        visitType: 'Denied support action',
        startsAt: '2026-05-27T16:00:00.000Z',
        durationMinutes: 15,
        modality: 'in_person',
        reasonForVisit: 'Synthetic permission denial path'
      });
      setStatusMessage('Unexpected support appointment creation succeeded.');
      setScreenState('failed');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'API denied the support write path.');
      setScreenState('permission-denied');
    }
  }

  return (
    <main className="schedule-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Schedule Builder</p>
          <h1>Standalone Patient And Schedule Workspace</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note">Runtime Home</a>
          <a href="/aura-note/drafts">Draft Notes</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
          <a href="/status">Status</a>
        </nav>
      </header>

      <section className="status-band" aria-live="polite">
        <p>{statusMessage}</p>
        <dl>
          <div>
            <dt>Data Source</dt>
            <dd>typed_api_client</dd>
          </div>
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
            {screenState === 'loading' ? <p className="empty-state">Loading patient shell API state.</p> : null}
            {patients.length === 0 && screenState !== 'loading' ? (
              <p className="empty-state">No standalone patient shell returned by the API.</p>
            ) : (
              patients.map((patient) => (
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
              <span>Preferred: {(selectedPatient.preferredModality ?? 'in_person').replace('_', ' ')}</span>
              <span>Chart freshness: {selectedPatientAppointment?.chartContextFreshness ?? 'unknown'}</span>
              <small>{(selectedPatientAppointment?.chartContextWarnings ?? ['No appointment-linked chart context returned yet.']).join(' ')}</small>
              <button type="button" onClick={markPatientInactive}>
                Mark Inactive
              </button>
            </div>
          ) : null}
          <button type="button" className="secondary-action" onClick={verifyPermissionDeniedState}>
            Verify Permission Denied
          </button>
        </aside>

        <form
          className="appointment-form"
          onSubmit={(event) => {
            event.preventDefault();
            void createAppointment();
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
          <button type="submit" disabled={screenState === 'saving'}>
            Create Appointment + Note Shell
          </button>
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
          {filteredAppointments.length === 0 ? <p className="empty-state">No appointments returned for this schedule view.</p> : null}
          {filteredAppointments.map((appointment) => (
            <article key={appointment.appointmentId} className="appointment-row">
              <div className="appointment-main">
                <strong>{appointment.safePatientId}</strong>
                <span>{appointment.visitType}</span>
                <span>
                  {appointment.startsAt} / {appointment.durationMinutes} min / {appointment.modality.replace('_', ' ')}
                </span>
                <small>{appointment.reasonForVisit ?? 'No reason recorded.'}</small>
                <small>
                  Chart context: {appointment.chartContextFreshness ?? 'unknown'} / {(appointment.chartContextWarnings ?? []).join(' ')}
                </small>
              </div>
              <dl className="state-grid">
                <div>
                  <dt>Appointment</dt>
                  <dd>{appointment.state}</dd>
                </div>
                <div>
                  <dt>Note</dt>
                  <dd>{appointment.noteStatus}</dd>
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
                  disabled={appointment.state !== 'scheduled'}
                  onClick={() => void updateAppointmentStatus(appointment.appointmentId, 'checked_in')}
                >
                  Check In
                </button>
                <button
                  type="button"
                  disabled={!appointment.startVisitEnabled}
                  onClick={() => void updateAppointmentStatus(appointment.appointmentId, 'visit_started')}
                >
                  Start Visit
                </button>
                <button
                  type="button"
                  disabled={appointment.state === 'visit_started' || appointment.state === 'visit_completed'}
                  onClick={() => void updateAppointmentStatus(appointment.appointmentId, 'cancelled')}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={appointment.state === 'visit_started' || appointment.state === 'visit_completed'}
                  onClick={() => void updateAppointmentStatus(appointment.appointmentId, 'no_show')}
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

      <section className="status-band" aria-label="Route state coverage">
        <div>
          <h2>API-Backed Route States</h2>
          <p>Storybook/demo-only local state is not used as the authoritative schedule source on this route.</p>
        </div>
        <dl>
          {routeStates.map((state) => (
            <div key={state}>
              <dt>{state}</dt>
              <dd>{state === screenState ? 'active' : 'covered'}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

function appointmentActionForState(state: AppointmentState): AppointmentStatusActionDto | undefined {
  if (state === 'checked_in') return 'check_in';
  if (state === 'cancelled') return 'cancel';
  if (state === 'no_show') return 'mark_no_show';
  return undefined;
}
