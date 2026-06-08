'use client';

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  FilePlus,
  FileText,
  Home,
  Settings,
  Shield,
  Sparkles,
  Stethoscope,
  Timer
} from 'lucide-react';
import { useState } from 'react';
import type { AppShellViewDto } from '@aura-note/contracts';

interface AuraNoteAppShellProps {
  appShell: AppShellViewDto;
}

const navIcons = {
  dashboard: Home,
  schedule: Calendar,
  drafts: FileText,
  workspace: ClipboardList,
  finalized: CheckCircle,
  operations: BarChart3,
  coaching: Sparkles,
  platform: Settings,
  ehr: Activity,
  clinicos: Shield,
  ai: Sparkles,
  support: Bell,
  runtime: Timer,
  figma: FilePlus
} as const;

function resolveNavIcon(key: string) {
  const match = Object.entries(navIcons).find(([iconKey]) => key.includes(iconKey));
  return match?.[1] ?? FileText;
}

export function AuraNoteAppShell({ appShell }: AuraNoteAppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const operationsNav = appShell.navigation.find((item) => item.key === 'operations');
  const primaryNavKeys = new Set(['dashboard', 'schedule', 'drafts', 'workspace', 'finalized', 'operations']);
  const primaryNav = appShell.navigation.filter((item) => primaryNavKeys.has(item.key));
  const resourceNav = appShell.navigation.filter((item) => !primaryNavKeys.has(item.key));
  const quickActions = appShell.navigation.filter((item) => ['schedule', 'workspace', 'finalized', 'operations'].includes(item.key));
  const metricById = new Map(appShell.dashboard.metrics.map((metric) => [metric.metricId, metric]));
  const numericMetric = (metricId: string) => {
    const value = metricById.get(metricId)?.value;
    return typeof value === 'number' ? value : Number.isFinite(Number(value)) ? Number(value) : 0;
  };
  const scheduleCount = numericMetric('appointments-today');
  const draftCount = numericMetric('draft-notes');
  const finalizedCount = numericMetric('finalized-notes');
  const blockerCount = numericMetric('blocker-tasks');
  const unreadCount = numericMetric('notifications-unread');
  const completedTotal = Math.max(scheduleCount + draftCount + finalizedCount, 1);
  const schedulePreview = [
    {
      time: '09:00 AM',
      initials: 'AS',
      title: scheduleCount > 0 ? 'Open scheduled visit' : 'No scheduled visits',
      detail: scheduleCount > 0 ? `${scheduleCount} API-backed appointment${scheduleCount === 1 ? '' : 's'}` : 'Create a synthetic appointment',
      status: scheduleCount > 0 ? 'In Progress' : 'Empty'
    },
    {
      time: '09:30 AM',
      initials: 'DN',
      title: 'Draft documentation',
      detail: `${draftCount} API-backed draft note${draftCount === 1 ? '' : 's'}`,
      status: draftCount > 0 ? 'Ready' : 'Empty'
    },
    {
      time: '10:00 AM',
      initials: 'BR',
      title: 'Blocker review',
      detail: `${blockerCount} blocker task${blockerCount === 1 ? '' : 's'} awaiting human review`,
      status: blockerCount > 0 ? 'Review' : 'Clear'
    }
  ];
  const draftPreview = [
    {
      initials: 'DN',
      label: 'Draft Notes',
      urgency: draftCount > 0 ? 'medium' : 'empty',
      completion: draftCount > 0 ? 75 : 0
    },
    {
      initials: 'VS',
      label: 'Visit Selections',
      urgency: 'review',
      completion: finalizedCount > 0 ? 90 : 50
    }
  ];
  const routeStateSummary = appShell.routeStates
    .map((state) => ({
      state,
      count: appShell.navigation.filter((item) => item.state === state).length
    }))
    .filter((entry) => entry.count > 0 || ['ready', 'permission-denied', 'degraded', 'disabled'].includes(entry.state));
  const heroMetric = appShell.dashboard.metrics[0];

  return (
    <main className={`aura-app-shell figma-node-shell figma-source-app${sidebarCollapsed ? ' is-collapsed' : ''}`}>
      <aside className="aura-sidebar" aria-label="AURA Note app shell">
        <div className="sidebar-brand">
          <span className="brand-icon" aria-hidden="true">
            <Stethoscope size={22} strokeWidth={2.2} />
          </span>
          <strong>{sidebarCollapsed ? 'AURA' : appShell.productName}</strong>
          <button
            type="button"
            className="secondary-button"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            {sidebarCollapsed ? '>' : '<'}
          </button>
        </div>
        <nav aria-label="AURA Note sections" className="sidebar-nav">
          {!sidebarCollapsed ? <span className="sidebar-section-label">Clinical Workflow</span> : null}
          {primaryNav.map((item) => {
            const Icon = resolveNavIcon(item.key);
            return (
            <a key={item.key} href={item.href} aria-disabled={item.state === 'permission-denied'} data-state={item.state}>
              <span className="nav-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span className="nav-label">{sidebarCollapsed ? item.label.slice(0, 2) : item.label}</span>
              {!sidebarCollapsed && (
                <span className="nav-meta">
                  {item.badgeLabel ? <span>{item.badgeLabel}</span> : null}
                  <span>{item.itemCount}</span>
                </span>
              )}
              {!sidebarCollapsed ? <ChevronRight className="nav-chevron" size={16} aria-hidden="true" /> : null}
            </a>
            );
          })}
          {!sidebarCollapsed ? <span className="sidebar-section-label">Resources</span> : null}
          {resourceNav.map((item) => {
            const Icon = resolveNavIcon(item.key);
            return (
            <a key={item.key} href={item.href} aria-disabled={item.state === 'permission-denied'} data-state={item.state}>
              <span className="nav-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span className="nav-label">{sidebarCollapsed ? item.label.slice(0, 2) : item.label}</span>
              {!sidebarCollapsed && (
                <span className="nav-meta">
                  {item.badgeLabel ? <span>{item.badgeLabel}</span> : null}
                  <span>{item.state}</span>
                </span>
              )}
              {!sidebarCollapsed ? <ChevronRight className="nav-chevron" size={16} aria-hidden="true" /> : null}
            </a>
            );
          })}
        </nav>
      </aside>

      <section className="aura-main-panel aura-dashboard" aria-labelledby="runtime-home-heading">
        <header className="figma-source-topbar" aria-label="Figma Make dashboard top bar">
          <button
            type="button"
            className="secondary-button"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            Toggle Sidebar
          </button>
          <p className="figma-source-title">AURA Note Dashboard</p>
          <nav aria-label="Design and runtime references">
            <a href="/aura-note/figma-handoff">View Style Guide</a>
            <a href="/aura-note/runtime-integration">Runtime Gate</a>
          </nav>
        </header>

        <section className="figma-source-hero" aria-label="Figma Make command dashboard">
          <div>
            <p className="figma-source-greeting">Good afternoon, {appShell.currentUser.displayName}</p>
            <p>Ready to optimize your clinical workflow</p>
          </div>
          <article className="figma-source-completion-card">
            <strong>
              {finalizedCount}/{completedTotal}
            </strong>
            <span>Notes Completed</span>
            <small>API-backed local runtime</small>
          </article>
        </section>

        <section className="figma-source-quick-actions" aria-label="Quick Actions">
          <div>
            <h2>Quick Actions</h2>
            <p>Jump into your most important tasks</p>
          </div>
          {quickActions.map((item, index) => {
            const Icon = resolveNavIcon(item.key);
            return (
              <a key={item.key} href={item.href} data-tone={index % 4} data-state={item.state}>
                <span className="figma-source-action-icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <strong>
                  {item.key === 'workspace'
                    ? 'New Note'
                    : item.key === 'schedule'
                      ? 'Schedule Builder'
                      : item.key === 'operations'
                        ? 'Billing & Coding'
                        : item.label}
                </strong>
                <span>
                  {item.key === 'workspace'
                    ? 'Start Documentation'
                    : item.key === 'schedule'
                      ? 'Manage Appointments'
                      : item.key === 'operations'
                        ? 'Review Queues'
                        : 'Read Only'}
                </span>
                <small>{item.badgeLabel ?? `${item.itemCount} API-backed`}</small>
              </a>
            );
          })}
        </section>

        <section className="figma-source-dashboard-grid" aria-label="Figma Make dashboard cards">
          <article className="figma-source-card figma-source-schedule-card">
            <div className="panel-heading-row">
              <div>
                <h2>Today&apos;s Schedule</h2>
                <p>{scheduleCount} appointments in the current backend runtime</p>
              </div>
              <span className="state-pill">In Progress</span>
            </div>
            <div className="figma-source-schedule-list">
              {schedulePreview.map((item) => (
                <a key={`${item.time}-${item.initials}`} href="/aura-note/schedule">
                  <span className="schedule-time">{item.time}</span>
                  <span className="figma-source-avatar">{item.initials}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <em>{item.status}</em>
                </a>
              ))}
            </div>
            <a className="figma-source-card-link" href="/aura-note/schedule">
              View Full Schedule
            </a>
          </article>

          <aside className="figma-source-side-stack">
            <article className="figma-source-card">
              <div className="panel-heading-row">
                <h2>Drafts</h2>
                <strong>{draftCount}</strong>
              </div>
              <div className="figma-source-draft-list">
                {draftPreview.map((draft) => (
                  <a key={draft.label} href="/aura-note/drafts">
                    <span className="figma-source-avatar">{draft.initials}</span>
                    <span>
                      <strong>{draft.label}</strong>
                      <small>{draft.urgency}</small>
                    </span>
                    <em>{draft.completion}%</em>
                  </a>
                ))}
              </div>
              <a className="figma-source-card-link" href="/aura-note/drafts">
                View All Drafts
              </a>
            </article>

            <article className="figma-source-card">
              <h2>Today&apos;s Performance</h2>
              <dl className="figma-source-performance-grid">
                <div>
                  <dt>Avg Confidence</dt>
                  <dd>92%</dd>
                </div>
                <div>
                  <dt>Revenue Today</dt>
                  <dd>Gated</dd>
                </div>
              </dl>
            </article>
          </aside>
        </section>

        <section className="figma-source-quality-card" aria-label="Quality Metrics">
          <h2>Quality Metrics</h2>
          {[
            ['Coding Accuracy', '94%', '+2.1%'],
            ['Documentation Completeness', '89%', '+1.5%'],
            ['Human Review Gates', appShell.dashboard.submittedClaim ? 'Failed' : 'Ready', 'submittedClaim=false']
          ].map(([label, value, trend]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{trend}</small>
            </div>
          ))}
        </section>

        <header className="aura-dashboard-header compact-runtime-evidence">
          <div>
            <p className="eyebrow">Clinical Documentation Assistant</p>
            <h1 id="runtime-home-heading">AURA Note Dashboard</h1>
            <p>
              Ready to optimize your clinical workflow.
            </p>
          </div>
          <div className="user-context" aria-label="Current user context">
            <span className="avatar-chip" aria-hidden="true">
              {appShell.currentUser.role.slice(0, 2).toUpperCase()}
            </span>
            <span>{appShell.currentUser.displayName}</span>
            <span>{appShell.currentUser.role}</span>
            <span>{appShell.currentUser.identityProvider}</span>
          </div>
        </header>

        <section className="dashboard-hero-band" aria-label="Dashboard quick actions">
          <article className="dashboard-welcome-card">
            <div className="dashboard-card-title">
              <span className="figma-icon-block neutral" aria-hidden="true">
                <Stethoscope size={22} />
              </span>
              <div>
                <p className="eyebrow">Good morning</p>
                <h2>{appShell.currentUser.displayName}</h2>
              </div>
            </div>
            <p>Review the day, open active notes, and keep finalization work moving without leaving AURA Note.</p>
            <div className="dashboard-hero-metrics" aria-label="Route state summary">
              {routeStateSummary.map((entry) => (
                <span key={entry.state}>
                  <strong>{entry.count}</strong>
                  {entry.state}
                </span>
              ))}
            </div>
          </article>
          <div className="dashboard-quick-actions">
            {quickActions.map((item, index) => {
              const Icon = resolveNavIcon(item.key);
              return (
              <a key={item.key} href={item.href} data-state={item.state} data-tone={index % 4}>
                <span className="figma-icon-block" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <strong>{item.label}</strong>
                <span>
                  {item.badgeLabel ?? `${item.itemCount} API-backed item${item.itemCount === 1 ? '' : 's'}`}
                </span>
                <ArrowUpRight className="quick-action-arrow" size={16} aria-hidden="true" />
              </a>
              );
            })}
          </div>
        </section>

        <section className="clinical-command-dashboard" aria-label="Clinical command dashboard">
          <article className="dashboard-primary-card">
            <div className="panel-heading-row">
              <div className="dashboard-card-title">
                <span className="figma-icon-block neutral" aria-hidden="true">
                  <Calendar size={20} />
                </span>
                <div>
                  <p className="eyebrow">Today</p>
                  <h2>{heroMetric?.label ?? 'Today schedule'}</h2>
                </div>
              </div>
              <span className="state-pill">On Track</span>
            </div>
            <p className="dashboard-value">{heroMetric?.value ?? 'loading'}</p>
            <small>Production launch approved: {String(appShell.dashboard.productionLaunchApproved)}</small>
            <div className="dashboard-schedule-list" aria-label="Today schedule preview">
              {appShell.dashboard.metrics.slice(1, 4).map((metric, index) => (
                <a key={metric.metricId} href={metric.route ?? '/aura-note'} data-state={metric.state}>
                  <span className="schedule-time">{index === 0 ? '09:00' : index === 1 ? '10:30' : '13:00'}</span>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.state}</small>
                  <ChevronRight size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
          </article>

          <aside className="dashboard-side-stack" aria-label="Dashboard side cards">
            <article>
              <div className="dashboard-card-title">
                <span className="figma-icon-block amber" aria-hidden="true">
                  <FilePlus size={18} />
                </span>
                <h2>Draft Notes</h2>
              </div>
              <p>{appShell.dashboard.metrics.find((metric) => metric.metricId.includes('draft'))?.value ?? '0'}</p>
              <a href="/aura-note/drafts">Open drafts</a>
            </article>
            <article>
              <div className="dashboard-card-title">
                <span className="figma-icon-block emerald" aria-hidden="true">
                  <CheckCircle size={18} />
                </span>
                <h2>Finalized Notes</h2>
              </div>
              <p>{appShell.dashboard.metrics.find((metric) => metric.metricId.includes('final'))?.value ?? '0'}</p>
              <a href="/aura-note/finalized">Review finalized</a>
            </article>
            <article aria-label="Queue quick summary">
              <div className="dashboard-card-title">
                <span className="figma-icon-block blue" aria-hidden="true">
                  <Shield size={18} />
                </span>
                <h2>Operations</h2>
              </div>
              <p>{operationsNav?.itemCount ?? 0}</p>
              <a href="/aura-note/operations">Open queue</a>
            </article>
          </aside>
        </section>

        <section className="dashboard-metric-grid" aria-label="Clinical workflow dashboard">
          {appShell.dashboard.metrics.map((metric) => (
            <article className="panel-card" key={metric.metricId} aria-label={metric.label}>
              <span className="eyebrow">{metric.state}</span>
              <h2>{metric.label}</h2>
              <p className="dashboard-value">{metric.value}</p>
              {metric.route ? <a href={metric.route}>Open</a> : null}
            </article>
          ))}
        </section>

        <section className="dashboard-feed-grid" aria-label="Notification and activity feed">
          <article className="panel-card dashboard-feed-card">
            <div className="panel-heading-row">
              <h2>Notifications</h2>
            </div>
            <ul className="stack-list">
              {appShell.notifications.map((notification) => (
                <li key={notification.notificationId}>
                  <strong>{notification.title}</strong>
                  <span>{notification.body}</span>
                  <small>{notification.severity}</small>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel-card dashboard-feed-card">
            <h2>Activity Log</h2>
            <ul className="stack-list">
              {appShell.activity.map((item) => (
                <li key={item.activityId}>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                  <small>{item.actorLabel}</small>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel-card dashboard-feed-card" aria-label="Operations">
            <h2>Operations</h2>
            <dl className="metric-list">
              <div>
                <dt>Tasks</dt>
                <dd>{operationsNav?.itemCount ?? 0}</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>{operationsNav?.state ?? 'permission-denied'}</dd>
              </div>
              <div>
                <dt>Data Source</dt>
                <dd>{appShell.dashboard.dataSource}</dd>
              </div>
              <div>
                <dt>Patient Facing</dt>
                <dd>{String(appShell.patientFacingRevenueExposed)}</dd>
              </div>
            </dl>
          </article>

          <article className="panel-card dashboard-feed-card">
            <h2>Disabled Feature States</h2>
            <ul className="stack-list">
              {appShell.dashboard.disabledFeatureStates.map((feature) => (
                <li key={feature.feature}>
                  <strong>{feature.feature}</strong>
                  <span>{feature.reason}</span>
                  <small>{feature.state}</small>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </section>
    </main>
  );
}
