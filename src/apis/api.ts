import Fastify, { FastifyInstance } from "fastify";
import { createJob, getJob } from "../jobs/jobs";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.post<{ Body: { type?: string; payload?: unknown; run_at?: string } }>(
    "/jobs",
    async (req, reply) => {
      const { type, payload, run_at } = req.body ?? {};
      if (!type || typeof type !== "string") {
        return reply.code(400).send({ error: "`type` (string) is required" });
      }
      const job = await createJob(type, payload ?? {}, run_at);
      return reply.code(201).send(job);
    }
  );

  app.get<{ Params: { id: string } }>("/jobs/:id", async (req, reply) => {
    const job = await getJob(req.params.id);
    if (!job) return reply.code(404).send({ error: "Not found" });
    return job;
  });

  app.get("/health", async () => ({ ok: true }));

  return app;
}
