const DAYS = [
  "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado"
];

const byId = id => document.getElementById(id);
const text = (element, value) => {
  if (element) element.textContent = value ?? "";
};
const make = (name, className, value) => {
  const element = document.createElement(name);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = value;
  return element;
};

export function renderCatalog(state, onSelect) {
  const grid = byId("entityCardsGrid");
  const heading = byId("entitySelectionTitle");
  const panel = byId("panel-selector");
  const search = (byId("selectorSearchInput")?.value || "").trim().toLocaleLowerCase("pt-BR");
  if (!grid) return;
  grid.replaceChildren();

  const { activeQueryType, data, selectedEntityId } = state;
  const entities = {
    turma: data.classGroups.map(item => ({ id: item.id, name: item.name, subtitle: item.course?.name || "" })),
    curso: data.courses.map(item => ({ id: item.id, name: item.name, subtitle: item.code })),
    professor: data.professors.map(item => ({ id: item.id, name: item.fullName, subtitle: item.email || "Docente" })),
    sala: data.rooms.map(item => ({ id: item.id, name: item.name, subtitle: [item.block, item.type].filter(Boolean).join(" • ") }))
  }[activeQueryType] || [];

  const title = { turma: "Turma", curso: "Curso", professor: "Professor", sala: "Sala" }[activeQueryType];
  text(heading, `Selecione ${activeQueryType === "professor" ? "um" : "uma"} ${title}:`);
  text(byId("entityCounterChip"), `${entities.length} opções`);
  panel?.setAttribute("aria-labelledby", `tab-${activeQueryType}`);

  const visible = entities.filter(entity =>
    `${entity.name} ${entity.subtitle}`.toLocaleLowerCase("pt-BR").includes(search)
  );
  for (const entity of visible) {
    const button = make("button", `entity-card-option${selectedEntityId === entity.id ? " selected" : ""}`);
    button.type = "button";
    button.setAttribute("aria-pressed", String(selectedEntityId === entity.id));
    button.append(make("strong", "card-option-title", entity.name));
    button.append(make("span", "card-option-badge", entity.subtitle));
    button.addEventListener("click", () => onSelect(activeQueryType, entity.id));
    grid.append(button);
  }
  if (!visible.length) grid.append(make("p", "empty-desc", "Nenhuma opção encontrada."));
}

export function renderSchedule(state, onOpenDetails) {
  const result = byId("scheduleResultSection");
  const loading = byId("scheduleLoadingState");
  const empty = byId("scheduleEmptyState");
  const table = byId("tableViewContainer");
  const list = byId("listViewContainer");
  if (!result) return;

  result.style.display = state.selectedEntityId ? "" : "none";
  if (loading) loading.style.display = state.loading ? "" : "none";
  if (state.error) {
    if (empty) {
      empty.style.display = "";
      text(byId("emptyStateDesc"), state.error);
    }
    if (table) table.style.display = "none";
    if (list) list.style.display = "none";
    return;
  }

  const schedules = filterSchedules(state.data.schedules, state.activeFilters);
  const isEmpty = !schedules.length;
  if (empty) empty.style.display = isEmpty && !state.loading ? "" : "none";
  if (table) table.style.display = isEmpty || state.viewMode !== "table" ? "none" : "";
  if (list) list.style.display = isEmpty || state.viewMode !== "list" ? "none" : "";
  if (isEmpty) return;

  const blocks = [...new Map(schedules.map(slot => [slot.timeBlock.id, slot.timeBlock])).values()]
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const now = new Date();
  const body = byId("academicTableBody");
  if (body) {
    body.replaceChildren(...blocks.map(block => {
      const row = make("tr");
      row.append(make("td", "time-cell", `${block.startTime} – ${block.endTime}`));
      for (let day = 1; day <= 6; day += 1) {
        const cell = make("td");
        for (const slot of schedules.filter(item =>
          item.timeBlock.id === block.id && item.dayOfWeek === day
        )) {
          const current = isCurrentSlot(slot, now);
          if (current) cell.classList.add("active-current-slot");
          cell.append(createScheduleCard(slot, onOpenDetails, current));
        }
        row.append(cell);
      }
      return row;
    }));
  }

  const listContainer = byId("listDaysContainer");
  if (listContainer) {
    listContainer.replaceChildren(...DAYS.map((dayName, index) => {
      const day = index + 1;
      const slots = schedules.filter(slot => slot.dayOfWeek === day);
      const section = make("section", "list-day-card");
      section.append(make("h3", "list-day-title", dayName));
      if (!slots.length) section.append(make("p", "empty-desc", "Sem aulas."));
      slots.forEach(slot => section.append(createScheduleCard(slot, onOpenDetails, isCurrentSlot(slot, now))));
      return section;
    }));
  }

  const teachers = new Map(state.data.professors.map(item => [item.id, item.fullName]));
  const filter = byId("filterTeacherSelect");
  if (filter && filter.options.length !== teachers.size + 1) {
    const selected = state.activeFilters.professorId;
    filter.replaceChildren(new Option("Todos os Docentes", "all"));
    teachers.forEach((name, id) => filter.add(new Option(name, id)));
    filter.value = selected;
  }
  document.querySelectorAll(".mobile-days-nav [data-day]").forEach(button => {
    button.classList.toggle("active", button.dataset.day === state.activeFilters.dayOfWeek);
  });
  updateEntityHeader(state);
}

