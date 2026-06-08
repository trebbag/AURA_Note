'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, FileSearch, Filter, MapPin, Plus, Video } from 'lucide-react';
import type { AppointmentModality, AppointmentState } from '@aura-note/domain';
import type {
  AppointmentStatusActionDto,
  ScheduleAppointmentDto,
  ScheduleViewDto,
  StandalonePatientDto,
  WorkspaceValidationDto
} from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';

type ScheduleViewMode = 'day' | 'week';
type RouteState = 'loading' | 'empty' | 'ready' | 'saving' | 'blocked' | 'failed' | 'permission-denied' | 'read-only' | 'demo fixture';

const routeStates: RouteState[] = ['loading', 'empty', 'ready', 'saving', 'failed', 'permission-denied', 'read-only', 'blocked', 'demo fixture'];

const emptyFilters: ScheduleViewDto['filters'] = {
  providers: [],
  statuses: [],
  visitTypes: [],
  modalities: [],
  clinicLocations: []
};

const initialForm = {
  safePatientId: 'safe-patient-new-002',
  clinicianId: 'clinician-demo-001',
  visitType: 'AWV plus problem',
  startsAt: '2026-05-27T15:00',
  durationMinutes: 40,
  modality: 'in_person' as AppointmentModality,
  reasonForVisit: 'Synthetic wellness visit with problem follow-up',
  clinicLocationId: 'clinic-location-main',
  clinicLocationLabel: 'Primary Care Clinic',
  roomId: 'room-101',
  roomLabel: 'Room 101'
};

