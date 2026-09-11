// In-memory sandbox used by demo mode. Nothing here ever touches the database,
// and everything resets when the page reloads.
import { mockJobs, mockParts, mockNotes, mockTimeSessions } from "@/data/mockData";
import type { Job, JobPart, JobNote } from "@/hooks/useJobs";
import type { TimeSession } from "@/hooks/useTimeSessions";
import type { Customer, CustomerInput } from "@/hooks/useCustomers";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const newId = () => `demo-${Math.random().toString(36).slice(2, 10)}`;

const seedJobs = (): Job[] =>
  clone(mockJobs).map((j: any) => ({
    ...j,
    discount_percent: j.discount_percent ?? 0,
    scheduled_date: j.scheduled_date ?? null,
  })) as Job[];

const seedFlat = <T,>(byJob: Record<string, T[]>): T[] =>
  Object.values(clone(byJob)).flat() as T[];

const seedCustomers = (): Customer[] =>
  seedJobs().map((j) => ({
    id: newId(),
    name: j.customer_name,
    phone: j.customer_phone,
    address: j.customer_address,
    boat_name: j.boat_name,
    boat_type: j.boat_type,
    engine_make_model: j.engine_make_model,
    engine_serial: j.engine_serial,
    model_number: j.model_number,
    notes: "",
    created_at: j.created_at,
    updated_at: j.updated_at,
  }));

let jobs: Job[] = seedJobs();
let parts: JobPart[] = seedFlat<JobPart>(mockParts as any);
let notes: JobNote[] = seedFlat<JobNote>(mockNotes as any);
let sessions: TimeSession[] = seedFlat<TimeSession>(mockTimeSessions as any);
let customers: Customer[] = seedCustomers();

const recalcHours = (jobId: string) => {
  const total = sessions
    .filter((s) => s.job_id === jobId)
    .reduce((sum, s) => sum + (s.duration || 0) / 3600, 0);
  const job = jobs.find((j) => j.id === jobId);
  if (job) job.total_hours = total;
};

export const demoStore = {
  reset() {
    jobs = seedJobs();
    parts = seedFlat<JobPart>(mockParts as any);
    notes = seedFlat<JobNote>(mockNotes as any);
    sessions = seedFlat<TimeSession>(mockTimeSessions as any);
    customers = seedCustomers();
  },

  // Jobs
  listJobs: (): Job[] =>
    clone(jobs).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  createJob(input: Partial<Job>): Job {
    const now = new Date().toISOString();
    const job: Job = {
      id: newId(),
      customer_name: "",
      boat_name: "",
      boat_type: "",
      description: "",
      hourly_rate: 75,
      status: "active",
      total_hours: 0,
      paid: false,
      payment_amount: 0,
      tax_rate: 0,
      customer_address: "",
      customer_phone: "",
      engine_make_model: "",
      engine_serial: "",
      model_number: "",
      discount_percent: 0,
      scheduled_date: null,
      ...input,
      created_at: now,
      updated_at: now,
      customer_token: newId(),
    } as Job;
    jobs = [job, ...jobs];
    return clone(job);
  },
  updateJob(id: string, updates: Partial<Job>): Job {
    const job = jobs.find((j) => j.id === id);
    if (!job) throw new Error("Job not found");
    Object.assign(job, updates, { updated_at: new Date().toISOString() });
    return clone(job);
  },
  deleteJob(id: string) {
    jobs = jobs.filter((j) => j.id !== id);
    parts = parts.filter((p) => p.job_id !== id);
    notes = notes.filter((n) => n.job_id !== id);
    sessions = sessions.filter((s) => s.job_id !== id);
  },

  // Parts
  listParts: (jobId: string): JobPart[] =>
    clone(parts.filter((p) => p.job_id === jobId)).sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    ),
  addPart(input: Omit<JobPart, "id" | "created_at">): JobPart {
    const part: JobPart = { ...input, id: newId(), created_at: new Date().toISOString() };
    parts = [...parts, part];
    return clone(part);
  },
  updatePart(id: string, updates: Partial<JobPart>): JobPart {
    const part = parts.find((p) => p.id === id);
    if (!part) throw new Error("Part not found");
    Object.assign(part, updates);
    return clone(part);
  },
  deletePart(id: string) {
    parts = parts.filter((p) => p.id !== id);
  },

  // Notes
  listNotes: (jobId: string): JobNote[] =>
    clone(notes.filter((n) => n.job_id === jobId)).sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    ),
  addNote(input: Omit<JobNote, "id" | "created_at">): JobNote {
    const note: JobNote = { ...input, id: newId(), created_at: new Date().toISOString() };
    notes = [...notes, note];
    return clone(note);
  },
  updateNote(id: string, content: string): JobNote {
    const note = notes.find((n) => n.id === id);
    if (!note) throw new Error("Note not found");
    note.content = content;
    return clone(note);
  },

  // Time sessions
  listSessions: (jobId: string): TimeSession[] =>
    clone(sessions.filter((s) => s.job_id === jobId)).sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    ),
  createSession(jobId: string, description: string, hourlyRate: number): TimeSession {
    const now = new Date().toISOString();
    const session: TimeSession = {
      id: newId(),
      job_id: jobId,
      description,
      start_time: null,
      end_time: null,
      duration: 0,
      hourly_rate: hourlyRate,
      created_at: now,
      updated_at: now,
    };
    sessions = [...sessions, session];
    recalcHours(jobId);
    return clone(session);
  },
  updateSession(id: string, updates: Partial<TimeSession>): TimeSession {
    const session = sessions.find((s) => s.id === id);
    if (!session) throw new Error("Session not found");
    Object.assign(session, updates, { updated_at: new Date().toISOString() });
    recalcHours(session.job_id);
    return clone(session);
  },
  getSession: (id: string): TimeSession | undefined => {
    const found = sessions.find((s) => s.id === id);
    return found ? clone(found) : undefined;
  },
  deleteSession(id: string) {
    const session = sessions.find((s) => s.id === id);
    sessions = sessions.filter((s) => s.id !== id);
    if (session) recalcHours(session.job_id);
  },

  // Customers
  listCustomers: (): Customer[] =>
    clone(customers).sort((a, b) => a.name.localeCompare(b.name)),
  saveCustomer(input: CustomerInput & { id?: string }): Customer {
    const now = new Date().toISOString();
    if (input.id) {
      const existing = customers.find((c) => c.id === input.id);
      if (existing) {
        Object.assign(existing, input, { updated_at: now });
        return clone(existing);
      }
    }
    const customer: Customer = {
      ...(input as CustomerInput),
      id: newId(),
      created_at: now,
      updated_at: now,
    };
    customers = [...customers, customer];
    return clone(customer);
  },
  deleteCustomer(id: string) {
    customers = customers.filter((c) => c.id !== id);
  },
};