function filterSchedules(schedules, filters) {
  const query = filters.search.trim().toLocaleLowerCase("pt-BR");
  return schedules.filter(slot => {
    if (filters.dayOfWeek !== "all" && slot.dayOfWeek !== Number(filters.dayOfWeek)) return false;
    if (filters.professorId !== "all" && slot.professor?.id !== filters.professorId) return false;
    if (!query) return true;
    const searchable = [
      slot.subject.name, slot.professor?.fullName, slot.classGroup.name,
      slot.room?.name, slot.classGroup.course.name
    ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    return searchable.includes(query);
  });
}

function createScheduleCard(slot, onOpenDetails, current) {
  const button = make("button", `schedule-card${current ? " active-current-slot" : ""}`);
  button.type = "button";
  button.dataset.scheduleId = slot.id;
  button.append(make("strong", "schedule-card-subject", slot.subject.name));
  button.append(make("span", "schedule-card-professor", slot.professor?.fullName || "Docente não informado"));
  button.append(make("span", "schedule-card-class", slot.classGroup.name));
  if (slot.room) button.append(make("span", "schedule-card-room", `Sala ${slot.room.name}`));
  button.addEventListener("click", () => onOpenDetails(slot));
  return button;
}

function isCurrentSlot(slot, now) {
  const currentDay = now.getDay();
  if (currentDay === 0 || slot.dayOfWeek !== currentDay) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const toMinutes = value => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  return currentMinutes >= toMinutes(slot.timeBlock.startTime) &&
    currentMinutes < toMinutes(slot.timeBlock.endTime);
}

function updateEntityHeader(state) {
  const typeNames = { turma: "Turma", curso: "Curso", professor: "Professor", sala: "Sala" };
  const selected = {
    turma: state.data.classGroups,
    curso: state.data.courses,
    professor: state.data.professors,
    sala: state.data.rooms
  }[state.activeQueryType]?.find(item => item.id === state.selectedEntityId);
  if (!selected) return;
  const name = selected.name || selected.fullName;
  text(byId("entityKindBadge"), typeNames[state.activeQueryType]);
  text(byId("entityCodeBadge"), selected.code || selected.semesterPeriod || "");
  text(byId("entityMainName"), name);
  text(byId("entitySecondaryDesc"), [
    selected.course?.name,
    selected.shift,
    selected.block
  ].filter(Boolean).join(" • "));
}

export function renderClassDetail(slot, modal) {
  text(byId("modalBadge"), slot.subject.name);
  text(byId("modalShiftBadge"), slot.timeBlock.shift);
  text(byId("modalTitle"), slot.subject.code || slot.subject.name);
  text(byId("modalTeacher"), slot.professor?.fullName || "Docente não informado");
  text(byId("modalClass"), `${slot.classGroup.name} (${slot.classGroup.semesterPeriod})`);
  text(byId("modalTime"), `${DAYS[slot.dayOfWeek - 1]} • ${slot.timeBlock.startTime} às ${slot.timeBlock.endTime}`);
  text(byId("modalObs"), slot.room ? `Sala ${slot.room.name}` : "Sem observações adicionais.");
  const deleteButton = byId("modalDeleteScheduleBtn");
  if (deleteButton) deleteButton.hidden = true;
  modal.open("classDetailModal");
}

export function updateLoadingState(state) {
  const loading = byId("scheduleLoadingState");
  if (loading) loading.style.display = state.loading ? "" : "none";
}
