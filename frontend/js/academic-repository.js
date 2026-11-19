/**
 * HIFPB Monteiro — Sistema de Consulta de Horários Acadêmicos
 * Dados institucionais importados da planilha do Campus Monteiro
 * Semestre Letivo: 2026.2
 */

function buildImportedAcademicData() {
  const courseDefinitions = [
    { id: "ted", code: "TED", name: "TED" },
    { id: "informatica", code: "INFO", name: "Inform\u00e1tica" },
    { id: "im", code: "IM", name: "Instrumento Musical" },
    { id: "tce", code: "TCE", name: "Tecnologia em Constru\u00e7\u00e3o de Edif\u00edcios" },
    { id: "ads", code: "ADS", name: "An\u00e1lise e Desenvolvimento de Sistemas" },
    { id: "eng-civil", code: "ENG-CIVIL", name: "Engenharia Civil" }
  ];
  const classes = new Map();
  const teachers = new Map();
  const disciplines = new Map();
  const pendingSchedules = [];
  const dayIds = new Map([
    ["segunda-feira", 1], ["terca-feira", 2], ["quarta-feira", 3],
    ["quinta-feira", 4], ["sexta-feira", 5], ["sabado", 6]
  ]);
  const shiftDetails = {
    matutino: { id: "matutino", name: "Matutino", prefix: "M" },
    vespertino: { id: "vespertino", name: "Vespertino", prefix: "V" },
    noturno: { id: "noturno", name: "Noturno", prefix: "N" }
  };
  const intervals = new Map(Object.keys(shiftDetails).map(shift => [shift, new Map()]));
  const fixedMorningIntervals = [
    { startTime: "07:00", endTime: "07:50" },
    { startTime: "07:50", endTime: "08:40" },
    { startTime: "09:00", endTime: "09:50" },
    { startTime: "09:50", endTime: "10:40" },
    { startTime: "10:40", endTime: "11:30" },
    { startTime: "11:30", endTime: "12:20" }
  ];
  const fixedAfternoonIntervals = [
    { startTime: "13:00", endTime: "13:50" },
    { startTime: "13:50", endTime: "14:40" },
    { startTime: "14:40", endTime: "15:30" },
    { startTime: "15:40", endTime: "16:30" },
    { startTime: "16:30", endTime: "17:20" },
    { startTime: "17:20", endTime: "18:10" }
  ];
  const fixedNightIntervals = [
    { startTime: "18:30", endTime: "19:20" },
    { startTime: "19:20", endTime: "20:10" },
    { startTime: "20:30", endTime: "21:20" },
    { startTime: "21:20", endTime: "22:10" }
  ];
  const fixedIntervalsByShift = {
    matutino: fixedMorningIntervals,
    vespertino: fixedAfternoonIntervals,
    noturno: fixedNightIntervals
  };
  Object.entries(fixedIntervalsByShift).forEach(([shift, fixedIntervals]) => {
    fixedIntervals.forEach(interval => {
      intervals.get(shift).set(
        interval.startTime + "|" + interval.endTime,
        interval
      );
    });
  });
  const themes = { ted: "amber", informatica: "emerald", im: "purple", tce: "orange", ads: "cyan", "eng-civil": "blue" };
  const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const slug = value => normalize(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const displayName = value => value.toLocaleLowerCase("pt-BR").split(/(\s+)/).map(part =>
    part.trim() ? part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1) : part
  ).join("");
  const courseForClass = name => {
    const normalized = normalize(name);
    if (normalized.includes("TED")) return "ted";
    if (normalized.includes("INFORMATICA")) return "informatica";
    if (/\bIM(?:A|B)?\b/.test(normalized)) return "im";
    if (normalized.includes("TCE")) return "tce";
    if (normalized.includes("ADS")) return "ads";
    if (normalized.includes("ENG") && normalized.includes("CIVIL")) return "eng-civil";
    throw new Error("Curso nao identificado para a turma: " + name);
  };
  const periodForClass = name => {
    const match = normalize(name).match(/\d+\s*(?:ANO|PERIODO)/i);
    if (match) return match[0];
    const normalized = normalize(name);
    return normalized.includes("OPTATIVAS") ? "Optativas" : name;
  };
  const teacherIdsForLesson = value => value.split("/").map(name => name.trim()).filter(name => {
    const normalized = normalize(name);
    return normalized && normalized !== "SUBS INFO" && normalized !== "ENG NOVO";
  }).map(name => {
    const normalized = displayName(name);
    const id = "teacher-" + slug(normalized);
    if (!teachers.has(id)) {
      teachers.set(id, { id, name: normalized, title: "Docente", department: "", email: "", areas: [] });
    }
    return id;
  }).filter((id, index, list) => list.indexOf(id) === index);

  IMPORTED_HORARIOS.forEach(sourceClass => {
    const courseId = courseForClass(sourceClass.turma);
    const classId = "class-" + slug(sourceClass.turma);
    const classRecord = {
      id: classId,
      code: sourceClass.turma,
      name: sourceClass.turma,
      courseId,
      period: periodForClass(sourceClass.turma),
      shiftIds: new Set()
    };
    classes.set(classId, classRecord);

    sourceClass.aulas.forEach(lesson => {
      const times = lesson.periodo.match(/(\d{1,2})h(\d{2})/g);
      if (!times || times.length !== 2) throw new Error("Faixa de horario invalida: " + lesson.periodo);
      const parseTime = value => {
        const match = value.match(/(\d{1,2})h(\d{2})/);
        return match[1].padStart(2, "0") + ":" + match[2];
      };
      const timeToMinutes = value => {
        const [hours, minutes] = value.split(":").map(Number);
        return (hours * 60) + minutes;
      };
      const minutesToTime = value => {
        const hours = String(Math.floor(value / 60)).padStart(2, "0");
        const minutes = String(value % 60).padStart(2, "0");
        return `${hours}:${minutes}`;
      };
      const startTime = parseTime(times[0]);
      const endTime = parseTime(times[1]);
      const shift = Number(startTime.slice(0, 2)) >= 18 ? "noturno" :
        Number(startTime.slice(0, 2)) >= 12 ? "vespertino" : "matutino";
      const day = dayIds.get(normalize(lesson.dia).toLowerCase());
      if (!day) throw new Error("Dia da semana invalido: " + lesson.dia);
      const teacherIds = teacherIdsForLesson(lesson.professor);
      const canonicalDisciplineName = lesson.disciplina.match(/\(([^()]*)\)\s*$/)?.[1].trim() || lesson.disciplina.trim();
      const disciplineKey = [courseId, normalize(canonicalDisciplineName)].join("|");

      if (!disciplines.has(disciplineKey)) {
        disciplines.set(disciplineKey, {
          id: "disc-imported-" + String(disciplines.size + 1).padStart(3, "0"),
          name: canonicalDisciplineName,
          ch: "",
          tag: courseId,
          courseId,
          classIds: [],
          teacherIds: [],
          teacherAssignments: []
        });
      }
      const discipline = disciplines.get(disciplineKey);
      if (!discipline.classIds.includes(classId)) discipline.classIds.push(classId);
      let assignment = discipline.teacherAssignments.find(item => item.classId === classId);
      if (!assignment) {
        assignment = { classId, teacherIds: [] };
        discipline.teacherAssignments.push(assignment);
      }
      assignment.teacherIds = [...new Set([...assignment.teacherIds, ...teacherIds])];
      discipline.teacherIds = [...new Set([...discipline.teacherIds, ...teacherIds])];
      discipline.teacherId = discipline.teacherIds.length === 1 ? discipline.teacherIds[0] : undefined;
      const disciplineId = discipline.id;
      teacherIds.forEach(teacherId => {
        const teacher = teachers.get(teacherId);
        if (!teacher.areas.includes(lesson.disciplina)) teacher.areas.push(lesson.disciplina);
      });

      classRecord.shiftIds.add(shift);
      const intervalKey = startTime + "|" + endTime;
      if (!fixedIntervalsByShift[shift]) {
        intervals.get(shift).set(intervalKey, { startTime, endTime });
      }
      const coveredIntervals = fixedIntervalsByShift[shift].filter(interval =>
        interval.startTime >= startTime && interval.endTime <= endTime
      );
      coveredIntervals.forEach(interval => {
        pendingSchedules.push({
          id: "schedule-imported-" + String(pendingSchedules.length + 1).padStart(3, "0"),
          day,
          shift,
          startTime: interval.startTime,
          endTime: interval.endTime,
          disciplineId,
          disciplineName: lesson.disciplina,
          courseId,
          classId,
          teacherIds,
          teacherId: teacherIds.length === 1 ? teacherIds[0] : undefined,
          theme: themes[courseId],
          obs: ""
        });
      });
    });
  });

  const shifts = Object.values(shiftDetails).map(shift => {
    const slots = [...intervals.get(shift.id).values()].sort((a, b) =>
      a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime)
    ).map((interval, index) => ({
      id: shift.prefix + (index + 1),
      index,
      label: (index + 1) + "\u00ba Hor\u00e1rio",
      time: interval.startTime + " - " + interval.endTime,
      start: interval.startTime,
      end: interval.endTime
    }));
    return { id: shift.id, name: shift.name, slots };
  });
  const slotIds = new Map();
  shifts.forEach(shift => shift.slots.forEach(slot => {
    slotIds.set(shift.id + "|" + slot.start + "|" + slot.end, slot.id);
  }));
  const schedules = pendingSchedules.map(schedule => ({
    ...schedule,
    slotStart: slotIds.get(schedule.shift + "|" + schedule.startTime + "|" + schedule.endTime),
    slotSpan: 1
  }));
  const courses = courseDefinitions.map(course => {
    const shiftIds = [...new Set([...classes.values()].filter(item => item.courseId === course.id)
      .flatMap(item => [...item.shiftIds]))];
    return {
      ...course,
      level: "Curso",
      duration: "",
      shiftDefault: shiftIds.map(id => shiftDetails[id].name).join(" / "),
      description: ""
    };
  });
  const classList = [...classes.values()].map(item => ({
    id: item.id,
    code: item.code,
    name: item.name,
    courseId: item.courseId,
    period: item.period,
    shift: [...item.shiftIds][0]
  }));

  return {
    meta: {
      institution: "Instituto Federal de Educa\u00e7\u00e3o, Ci\u00eancia e Tecnologia da Para\u00edba",
      systemName: "HIFPB Monteiro \u2014 Hor\u00e1rio Acad\u00eamico",
      campus: "Campus Monteiro",
      semester: "2026.2",
      lastUpdate: "16 de Novembro de 2026",
      version: "3.0.5-intervalos-originais-distintos",
      disclaimer: "Hor\u00e1rios importados da planilha fornecida para consulta acad\u00eamica do Campus Monteiro."
    },
    weekDays: [
      { id: 1, name: "Segunda-feira", short: "Seg", abbrev: "SEG" },
      { id: 2, name: "Ter\u00e7a-feira", short: "Ter", abbrev: "TER" },
      { id: 3, name: "Quarta-feira", short: "Qua", abbrev: "QUA" },
      { id: 4, name: "Quinta-feira", short: "Qui", abbrev: "QUI" },
      { id: 5, name: "Sexta-feira", short: "Sex", abbrev: "SEX" },
      { id: 6, name: "S\u00e1bado", short: "S\u00e1b", abbrev: "S\u00c1B" }
    ],
    shifts,
    courses,
    classes: classList,
    teachers: [...teachers.values()],
    disciplines: [...disciplines.values()],
    schedules
  };
}

