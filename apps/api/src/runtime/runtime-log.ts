import { createStructuredLogEntry, type StructuredLogEntry, type StructuredLogInput } from '@aura-note/security';

const runtimeLogEntries: StructuredLogEntry[] = [];

export function appendRuntimeLog(input: StructuredLogInput): StructuredLogEntry {
  const entry = createStructuredLogEntry(input);
  runtimeLogEntries.push(entry);
  return entry;
}

export function getRuntimeLogEntries(): StructuredLogEntry[] {
  return [...runtimeLogEntries];
}

export function clearRuntimeLogEntries(): void {
  runtimeLogEntries.splice(0, runtimeLogEntries.length);
}

export function runtimeTimestamp(): string {
  return new Date().toISOString();
}