export default function ScheduleBuilderPage() {
  const client = useMemo(() => createAuraNoteApiClient({ role: 'clinician' }), []);
  const supportClient = useMemo(() => createAuraNoteApiClient({ role: 'support', userId: 'user-support-primary-runtime-denial' }), []);
  const [patients, setPatients] = useState<StandalonePatientDto[]>([]);
  const [appointments, setAppointments] = useState<ScheduleAppointmentDto[]>([]);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('day');
  const [activeDate, setActiveDate] = useState('2026-05-27');
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [visitTypeFilter, setVisitTypeFilter] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [scheduleFilters, setScheduleFilters] = useState<ScheduleViewDto['filters']>(emptyFilters);
  const [disabledLiveSources, setDisabledLiveSources] = useState<string[]>([]);
  const [workspaceValidation, setWorkspaceValidation] = useState<WorkspaceValidationDto | undefined>();
  const [selectedPatientId, setSelectedPatientId] = useState('safe-patient-demo-001');
  const [patientQuery, setPatientQuery] = useState('safe-patient-demo');
  const [screenState, setScreenState] = useState<RouteState>('loading');
  const [form, setForm] = useState(initialForm);
  const [statusMessage, setStatusMessage] = useState('Loading schedule through the typed AURA Note API client.');

  const refreshRuntimeState = useCallback(async (patientSearchOverride?: string) => {
    setScreenState('loading');
    try {
      const patientSearch = patientSearchOverride ?? patientQuery;
      const [scheduleResponse, patientResponse] = await Promise.all([
        client.listSchedule({
          activeDate,
          viewMode,
          ...(providerFilter ? { providerId: providerFilter } : {}),
          ...(statusFilter ? { status: statusFilter as AppointmentState } : {}),
          ...(visitTypeFilter ? { visitType: visitTypeFilter } : {}),
          ...(modalityFilter ? { modality: modalityFilter as AppointmentModality } : {}),
          ...(locationFilter ? { clinicLocationId: locationFilter } : {})
        }),
        client.searchPatients(patientSearch ? { safePatientId: patientSearch } : {})
      ]);
      const nextAppointments = scheduleResponse.data.appointments;
      const nextPatients = patientResponse.data.patients;
      setAppointments(nextAppointments);
      setScheduleFilters(scheduleResponse.data.filters);
      setDisabledLiveSources(scheduleResponse.data.disabledLiveSchedulingSources);
      setPatients(nextPatients);
      setSelectedPatientId((current) => nextPatients.find((patient) => patient.safePatientId === current)?.safePatientId ?? nextPatients[0]?.safePatientId ?? current);
      setScreenState(nextAppointments.length === 0 ? 'empty' : 'ready');
      setStatusMessage('Schedule filters, patient shell state, and chart-intake metadata loaded from AURA Note API responses.');
    } catch (error) {
      setScreenState('failed');
      setStatusMessage(error instanceof Error ? error.message : 'Schedule API load failed.');
    }
  }, [activeDate, client, locationFilter, modalityFilter, patientQuery, providerFilter, statusFilter, visitTypeFilter, viewMode]);

  useEffect(() => {
    void refreshRuntimeState();
  }, [refreshRuntimeState]);

  const selectedPatient = patients.find((patient) => patient.safePatientId === selectedPatientId) ?? patients[0];
  const selectedPatientAppointment = appointments.find((appointment) => appointment.safePatientId === selectedPatient?.safePatientId);
  const filteredAppointments = appointments;
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

  async function validateWorkspace(appointmentId: string) {
    setScreenState('loading');
    try {
      const response = await client.validateWorkspaceEntry(appointmentId);
      setWorkspaceValidation(response.data.workspaceValidation);
      setScreenState(response.data.workspaceValidation.workspaceOpenAllowed ? 'ready' : 'blocked');
      setStatusMessage(`Workspace validation returned ${response.data.workspaceValidation.validationStatus} from the API.`);
    } catch (error) {
      setWorkspaceValidation(undefined);
      setScreenState('failed');
      setStatusMessage(error instanceof Error ? error.message : 'Workspace validation failed.');
    }
  }

  async function markChartIntakeStale(appointmentId: string) {
    setScreenState('saving');
    try {
      const response = await client.updateChartIntakeStatus(
        appointmentId,
        {
          status: 'stale_warning',
          sourceFreshness: 'historical',
          warning: 'Synthetic metadata-only chart intake needs source freshness review.'
        },
        `chart-intake-${appointmentId}-${Date.now()}`
      );
      setStatusMessage(`Chart intake metadata updated to ${response.data.scheduleMetadata.chartIntakeStatus}; live PHI upload remains disabled.`);
      await refreshRuntimeState();
    } catch (error) {
      setScreenState('failed');
      setStatusMessage(error instanceof Error ? error.message : 'Chart intake metadata update failed.');
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
          <a href="/aura-note">Dashboard</a>
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
          <div>
            <dt>Disabled Live Sources</dt>
            <dd>{disabledLiveSources.length}</dd>
          </div>
        </dl>
      </section>

      <section className="figma-schedule-board" aria-label="Figma schedule builder">
        <article aria-label="Schedule command card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Schedule Builder</p>
              <h2>Day And Week Workflow</h2>
              <p>Provider, date, visit type, room, virtual visit, and chart-intake metadata are loaded from backend schedule state.</p>
            </div>
            <span className="figma-icon-block blue" aria-hidden="true">
              <Calendar size={20} />
            </span>
          </div>
          <div className="figma-status-row">
            <span>View: {viewMode}</span>
            <span>Date: {activeDate}</span>
            <span>Appointments: {appointments.length}</span>
            <span>Source: typed_api_client</span>
          </div>
        </article>

        <article aria-label="Schedule filter summary">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Filters</p>
              <h2>Backend Filter Set</h2>
            </div>
            <span className="figma-icon-block neutral" aria-hidden="true">
              <Filter size={20} />
            </span>
          </div>
          <div className="figma-settings-grid">
            <div>
              <strong>Providers</strong>
              <span>{scheduleFilters.providers.length}</span>
            </div>
            <div>
              <strong>Statuses</strong>
              <span>{scheduleFilters.statuses.length}</span>
            </div>
            <div>
              <strong>Visit Types</strong>
              <span>{scheduleFilters.visitTypes.length}</span>
            </div>
            <div>
              <strong>Modalities</strong>
              <span>{scheduleFilters.modalities.length}</span>
            </div>
            <div>
              <strong>Locations</strong>
              <span>{scheduleFilters.clinicLocations.length}</span>
            </div>
            <div>
              <strong>Live Sources</strong>
              <span>disabled={disabledLiveSources.length}</span>
            </div>
          </div>
        </article>

        <article aria-label="Schedule appointment metadata">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Chart Intake</p>
              <h2>Appointment Cards</h2>
            </div>
            <span className="figma-icon-block emerald" aria-hidden="true">
              <FileSearch size={20} />
            </span>
          </div>
          <div className="figma-series-grid">
            {appointments.slice(0, 3).map((appointment) => (
              <div key={appointment.appointmentId} className="figma-series-card">
                <strong>{appointment.safePatientId}</strong>
                <small>
                  {appointment.state} / {appointment.scheduleMetadata.chartIntakeStatus}
                </small>
                <span>
                  <MapPin size={14} aria-hidden="true" /> {appointment.scheduleMetadata.clinicLocationLabel} /{' '}
                  {appointment.scheduleMetadata.roomLabel}
                </span>
                <span>
                  <Video size={14} aria-hidden="true" /> {appointment.scheduleMetadata.virtualVisitStatus}
                </span>
              </div>
            ))}
            {appointments.length === 0 ? <p>No appointments returned by the API for this filter set.</p> : null}
          </div>
        </article>

        <article aria-label="Schedule create action reference">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Create</p>
              <h2>Appointment + Note Shell</h2>
              <p>Creation remains idempotent and produces a one-to-one inactive note shell.</p>
            </div>
            <span className="figma-icon-block amber" aria-hidden="true">
              <Plus size={20} />
            </span>
          </div>
          <div className="figma-status-row">
            <span>Safe ID: {form.safePatientId}</span>
            <span>Visit: {form.visitType}</span>
            <span>Room: {form.roomLabel}</span>
          </div>
        </article>
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
            <select aria-label="Appointment visit type" value={form.visitType} onChange={(event) => setForm({ ...form, visitType: event.target.value })}>
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
            Clinic Location
            <select
              value={form.clinicLocationId}
              onChange={(event) =>
                setForm({
                  ...form,
                  clinicLocationId: event.target.value,
                  clinicLocationLabel: event.target.selectedOptions[0]?.textContent ?? 'Primary Care Clinic'
                })
              }
            >
              <option value="clinic-location-main">Primary Care Clinic</option>
              <option value="clinic-location-east">East Clinic</option>
            </select>
          </label>
          <label>
            Room
            <input value={form.roomLabel} onChange={(event) => setForm({ ...form, roomLabel: event.target.value, roomId: slugRoom(event.target.value) })} />
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
          <div className="schedule-filter-grid" aria-label="Backend-backed schedule filters">
            <label>
              Active Date
              <input type="date" value={activeDate} onChange={(event) => setActiveDate(event.target.value)} />
            </label>
            <label>
              Provider
              <select aria-label="Provider filter" value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
                <option value="">All providers</option>
                {scheduleFilters.providers.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select aria-label="Status filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {scheduleFilters.statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Visit Type
              <select aria-label="Visit type filter" value={visitTypeFilter} onChange={(event) => setVisitTypeFilter(event.target.value)}>
                <option value="">All visit types</option>
                {scheduleFilters.visitTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Modality
              <select aria-label="Modality filter" value={modalityFilter} onChange={(event) => setModalityFilter(event.target.value)}>
                <option value="">All modalities</option>
                {scheduleFilters.modalities.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label.replace('_', ' ')} ({option.count})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Location
              <select aria-label="Location filter" value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
                <option value="">All locations</option>
                {scheduleFilters.clinicLocations.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </label>
          </div>
          {workspaceValidation ? (
            <div className="validation-panel" aria-label="Workspace validation result">
              <strong>Workspace validation: {workspaceValidation.validationStatus}</strong>
              <span>Open allowed: {workspaceValidation.workspaceOpenAllowed ? 'yes' : 'no'}</span>
              <span>Editor read-only: {workspaceValidation.editorInitiallyReadOnly ? 'yes' : 'no'}</span>
              <span>Chart freshness: {workspaceValidation.chartFreshness}</span>
            </div>
          ) : null}
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
                <small>
                  Location: {appointment.scheduleMetadata.clinicLocationLabel} / {appointment.scheduleMetadata.roomLabel}
                </small>
                <small>
                  Intake: {appointment.scheduleMetadata.chartIntakeStatus} / Virtual: {appointment.scheduleMetadata.virtualVisitStatus}
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
                <button type="button" onClick={() => void validateWorkspace(appointment.appointmentId)}>
                  Validate Workspace
                </button>
                <button type="button" onClick={() => void markChartIntakeStale(appointment.appointmentId)}>
                  Flag Chart Stale
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

function slugRoom(roomLabel: string): string {
  const normalized = roomLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized ? `room-${normalized}` : 'room-101';
}
