import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  classGroupCreateSchema, classGroupManagementResponseSchema, classGroupUpdateSchema,
  courseCreateSchema, courseManagementResponseSchema, courseUpdateSchema,
  professorCreateSchema, professorUpdateSchema, roomCreateSchema, roomUpdateSchema,
  professorManagementResponseSchema, roomManagementResponseSchema,
  scheduleImportResponseSchema, scheduleImportSchema, scheduleSlotCreateSchema,
  scheduleSlotManagementResponseSchema, scheduleSlotUpdateSchema,
  subjectCreateSchema, subjectManagementResponseSchema, subjectUpdateSchema,
  timeBlockCreateSchema, timeBlockManagementResponseSchema, timeBlockUpdateSchema
} from "../dtos/management.dto";
import { managementService } from "../services/management.service";

interface CrudService<Create, Update> {
  create(data: Create): Promise<unknown>;
  update(id: string, data: Update): Promise<unknown>;
  remove(id: string): Promise<unknown>;
}

function createCrudController<Create, Update>(
  createSchema: z.ZodType<Create>,
  updateSchema: z.ZodType<Update>,
  responseSchema: z.ZodType<unknown>,
  service: CrudService<Create, Update>
) {
  return {
    async create(request: Request, response: Response, next: NextFunction) {
      try {
        response.status(201).json(responseSchema.parse(await service.create(createSchema.parse(request.body))));
      } catch (error) { next(error); }
    },
    async update(request: Request, response: Response, next: NextFunction) {
      try {
        response.json(responseSchema.parse(await service.update(
          z.string().min(1).parse(request.params.id),
          updateSchema.parse(request.body)
        )));
      } catch (error) { next(error); }
    },
    async remove(request: Request, response: Response, next: NextFunction) {
      try {
        await service.remove(z.string().min(1).parse(request.params.id));
        response.sendStatus(204);
      } catch (error) { next(error); }
    }
  };
}

export const courseManagementController = createCrudController(
  courseCreateSchema, courseUpdateSchema, courseManagementResponseSchema,
  { create: managementService.createCourse, update: managementService.updateCourse, remove: managementService.deleteCourse }
);
export const classGroupManagementController = createCrudController(
  classGroupCreateSchema, classGroupUpdateSchema, classGroupManagementResponseSchema,
  { create: managementService.createClassGroup, update: managementService.updateClassGroup, remove: managementService.deleteClassGroup }
);
export const subjectManagementController = createCrudController(
  subjectCreateSchema, subjectUpdateSchema, subjectManagementResponseSchema,
  { create: managementService.createSubject, update: managementService.updateSubject, remove: managementService.deleteSubject }
);
export const professorManagementController = createCrudController(
  professorCreateSchema, professorUpdateSchema, professorManagementResponseSchema,
  { create: managementService.createProfessor, update: managementService.updateProfessor, remove: managementService.deleteProfessor }
);
export const roomManagementController = createCrudController(
  roomCreateSchema, roomUpdateSchema, roomManagementResponseSchema,
  { create: managementService.createRoom, update: managementService.updateRoom, remove: managementService.deleteRoom }
);
export const timeBlockManagementController = createCrudController(
  timeBlockCreateSchema, timeBlockUpdateSchema, timeBlockManagementResponseSchema,
  { create: managementService.createTimeBlock, update: managementService.updateTimeBlock, remove: managementService.deleteTimeBlock }
);
export const scheduleSlotManagementController = createCrudController(
  scheduleSlotCreateSchema, scheduleSlotUpdateSchema, scheduleSlotManagementResponseSchema,
  { create: managementService.createScheduleSlot, update: managementService.updateScheduleSlot, remove: managementService.deleteScheduleSlot }
);

export const scheduleImportController = {
  async import(request: Request, response: Response, next: NextFunction) {
    try {
      const payload = scheduleImportSchema.parse(request.body);
      response.status(201).json(scheduleImportResponseSchema.parse(await managementService.importSchedule(payload)));
    } catch (error) { next(error); }
  }
};
