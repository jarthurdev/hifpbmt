import { NextFunction, Request, Response } from "express";
import { classGroupQuerySchema, roomAvailabilityQuerySchema, scheduleQuerySchema } from "../dtos/query.dto";
import { scheduleResponseSchema } from "../dtos/schedule.dto";
import {
  classGroupResponseSchema, courseResponseSchema, professorResponseSchema, roomResponseSchema,
  subjectResponseSchema, timeBlockResponseSchema
} from "../dtos/response.dto";
import { academicService } from "../services/academic.service";

function respondWithValidated<T>(
  schema: { array: () => { parse: (data: unknown) => T } },
  data: unknown,
  response: Response
): void {
  response.json(schema.array().parse(data));
}

export const academicController = {
  async courses(_request: Request, response: Response, next: NextFunction) {
    try {
      respondWithValidated(courseResponseSchema, await academicService.listCourses(), response);
    } catch (error) { next(error); }
  },

  async classGroups(request: Request, response: Response, next: NextFunction) {
    try {
      const filter = classGroupQuerySchema.parse(request.query);
      respondWithValidated(classGroupResponseSchema, await academicService.listClassGroups(filter), response);
    } catch (error) { next(error); }
  },

  async professors(_request: Request, response: Response, next: NextFunction) {
    try {
      respondWithValidated(professorResponseSchema, await academicService.listProfessors(), response);
    } catch (error) { next(error); }
  },

  async subjects(_request: Request, response: Response, next: NextFunction) {
    try {
      respondWithValidated(subjectResponseSchema, await academicService.listSubjects(), response);
    } catch (error) { next(error); }
  },

  async rooms(_request: Request, response: Response, next: NextFunction) {
    try {
      respondWithValidated(roomResponseSchema, await academicService.listRooms(), response);
    } catch (error) { next(error); }
  },

  async timeBlocks(_request: Request, response: Response, next: NextFunction) {
    try {
      respondWithValidated(timeBlockResponseSchema, await academicService.listTimeBlocks(), response);
    } catch (error) { next(error); }
  },

  async roomAvailability(request: Request, response: Response, next: NextFunction) {
    try {
      const { dayOfWeek, timeBlockId } = roomAvailabilityQuerySchema.parse(request.query);
      respondWithValidated(
        roomResponseSchema,
        await academicService.listAvailableRooms(dayOfWeek, timeBlockId),
        response
      );
    } catch (error) { next(error); }
  },

  async schedules(request: Request, response: Response, next: NextFunction) {
    try {
      const filter = scheduleQuerySchema.parse(request.query);
      const data = await academicService.listSchedules(filter);
      response.json(data.map(record => scheduleResponseSchema.parse(record)));
    } catch (error) { next(error); }
  }
};
