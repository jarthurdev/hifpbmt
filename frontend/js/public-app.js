import { catalogService } from "./services/catalog-service.js";
import { scheduleService } from "./services/schedule-service.js";
import { store } from "./state/store.js";
import { renderCatalog, renderClassDetail, renderSchedule } from "./views/public-schedule-view.js";
import { initializeModals } from "./views/modal-view.js";
import { showToast } from "./ui/toast.js";

const modal = initializeModals();
const types = ["turma", "curso", "professor", "sala"];

function render(state) {
  renderCatalog(state, selectEntity);
  renderSchedule(state, slot => renderClassDetail(slot, modal));
}

async function loadCatalog() {
  store.update(state => ({ ...state, loading: true, error: null }));
  try {
    const [courses, classGroups, professors, rooms] = await Promise.all([
      catalogService.getCourses(),
      catalogService.getClassGroups(),
      catalogService.getProfessors(),
      catalogService.getRooms()
    ]);
    store.update(state => ({
      ...state,
      data: { ...state.data, courses, classGroups, professors, rooms },
      loading: false
    }));
    setText("badgeCountTurma", classGroups.length);
    setText("badgeCountCurso", courses.length);
    setText("badgeCountProf", professors.length);
    setText("badgeCountSala", rooms.length);
  } catch (error) {
    store.update(state => ({ ...state, loading: false, error: error.message }));
    showToast(error.message);
  }
}

async function selectEntity(type, id) {
  store.update(state => ({
    ...state,
    activeQueryType: type,
    selectedEntityId: id,
    loading: true,
    error: null,
    activeFilters: { ...state.activeFilters, professorId: "all" }
  }));
  const token = store.getState().authentication.token;
  try {
    let schedules;
    if (type === "turma") {
      schedules = await scheduleService.getSchedules({ classGroupId: id }, token);
    } else if (type === "professor") {
      schedules = await scheduleService.getSchedules({ professorId: id }, token);
    } else if (type === "sala") {
      schedules = await scheduleService.getSchedules({ roomId: id }, token);
    } else {
      const groups = await catalogService.getClassGroups({ courseId: id }, token);
      const groupedSchedules = await Promise.all(groups.map(group =>
        scheduleService.getSchedules({ classGroupId: group.id }, token)
      ));
      schedules = groupedSchedules.flat();
    }
    store.update(state => ({
      ...state,
      data: { ...state.data, schedules },
      loading: false
    }));
  } catch (error) {
    store.update(state => ({ ...state, loading: false, error: error.message }));
    showToast(error.message);
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value);
}

function bindEvents() {
  document.querySelectorAll(".query-tab-btn").forEach(button => {
    button.dataset.type = button.dataset.type || "turma";
    button.addEventListener("click", () => {
      const type = button.dataset.type;
      store.update(state => ({ ...state, activeQueryType: type, selectedEntityId: null }));
      document.querySelectorAll(".query-tab-btn").forEach(tab => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
    });
  });

  const searchCatalog = document.getElementById("selectorSearchInput");
  searchCatalog?.addEventListener("input", () => render(store.getState()));
  document.getElementById("selectorSearchClearBtn")?.addEventListener("click", () => {
    if (searchCatalog) searchCatalog.value = "";
    render(store.getState());
  });
  document.getElementById("filterSearchClearBtn")?.addEventListener("click", () => {
    const search = document.getElementById("filterSearchInput");
    if (search) search.value = "";
    store.update(state => ({
      ...state,
      activeFilters: { ...state.activeFilters, search: "" }
    }));
  });
  document.querySelectorAll(".mobile-days-nav [data-day]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".mobile-days-nav [data-day]").forEach(item =>
        item.classList.toggle("active", item === button)
      );
      store.update(state => ({
        ...state,
        activeFilters: { ...state.activeFilters, dayOfWeek: button.dataset.day }
      }));
      const dayFilter = document.getElementById("filterDaySelect");
      if (dayFilter) dayFilter.value = button.dataset.day;
    });
  });

  document.getElementById("filterSearchInput")?.addEventListener("input", event => {
    store.update(state => ({
      ...state,
      activeFilters: { ...state.activeFilters, search: event.target.value }
    }));
  });
  document.getElementById("filterDaySelect")?.addEventListener("change", event => {
    store.update(state => ({
      ...state,
      activeFilters: { ...state.activeFilters, dayOfWeek: event.target.value }
    }));
  });
  document.getElementById("filterTeacherSelect")?.addEventListener("change", event => {
    store.update(state => ({
      ...state,
      activeFilters: { ...state.activeFilters, professorId: event.target.value }
    }));
  });

  document.getElementById("btnClearFilters")?.addEventListener("click", clearFilters);
  document.getElementById("btnEmptyReset")?.addEventListener("click", clearFilters);
  document.getElementById("btnBackToSelection")?.addEventListener("click", () => {
    store.update(state => ({ ...state, selectedEntityId: null, data: { ...state.data, schedules: [] } }));
  });
  document.getElementById("btnPrintSchedule")?.addEventListener("click", () => window.print());
  document.querySelectorAll(".footer-link-btn[data-action='pickCourse']").forEach(button => {
    button.addEventListener("click", () => {
      const courseTab = document.getElementById("tab-curso");
      courseTab?.click();
      if (button.dataset.id) selectEntity("curso", button.dataset.id);
      document.getElementById("conteudo-principal")?.scrollIntoView({ behavior: "smooth" });
    });
  });
  document.getElementById("btnViewTable")?.addEventListener("click", () => setViewMode("table"));
  document.getElementById("btnViewList")?.addEventListener("click", () => setViewMode("list"));
}

function setViewMode(mode) {
  store.update(state => ({ ...state, viewMode: mode }));
  const table = document.getElementById("btnViewTable");
  const list = document.getElementById("btnViewList");
  table?.classList.toggle("active", mode === "table");
  list?.classList.toggle("active", mode === "list");
  table?.setAttribute("aria-checked", String(mode === "table"));
  list?.setAttribute("aria-checked", String(mode === "list"));
}

function clearFilters() {
  store.update(state => ({
    ...state,
    activeFilters: { search: "", dayOfWeek: "all", professorId: "all" }
  }));
  const search = document.getElementById("filterSearchInput");
  const day = document.getElementById("filterDaySelect");
  const professor = document.getElementById("filterTeacherSelect");
  if (search) search.value = "";
  if (day) day.value = "all";
  if (professor) professor.value = "all";
  showToast("Filtros limpos.");
}

document.querySelectorAll(".query-tab-btn").forEach((button, index) => {
  button.dataset.type = button.dataset.type || types[index];
});
store.subscribe(render);
bindEvents();
loadCatalog();