const ACADEMIC_DATA = buildImportedAcademicData();

function getScheduleTeacherIds(schedule) {
  if (Array.isArray(schedule.teacherIds)) return schedule.teacherIds;
  return schedule.teacherId ? [schedule.teacherId] : [];
}

function getDisciplineTeacherIds(discipline, classId) {
  const assignment = Array.isArray(discipline.teacherAssignments)
    ? discipline.teacherAssignments.find(item => item.classId === classId)
    : null;
  if (assignment) return assignment.teacherIds;
  if (Array.isArray(discipline.teacherIds)) return discipline.teacherIds;
  return discipline.teacherId ? [discipline.teacherId] : [];
}

const DataService = {
  getMeta: () => ACADEMIC_DATA.meta,
  getWeekDays: () => ACADEMIC_DATA.weekDays,
  getShifts: () => ACADEMIC_DATA.shifts,
  getCourses: () => ACADEMIC_DATA.courses,
  getClasses: () => ACADEMIC_DATA.classes,
  getTeachers: () => ACADEMIC_DATA.teachers,
  getDisciplines: () => ACADEMIC_DATA.disciplines,
  getAllSchedules: () => ACADEMIC_DATA.schedules,

  // Buscas por ID
  getCourseById: (id) => ACADEMIC_DATA.courses.find(c => c.id === id),
  getClassById: (id) => ACADEMIC_DATA.classes.find(c => c.id === id),
  getTeacherById: (id) => ACADEMIC_DATA.teachers.find(t => t.id === id),
  getDisciplineById: (id) => ACADEMIC_DATA.disciplines.find(d => d.id === id),

  // Consulta por Categoria Principal
  getByCategory: (category, id) => {
    switch (category) {
      case "turma":
        return ACADEMIC_DATA.schedules.filter(s => s.classId === id);
      case "curso":
        return ACADEMIC_DATA.schedules.filter(s => s.courseId === id);
      case "professor":
        return ACADEMIC_DATA.schedules.filter(s => getScheduleTeacherIds(s).includes(id));
      default:
        return [];
    }
  },

  // Retorna entidade com seus metadados para exibição no cabeçalho dos resultados
  getEntityInfo: (category, id) => {
    if (category === "turma") {
      const cls = DataService.getClassById(id);
      if (!cls) return null;
      const course = DataService.getCourseById(cls.courseId);
      return {
        title: cls.name,
        subtitle: `${course ? course.name : ''} • Turno: ${cls.shift.charAt(0).toUpperCase() + cls.shift.slice(1)}`,
        badge: cls.period,
        details: [
          { label: "Curso", value: course ? course.name : "—" },
          { label: "Turno Principal", value: cls.shift.charAt(0).toUpperCase() + cls.shift.slice(1) },
          { label: "Período", value: cls.period }
        ],
        raw: cls
      };
    }
    if (category === "curso") {
      const crs = DataService.getCourseById(id);
      if (!crs) return null;
      const classes = ACADEMIC_DATA.classes.filter(c => c.courseId === id);
      return {
        title: crs.name,
        subtitle: [crs.level, `Cód: ${crs.code}`, crs.duration].filter(Boolean).join(" • "),
        badge: crs.code,
        details: [
          { label: "Modalidade", value: crs.level },
          { label: "Duração", value: crs.duration || "Não informado" },
          { label: "Turno(s)", value: crs.shiftDefault },
          { label: "Turmas Ativas", value: `${classes.length} turmas cadastradas` }
        ],
        raw: crs
      };
    }
    if (category === "professor") {
      const prof = DataService.getTeacherById(id);
      if (!prof) return null;
      return {
        title: prof.name,
        subtitle: `${prof.title || "Docente"} • ${prof.department || "Campus Monteiro"}`,
        badge: "Docente",
        details: [
          { label: "Titulação", value: prof.title },
          { label: "Departamento", value: prof.department || "Não informado" },
          { label: "E-mail Acadêmico", value: prof.email || "Não informado" },
          { label: "Áreas", value: prof.areas.join(", ") }
        ],
        raw: prof
      };
    }
    return null;
  },

  // Adicionar novo horário acadêmico
  addSchedule: (item) => {
    if (!item.id) {
      item.id = "sch-custom-" + Date.now();
    }
    item.isCustom = true;
    ACADEMIC_DATA.schedules.push(item);
    DataService.saveCustomSchedules();
    return item;
  },

  // Gestão de Disciplinas: Adicionar
  addDiscipline: (disciplineData) => {
    const normalizedName = disciplineData.name.trim().toLocaleLowerCase("pt-BR");
    const duplicate = ACADEMIC_DATA.disciplines.some(
      discipline => discipline.name.trim().toLocaleLowerCase("pt-BR") === normalizedName
    );
    if (duplicate) {
      return { success: false, reason: "Já existe uma disciplina com esse nome." };
    }

    const discipline = {
      ...disciplineData,
      id: disciplineData.id || "disc-custom-" + Date.now(),
      name: disciplineData.name.trim(),
      isCustom: true
    };
    ACADEMIC_DATA.disciplines.push(discipline);
    DataService.saveCustomDisciplines();
    return { success: true, discipline };
  },

  updateDiscipline: (disciplineId, updates) => {
    const discipline = ACADEMIC_DATA.disciplines.find(item => item.id === disciplineId);
    if (!discipline) {
      return { success: false, reason: "Disciplina não encontrada no sistema." };
    }

    const workload = Number(updates.workload);
    if (!Number.isInteger(workload) || workload < 1) {
      return { success: false, reason: "Informe uma carga horária válida, em horas inteiras." };
    }
    if (!DataService.getTeacherById(updates.teacherId)) {
      return { success: false, reason: "Selecione um professor cadastrado." };
    }

    discipline.ch = `${workload}h`;
    discipline.tag = String(updates.tag || "geral").trim() || "geral";
    discipline.teacherId = updates.teacherId;
    discipline.teacherIds = [updates.teacherId];
    if (Array.isArray(discipline.classIds)) {
      discipline.teacherAssignments = discipline.classIds.map(classId => ({
        classId,
        teacherIds: [updates.teacherId]
      }));
    }

    ACADEMIC_DATA.schedules.forEach(schedule => {
      if (schedule.disciplineId === disciplineId) {
        schedule.teacherId = updates.teacherId;
        schedule.teacherIds = [updates.teacherId];
      }
    });

    DataService.saveCustomDisciplines();
    DataService.saveCustomSchedules();
    return { success: true, discipline };
  },

  deleteDiscipline: (disciplineId) => {
    const discipline = ACADEMIC_DATA.disciplines.find(item => item.id === disciplineId);
    if (!discipline) {
      return { success: false, reason: "Disciplina não encontrada no sistema." };
    }

    const linkedSchedules = ACADEMIC_DATA.schedules.filter(schedule => schedule.disciplineId === disciplineId);
    if (linkedSchedules.length > 0) {
      return {
        success: false,
        reason: `A disciplina está vinculada a ${linkedSchedules.length} horário(s). Remova esses horários antes de excluir a disciplina.`,
        linkedSchedules
      };
    }

    ACADEMIC_DATA.disciplines = ACADEMIC_DATA.disciplines.filter(item => item.id !== disciplineId);
    DataService.saveCustomDisciplines();
    return { success: true, discipline };
  },

  // Salvar disciplinas customizadas no localStorage
  saveCustomDisciplines: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      HIFPBStorage.setJson(HIFPBStorage.keys.allDisciplines, ACADEMIC_DATA.disciplines);
      const custom = ACADEMIC_DATA.disciplines.filter(
        discipline => discipline.isCustom || (discipline.id && discipline.id.startsWith("disc-custom-"))
      );
      HIFPBStorage.setJson(HIFPBStorage.keys.customDisciplines, custom);
    }
  },

  // Carregar disciplinas customizadas do localStorage
  loadCustomDisciplines: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const storedAll = HIFPBStorage.get(HIFPBStorage.keys.allDisciplines);
        if (storedAll) {
          const list = JSON.parse(storedAll);
          if (Array.isArray(list) && list.length > 0) {
            ACADEMIC_DATA.disciplines = list;
            return;
          }
        }
        const stored = HIFPBStorage.get(HIFPBStorage.keys.customDisciplines);
        if (!stored) return;

        const list = JSON.parse(stored);
        if (!Array.isArray(list)) return;
        list.forEach(discipline => {
          if (
            discipline &&
            typeof discipline.id === "string" &&
            typeof discipline.name === "string" &&
            !ACADEMIC_DATA.disciplines.some(existing => existing.id === discipline.id)
          ) {
            ACADEMIC_DATA.disciplines.push(discipline);
          }
        });
      } catch (err) {
        console.error("Erro ao carregar disciplinas customizadas:", err);
      }
    }
  },

  // Excluir horário acadêmico
  deleteSchedule: (scheduleId) => {
    const idx = ACADEMIC_DATA.schedules.findIndex(s => s.id === scheduleId);
    if (idx !== -1) {
      ACADEMIC_DATA.schedules.splice(idx, 1);
      DataService.saveCustomSchedules();
      return true;
    }
    return false;
  },

  // Salvar horários customizados no localStorage
  saveCustomSchedules: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      HIFPBStorage.setJson(HIFPBStorage.keys.allSchedules, ACADEMIC_DATA.schedules);
      const custom = ACADEMIC_DATA.schedules.filter(s => s.isCustom || (s.id && s.id.startsWith("sch-custom-")));
      HIFPBStorage.setJson(HIFPBStorage.keys.customSchedules, custom);
    }
  },

  // Carregar horários customizados do localStorage
  loadCustomSchedules: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const storedAll = HIFPBStorage.get(HIFPBStorage.keys.allSchedules);
        if (storedAll) {
          const list = JSON.parse(storedAll);
          if (Array.isArray(list) && list.length > 0) {
            ACADEMIC_DATA.schedules = list;
            return;
          }
        }
        const stored = HIFPBStorage.get(HIFPBStorage.keys.customSchedules);
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            list.forEach(item => {
              if (!ACADEMIC_DATA.schedules.some(s => s.id === item.id)) {
                ACADEMIC_DATA.schedules.push(item);
              }
            });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar horários customizados:", err);
      }
    }
  },

  // Gestão de Professores: Adicionar
  addTeacher: (teacherData) => {
    if (!teacherData.id) {
      teacherData.id = "prof-custom-" + Date.now();
    }
    teacherData.isCustom = true;
    ACADEMIC_DATA.teachers.push(teacherData);
    DataService.saveCustomTeachers();
    return teacherData;
  },

  // Gestão de Professores: Excluir
  deleteTeacher: (teacherId) => {
    // Verifica se professor tem horários vinculados
    const activeSchedules = ACADEMIC_DATA.schedules.filter(s => getScheduleTeacherIds(s).includes(teacherId));
    const assignedDisciplines = ACADEMIC_DATA.disciplines.filter(d =>
      (Array.isArray(d.teacherIds) ? d.teacherIds : [d.teacherId]).includes(teacherId)
    );
    if (activeSchedules.length > 0 || assignedDisciplines.length > 0) {
      return {
        success: false,
        reason: `Este docente está vinculado a ${activeSchedules.length} horário(s) e ${assignedDisciplines.length} disciplina(s). Remova ou altere os vínculos antes de excluir o docente.`
      };
    }
    const idx = ACADEMIC_DATA.teachers.findIndex(t => t.id === teacherId);
    if (idx !== -1) {
      ACADEMIC_DATA.teachers.splice(idx, 1);
      DataService.saveCustomTeachers();
      return { success: true };
    }
    return { success: false, reason: "Docente não encontrado no sistema." };
  },

  // Salvar docentes no localStorage
  saveCustomTeachers: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      HIFPBStorage.setJson(HIFPBStorage.keys.allTeachers, ACADEMIC_DATA.teachers);
      const custom = ACADEMIC_DATA.teachers.filter(t => t.isCustom || (t.id && t.id.startsWith("prof-custom-")));
      HIFPBStorage.setJson(HIFPBStorage.keys.customTeachers, custom);
    }
  },

  // Carregar docentes do localStorage
  loadCustomTeachers: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const storedAll = HIFPBStorage.get(HIFPBStorage.keys.allTeachers);
        if (storedAll) {
          const list = JSON.parse(storedAll);
          if (Array.isArray(list) && list.length > 0) {
            ACADEMIC_DATA.teachers = list;
            return;
          }
        }
        const storedCustom = HIFPBStorage.get(HIFPBStorage.keys.customTeachers);
        if (storedCustom) {
          const list = JSON.parse(storedCustom);
          if (Array.isArray(list)) {
            list.forEach(item => {
              if (!ACADEMIC_DATA.teachers.some(t => t.id === item.id)) {
                ACADEMIC_DATA.teachers.push(item);
              }
            });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar docentes customizados:", err);
      }
    }
  },

  // Verificação rigorosa de Choque de Horários (Professor e Turma)
  checkConflict: (newSchedule) => {
    const conflicts = [];
    const all = ACADEMIC_DATA.schedules;
    const weekDays = ACADEMIC_DATA.weekDays;
    const dayObj = weekDays.find(d => d.id === Number(newSchedule.day));
    const dayName = dayObj ? dayObj.name : `Dia ${newSchedule.day}`;

    for (const s of all) {
      // Ignora o mesmo registro se estiver editando
      if (s.id && newSchedule.id && s.id === newSchedule.id) continue;

      // Verifica se ocorre no mesmo dia da semana
      if (Number(s.day) === Number(newSchedule.day)) {
        // Verifica sobreposição temporal
        const isOverlap = (s.slotStart === newSchedule.slotStart && s.shift === newSchedule.shift) ||
          (s.startTime && newSchedule.startTime && !(newSchedule.endTime <= s.startTime || newSchedule.startTime >= s.endTime));

        if (isOverlap) {
          const sharedTeacherIds = getScheduleTeacherIds(s).filter(id =>
            getScheduleTeacherIds(newSchedule).includes(id)
          );
          if (sharedTeacherIds.length > 0) {
            const profNames = sharedTeacherIds.map(id => DataService.getTeacherById(id))
              .filter(Boolean).map(teacher => teacher.name).join(" / ");
            const cls = DataService.getClassById(s.classId);
            conflicts.push({
              type: "teacher",
              title: "Choque de Docente",
              message: `O(s) docente(s) ${profNames || "selecionado(s)"} já está(ão) alocado(s) na aula de "${s.disciplineName}" (${cls ? cls.code : "Turma"}) das ${s.startTime} às ${s.endTime} (${dayName}).`
            });
          }

          // Choque de Turma
          if (s.classId && newSchedule.classId && s.classId === newSchedule.classId) {
            const cls = DataService.getClassById(s.classId);
            conflicts.push({
              type: "class",
              title: "Choque de Turma",
              message: `A turma ${cls ? cls.name : "selecionada"} já possui a aula de "${s.disciplineName}" das ${s.startTime} às ${s.endTime} (${dayName}).`
            });
          }
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  }
};

function migrateLegacyStoredData() {
  if (typeof window === "undefined" || !window.HIFPBStorage) return;
  const versionKey = HIFPBStorage.keys.datasetVersion;
  const currentVersion = ACADEMIC_DATA.meta.version;

  try {
    if (HIFPBStorage.get(versionKey) === currentVersion) return;
    [
      HIFPBStorage.keys.allSchedules,
      HIFPBStorage.keys.customSchedules,
      HIFPBStorage.keys.allTeachers,
      HIFPBStorage.keys.customTeachers,
      HIFPBStorage.keys.customDisciplines,
      HIFPBStorage.keys.allDisciplines
    ].forEach(key => HIFPBStorage.remove(key));
    HIFPBStorage.set(versionKey, currentVersion);
  } catch (error) {
    console.error("Erro ao atualizar os dados locais para a nova grade:", error);
  }
}

// Inicializa dados customizados se disponíveis
if (typeof DataService !== "undefined") {
  migrateLegacyStoredData();
  if (typeof DataService.loadCustomTeachers === "function") DataService.loadCustomTeachers();
  if (typeof DataService.loadCustomDisciplines === "function") DataService.loadCustomDisciplines();
  if (typeof DataService.loadCustomSchedules === "function") DataService.loadCustomSchedules();
}
