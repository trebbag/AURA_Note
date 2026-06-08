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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(appShell.layoutPreference.sidebarDefaultCollapsed);
  const operationsNav = appShell.navigation.find((item) => item.key === 'operations');
  const primaryNavKeys = new Set(['dashboard', 'schedule', 'drafts', 'workspace', 'finalized', 'operations']);
  const primaryNav = appShell.navigation.filter((item) => primaryNavKeys.has(item.key));
  const resourceNav = appShell.navigation.filter((item) => !primaryNavKeys.has(item.key));
  const quickActions = appShell.navigation.filter((item) => ['schedule', 'workspace', 'finalized', 'operations'].includes(item.key));
  const routeStateSummary = appShell.routeStates
    .map((state) => ({
      state,
      count: appShell.navigation.filter((item) => item.state === state).length
    }))
    .filter((entry) => entry.count > 0 || ['ready', 'permission-denied', 'degraded', 'disabled'].includes(entry.state));
  const heroMetric = appShell.dashboard.metrics[0];

  return (
    <main className={`aura-app-shell figma-node-shell${sidebarCollapsed ? ' is-collapsed' : ''}`}>
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
        <header className="aura-dashboard-header">
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
