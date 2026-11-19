import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const dataDirectory = path.resolve(__dirname, "data");

const seedSchemas = {
  courses: z.object({ id: z.string(), name: z.string(), code: z.string(), level: z.string() }),
  classGroups: z.object({
    id: z.string(), course_id: z.string(), name: z.string(), semester_period: z.string(),
    shift: z.string(), academic_term: z.string()
  }),
  subjects: z.object({
    id: z.string(), course_id: z.string(), name: z.string(), code: z.string(),
    workload_hours: z.number().int().nullable()
  }),
  professors: z.object({
    id: z.string(), full_name: z.string(), siape: z.string().nullable(),
    email: z.string().nullable(), active: z.boolean()
  }),
  rooms: z.object({
    id: z.string(), name: z.string(), block: z.string().nullable(), type: z.string().nullable(),
    capacity: z.number().int().nullable()
  }),
  timeBlocks: z.object({
    id: z.string(), shift: z.string(), order_index: z.number().int(),
    start_time: z.string(), end_time: z.string()
  }),
  scheduleSlots: z.object({
    id: z.string(), day_of_week: z.number().int().min(1).max(6), class_group_id: z.string(),
    subject_id: z.string(), professor_id: z.string().nullable(), room_id: z.string().nullable(),
    time_block_id: z.string()
  })
};

async function load<T>(fileName: string, schema: z.ZodType<T>): Promise<T[]> {
  const contents = await readFile(path.join(dataDirectory, fileName), "utf8");
  const value: unknown = JSON.parse(contents);
  return z.array(schema).parse(value);
}

async function main(): Promise<void> {
  const courses = await load("courses.json", seedSchemas.courses);
  const classGroups = await load("class_groups.json", seedSchemas.classGroups);
  const subjects = await load("subjects.json", seedSchemas.subjects);
  const professors = await load("professors.json", seedSchemas.professors);
  const rooms = await load("rooms.json", seedSchemas.rooms);
  const timeBlocks = await load("time_blocks.json", seedSchemas.timeBlocks);
  const scheduleSlots = await load("schedule_slots.json", seedSchemas.scheduleSlots);

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@hifpb.local").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD must be configured with at least 12 characters.");
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, passwordHash, role: "ADMIN", active: true },
    update: { passwordHash, role: "ADMIN", active: true }
  });

  if (process.argv.includes("--admin-only")) {
    console.log(`Administrator account ready for ${adminEmail}.`);
    return;
  }

  assertScheduleConstraints(scheduleSlots);

  for (const row of courses) {
    await prisma.course.upsert({
      where: { id: row.id },
      create: row,
      update: { name: row.name, code: row.code, level: row.level }
    });
  }
  for (const row of classGroups) {
    const data = {
      courseId: row.course_id,
      name: row.name,
      semesterPeriod: row.semester_period,
      shift: row.shift,
      academicTerm: row.academic_term
    };
    await prisma.classGroup.upsert({
      where: { id: row.id },
      create: { id: row.id, ...data },
      update: data
    });
  }
  for (const row of subjects) {
    const data = {
      courseId: row.course_id,
      name: row.name,
      code: row.code,
      workloadHours: row.workload_hours
    };
    await prisma.subject.upsert({
      where: { id: row.id },
      create: { id: row.id, ...data },
      update: data
    });
  }
  for (const row of professors) {
    const data = {
      fullName: row.full_name,
      siape: row.siape,
      email: row.email,
      active: row.active
    };
    await prisma.professor.upsert({
      where: { id: row.id },
      create: { id: row.id, ...data },
      update: data
    });
  }
  for (const row of rooms) {
    const data = { name: row.name, block: row.block, type: row.type, capacity: row.capacity };
    await prisma.room.upsert({
      where: { id: row.id },
      create: { id: row.id, ...data },
      update: data
    });
  }
  for (const row of timeBlocks) {
    const data = {
      shift: row.shift,
      orderIndex: row.order_index,
      startTime: row.start_time,
      endTime: row.end_time
    };
    await prisma.timeBlock.upsert({
      where: { id: row.id },
      create: { id: row.id, ...data },
      update: data
    });
  }
  for (const row of scheduleSlots) {
    const data = {
      dayOfWeek: row.day_of_week,
      classGroupId: row.class_group_id,
      subjectId: row.subject_id,
      professorId: row.professor_id,
      roomId: row.room_id,
      timeBlockId: row.time_block_id
    };
    await prisma.scheduleSlot.upsert({
      where: { id: row.id },
      create: { id: row.id, ...data },
      update: data
    });
  }

  console.log(`Seed imported: ${courses.length} courses, ${classGroups.length} class groups, ${subjects.length} subjects, ${professors.length} professors, ${rooms.length} rooms, ${timeBlocks.length} time blocks, ${scheduleSlots.length} schedule slots.`);
}

function assertScheduleConstraints(slots: Array<{
  id: string;
  day_of_week: number;
  class_group_id: string;
  professor_id: string | null;
  room_id: string | null;
  time_block_id: string;
}>): void {
  const keys = new Map<string, string>();
  const conflicts: string[] = [];
  for (const slot of slots) {
    const uniqueValues: Array<[string, string | null]> = [
      ["professor", slot.professor_id],
      ["room", slot.room_id],
      ["class group", slot.class_group_id]
    ];
    for (const [resource, value] of uniqueValues) {
      if (value === null) continue;
      const key = `${resource}|${slot.day_of_week}|${slot.time_block_id}|${value}`;
      const previousId = keys.get(key);
      if (previousId) {
        conflicts.push(`${resource} conflict between slots ${previousId} and ${slot.id}`);
      } else {
        keys.set(key, slot.id);
      }
    }
  }
  if (conflicts.length) {
    throw new Error(
      `Seed has ${conflicts.length} ScheduleSlot uniqueness conflict(s); no academic records were written. ` +
      conflicts.slice(0, 10).join("; ")
    );
  }
}

main()
  .catch(error => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
