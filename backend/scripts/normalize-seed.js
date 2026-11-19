"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..", "..");
const seedPath = path.join(projectRoot, "frontend", "js", "seed-data.js");
const outputDirectory = path.join(projectRoot, "backend", "prisma", "data");
const academicTerm = "2026.2";

const courseDefinitions = [
  { id: "ted", name: "TED", code: "TED", level: "Técnico Integrado" },
  { id: "informatica", name: "Informática", code: "INFO", level: "Técnico Integrado" },
  { id: "im", name: "Instrumento Musical", code: "IM", level: "Técnico Integrado" },
  { id: "tce", name: "Tecnologia em Construção de Edifícios", code: "TCE", level: "Tecnólogo" },
  { id: "ads", name: "Análise e Desenvolvimento de Sistemas", code: "ADS", level: "Tecnólogo" },
  { id: "eng-civil", name: "Engenharia Civil", code: "ENG-CIVIL", level: "Bacharelado" }
];

const shiftOrder = { matutino: 0, vespertino: 1, noturno: 2 };
const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
const slug = value => normalize(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const displayName = value => value.toLocaleLowerCase("pt-BR").split(/(\s+)/).map(part =>
  part.trim() ? part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1) : part
).join("");
const timeToMinutes = value => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

function readSeed() {
  const source = fs.readFileSync(seedPath, "utf8");
  const sandbox = Object.create(null);
  vm.runInNewContext(`${source}\nglobalThis.__seed = IMPORTED_HORARIOS;`, sandbox, {
    filename: seedPath,
    timeout: 5000
  });
  if (!Array.isArray(sandbox.__seed)) {
    throw new Error("O seed deve definir a lista IMPORTED_HORARIOS.");
  }
  return sandbox.__seed;
}

function courseForClass(name) {
  const normalized = normalize(name);
  if (normalized.includes("TED")) return "ted";
  if (normalized.includes("INFORMATICA")) return "informatica";
  if (/\bIM(?:A|B)?\b/.test(normalized)) return "im";
  if (normalized.includes("TCE")) return "tce";
  if (normalized.includes("ADS")) return "ads";
  if (normalized.includes("ENG") && normalized.includes("CIVIL")) return "eng-civil";
  throw new Error(`Não foi possível identificar o curso da turma "${name}".`);
}

function parsePeriod(name) {
  const match = normalize(name).match(/(\d+)\s*º?\s*(ANO|PERIODO)/);
  if (!match) {
    if (normalize(name).includes("OPTATIVAS")) return "Optativas";
    throw new Error(`Não foi possível identificar o período da turma "${name}".`);
  }
  return `${match[1]}º ${match[2] === "ANO" ? "ano" : "período"}`;
}

function parseLesson(lesson) {
  const times = lesson.periodo.match(/(\d{1,2})h(\d{2})/g);
  if (!times || times.length !== 2) {
    throw new Error(`Faixa de horário inválida: "${lesson.periodo}".`);
  }
  const toTime = value => {
    const match = value.match(/(\d{1,2})h(\d{2})/);
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) throw new Error(`Horário inválido: "${value}".`);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };
  const startTime = toTime(times[0]);
  const endTime = toTime(times[1]);
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    throw new Error(`A faixa deve terminar após iniciar: "${lesson.periodo}".`);
  }

  const hour = Number(startTime.slice(0, 2));
  const shift = hour >= 18 ? "noturno" : hour >= 12 ? "vespertino" : "matutino";
  const day = new Map([
    ["SEGUNDA-FEIRA", 1], ["TERCA-FEIRA", 2], ["QUARTA-FEIRA", 3],
    ["QUINTA-FEIRA", 4], ["SEXTA-FEIRA", 5], ["SABADO", 6]
  ]).get(normalize(lesson.dia));
  if (!day) throw new Error(`Dia da semana inválido: "${lesson.dia}".`);

  const canonicalSubjectName = lesson.disciplina.match(/\(([^()]*)\)\s*$/)?.[1].trim() ||
    lesson.disciplina.trim();
  const sourceCode = lesson.disciplina.match(/^([^()]*)\s*\(/)?.[1].trim() ||
    canonicalSubjectName;
  const professors = lesson.professor.split("/").map(name => name.trim()).filter(name => {
    const normalized = normalize(name);
    return normalized && normalized !== "SUBS INFO" && normalized !== "ENG NOVO";
  }).map(displayName);

  return { day, startTime, endTime, shift, canonicalSubjectName, sourceCode, professors };
}

function assertUniqueIds(name, records) {
  const seen = new Set();
  for (const record of records) {
    if (!record.id || seen.has(record.id)) throw new Error(`${name} contém ID ausente ou duplicado: ${record.id}`);
    seen.add(record.id);
  }
  return seen;
}

