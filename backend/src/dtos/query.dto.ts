import { z } from "zod";

const optionalNonEmptyString = z.string().trim().min(1).optional();

export const classGroupQuerySchema = z.object({
  courseId: optionalNonEmptyString,
  shift: optionalNonEmptyString
}).strict();

export const scheduleQuerySchema = z.object({
  classGroupId: optionalNonEmptyString,
  professorId: optionalNonEmptyString,
  roomId: optionalNonEmptyString,
  dayOfWeek: z.coerce.number().int().min(1).max(6).optional()
}).strict();

export const roomAvailabilityQuerySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(1).max(6),
  timeBlockId: z.string().trim().min(1)
}).strict();
