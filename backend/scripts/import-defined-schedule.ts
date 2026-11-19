import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";
import { managementService } from "../src/services/management.service";
import { prisma } from "../src/shared/prisma";
import { ScheduleImportInput } from "../src/dtos/management.dto";

const academicTerm = "2026.2";
const normalizedFile = path.resolve(__dirname, "..", "prisma", "data", `defined-schedule-${academicTerm}.json`);

interface SourceLesson {
  dia: string;
  periodo: string;
  disciplina: string;
  professor: string;
}

interface SourceGroup {
  turma: string;
  aulas: SourceLesson[];
}

interface CourseData {
  id: string;
  name: string;
  code: string;
  level: string;
}

interface NormalizedData {
  courses: CourseData[];
  classGroups: Array<{
    id: string; courseId: string; name: string; semesterPeriod: string;
    shift: string; academicTerm: string;
  }>;
  subjects: Array<{
    id: string; courseId: string; name: string; code: string; workloadHours: number | null;
  }>;
  professors: Array<{
    id: string; fullName: string; siape: string | null; email: string | null; active: boolean;
  }>;
  rooms: Array<{
    id: string; name: string; block: string | null; type: string | null; capacity: number | null;
  }>;
  timeBlocks: Array<{
    id: string; shift: string; orderIndex: number; startTime: string; endTime: string;
  }>;
  scheduleSlots: Array<{
    id: string; dayOfWeek: number; classGroupId: string; subjectId: string;
    professorId: string | null; roomId: string | null; timeBlockId: string;
  }>;
}

const courseDefinitions: Record<string, CourseData> = {
  ted: { id: "ted", name: "TED", code: "TED", level: "Técnico Integrado" },
  informatica: { id: "informatica", name: "Informática", code: "INFO", level: "Técnico Integrado" },
  im: { id: "im", name: "Instrumento Musical", code: "IM", level: "Técnico Integrado" },
  tce: { id: "tce", name: "Tecnologia em Construção de Edifícios", code: "TCE", level: "Tecnólogo" },
  ads: { id: "ads", name: "Análise e Desenvolvimento de Sistemas", code: "ADS", level: "Tecnólogo" },
  "eng-civil": {
    id: "eng-civil", name: "Engenharia Civil", code: "ENG-CIVIL", level: "Bacharelado"
  }
};

const weekdayNumbers: Record<string, number> = {
  "segunda-feira": 1,
  "terca-feira": 2,
  "quarta-feira": 3,
  "quinta-feira": 4,
  "sexta-feira": 5,
  sabado: 6
};

function normalizedKey(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ").trim().toLowerCase();
}

function stableId(prefix: string, value: string): string {
  const slug = normalizedKey(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  const hash = createHash("sha1").update(value).digest("hex").slice(0, 8);
  return `${prefix}-${slug || "item"}-${hash}`;
}

function titleCase(value: string): string {
  return value.toLocaleLowerCase("pt-BR").replace(/(^|[\s-])(\p{L})/gu, (_match, prefix, letter: string) =>
    `${prefix}${letter.toLocaleUpperCase("pt-BR")}`);
}

function findCourse(groupName: string): CourseData {
  const name = normalizedKey(groupName);
  if (name.includes("ted")) return courseDefinitions.ted;
  if (name.includes("informatica")) return courseDefinitions.informatica;
  if (name.includes("tce")) return courseDefinitions.tce;
  if (name.includes("ads")) return courseDefinitions.ads;
  if (name.includes("eng")) return courseDefinitions["eng-civil"];
  if (name.includes("ano im") || /\bim[ab]?\b/.test(name)) return courseDefinitions.im;
  throw new Error(`Não foi possível identificar o curso da turma "${groupName}".`);
}

function periodLabel(groupName: string): string {
  const match = groupName.match(/^(\d+)[º°]\s*(ANO|PER[IÍ]ODO)/i);
  if (match) return `${match[1]}º ${normalizedKey(match[2]) === "ano" ? "ano" : "período"}`;
  if (/optativas/i.test(groupName)) return "Optativas";
  throw new Error(`Não foi possível identificar o período da turma "${groupName}".`);
}

function parseTime(period: string): [string, string] {
  const matches = [...period.matchAll(/(\d{1,2})h(\d{2})/gi)];
  if (matches.length !== 2) throw new Error(`Período inválido: "${period}".`);
  return matches.map(match => {
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) throw new Error(`Horário fora do intervalo: "${period}".`);
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }) as [string, string];
}

function minutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function shiftForStart(startTime: string): string {
  const start = minutes(startTime);
  if (start < 12 * 60) return "matutino";
  if (start < 18 * 60) return "vespertino";
  return "noturno";
}

function parseSubject(value: string): { name: string; code: string } {
  const match = value.match(/^\s*(.*?)\s*\((.+)\)\s*$/);
  if (!match) return { name: value.trim(), code: value.trim() };
  return { code: match[1].trim(), name: match[2].trim() };
}

function primaryProfessor(value: string): string {
  return value.split("/")[0].trim();
}

async function loadSource(filePath: string): Promise<SourceGroup[]> {
  const source = await readFile(filePath, "utf8");
  const context = Object.create(null) as Record<string, unknown>;
  vm.runInNewContext(`${source}\nglobalThis.__scheduleData = horariosIFPB;`, context, {
    timeout: 1_000,
    filename: filePath
  });
  if (!Array.isArray(context.__scheduleData)) throw new Error("O script não exporta o array horariosIFPB.");
  return context.__scheduleData as SourceGroup[];
}

function normalize(source: SourceGroup[]): NormalizedData {
  const groups = new Map<string, NormalizedData["classGroups"][number]>();
  const subjects = new Map<string, NormalizedData["subjects"][number]>();
  const professors = new Map<string, NormalizedData["professors"][number]>();
  const timeBlockKeys = new Set<string>();
  const pendingSlots: Array<{
    dayOfWeek: number; classGroupId: string; subjectId: string;
    professorId: string; blockKey: string;
  }> = [];
  const courses = new Map<string, CourseData>();

  for (const group of source) {
    if (!group || typeof group.turma !== "string" || !Array.isArray(group.aulas)) {
      throw new Error("O script contém uma turma em formato inválido.");
    }
    const course = findCourse(group.turma);
    courses.set(course.id, course);
    const classGroupId = stableId("class", group.turma);
    const hasNightClass = group.aulas.some(lesson => {
      const [startTime] = parseTime(lesson.periodo);
      return shiftForStart(startTime) === "noturno";
    });
    const classGroup = {
      id: classGroupId,
      courseId: course.id,
      name: group.turma.trim(),
      semesterPeriod: periodLabel(group.turma),
      shift: hasNightClass ? "noturno" : "matutino",
      academicTerm
    };
    groups.set(classGroupId, classGroup);

    for (const lesson of group.aulas) {
      const dayOfWeek = weekdayNumbers[normalizedKey(lesson.dia)];
      if (!dayOfWeek) throw new Error(`Dia da semana inválido: "${lesson.dia}".`);
      const [startTime, endTime] = parseTime(lesson.periodo);
      if (startTime >= endTime) throw new Error(`Faixa de horário inválida: "${lesson.periodo}".`);
      const shift = shiftForStart(startTime);
      const blockKey = `${shift}|${startTime}|${endTime}`;
      timeBlockKeys.add(blockKey);

      const subject = parseSubject(lesson.disciplina);
      const subjectKey = `${course.id}|${normalizedKey(subject.name)}`;
      if (!subjects.has(subjectKey)) {
        subjects.set(subjectKey, {
          id: stableId("subject", subjectKey),
          courseId: course.id,
          name: subject.name,
          code: subject.code,
          workloadHours: null
        });
      }

      const professorName = primaryProfessor(lesson.professor);
      if (!professorName) throw new Error(`Aula sem docente: "${group.turma}" / "${lesson.disciplina}".`);
      const professorKey = normalizedKey(professorName);
      if (!professors.has(professorKey)) {
        professors.set(professorKey, {
          id: stableId("professor", professorKey),
          fullName: titleCase(professorName),
          siape: null,
          email: null,
          active: true
        });
      }
      pendingSlots.push({
        dayOfWeek,
        classGroupId,
        subjectId: subjects.get(subjectKey)!.id,
        professorId: professors.get(professorKey)!.id,
        blockKey
      });
    }
  }

  const timeBlocks = [...timeBlockKeys].map(key => {
    const [shift, startTime, endTime] = key.split("|");
    return { key, shift, startTime, endTime };
  }).sort((left, right) =>
    left.shift.localeCompare(right.shift) || left.startTime.localeCompare(right.startTime) ||
    left.endTime.localeCompare(right.endTime)
  );
  const orderIndexByKey = new Map<string, number>();
  const nextIndexByShift = new Map<string, number>();
  for (const block of timeBlocks) {
    const index = nextIndexByShift.get(block.shift) || 0;
    orderIndexByKey.set(block.key, index);
    nextIndexByShift.set(block.shift, index + 1);
  }
  const blocks = timeBlocks.map(block => ({
    id: stableId("time", block.key),
    shift: block.shift,
    orderIndex: orderIndexByKey.get(block.key)!,
    startTime: block.startTime,
    endTime: block.endTime
  }));
  const blockIds = new Map(timeBlocks.map(block => [block.key, stableId("time", block.key)]));
  const scheduleSlots = pendingSlots.map(slot => ({
    id: stableId("slot", `${slot.classGroupId}|${slot.dayOfWeek}|${slot.blockKey}`),
    dayOfWeek: slot.dayOfWeek,
    classGroupId: slot.classGroupId,
    subjectId: slot.subjectId,
    professorId: slot.professorId,
    roomId: null,
    timeBlockId: blockIds.get(slot.blockKey)!
  }));
  return {
    courses: [...courses.values()],
    classGroups: [...groups.values()],
    subjects: [...subjects.values()],
    professors: [...professors.values()],
    rooms: [],
    timeBlocks: blocks,
    scheduleSlots
  };
}

