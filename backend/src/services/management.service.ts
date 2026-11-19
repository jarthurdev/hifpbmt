import {
  ScheduleImportInput, scheduleSlotCreateSchema, scheduleSlotUpdateSchema
} from "../dtos/management.dto";
import { managementRepository } from "../repositories/management.repository";
import { HttpError } from "../shared/http-error";
import { z } from "zod";

type ScheduleSlotCreate = z.infer<typeof scheduleSlotCreateSchema>;
type ScheduleSlotUpdate = z.infer<typeof scheduleSlotUpdateSchema>;

async function validateProfessorAvailability(
  dayOfWeek: number, professorId: string | null | undefined, timeBlockId: string, excludeId?: string
): Promise<void> {
  if (!professorId) return;
  const timeBlock = await managementRepository.findTimeBlock(timeBlockId);
  if (!timeBlock) throw new HttpError("Faixa de horário não encontrada.", 400);
  const conflict = await managementRepository.findProfessorOverlap(
    dayOfWeek, professorId, timeBlock.startTime, timeBlock.endTime, excludeId
  );
  if (conflict) {
    throw new HttpError("Conflito de horário: professor já está ocupado em uma aula sobreposta.", 409);
  }
}

export const managementService = {
  createCourse: managementRepository.createCourse,
  updateCourse: managementRepository.updateCourse,
  deleteCourse: managementRepository.deleteCourse,
  createClassGroup: managementRepository.createClassGroup,
  updateClassGroup: managementRepository.updateClassGroup,
  deleteClassGroup: managementRepository.deleteClassGroup,
  createSubject: managementRepository.createSubject,
  updateSubject: managementRepository.updateSubject,
  deleteSubject: managementRepository.deleteSubject,
  createProfessor: managementRepository.createProfessor,
  updateProfessor: managementRepository.updateProfessor,
  deleteProfessor: managementRepository.deleteProfessor,
  createRoom: managementRepository.createRoom,
  updateRoom: managementRepository.updateRoom,
  deleteRoom: managementRepository.deleteRoom,
  createTimeBlock: managementRepository.createTimeBlock,
  updateTimeBlock: managementRepository.updateTimeBlock,
  deleteTimeBlock: managementRepository.deleteTimeBlock,
  async createScheduleSlot(data: ScheduleSlotCreate) {
    await validateProfessorAvailability(data.dayOfWeek, data.professorId, data.timeBlockId);
    return managementRepository.createScheduleSlot(data);
  },
  async updateScheduleSlot(id: string, data: ScheduleSlotUpdate) {
    const current = await managementRepository.findScheduleSlot(id);
    if (!current) throw new HttpError("Registro não encontrado.", 404);
    const dayOfWeek = data.dayOfWeek ?? current.dayOfWeek;
    const professorId = data.professorId === undefined ? current.professorId : data.professorId;
    const timeBlockId = data.timeBlockId ?? current.timeBlockId;
    await validateProfessorAvailability(dayOfWeek, professorId, timeBlockId, id);
    return managementRepository.updateScheduleSlot(id, data);
  },
  deleteScheduleSlot: managementRepository.deleteScheduleSlot,

  async importSchedule(data: ScheduleImportInput) {
    if (data.classGroups.some(group =>
      group.courseId !== data.courseId || group.academicTerm !== data.academicTerm
    )) {
      throw new HttpError("Todas as turmas importadas devem pertencer ao curso e semestre informados.", 400);
    }
    if (data.subjects.some(subject => subject.courseId !== data.courseId)) {
      throw new HttpError("Todas as disciplinas importadas devem pertencer ao curso informado.", 400);
    }

    const slotIds = data.scheduleSlots.flatMap(slot => slot.id ? [slot.id] : []);
    if (new Set(slotIds).size !== slotIds.length) {
      throw new HttpError("A grade contém IDs de horário duplicados.", 400);
    }

    const conflicts = new Map<string, { resource: string; slotId: string }>();
    for (const slot of data.scheduleSlots) {
      const resources: Array<[string, string | null]> = [
        ["turma", slot.classGroupId],
        ["professor", slot.professorId],
        ["sala", slot.roomId]
      ];
      for (const [resource, value] of resources) {
        if (!value || (resource === "professor" && data.allowProfessorConflicts)) continue;
        const key = `${resource}|${slot.dayOfWeek}|${slot.timeBlockId}|${value}`;
        const previous = conflicts.get(key);
        if (previous) {
          throw new HttpError(
            `Conflito de ${resource} entre os horários ${previous.slotId} e ${slot.id || "(novo)"}.`,
            409
          );
        }
        conflicts.set(key, { resource, slotId: slot.id || "(novo)" });
      }
    }

    return managementRepository.importSchedule(data);
  }
};
