import { academicRepository, ScheduleRecord } from "../repositories/academic.repository";
import { HttpError } from "../shared/http-error";

export const academicService = {
  listCourses: () => academicRepository.listCourses(),
  listClassGroups: (filter: { courseId?: string; shift?: string }) =>
    academicRepository.listClassGroups(filter),
  listProfessors: () => academicRepository.listProfessors(),
  listSubjects: () => academicRepository.listSubjects(),
  listRooms: () => academicRepository.listRooms(),
  listTimeBlocks: () => academicRepository.listTimeBlocks(),
  async listAvailableRooms(dayOfWeek: number, timeBlockId: string) {
    const timeBlock = await academicRepository.findTimeBlock(timeBlockId);
    if (!timeBlock) throw new HttpError("Time block not found.", 404);
    return academicRepository.listAvailableRooms(dayOfWeek, timeBlock.startTime, timeBlock.endTime);
  },
  async listSchedules(filter: {
    classGroupId?: string; professorId?: string; roomId?: string; dayOfWeek?: number;
  }) {
    const records = await academicRepository.listSchedules(filter);
    return records.map(toScheduleResponse);
  }
};

function toScheduleResponse(record: ScheduleRecord) {
  return {
    id: record.id,
    dayOfWeek: record.dayOfWeek,
    classGroup: {
      id: record.classGroup.id,
      name: record.classGroup.name,
      semesterPeriod: record.classGroup.semesterPeriod,
      shift: record.classGroup.shift,
      academicTerm: record.classGroup.academicTerm,
      course: record.classGroup.course
    },
    subject: record.subject,
    professor: record.professor,
    room: record.room,
    timeBlock: record.timeBlock
  };
}
