export const demoTenant = { id: 'demo-tenant', name: 'AURA Demo Clinic' };
export const demoSite = { id: 'demo-site', tenantId: demoTenant.id, name: 'Main Demo Site' };

export const demoAppointments = [
  {
    id: 'appt-awv-001',
    tenantId: demoTenant.id,
    siteId: demoSite.id,
    patientDisplay: 'Synthetic Patient A',
    visitType: 'awv_plus_problem',
    clinicianId: 'user-clinician-001',
    startsAt: '2026-05-19T09:00:00.000Z'
  },
  {
    id: 'appt-tcm-001',
    tenantId: demoTenant.id,
    siteId: demoSite.id,
    patientDisplay: 'Synthetic Patient B',
    visitType: 'tcm',
    clinicianId: 'user-clinician-001',
    startsAt: '2026-05-19T10:00:00.000Z'
  }
];
