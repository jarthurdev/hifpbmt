import { randomUUID } from "node:crypto";
import { ScheduleImportInput } from "../dtos/management.dto";
import {
  classGroupCreateSchema, classGroupUpdateSchema, courseCreateSchema, courseUpdateSchema,
  professorCreateSchema, professorUpdateSchema, roomCreateSchema, roomUpdateSchema,
  scheduleSlotCreateSchema, scheduleSlotUpdateSchema, subjectCreateSchema, subjectUpdateSchema,
  timeBlockCreateSchema, timeBlockUpdateSchema
} from "../dtos/management.dto";
import { prisma } from "../shared/prisma";
import { HttpError } from "../shared/http-error";
import { z } from "zod";

type CourseCreate = z.infer<typeof courseCreateSchema>;
type CourseUpdate = z.infer<typeof courseUpdateSchema>;
type ClassGroupCreate = z.infer<typeof classGroupCreateSchema>;
type ClassGroupUpdate = z.infer<typeof classGroupUpdateSchema>;
type SubjectCreate = z.infer<typeof subjectCreateSchema>;
type SubjectUpdate = z.infer<typeof subjectUpdateSchema>;
type ProfessorCreate = z.infer<typeof professorCreateSchema>;
type ProfessorUpdate = z.infer<typeof professorUpdateSchema>;
type RoomCreate = z.infer<typeof roomCreateSchema>;
type RoomUpdate = z.infer<typeof roomUpdateSchema>;
type TimeBlockCreate = z.infer<typeof timeBlockCreateSchema>;
type TimeBlockUpdate = z.infer<typeof timeBlockUpdateSchema>;
type ScheduleSlotCreate = z.infer<typeof scheduleSlotCreateSchema>;
type ScheduleSlotUpdate = z.infer<typeof scheduleSlotUpdateSchema>;

const generatedId = (id?: string) => id || randomUUID();

