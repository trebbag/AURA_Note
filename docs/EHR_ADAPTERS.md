# EHR Adapter Strategy

## First target

AURA Note v1 targets **athenahealth** first.

## Vendor-neutral requirement

AURA Note must not hard-code athenahealth into domain services. Implement an `EhrAdapter` interface and vendor-specific implementations.

## Adapter operations

The interface should support:

- `getConnectionStatus()`
- `searchPatient()`
- `getPatientDemographics()`
- `getAppointments()`
- `getAppointment()`
- `getEncounterContext()`
- `getProblemList()`
- `getMedications()`
- `getAllergies()`
- `getVitals()`
- `getLabs()`
- `getDocuments()`
- `writeFinalNote()`
- `writePatientSummary()` if supported/configured
- `createTask()` if supported/configured
- `getWritebackStatus()`

## EHR writeback rule

Final note supports writeback if configured. If writeback is not configured or fails, copy/export/PDF must still work.

## Mapping records

Every EHR-sourced object should retain:

- source vendor;
- source ID;
- source timestamp;
- mapped local ID;
- confidence;
- freshness;
- mapping warnings.

## Athenahealth implementation posture

Build mock and sandbox-ready adapter first. Live production credentials and vendor certification are out of scope for the initial repo scaffold.
