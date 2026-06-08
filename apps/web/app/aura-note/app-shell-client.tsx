'use client';

import { useState } from 'react';
import type { AppShellViewDto } from '@aura-note/contracts';

interface AuraNoteAppShellProps {
  appShell: AppShellViewDto;
}

export function AuraNoteAppShell({ appShell }: AuraNoteAppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(appShell.layoutPreference.sidebarDefaultCollapsed);
  const [notificationsOpen, setNotificationsOpen] = useState(true);
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
            AN
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
          {primaryNav.map((item) => (
            <a key={item.key} href={item.href} aria-disabled={item.state === 'permission-denied'} data-state={item.state}>
              <span>{sidebarCollapsed ? item.label.slice(0, 2) : item.label}</span>
              {!sidebarCollapsed && (
                <span className="nav-meta">
                  {item.badgeLabel ? <span>{item.badgeLabel}</span> : null}
                  <span>{item.itemCount}</span>
                </span>
              )}
            </a>
          ))}
          {!sidebarCollapsed ? <span className="sidebar-section-label">Resources</span> : null}
          {resourceNav.map((item) => (
            <a key={item.key} href={item.href} aria-disabled={item.state === 'permission-denied'} data-state={item.state}>
              <span>{sidebarCollapsed ? item.label.slice(0, 2) : item.label}</span>
              {!sidebarCollapsed && (
                <span className="nav-meta">
                  {item.badgeLabel ? <span>{item.badgeLabel}</span> : null}
                  <span>{item.state}</span>
                </span>
              )}
            </a>
          ))}
        </nav>
      </aside>

      <section className="aura-main-panel" aria-labelledby="runtime-home-heading">
        <header className="app-shell-header">
          <div>
            <p className="eyebrow">Figma Make Backend Catch-Up</p>
            <h1 id="runtime-home-heading">AURA Note Runtime Home</h1>
            <p>
              This shell is backed by the AURA Note typed API client and synthetic local backend state. It does not enable
              production PHI, live vendors, autonomous finalization, claim submission, or launch readiness.
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

        <section className="figma-visual-band" aria-label="Figma node visual fidelity pass">
          <div>
            <p className="eyebrow">Design 1 visual node parity</p>
            <h2>Clinical Command Dashboard</h2>
            <p>
              The sidebar, command header, quick-action band, notification rail, and dashboard cards follow the supplied
              Figma Make source while preserving AURA Note API-backed state.
            </p>
          </div>
          <div className="figma-quick-actions" aria-label="Figma quick actions">
            {quickActions.map((item) => (
              <a key={item.key} href={item.href} data-state={item.state}>
                <strong>{item.label}</strong>
                <span>
                  {item.badgeLabel ?? `${item.itemCount} API-backed item${item.itemCount === 1 ? '' : 's'}`}
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="figma-command-dashboard" aria-label="Design 1 visual command dashboard">
          <article className="figma-command-primary">
            <p className="eyebrow">Today</p>
            <h2>{heroMetric?.label ?? 'Today schedule'}</h2>
            <p className="dashboard-value">{heroMetric?.value ?? 'loading'}</p>
            <small>
              {appShell.dashboard.dataSource} / productionLaunchApproved=
              {String(appShell.dashboard.productionLaunchApproved)}
            </small>
            <div className="figma-status-row" aria-label="Route state summary">
              {routeStateSummary.map((entry) => (
                <span key={entry.state}>
                  {entry.state}: {entry.count}
                </span>
              ))}
            </div>
          </article>

          <aside className="figma-command-side" aria-label="Dashboard side cards">
            {appShell.dashboard.metrics.slice(1, 4).map((metric) => (
              <a key={metric.metricId} href={metric.route ?? '/aura-note'} data-state={metric.state}>
                <strong>{metric.label}</strong>
                <span>{metric.value}</span>
                <small>{metric.state}</small>
              </a>
            ))}
          </aside>
        </section>

        <section className="figma-dashboard-grid" aria-label="Clinical workflow dashboard">
          {appShell.dashboard.metrics.map((metric) => (
            <article className="panel-card" key={metric.metricId} aria-label={metric.label}>
              <span className="eyebrow">{metric.state}</span>
              <h2>{metric.label}</h2>
              <p className="dashboard-value">{metric.value}</p>
              {metric.route ? <a href={metric.route}>Open</a> : null}
            </article>
          ))}
        </section>

        <section className="panel-grid" aria-label="Figma-derived runtime details">
          <article className="panel-card">
            <div className="panel-heading-row">
              <h2>Notifications</h2>
              <button
                type="button"
                className="secondary-button"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((current) => !current)}
              >
                {notificationsOpen ? 'Hide' : 'Show'}
              </button>
            </div>
            {notificationsOpen ? (
              <ul className="stack-list">
                {appShell.notifications.map((notification) => (
                  <li key={notification.notificationId}>
                    <strong>{notification.title}</strong>
                    <span>{notification.body}</span>
                    <small>{notification.severity}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Notification drawer collapsed by transient local UI state.</p>
            )}
          </article>

          <article className="panel-card">
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

          <article className="panel-card" aria-label="Operations">
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

          <article className="panel-card">
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

          <article className="panel-card">
            <h2>Runtime Contract</h2>
            <dl className="metric-list">
              <div>
                <dt>Prototype backend</dt>
                <dd>{appShell.rejectedPrototypeBackend}</dd>
              </div>
              <div>
                <dt>Supabase accepted</dt>
                <dd>{String(appShell.supabaseBackendAccepted)}</dd>
              </div>
              <div>
                <dt>RevenuePilot branding</dt>
                <dd>{String(appShell.revenuePilotBrandingAccepted)}</dd>
              </div>
              <div>
                <dt>Local React state</dt>
                <dd>{appShell.localReactStateLimit}</dd>
              </div>
            </dl>
          </article>
        </section>
      </section>
    </main>
  );
}
