import { Router } from "express";
import { authRouter } from "./auth.routes";
import { academicController } from "../controllers/academic.controller";
import {
  classGroupManagementController, courseManagementController, professorManagementController,
  roomManagementController, scheduleImportController, scheduleSlotManagementController,
  subjectManagementController, timeBlockManagementController
} from "../controllers/management.controller";
import { ensureAuthenticated } from "../middleware/ensure-authenticated";

export const academicRouter = Router();

academicRouter.use("/auth", authRouter);
academicRouter.get("/courses", academicController.courses);
academicRouter.get("/class-groups", academicController.classGroups);
academicRouter.get("/subjects", academicController.subjects);
academicRouter.get("/professors", academicController.professors);
academicRouter.get("/rooms/availability", academicController.roomAvailability);
academicRouter.get("/rooms", academicController.rooms);
academicRouter.get("/time-blocks", academicController.timeBlocks);
academicRouter.get("/schedules", academicController.schedules);

academicRouter.post("/courses", ensureAuthenticated, courseManagementController.create);
academicRouter.put("/courses/:id", ensureAuthenticated, courseManagementController.update);
academicRouter.delete("/courses/:id", ensureAuthenticated, courseManagementController.remove);
academicRouter.post("/class-groups", ensureAuthenticated, classGroupManagementController.create);
academicRouter.put("/class-groups/:id", ensureAuthenticated, classGroupManagementController.update);
academicRouter.delete("/class-groups/:id", ensureAuthenticated, classGroupManagementController.remove);
academicRouter.post("/subjects", ensureAuthenticated, subjectManagementController.create);
academicRouter.put("/subjects/:id", ensureAuthenticated, subjectManagementController.update);
academicRouter.delete("/subjects/:id", ensureAuthenticated, subjectManagementController.remove);
academicRouter.post("/professors", ensureAuthenticated, professorManagementController.create);
academicRouter.put("/professors/:id", ensureAuthenticated, professorManagementController.update);
academicRouter.delete("/professors/:id", ensureAuthenticated, professorManagementController.remove);
academicRouter.post("/rooms", ensureAuthenticated, roomManagementController.create);
academicRouter.put("/rooms/:id", ensureAuthenticated, roomManagementController.update);
academicRouter.delete("/rooms/:id", ensureAuthenticated, roomManagementController.remove);
academicRouter.post("/time-blocks", ensureAuthenticated, timeBlockManagementController.create);
academicRouter.put("/time-blocks/:id", ensureAuthenticated, timeBlockManagementController.update);
academicRouter.delete("/time-blocks/:id", ensureAuthenticated, timeBlockManagementController.remove);
academicRouter.post("/schedule-slots", ensureAuthenticated, scheduleSlotManagementController.create);
academicRouter.put("/schedule-slots/:id", ensureAuthenticated, scheduleSlotManagementController.update);
academicRouter.delete("/schedule-slots/:id", ensureAuthenticated, scheduleSlotManagementController.remove);
academicRouter.post("/schedules/import", ensureAuthenticated, scheduleImportController.import);
