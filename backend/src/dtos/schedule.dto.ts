import { z } from "zod";

export const scheduleResponseSchema = z.object({
  id: z.string(),
  dayOfWeek: z.number().int(),
  classGroup: z.object({
    id: z.string(),
    name: z.string(),
    semesterPeriod: z.string(),
    shift: z.string(),
    academicTerm: z.string(),
    course: z.object({ id: z.string(), name: z.string(), code: z.string() })
  }),
  subject: z.object({ id: z.string(), name: z.string(), code: z.string() }),
  professor: z.object({ id: z.string(), fullName: z.string() }).nullable(),
  room: z.object({ id: z.string(), name: z.string(), block: z.string().nullable() }).nullable(),
  timeBlock: z.object({
    id: z.string(), shift: z.string(), startTime: z.string(), endTime: z.string()
  })
});

export type ScheduleResponse = z.infer<typeof scheduleResponseSchema>;
