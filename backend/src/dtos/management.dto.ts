import { z } from "zod";

const id = z.string().trim().min(1).optional();
const requiredText = z.string().trim().min(1);
const nullableText = z.string().trim().min(1).nullable().optional();

function updateSchema<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.partial().refine(value => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar."
  });
}

const courseFields = {
  name: requiredText,
  code: requiredText,
  level: requiredText
};

const classGroupFields = {
  courseId: requiredText,
  name: requiredText,
  semesterPeriod: requiredText,
  shift: requiredText,
  academicTerm: requiredText
};

const subjectFields = {
  courseId: requiredText,
  name: requiredText,
  code: requiredText,
  workloadHours: z.number().int().positive().nullable().optional()
};

const professorFields = {
  fullName: requiredText,
  siape: nullableText,
  email: z.string().trim().email().nullable().optional(),
  active: z.boolean().optional()
};

const roomFields = {
  name: requiredText,
  block: nullableText,
  type: nullableText,
  capacity: z.number().int().positive().nullable().optional()
};

const timeBlockFields = {
  shift: requiredText,
  orderIndex: z.number().int().nonnegative(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/)
};

const scheduleSlotFields = {
  dayOfWeek: z.number().int().min(1).max(6),
  classGroupId: requiredText,
  subjectId: requiredText,
  professorId: z.string().trim().min(1).nullable().optional(),
  roomId: z.string().trim().min(1).nullable().optional(),
  timeBlockId: requiredText
};

export const courseCreateSchema = z.object({ id, ...courseFields }).strict();
export const courseUpdateSchema = updateSchema(z.object(courseFields).strict());
export const classGroupCreateSchema = z.object({ id, ...classGroupFields }).strict();
export const classGroupUpdateSchema = updateSchema(z.object(classGroupFields).strict());
export const subjectCreateSchema = z.object({ id, ...subjectFields }).strict();
export const subjectUpdateSchema = updateSchema(z.object(subjectFields).strict());
export const professorCreateSchema = z.object({ id, ...professorFields }).strict();
export const professorUpdateSchema = updateSchema(z.object(professorFields).strict());
export const roomCreateSchema = z.object({ id, ...roomFields }).strict();
export const roomUpdateSchema = updateSchema(z.object(roomFields).strict());
export const timeBlockCreateSchema = z.object({ id, ...timeBlockFields }).strict();
export const timeBlockUpdateSchema = updateSchema(z.object(timeBlockFields).strict());
export const scheduleSlotCreateSchema = z.object({ id, ...scheduleSlotFields }).strict();
export const scheduleSlotUpdateSchema = updateSchema(z.object(scheduleSlotFields).strict());

export const courseManagementResponseSchema = z.object({
  id: z.string(), name: z.string(), code: z.string(), level: z.string()
});
export const classGroupManagementResponseSchema = z.object({
  id: z.string(), courseId: z.string(), name: z.string(), semesterPeriod: z.string(),
  shift: z.string(), academicTerm: z.string()
});
export const subjectManagementResponseSchema = z.object({
  id: z.string(), courseId: z.string(), name: z.string(), code: z.string(),
  workloadHours: z.number().int().nullable()
});
export const professorManagementResponseSchema = z.object({
  id: z.string(), fullName: z.string(), siape: z.string().nullable(),
  email: z.string().nullable(), active: z.boolean()
});
export const roomManagementResponseSchema = z.object({
  id: z.string(), name: z.string(), block: z.string().nullable(),
  type: z.string().nullable(), capacity: z.number().int().nullable()
});
export const timeBlockManagementResponseSchema = z.object({
  id: z.string(), shift: z.string(), orderIndex: z.number().int(),
  startTime: z.string(), endTime: z.string()
});
export const scheduleSlotManagementResponseSchema = z.object({
  id: z.string(), dayOfWeek: z.number().int(), classGroupId: z.string(), subjectId: z.string(),
  professorId: z.string().nullable(), roomId: z.string().nullable(), timeBlockId: z.string()
});

const importId = z.string().trim().min(1);
export const scheduleImportSchema = z.object({
  courseId: importId,
  academicTerm: requiredText,
  allowProfessorConflicts: z.boolean().default(false),
  classGroups: z.array(z.object({
    id: importId,
    courseId: importId,
    name: requiredText,
    semesterPeriod: requiredText,
    shift: requiredText,
    academicTerm: requiredText
  }).strict()).default([]),
  subjects: z.array(z.object({
    id: importId,
    courseId: importId,
    name: requiredText,
    code: requiredText,
    workloadHours: z.number().int().positive().nullable()
  }).strict()).default([]),
  professors: z.array(z.object({
    id: importId,
    fullName: requiredText,
    siape: z.string().nullable(),
    email: z.string().email().nullable(),
    active: z.boolean()
  }).strict()).default([]),
  rooms: z.array(z.object({
    id: importId,
    name: requiredText,
    block: z.string().nullable(),
    type: z.string().nullable(),
    capacity: z.number().int().positive().nullable()
  }).strict()).default([]),
  timeBlocks: z.array(z.object({
    id: importId,
    shift: requiredText,
    orderIndex: z.number().int().nonnegative(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/)
  }).strict()).default([]),
  scheduleSlots: z.array(z.object({
    id: id,
    dayOfWeek: z.number().int().min(1).max(6),
    classGroupId: importId,
    subjectId: importId,
    professorId: z.string().nullable(),
    roomId: z.string().nullable(),
    timeBlockId: importId
  }).strict()).min(1)
}).strict();

export type ScheduleImportInput = z.infer<typeof scheduleImportSchema>;
export const scheduleImportResponseSchema = z.object({
  importedSlots: z.number().int().nonnegative(),
  replacedClassGroups: z.number().int().nonnegative(),
  professorConflictCount: z.number().int().nonnegative()
});
