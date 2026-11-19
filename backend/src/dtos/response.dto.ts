import { z } from "zod";

export const courseResponseSchema = z.object({
  id: z.string(), name: z.string(), code: z.string(), level: z.string()
});

export const classGroupResponseSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  name: z.string(),
  semesterPeriod: z.string(),
  shift: z.string(),
  academicTerm: z.string(),
  course: z.object({ id: z.string(), name: z.string(), code: z.string() })
});

export const professorResponseSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  siape: z.string().nullable(),
  email: z.string().nullable(),
  active: z.boolean()
});

export const subjectResponseSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  name: z.string(),
  code: z.string(),
  workloadHours: z.number().int().nullable(),
  course: z.object({ id: z.string(), name: z.string(), code: z.string() })
});

export const timeBlockResponseSchema = z.object({
  id: z.string(),
  shift: z.string(),
  orderIndex: z.number().int(),
  startTime: z.string(),
  endTime: z.string()
});

export const roomResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  block: z.string().nullable(),
  type: z.string().nullable(),
  capacity: z.number().int().nullable()
});
