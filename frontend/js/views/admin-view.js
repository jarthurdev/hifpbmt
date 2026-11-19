import { authService } from "../services/auth-service.js";
import { catalogService } from "../services/catalog-service.js";
import { managementService } from "../services/management-service.js";
import { scheduleService } from "../services/schedule-service.js";
import { store } from "../state/store.js";
import { initializeModals } from "./modal-view.js";
import { showToast } from "../ui/toast.js";

const modal = initializeModals();
const days = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export async function initializeAdminView() {
  if (!authService.isAuthenticated()) {
    location.replace("login.html?returnTo=admin.html");
    return modal;
  }
  store.setAuthToken(authService.getToken());
  initializeTabs();
  initializeFormNavigation();
  initializeAdminForms();
  initializeCatalogForms();
  initializeImportForm();
  document.getElementById("btnAdminSectionLogout")?.addEventListener("click", () => {
    authService.logout();
    store.setAuthToken(null);
    location.replace("login.html");
  });
  await loadAdminCatalog();
  return modal;
}

function initializeTabs() {
  document.querySelectorAll("[data-admin-tab]").forEach(button => {
    button.addEventListener("click", () => {
      const selected = button.dataset.adminTab;
      document.querySelectorAll("[data-admin-tab]").forEach(item => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      document.querySelectorAll(".admin-module-content").forEach(panel => {
        panel.hidden = panel.id !== `adminPanel${selected[0].toUpperCase()}${selected.slice(1)}`;
        panel.style.display = panel.hidden ? "none" : "";
      });
    });
  });

  const views = [
    ["btnAdminShowNovoHorario", "btnAdminShowVerHorarios", "adminSubViewNovoHorario", "adminSubViewVerHorarios"],
    ["btnAdminShowNovoProfessor", "btnAdminShowVerProfessores", "adminSubViewNovoProfessor", "adminSubViewVerProfessores"],
    ["btnAdminShowNovaDisciplina", "btnAdminShowVerDisciplinas", "adminSubViewNovaDisciplina", "adminSubViewVerDisciplinas"]
  ];
  views.forEach(([newButton, listButton, newPanel, listPanel]) => {
    document.getElementById(newButton)?.addEventListener("click", () =>
      setAdminSubview(true, newButton, listButton, newPanel, listPanel));
    document.getElementById(listButton)?.addEventListener("click", () =>
      setAdminSubview(false, newButton, listButton, newPanel, listPanel));
  });
}

function setAdminSubview(showNew, newButtonId, listButtonId, newPanelId, listPanelId) {
  const newPanel = document.getElementById(newPanelId);
  const listPanel = document.getElementById(listPanelId);
  if (newPanel) {
    newPanel.hidden = !showNew;
    newPanel.style.display = showNew ? "" : "none";
  }
  if (listPanel) {
    listPanel.hidden = showNew;
    listPanel.style.display = showNew ? "none" : "";
  }
  document.getElementById(newButtonId)?.classList.toggle("active", showNew);
  document.getElementById(listButtonId)?.classList.toggle("active", !showNew);
}

function initializeFormNavigation() {
  document.querySelectorAll("tbody").forEach(body => {
    body.addEventListener("click", handleResourceAction);
  });
}

function initializeAdminForms() {
  document.getElementById("sectionAddTeacherForm")?.addEventListener("submit", event => {
    event.preventDefault();
    void submitForm(event.currentTarget, async form => {
      const id = value("secTeacherIdInput");
      const data = {
        fullName: value("secTeacherNameInput"),
        siape: optionalValue("secTeacherSiapeInput"),
        email: value("secTeacherEmailInput"),
        active: true
      };
      if (id) await managementService.professors.update(id, data);
      else await managementService.professors.create(data);
      return "Professor salvo com sucesso.";
    }, ["secTeacherIdInput"]);
  });

  document.getElementById("sectionAddDisciplineForm")?.addEventListener("submit", event => {
    event.preventDefault();
    void submitForm(event.currentTarget, async () => {
      const id = value("secDisciplineIdInput");
      const workload = value("secDisciplineWorkloadInput");
      const data = {
        courseId: value("secDisciplineCourseSelect"),
        name: value("secDisciplineNameInput"),
        code: value("secDisciplineCodeInput"),
        workloadHours: workload ? Number(workload) : null
      };
      if (id) await managementService.subjects.update(id, data);
      else await managementService.subjects.create(data);
      return "Disciplina salva com sucesso.";
    }, ["secDisciplineIdInput"]);
  });

  document.getElementById("sectionAddScheduleForm")?.addEventListener("submit", event => {
    event.preventDefault();
    void submitScheduleForm(event.currentTarget, "sec");
  });
  document.getElementById("addScheduleForm")?.addEventListener("submit", event => {
    event.preventDefault();
    void submitScheduleForm(event.currentTarget, "modal");
  });

  for (const prefix of ["sec", ""]) {
    const shiftSelect = document.getElementById(prefix ? "secSchedShiftSelect" : "schedShiftSelect");
    shiftSelect?.addEventListener("change", () => populateTimeBlocks(prefix));
  }
}

function initializeCatalogForms() {
  bindCrudForm("courseForm", "courseEditId", managementService.courses, () => ({
    name: value("courseName"),
    code: value("courseCode"),
    level: value("courseLevel")
  }));
  bindCrudForm("classGroupForm", "classGroupEditId", managementService.classGroups, () => ({
    courseId: value("classGroupCourse"),
    name: value("classGroupName"),
    semesterPeriod: value("classGroupPeriod"),
    shift: value("classGroupShift"),
    academicTerm: value("classGroupTerm")
  }));
  bindCrudForm("roomForm", "roomEditId", managementService.rooms, () => ({
    name: value("roomName"),
    block: optionalValue("roomBlock"),
    type: optionalValue("roomType"),
    capacity: value("roomCapacity") ? Number(value("roomCapacity")) : null
  }));
  bindCrudForm("timeBlockForm", "timeBlockEditId", managementService.timeBlocks, () => ({
    shift: value("timeBlockShift"),
    orderIndex: Number(value("timeBlockOrder")),
    startTime: value("timeBlockStart"),
    endTime: value("timeBlockEnd")
  }));
}

function bindCrudForm(formId, idInput, service, getData) {
  document.getElementById(formId)?.addEventListener("submit", event => {
    event.preventDefault();
    void submitForm(event.currentTarget, async () => {
      const id = value(idInput);
      if (id) await service.update(id, getData());
      else await service.create(getData());
      return "Registro salvo com sucesso.";
    }, [idInput]);
  });
}

async function submitForm(form, operation, resetIds = []) {
  if (!form.reportValidity()) return;
  const button = form.querySelector("button[type='submit']");
  if (button) button.disabled = true;
  try {
    const message = await operation(form);
    form.reset();
    resetIds.forEach(id => setValue(id, ""));
    showToast(message);
    await loadAdminCatalog();
  } catch (error) {
    handleApiError(error);
  } finally {
    if (button) button.disabled = false;
  }
}

async function submitScheduleForm(form, prefix) {
  if (!form.reportValidity()) return;
  const ids = prefix === "sec"
    ? { id: "secScheduleIdInput", group: "secSchedClassSelect", subject: "secSchedDisciplineSelect", professor: "secSchedTeacherSelect", day: "secSchedDaySelect", time: "secSchedSlotSelect", room: "secSchedRoomSelect" }
    : { id: "modalScheduleIdInput", group: "schedClassSelect", subject: "schedDisciplineSelect", professor: "schedTeacherSelect", day: "schedDaySelect", time: "schedSlotSelect", room: "schedRoomSelect" };
  const payload = {
    classGroupId: value(ids.group),
    subjectId: value(ids.subject),
    professorId: value(ids.professor) || null,
    roomId: value(ids.room) || null,
    dayOfWeek: Number(value(ids.day)),
    timeBlockId: value(ids.time)
  };
  const button = form.querySelector("button[type='submit']");
  if (button) button.disabled = true;
  try {
    const id = value(ids.id);
    if (id) await scheduleService.update(id, payload);
    else await scheduleService.create(payload);
    form.reset();
    setValue(ids.id, "");
    showToast("Horário salvo com sucesso.");
    await loadAdminCatalog();
  } catch (error) {
    handleApiError(error);
  } finally {
    if (button) button.disabled = false;
  }
}

async function loadAdminCatalog() {
  const status = document.getElementById("adminApiStatus");
  try {
    const [courses, classGroups, subjects, professors, rooms, timeBlocks, schedules] = await Promise.all([
      catalogService.getCourses(),
      catalogService.getClassGroups(),
      catalogService.getSubjects(),
      catalogService.getProfessors(),
      catalogService.getRooms(),
      catalogService.getTimeBlocks(),
      scheduleService.getSchedules()
    ]);
    const data = { courses, classGroups, subjects, professors, rooms, timeBlocks, schedules };
    store.update(state => ({ ...state, data: { ...state.data, ...data } }));

    populateSelects(document.querySelectorAll("[data-catalog='class-groups']"), classGroups, item => item.name);
    populateSelects(document.querySelectorAll("[data-catalog='subjects']"), subjects, item => `${item.name} (${item.code})`);
    populateSelects(document.querySelectorAll("[data-catalog='professors']"), professors, item => item.fullName);
    populateSelects(document.querySelectorAll("[data-catalog='rooms'], #schedRoomSelect"), rooms, item => item.name);
    populateSelects(document.querySelectorAll("#secDisciplineCourseSelect, #scheduleImportCourseId, #classGroupCourse"), courses, item => item.name);
    populateTimeBlocks("sec");
    populateTimeBlocks("");

    renderSchedules(document.getElementById("adminScheduleRows"), schedules);
    renderProfessors(document.getElementById("adminProfessorRows"), professors, schedules);
    renderSubjects(document.getElementById("adminDisciplinesTableBody"), subjects);
    renderCatalogRows("adminCourseRows", courses, "course", course => [course.name, course.code, course.level]);
    renderCatalogRows("adminClassGroupRows", classGroups, "classGroup", group => [
      group.name, group.course.name, group.semesterPeriod, group.shift, group.academicTerm
    ]);
    renderCatalogRows("adminRoomRows", rooms, "room", room => [
      room.name, room.block || "—", room.type || "—", room.capacity ?? "—"
    ]);
    renderCatalogRows("adminTimeBlockRows", timeBlocks, "timeBlock", block => [
      block.shift, block.orderIndex, block.startTime, block.endTime
    ]);
    setCount("adminCountSchedules", schedules.length);
    setCount("adminCountTeachers", professors.length);
    setCount("adminCountDisciplines", subjects.length);
    if (status) {
      status.textContent = `${courses.length} cursos, ${classGroups.length} turmas, ${subjects.length} disciplinas, ${professors.length} professores, ${rooms.length} salas e ${schedules.length} horários carregados da API.`;
    }
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      authService.logout();
      store.setAuthToken(null);
      location.replace("login.html?returnTo=admin.html");
      return;
    }
    if (status) status.textContent = error.message;
    showToast(error.message);
  }
}