function buildData(seed) {
  const courses = courseDefinitions;
  const courseIds = new Set(courses.map(course => course.id));
  const classes = new Map();
  const subjects = new Map();
  const professors = new Map();
  const timeBlocks = new Map();
  const pendingSlots = [];
  const seenSlots = new Set();

  for (const sourceClass of seed) {
    if (!sourceClass || typeof sourceClass.turma !== "string" || !Array.isArray(sourceClass.aulas)) {
      throw new Error("Cada registro do seed precisa conter turma e lista aulas.");
    }

    const courseId = courseForClass(sourceClass.turma);
    if (!courseIds.has(courseId)) throw new Error(`Curso inexistente para "${sourceClass.turma}".`);
    const classId = `class-${slug(sourceClass.turma)}`;
    if (!classes.has(classId)) {
      classes.set(classId, {
        id: classId,
        course_id: courseId,
        name: sourceClass.turma,
        semester_period: parsePeriod(sourceClass.turma),
        shift: null,
        academic_term: academicTerm
      });
    }

    for (const lesson of sourceClass.aulas) {
      if (!lesson || typeof lesson.disciplina !== "string" || typeof lesson.professor !== "string") {
        throw new Error(`Aula inválida na turma "${sourceClass.turma}".`);
      }
      const parsed = parseLesson(lesson);
      const classGroup = classes.get(classId);
      if (!classGroup.shift) classGroup.shift = parsed.shift;

      const subjectKey = `${courseId}|${normalize(parsed.canonicalSubjectName)}`;
      if (!subjects.has(subjectKey)) {
        const id = `subject-${courseId}-${slug(parsed.canonicalSubjectName)}`;
        subjects.set(subjectKey, {
          id,
          course_id: courseId,
          name: parsed.canonicalSubjectName,
          code: parsed.sourceCode,
          workload_hours: null
        });
      }
      const subjectId = subjects.get(subjectKey).id;

      const timeBlockKey = `${parsed.shift}|${parsed.startTime}|${parsed.endTime}`;
      if (!timeBlocks.has(timeBlockKey)) {
        timeBlocks.set(timeBlockKey, {
          id: `time-${parsed.shift}-${parsed.startTime.replace(":", "")}-${parsed.endTime.replace(":", "")}`,
          shift: parsed.shift,
          order_index: null,
          start_time: parsed.startTime,
          end_time: parsed.endTime
        });
      }

      const professorIds = [...new Set(parsed.professors)].map(fullName => {
        const id = `professor-${slug(fullName)}`;
        if (!professors.has(id)) {
          professors.set(id, { id, full_name: fullName, siape: null, email: null, active: true });
        }
        return id;
      });
      const teachersForSlot = professorIds.length ? professorIds : [null];
      for (const professorId of teachersForSlot) {
        const slotKey = [
          parsed.day, classId, subjectId, professorId || "", parsed.startTime, parsed.endTime
        ].join("|");
        if (seenSlots.has(slotKey)) continue;
        seenSlots.add(slotKey);
        pendingSlots.push({
          day_of_week: parsed.day,
          class_group_id: classId,
          subject_id: subjectId,
          professor_id: professorId,
          room_id: null,
          time_block_key: timeBlockKey
        });
      }
    }
  }

  const sortedBlocks = [...timeBlocks.values()].sort((a, b) =>
    shiftOrder[a.shift] - shiftOrder[b.shift] ||
    timeToMinutes(a.start_time) - timeToMinutes(b.start_time) ||
    timeToMinutes(a.end_time) - timeToMinutes(b.end_time)
  );
  const blockIds = new Map();
  const nextOrder = new Map();
  sortedBlocks.forEach(block => {
    block.order_index = nextOrder.get(block.shift) || 0;
    nextOrder.set(block.shift, block.order_index + 1);
    blockIds.set(`${block.shift}|${block.start_time}|${block.end_time}`, block.id);
  });

  const scheduleSlots = pendingSlots.map((slot, index) => ({
    id: `schedule-${String(index + 1).padStart(6, "0")}`,
    day_of_week: slot.day_of_week,
    class_group_id: slot.class_group_id,
    subject_id: slot.subject_id,
    professor_id: slot.professor_id,
    room_id: slot.room_id,
    time_block_id: blockIds.get(slot.time_block_key)
  }));
  const classGroups = [...classes.values()];
  const subjectList = [...subjects.values()];
  const professorList = [...professors.values()];
  const rooms = [];

  const courseIdSet = assertUniqueIds("courses", courses);
  const classIdSet = assertUniqueIds("class_groups", classGroups);
  const subjectIdSet = assertUniqueIds("subjects", subjectList);
  const professorIdSet = assertUniqueIds("professors", professorList);
  const roomIdSet = assertUniqueIds("rooms", rooms);
  const timeBlockIdSet = assertUniqueIds("time_blocks", sortedBlocks);
  assertUniqueIds("schedule_slots", scheduleSlots);

  for (const record of classGroups) {
    if (!courseIdSet.has(record.course_id)) throw new Error(`Turma ${record.id} referencia curso inexistente.`);
  }
  for (const record of subjectList) {
    if (!courseIdSet.has(record.course_id)) throw new Error(`Disciplina ${record.id} referencia curso inexistente.`);
  }
  for (const slot of scheduleSlots) {
    if (!classIdSet.has(slot.class_group_id)) throw new Error(`Horário ${slot.id} referencia turma inexistente.`);
    if (!subjectIdSet.has(slot.subject_id)) throw new Error(`Horário ${slot.id} referencia disciplina inexistente.`);
    if (slot.professor_id !== null && !professorIdSet.has(slot.professor_id)) {
      throw new Error(`Horário ${slot.id} referencia professor inexistente.`);
    }
    if (slot.room_id !== null && !roomIdSet.has(slot.room_id)) {
      throw new Error(`Horário ${slot.id} referencia sala inexistente.`);
    }
    if (!timeBlockIdSet.has(slot.time_block_id)) throw new Error(`Horário ${slot.id} referencia faixa inexistente.`);
  }

  return {
    courses,
    class_groups: classGroups,
    subjects: subjectList,
    professors: professorList,
    rooms,
    time_blocks: sortedBlocks,
    schedule_slots: scheduleSlots
  };
}

function main() {
  const data = buildData(readSeed());
  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const [name, records] of Object.entries(data)) {
    fs.writeFileSync(path.join(outputDirectory, `${name}.json`), `${JSON.stringify(records, null, 2)}\n`);
  }
  console.log("Seed normalizado e validado:");
  for (const [name, records] of Object.entries(data)) {
    console.log(`- ${name}.json: ${records.length} registro(s)`);
  }
  console.log("Integridade referencial: OK");
}

main();
