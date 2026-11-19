import { Prisma } from "@prisma/client";
import { prisma } from "../shared/prisma";

const scheduleInclude = {
  classGroup: {
    include: { course: { select: { id: true, name: true, code: true } } }
  },
  subject: { select: { id: true, name: true, code: true } },
  professor: { select: { id: true, fullName: true } },
  room: { select: { id: true, name: true, block: true } },
  timeBlock: { select: { id: true, shift: true, startTime: true, endTime: true } }
} satisfies Prisma.ScheduleSlotInclude;

export type ScheduleRecord = Prisma.ScheduleSlotGetPayload<{ include: typeof scheduleInclude }>;

export const academicRepository = {
  listCourses: () => prisma.course.findMany({ orderBy: { name: "asc" } }),

  listClassGroups: (filter: { courseId?: string; shift?: string }) =>
    prisma.classGroup.findMany({
      where: {
        ...(filter.courseId ? { courseId: filter.courseId } : {}),
        ...(filter.shift ? { shift: { equals: filter.shift, mode: "insensitive" } } : {})
      },
      include: { course: { select: { id: true, name: true, code: true } } },
      orderBy: [{ course: { name: "asc" } }, { name: "asc" }]
    }),

  listProfessors: () => prisma.professor.findMany({
    where: { active: true },
    orderBy: { fullName: "asc" }
  }),

  listSubjects: () => prisma.subject.findMany({
    include: { course: { select: { id: true, name: true, code: true } } },
    orderBy: [{ course: { name: "asc" } }, { name: "asc" }]
  }),

  listRooms: () => prisma.room.findMany({ orderBy: [{ block: "asc" }, { name: "asc" }] }),
  listTimeBlocks: () => prisma.timeBlock.findMany({
    orderBy: [{ shift: "asc" }, { orderIndex: "asc" }]
  }),

  findTimeBlock: (id: string) => prisma.timeBlock.findUnique({ where: { id } }),

  listAvailableRooms: (dayOfWeek: number, startTime: string, endTime: string) =>
    prisma.room.findMany({
      where: {
        scheduleSlots: {
          none: {
            dayOfWeek,
            timeBlock: {
              startTime: { lt: endTime },
              endTime: { gt: startTime }
            }
          }
        }
      },
      orderBy: [{ block: "asc" }, { name: "asc" }]
    }),

  listSchedules: (filter: {
    classGroupId?: string; professorId?: string; roomId?: string; dayOfWeek?: number;
  }) => prisma.scheduleSlot.findMany({
    where: {
      ...(filter.classGroupId ? { classGroupId: filter.classGroupId } : {}),
      ...(filter.professorId ? { professorId: filter.professorId } : {}),
      ...(filter.roomId ? { roomId: filter.roomId } : {}),
      ...(filter.dayOfWeek !== undefined ? { dayOfWeek: filter.dayOfWeek } : {})
    },
    include: scheduleInclude,
    orderBy: [
      { dayOfWeek: "asc" },
      { timeBlock: { startTime: "asc" } },
      { classGroup: { name: "asc" } }
    ]
  })
};