function populateSelects(selects, records, getLabel) {
  selects.forEach(select => {
    const selected = select.value;
    select.replaceChildren(new Option("Selecione...", ""));
    records.forEach(record => select.add(new Option(getLabel(record), record.id)));
    if (records.some(record => record.id === selected)) select.value = selected;
  });
}

function populateTimeBlocks(prefix) {
  const id = prefix ? "secSchedSlotSelect" : "schedSlotSelect";
  const shiftId = prefix ? "secSchedShiftSelect" : "schedShiftSelect";
  const select = document.getElementById(id);
  if (!select) return;
  const shift = value(shiftId);
  const blocks = store.getState().data.timeBlocks.filter(block =>
    !shift || block.shift.toLowerCase() === shift.toLowerCase()
  );
  const selected = select.value;
  select.replaceChildren(new Option("Selecione...", ""));
  blocks.forEach(block => select.add(new Option(`${block.startTime}–${block.endTime}`, block.id)));
  if (blocks.some(block => block.id === selected)) select.value = selected;
}

function renderSchedules(tbody, schedules) {
  if (!tbody) return;
  tbody.replaceChildren(...schedules.map(slot => {
    const row = document.createElement("tr");
    [
      `${days[slot.dayOfWeek - 1]} • ${slot.timeBlock.shift}`,
      `${slot.timeBlock.startTime}–${slot.timeBlock.endTime}`,
      slot.subject.name,
      `${slot.classGroup.name} / ${slot.classGroup.course.name}`,
      slot.professor?.fullName || "Sem docente"
    ].forEach(text => appendCell(row, text));
    appendActions(row, "schedule", slot.id);
    return row;
  }));
}

