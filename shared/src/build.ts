export const buildStates = ['queued', 'validating', 'generating', 'resolving', 'compiling', 'signing', 'verifying', 'completed', 'failed', 'cancelled'] as const;
export type BuildState = typeof buildStates[number];
const transitions: Record<BuildState, readonly BuildState[]> = {
  queued: ['validating', 'failed', 'cancelled'], validating: ['generating', 'failed', 'cancelled'],
  generating: ['resolving', 'failed', 'cancelled'], resolving: ['compiling', 'failed', 'cancelled'],
  compiling: ['signing', 'failed', 'cancelled'], signing: ['verifying', 'failed', 'cancelled'],
  verifying: ['completed', 'failed', 'cancelled'], completed: [], failed: [], cancelled: [],
};
export function assertBuildTransition(from: BuildState, to: BuildState): void {
  if (!transitions[from].includes(to)) throw new Error(`Invalid build transition: ${from} -> ${to}`);
}
export interface BuildEvent {
  sequence: number; buildId: string; timestamp: string; state: BuildState;
  message: string; // Sanitized diagnostics only, never child-process environment or credentials.
}