function countProfessorConflicts(data: NormalizedData): number {
  const blockById = new Map(data.timeBlocks.map(block => [block.id, block]));
  let conflicts = 0;
  for (let first = 0; first < data.scheduleSlots.length; first += 1) {
    const a = data.scheduleSlots[first];
    if (!a.professorId) continue;
    const aBlock = blockById.get(a.timeBlockId)!;
    for (let second = first + 1; second < data.scheduleSlots.length; second += 1) {
      const b = data.scheduleSlots[second];
      if (a.professorId !== b.professorId || a.dayOfWeek !== b.dayOfWeek) continue;
      const bBlock = blockById.get(b.timeBlockId)!;
      if (aBlock.startTime < bBlock.endTime && aBlock.endTime > bBlock.startTime) conflicts += 1;
    }
  }
  return conflicts;
}

function payloadForCourse(data: NormalizedData, course: CourseData): ScheduleImportInput {
  const classGroups = data.classGroups.filter(group => group.courseId === course.id);
  const groupIds = new Set(classGroups.map(group => group.id));
  const scheduleSlots = data.scheduleSlots.filter(slot => groupIds.has(slot.classGroupId));
  const subjectIds = new Set(scheduleSlots.map(slot => slot.subjectId));
  const professorIds = new Set(scheduleSlots.flatMap(slot => slot.professorId ? [slot.professorId] : []));
  const timeBlockIds = new Set(scheduleSlots.map(slot => slot.timeBlockId));
  return {
    courseId: course.id,
    academicTerm,
    allowProfessorConflicts: true,
    classGroups,
    subjects: data.subjects.filter(subject => subjectIds.has(subject.id)),
    professors: data.professors.filter(professor => professorIds.has(professor.id)),
    rooms: [],
    timeBlocks: data.timeBlocks.filter(block => timeBlockIds.has(block.id)),
    scheduleSlots
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const normalizedOnly = args.includes("--normalized");
  const sourcePath = args.find(argument => !argument.startsWith("--"));
  const data = normalizedOnly
    ? JSON.parse(await readFile(normalizedFile, "utf8")) as NormalizedData
    : normalize(await loadSource(sourcePath ||
      path.resolve(os.homedir(), "Downloads", "gemini-code-1795105478817.js")));
  const conflicts = countProfessorConflicts(data);
  console.log(
    `Prepared ${data.courses.length} courses, ${data.classGroups.length} class groups, ` +
    `${data.subjects.length} subjects, ${data.professors.length} professors, ` +
    `${data.timeBlocks.length} time blocks, and ${data.scheduleSlots.length} schedule slots.`
  );
  console.log(`${conflicts} overlapping professor assignment(s) will be retained. Multi-teacher entries use the first listed professor. No rooms were present in the source.`);

  if (dryRun) {
    console.log("Dry run complete; no database records were changed.");
    return;
  }

  await writeFile(normalizedFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  for (const course of data.courses) {
    await prisma.course.upsert({
      where: { id: course.id },
      create: course,
      update: { name: course.name, code: course.code, level: course.level }
    });
    const result = await managementService.importSchedule(payloadForCourse(data, course));
    console.log(
      `${course.code}: imported ${result.importedSlots} slots across ` +
      `${result.replacedClassGroups} groups; ${result.professorConflictCount} professor overlaps retained.`
    );
  }

  console.log(`Normalized source saved to ${normalizedFile}.`);
}

main()
  .catch(error => {
    console.error("Defined schedule import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