function renderProfessors(tbody, professors, schedules) {
  if (!tbody) return;
  tbody.replaceChildren(...professors.map(professor => {
    const row = document.createElement("tr");
    [
      professor.fullName,
      professor.siape || "Não informado",
      professor.active ? "Ativo" : "Inativo",
      professor.email || "Não informado",
      String(schedules.filter(slot => slot.professor?.id === professor.id).length)
    ].forEach(text => appendCell(row, text));
    appendActions(row, "professor", professor.id);
    return row;
  }));
}

function renderSubjects(tbody, subjects) {
  if (!tbody) return;
  tbody.replaceChildren(...subjects.map(subject => {
    const row = document.createElement("tr");
    [
      subject.name,
      subject.workloadHours == null ? "—" : `${subject.workloadHours} h`,
      subject.code,
      subject.course?.name || "—"
    ].forEach(text => appendCell(row, text));
    appendActions(row, "subject", subject.id);
    return row;
  }));
}

function renderCatalogRows(tbodyId, records, resource, getValues) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.replaceChildren(...records.map(record => {
    const row = document.createElement("tr");
    getValues(record).forEach(text => appendCell(row, String(text)));
    appendActions(row, resource, record.id);
    return row;
  }));
}

function appendCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.append(cell);
}

function appendActions(row, resource, id) {
  const cell = document.createElement("td");
  cell.className = "text-right";
  for (const [action, label] of [["edit", "Editar"], ["delete", "Excluir"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-secondary";
    button.textContent = label;
    button.dataset[`${action}Resource`] = resource;
    button.dataset.id = id;
    cell.append(button);
  }
  row.append(cell);
}

function handleResourceAction(event) {
  const button = event.target.closest("[data-edit-resource], [data-delete-resource]");
  if (!button) return;
  const resource = button.dataset.editResource || button.dataset.deleteResource;
  const recordId = button.dataset.id;
  const records = store.getState().data;
  const collections = {
    schedule: records.schedules,
    professor: records.professors,
    subject: records.subjects,
    course: records.courses,
    classGroup: records.classGroups,
    room: records.rooms,
    timeBlock: records.timeBlocks
  };
  const collection = collections[resource];
  const record = collection.find(item => item.id === recordId);
  if (!record) return;

  if (button.dataset.deleteResource) {
    if (!window.confirm("Confirma a exclusão deste registro?")) return;
    const removers = {
      schedule: scheduleService.remove,
      professor: managementService.professors.remove,
      subject: managementService.subjects.remove,
      course: managementService.courses.remove,
      classGroup: managementService.classGroups.remove,
      room: managementService.rooms.remove,
      timeBlock: managementService.timeBlocks.remove
    };
    const remove = removers[resource];
    void remove(recordId).then(async () => {
      showToast("Registro excluído com sucesso.");
      await loadAdminCatalog();
    }).catch(handleApiError);
    return;
  }

  if (resource === "schedule") {
    setValue("secScheduleIdInput", record.id);
    setValue("secSchedClassSelect", record.classGroup.id);
    setValue("secSchedDisciplineSelect", record.subject.id);
    setValue("secSchedTeacherSelect", record.professor?.id || "");
    setValue("secSchedDaySelect", record.dayOfWeek);
    setValue("secSchedShiftSelect", record.timeBlock.shift.toLowerCase());
    populateTimeBlocks("sec");
    setValue("secSchedSlotSelect", record.timeBlock.id);
    setValue("secSchedRoomSelect", record.room?.id || "");
    setAdminSubview(true, "btnAdminShowNovoHorario", "btnAdminShowVerHorarios", "adminSubViewNovoHorario", "adminSubViewVerHorarios");
  } else if (resource === "professor") {
    setValue("secTeacherIdInput", record.id);
    setValue("secTeacherNameInput", record.fullName);
    setValue("secTeacherSiapeInput", record.siape || "");
    setValue("secTeacherEmailInput", record.email || "");
    setAdminSubview(true, "btnAdminShowNovoProfessor", "btnAdminShowVerProfessores", "adminSubViewNovoProfessor", "adminSubViewVerProfessores");
  } else if (resource === "subject") {
    setValue("secDisciplineIdInput", record.id);
    setValue("secDisciplineNameInput", record.name);
    setValue("secDisciplineCodeInput", record.code);
    setValue("secDisciplineWorkloadInput", record.workloadHours ?? "");
    setValue("secDisciplineCourseSelect", record.courseId);
    setAdminSubview(true, "btnAdminShowNovaDisciplina", "btnAdminShowVerDisciplinas", "adminSubViewNovaDisciplina", "adminSubViewVerDisciplinas");
  } else if (resource === "course") {
    setValue("courseEditId", record.id);
    setValue("courseName", record.name);
    setValue("courseCode", record.code);
    setValue("courseLevel", record.level);
  } else if (resource === "classGroup") {
    setValue("classGroupEditId", record.id);
    setValue("classGroupCourse", record.courseId);
    setValue("classGroupName", record.name);
    setValue("classGroupPeriod", record.semesterPeriod);
    setValue("classGroupShift", record.shift);
    setValue("classGroupTerm", record.academicTerm);
  } else if (resource === "room") {
    setValue("roomEditId", record.id);
    setValue("roomName", record.name);
    setValue("roomBlock", record.block || "");
    setValue("roomType", record.type || "");
    setValue("roomCapacity", record.capacity ?? "");
  } else if (resource === "timeBlock") {
    setValue("timeBlockEditId", record.id);
    setValue("timeBlockShift", record.shift);
    setValue("timeBlockOrder", record.orderIndex);
    setValue("timeBlockStart", record.startTime);
    setValue("timeBlockEnd", record.endTime);
  }
}

function initializeImportForm() {
  const form = document.getElementById("scheduleImportForm");
  form?.addEventListener("submit", event => {
    event.preventDefault();
    void submitForm(form, async () => {
      const file = document.getElementById("scheduleImportFile").files[0];
      if (!file) throw new Error("Selecione um arquivo JSON ou CSV.");
      const text = await file.text();
      let payload;
      if (file.name.toLowerCase().endsWith(".json")) {
        payload = JSON.parse(text);
      } else if (file.name.toLowerCase().endsWith(".csv")) {
        if (!value("scheduleImportCourseId") || !value("scheduleImportTerm")) {
          throw new Error("Informe o curso e o semestre para importar um CSV.");
        }
        payload = {
          courseId: value("scheduleImportCourseId"),
          academicTerm: value("scheduleImportTerm"),
          scheduleSlots: parseScheduleCSV(text)
        };
      } else throw new Error("O arquivo deve ser JSON ou CSV.");
      const result = await scheduleService.import(payload);
      document.getElementById("scheduleImportFile").value = "";
      const overlapWarning = result.professorConflictCount
        ? ` ${result.professorConflictCount} sobreposição(ões) de professor foram preservadas.`
        : "";
      return `Importação concluída: ${result.importedSlots} horários atualizados.${overlapWarning}`;
    });
  });
}

function parseScheduleCSV(text) {
  const [headerLine, ...lines] = parseCSVRows(text);
  if (!headerLine) throw new Error("O CSV está vazio.");
  const headers = headerLine.map(value => value.trim());
  const required = ["dayOfWeek", "classGroupId", "subjectId", "professorId", "roomId", "timeBlockId"];
  const missing = required.filter(header => !headers.includes(header));
  if (missing.length) throw new Error(`Colunas ausentes no CSV: ${missing.join(", ")}.`);
  return lines.filter(row => row.some(value => value.trim())).map(row => {
    const record = Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() || ""]));
    return {
      dayOfWeek: Number(record.dayOfWeek),
      classGroupId: record.classGroupId,
      subjectId: record.subjectId,
      professorId: record.professorId || null,
      roomId: record.roomId || null,
      timeBlockId: record.timeBlockId
    };
  });
}

function parseCSVRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"' && quoted && input[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("O CSV contém aspas não fechadas.");
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function handleApiError(error) {
  if (error.status === 401 || error.status === 403) {
    authService.logout();
    store.setAuthToken(null);
    location.replace("login.html?returnTo=admin.html");
    return;
  }
  showToast(error.message || "Não foi possível concluir a operação.");
}

function value(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function optionalValue(id) {
  return value(id) || null;
}

function setValue(id, nextValue) {
  const element = document.getElementById(id);
  if (element) element.value = String(nextValue ?? "");
}

function setCount(id, count) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(count);
}