export const managementRepository = {
  createCourse: (data: CourseCreate) =>
    prisma.course.create({ data: { ...data, id: generatedId(data.id) } }),
  updateCourse: (id: string, data: CourseUpdate) =>
    prisma.course.update({ where: { id }, data }),
  deleteCourse: (id: string) => prisma.course.delete({ where: { id } }),

  createClassGroup: (data: ClassGroupCreate) =>
    prisma.classGroup.create({ data: { ...data, id: generatedId(data.id) } }),
  updateClassGroup: (id: string, data: ClassGroupUpdate) =>
    prisma.classGroup.update({ where: { id }, data }),
  deleteClassGroup: (id: string) => prisma.classGroup.delete({ where: { id } }),

  createSubject: (data: SubjectCreate) =>
    prisma.subject.create({ data: { ...data, id: generatedId(data.id) } }),
  updateSubject: (id: string, data: SubjectUpdate) =>
    prisma.subject.update({ where: { id }, data }),
  deleteSubject: (id: string) => prisma.subject.delete({ where: { id } }),

  createProfessor: (data: ProfessorCreate) =>
    prisma.professor.create({ data: { ...data, id: generatedId(data.id) } }),
  updateProfessor: (id: string, data: ProfessorUpdate) =>
    prisma.professor.update({ where: { id }, data }),
  deleteProfessor: (id: string) => prisma.professor.delete({ where: { id } }),

  createRoom: (data: RoomCreate) =>
    prisma.room.create({ data: { ...data, id: generatedId(data.id) } }),
  updateRoom: (id: string, data: RoomUpdate) =>
    prisma.room.update({ where: { id }, data }),
  deleteRoom: (id: string) => prisma.room.delete({ where: { id } }),

  createTimeBlock: (data: TimeBlockCreate) =>
    prisma.timeBlock.create({ data: { ...data, id: generatedId(data.id) } }),
  updateTimeBlock: (id: string, data: TimeBlockUpdate) =>
    prisma.timeBlock.update({ where: { id }, data }),
  deleteTimeBlock: (id: string) => prisma.timeBlock.delete({ where: { id } }),

  createScheduleSlot: (data: ScheduleSlotCreate) =>
    prisma.scheduleSlot.create({ data: { ...data, id: generatedId(data.id) } }),
  updateScheduleSlot: (id: string, data: ScheduleSlotUpdate) =>
    prisma.scheduleSlot.update({ where: { id }, data }),
  deleteScheduleSlot: (id: string) => prisma.scheduleSlot.delete({ where: { id } }),
  findScheduleSlot: (id: string) =>
    prisma.scheduleSlot.findUnique({ where: { id }, select: {
      id: true, dayOfWeek: true, professorId: true, timeBlockId: true
    } }),
  findTimeBlock: (id: string) => prisma.timeBlock.findUnique({ where: { id } }),
  findProfessorOverlap: (
    dayOfWeek: number, professorId: string, startTime: string, endTime: string, excludeId?: string
  ) => prisma.scheduleSlot.findFirst({
    where: {
      dayOfWeek,
      professorId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      timeBlock: {
        startTime: { lt: endTime },
        endTime: { gt: startTime }
      }
    },
    select: { id: true }
  }),

  importSchedule: (data: ScheduleImportInput) =>
    prisma.$transaction(async transaction => {
      if (!(await transaction.course.findUnique({ where: { id: data.courseId }, select: { id: true } }))) {
        throw new HttpError("Curso informado não existe.", 400);
      }
      for (const row of data.classGroups) {
        await transaction.classGroup.upsert({
          where: { id: row.id },
          create: row,
          update: {
            courseId: row.courseId, name: row.name, semesterPeriod: row.semesterPeriod,
            shift: row.shift, academicTerm: row.academicTerm
          }
        });
      }
      for (const row of data.subjects) {
        await transaction.subject.upsert({
          where: { id: row.id },
          create: row,
          update: {
            courseId: row.courseId, name: row.name, code: row.code,
            workloadHours: row.workloadHours
          }
        });
      }
      for (const row of data.professors) {
        await transaction.professor.upsert({
          where: { id: row.id },
          create: row,
          update: {
            fullName: row.fullName, siape: row.siape, email: row.email, active: row.active
          }
        });
      }
      for (const row of data.rooms) {
        await transaction.room.upsert({
          where: { id: row.id },
          create: row,
          update: { name: row.name, block: row.block, type: row.type, capacity: row.capacity }
        });
      }
      for (const row of data.timeBlocks) {
        await transaction.timeBlock.upsert({
          where: { id: row.id },
          create: row,
          update: {
            shift: row.shift, orderIndex: row.orderIndex,
            startTime: row.startTime, endTime: row.endTime
          }
        });
      }

      const groups = await transaction.classGroup.findMany({
        where: { courseId: data.courseId, academicTerm: data.academicTerm },
        select: { id: true }
      });
      const allowedGroupIds = new Set(groups.map(group => group.id));
      const slotGroupIds = new Set(data.scheduleSlots.map(slot => slot.classGroupId));
      if ([...slotGroupIds].some(id => !allowedGroupIds.has(id))) {
        throw new HttpError("A importação contém turma inexistente ou fora do curso/semestre selecionado.", 400);
      }

      const subjectIds = new Set(data.scheduleSlots.map(slot => slot.subjectId));
      const professorIds = new Set(data.scheduleSlots.flatMap(slot => slot.professorId ? [slot.professorId] : []));
      const roomIds = new Set(data.scheduleSlots.flatMap(slot => slot.roomId ? [slot.roomId] : []));
      const timeBlockIds = new Set(data.scheduleSlots.map(slot => slot.timeBlockId));
      const subjects = await transaction.subject.findMany({
        where: { id: { in: [...subjectIds] } }, select: { id: true, courseId: true }
      });
      const professors = await transaction.professor.findMany({
        where: { id: { in: [...professorIds] } }, select: { id: true }
      });
      const rooms = await transaction.room.findMany({
        where: { id: { in: [...roomIds] } }, select: { id: true }
      });
      const timeBlocks = await transaction.timeBlock.findMany({
        where: { id: { in: [...timeBlockIds] } }, select: { id: true }
      });
      if (subjects.length !== subjectIds.size || subjects.some(subject => subject.courseId !== data.courseId)) {
        throw new HttpError("A grade contém disciplina inexistente ou vinculada a outro curso.", 400);
      }
      if (professors.length !== professorIds.size || rooms.length !== roomIds.size ||
          timeBlocks.length !== timeBlockIds.size) {
        throw new HttpError("A grade contém referência inexistente de professor, sala ou faixa de horário.", 400);
      }

      const classGroupIds = groups.map(group => group.id);
      const importedBlocks = new Map((await transaction.timeBlock.findMany({
        where: { id: { in: [...timeBlockIds] } },
        select: { id: true, startTime: true, endTime: true }
      })).map(block => [block.id, block]));
      const externalProfessorSlots = professorIds.size && data.scheduleSlots.length
        ? await transaction.scheduleSlot.findMany({
          where: {
            professorId: { in: [...professorIds] },
            dayOfWeek: { in: [...new Set(data.scheduleSlots.map(slot => slot.dayOfWeek))] },
            ...(classGroupIds.length ? { classGroupId: { notIn: classGroupIds } } : {})
          },
          select: {
            id: true,
            dayOfWeek: true,
            professorId: true,
            timeBlock: { select: { startTime: true, endTime: true } }
          }
        })
        : [];
      let externalProfessorConflictCount = 0;
      for (const slot of data.scheduleSlots) {
        if (!slot.professorId) continue;
        const block = importedBlocks.get(slot.timeBlockId);
        if (!block) continue;
        for (const existing of externalProfessorSlots) {
          if (existing.dayOfWeek === slot.dayOfWeek &&
              existing.professorId === slot.professorId &&
              block.startTime < existing.timeBlock.endTime &&
              block.endTime > existing.timeBlock.startTime) {
            externalProfessorConflictCount += 1;
          }
        }
      }
      if (externalProfessorConflictCount && !data.allowProfessorConflicts) {
        throw new HttpError(
          "Conflito de horário: professor já está ocupado em uma aula sobreposta fora do curso importado.",
          409
        );
      }

      await transaction.scheduleSlot.deleteMany({
        where: { classGroupId: { in: classGroupIds } }
      });
      for (const slot of data.scheduleSlots) {
        await transaction.scheduleSlot.create({
          data: { ...slot, id: generatedId(slot.id) }
        });
      }

      return {
        importedSlots: data.scheduleSlots.length,
        replacedClassGroups: groups.length,
        professorConflictCount: data.allowProfessorConflicts
          ? countProfessorConflicts(data.scheduleSlots, importedBlocks) + externalProfessorConflictCount
          : 0
      };
    }),
};

function countProfessorConflicts(
  slots: ScheduleImportInput["scheduleSlots"],
  timeBlocks: Map<string, { id: string; startTime: string; endTime: string }>
): number {
  let count = 0;
  for (let first = 0; first < slots.length; first += 1) {
    const firstSlot = slots[first];
    if (!firstSlot.professorId) continue;
    const firstBlock = timeBlocks.get(firstSlot.timeBlockId);
    if (!firstBlock) continue;
    for (let second = first + 1; second < slots.length; second += 1) {
      const secondSlot = slots[second];
      if (firstSlot.professorId !== secondSlot.professorId || !secondSlot.professorId) continue;
      if (firstSlot.dayOfWeek !== secondSlot.dayOfWeek) continue;
      const secondBlock = timeBlocks.get(secondSlot.timeBlockId);
      if (secondBlock && firstBlock.startTime < secondBlock.endTime &&
          firstBlock.endTime > secondBlock.startTime) count += 1;
    }
  }
  return count;
}
