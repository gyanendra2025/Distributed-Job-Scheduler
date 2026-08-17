
export type JobStatus = "PENDING" | "READY" | "RUNNING" | "SUCCESS" | "FAILED";

const ALLOWED: Record<JobStatus, JobStatus[]> = {
  PENDING: ["READY"],
  READY: ["RUNNING"],
  RUNNING: ["SUCCESS", "FAILED"],
  SUCCESS: [],
  FAILED: [],
};

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return ALLOWED[from].includes(to);
}

export class IllegalTransitionError extends Error {
  constructor(from: JobStatus, to: JobStatus) {
    super(`Illegal job status transition: ${from} -> ${to}`);
    this.name = "IllegalTransitionError";
  }
}
