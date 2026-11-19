/**
 * HIFPB Monteiro — Sistema de Consulta de Horários Acadêmicos
 * Lógica Principal da Aplicação Front-End (Vanilla JS)
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // ESTADO DA APLICAÇÃO
  // ==========================================================================
  const state = {
    queryType: "turma", // 'turma' | 'curso' | 'professor'
    selectedEntityId: null,
    viewMode: "table",  // 'table' | 'list'
    filters: {
      search: "",
      day: "all",
      teacher: "all"
    },
    selectorFilterText: "",
    selectorOpen: true,
    isAdmin: typeof window !== "undefined" && window.HIFPBAdminAuth
      ? window.HIFPBAdminAuth.isAuthenticated()
      : false,
    activeDetailScheduleId: null
  };

  // ==========================================================================
  // ELEMENTOS DO DOM
  // ==========================================================================
  const DOM = {
    // Topbar & Header
    lastUpdateText: document.getElementById("lastUpdateText"),
    breadcrumbHome: document.getElementById("breadcrumbHome"),
    breadcrumbCurrent: document.getElementById("breadcrumbCurrent"),

    // Acesso Administrativo na Navegação
    govAdminBtn: document.getElementById("govAdminBtn"),
    govAdminText: document.getElementById("govAdminText"),
    btnNavAdminLogin: document.getElementById("btnNavAdminLogin"),

    // Navegação e Tabs
    queryTabs: document.querySelectorAll(".query-tab-btn"),
    entitySelectionTitle: document.getElementById("entitySelectionTitle"),
    entityCounterChip: document.getElementById("entityCounterChip"),
    selectorSearchInput: document.getElementById("selectorSearchInput"),
    selectorSearchClearBtn: document.getElementById("selectorSearchClearBtn"),
    entityCardsGrid: document.getElementById("entityCardsGrid"),
    selectorPanel: document.getElementById("panel-selector"),
    queryNavigationSection: document.querySelector(".query-navigation-section"),

    // Seção de Resultados
    scheduleResultSection: document.getElementById("scheduleResultSection"),
    entityInfoCard: document.getElementById("entityInfoCard"),
    entityInfoAvatar: document.getElementById("entityInfoAvatar"),
    entityKindBadge: document.getElementById("entityKindBadge"),
    entityCodeBadge: document.getElementById("entityCodeBadge"),
    entityMainName: document.getElementById("entityMainName"),
    entitySecondaryDesc: document.getElementById("entitySecondaryDesc"),
    entityMetadataGrid: document.getElementById("entityMetadataGrid"),
    btnBackToSelection: document.getElementById("btnBackToSelection"),
    btnPrintSchedule: document.getElementById("btnPrintSchedule"),

    // Toolbar de Filtros
    filterSearchInput: document.getElementById("filterSearchInput"),
    filterSearchClearBtn: document.getElementById("filterSearchClearBtn"),
    filterDaySelect: document.getElementById("filterDaySelect"),
    filterTeacherSelect: document.getElementById("filterTeacherSelect"),
    btnClearFilters: document.getElementById("btnClearFilters"),

    // Modos de Exibição
    btnViewTable: document.getElementById("btnViewTable"),
    btnViewList: document.getElementById("btnViewList"),
    mobileDaysNav: document.getElementById("mobileDaysNav"),
    mobileDayButtons: document.querySelectorAll(".mobile-days-nav .day-tab-btn"),

    // Contêineres de Visualização
    scheduleLoadingState: document.getElementById("scheduleLoadingState"),
    scheduleEmptyState: document.getElementById("scheduleEmptyState"),
    emptyStateDesc: document.getElementById("emptyStateDesc"),
    btnEmptyReset: document.getElementById("btnEmptyReset"),
    tableViewContainer: document.getElementById("tableViewContainer"),
    academicTableBody: document.getElementById("academicTableBody"),
    listViewContainer: document.getElementById("listViewContainer"),
    listDaysContainer: document.getElementById("listDaysContainer"),

    // Modal de Detalhes
    classDetailModal: document.getElementById("classDetailModal"),
    modalBadge: document.getElementById("modalBadge"),
    modalShiftBadge: document.getElementById("modalShiftBadge"),
    modalTitle: document.getElementById("modalTitle"),
    modalTeacher: document.getElementById("modalTeacher"),
    modalClass: document.getElementById("modalClass"),
    modalTime: document.getElementById("modalTime"),
    modalObs: document.getElementById("modalObs"),
    modalCloseBtn: document.getElementById("modalCloseBtn"),
    modalCloseBtnAction: document.getElementById("modalCloseBtnAction"),
    modalDeleteScheduleBtn: document.getElementById("modalDeleteScheduleBtn"),

    // Modal de Login Administrativo
    adminLoginModal: document.getElementById("adminLoginModal"),
    adminLoginForm: document.getElementById("adminLoginForm"),
    loginUser: document.getElementById("loginUser"),
    loginPass: document.getElementById("loginPass"),
    btnTogglePass: document.getElementById("btnTogglePass"),
    loginErrorMsg: document.getElementById("loginErrorMsg"),
    loginErrorText: document.getElementById("loginErrorText"),
    btnDemoAutofill: document.getElementById("btnDemoAutofill"),
    loginModalCloseBtn: document.getElementById("loginModalCloseBtn"),
    loginModalCancelBtn: document.getElementById("loginModalCancelBtn"),

    // Modal de Adicionar Novo Horário
    adminAddScheduleModal: document.getElementById("adminAddScheduleModal"),
    addScheduleForm: document.getElementById("addScheduleForm"),
    addSchedConflictBox: document.getElementById("addSchedConflictBox"),
    schedClassSelect: document.getElementById("schedClassSelect"),
    schedDisciplineSelect: document.getElementById("schedDisciplineSelect"),
    schedTeacherSelect: document.getElementById("schedTeacherSelect"),
    schedDaySelect: document.getElementById("schedDaySelect"),
    schedShiftSelect: document.getElementById("schedShiftSelect"),
    schedSlotSelect: document.getElementById("schedSlotSelect"),
    schedThemeSelect: document.getElementById("schedThemeSelect"),
    schedObsInput: document.getElementById("schedObsInput"),
    addSchedModalCloseBtn: document.getElementById("addSchedModalCloseBtn"),
    addSchedCancelBtn: document.getElementById("addSchedCancelBtn"),
    btnSaveSchedule: document.getElementById("btnSaveSchedule"),

    // Seção Administrativa do Painel de Controle
    adminPanelSection: document.getElementById("adminPanelSection"),
    btnAdminSectionLogout: document.getElementById("btnAdminSectionLogout"),
    adminTabBtnHorarios: document.getElementById("adminTabBtnHorarios"),
    adminTabBtnProfessores: document.getElementById("adminTabBtnProfessores"),
    adminTabBtnDisciplinas: document.getElementById("adminTabBtnDisciplinas"),
    adminPanelHorarios: document.getElementById("adminPanelHorarios"),
    adminPanelProfessores: document.getElementById("adminPanelProfessores"),
    adminPanelDisciplinas: document.getElementById("adminPanelDisciplinas"),
    adminCountSchedules: document.getElementById("adminCountSchedules"),
    adminCountTeachers: document.getElementById("adminCountTeachers"),
    adminCountDisciplines: document.getElementById("adminCountDisciplines"),

    // Sub-ações Horários
    btnAdminShowNovoHorario: document.getElementById("btnAdminShowNovoHorario"),
    btnAdminShowVerHorarios: document.getElementById("btnAdminShowVerHorarios"),
    adminSubViewNovoHorario: document.getElementById("adminSubViewNovoHorario"),
    adminSubViewVerHorarios: document.getElementById("adminSubViewVerHorarios"),
    sectionSchedConflictAlert: document.getElementById("sectionSchedConflictAlert"),
    sectionAddScheduleForm: document.getElementById("sectionAddScheduleForm"),
    secSchedClassSelect: document.getElementById("secSchedClassSelect"),
    secSchedDisciplineSelect: document.getElementById("secSchedDisciplineSelect"),
    secSchedTeacherSelect: document.getElementById("secSchedTeacherSelect"),
    secSchedDaySelect: document.getElementById("secSchedDaySelect"),
    secSchedShiftSelect: document.getElementById("secSchedShiftSelect"),
    secSchedSlotSelect: document.getElementById("secSchedSlotSelect"),
    secSchedThemeSelect: document.getElementById("secSchedThemeSelect"),
    secSchedObsInput: document.getElementById("secSchedObsInput"),
    btnSecSchedReset: document.getElementById("btnSecSchedReset"),
    btnSecSchedSubmit: document.getElementById("btnSecSchedSubmit"),

    // Tabela Horários
    adminSchedSearchInput: document.getElementById("adminSchedSearchInput"),
    adminSchedFilterDay: document.getElementById("adminSchedFilterDay"),
    adminSchedFilterShift: document.getElementById("adminSchedFilterShift"),
    adminSchedulesTableBody: document.getElementById("adminSchedulesTableBody"),

    // Sub-ações Professores
    btnAdminShowNovoProfessor: document.getElementById("btnAdminShowNovoProfessor"),
    btnAdminShowVerProfessores: document.getElementById("btnAdminShowVerProfessores"),
    adminSubViewNovoProfessor: document.getElementById("adminSubViewNovoProfessor"),
    adminSubViewVerProfessores: document.getElementById("adminSubViewVerProfessores"),
    sectionAddTeacherForm: document.getElementById("sectionAddTeacherForm"),
    secTeacherNameInput: document.getElementById("secTeacherNameInput"),
    secTeacherTitleInput: document.getElementById("secTeacherTitleInput"),
    secTeacherEmailInput: document.getElementById("secTeacherEmailInput"),
    secTeacherAreasInput: document.getElementById("secTeacherAreasInput"),
    btnSecTeacherSubmit: document.getElementById("btnSecTeacherSubmit"),

    // Tabela Professores
    adminTeacherSearchInput: document.getElementById("adminTeacherSearchInput"),
    adminTeachersTableBody: document.getElementById("adminTeachersTableBody"),

    // Disciplinas
    btnAdminShowNovaDisciplina: document.getElementById("btnAdminShowNovaDisciplina"),
    btnAdminShowVerDisciplinas: document.getElementById("btnAdminShowVerDisciplinas"),
    adminSubViewNovaDisciplina: document.getElementById("adminSubViewNovaDisciplina"),
    adminSubViewVerDisciplinas: document.getElementById("adminSubViewVerDisciplinas"),
    sectionAddDisciplineForm: document.getElementById("sectionAddDisciplineForm"),
    secDisciplineNameInput: document.getElementById("secDisciplineNameInput"),
    secDisciplineWorkloadInput: document.getElementById("secDisciplineWorkloadInput"),
    secDisciplineTagInput: document.getElementById("secDisciplineTagInput"),
    secDisciplineTeacherSelect: document.getElementById("secDisciplineTeacherSelect"),
    adminDisciplineSearchInput: document.getElementById("adminDisciplineSearchInput"),
    adminDisciplinesTableBody: document.getElementById("adminDisciplinesTableBody"),

    // Toast
    toastNotification: document.getElementById("toastNotification"),
    toastMessage: document.getElementById("toastMessage")
  };

  // ==========================================================================
  // INICIALIZAÇÃO
  // ==========================================================================
  function init() {
    setupEventListeners();
    updateBadgesCounts();
    updateAdminUI();
    renderEntitySelector(state.queryType);

    // Inicializa carregando a turma ADS 2025.1 por padrão para experiência imediata
    selectEntity("turma", "ads-2025-1", false);
  }

  // ==========================================================================
  // ATUALIZAÇÃO DOS CONTADORES DAS ABAS
  // ==========================================================================
  function updateBadgesCounts() {
    const badgeTurma = document.getElementById("badgeCountTurma");
    const badgeCurso = document.getElementById("badgeCountCurso");
    const badgeProf = document.getElementById("badgeCountProf");

    if (badgeTurma) badgeTurma.textContent = DataService.getClasses().length;
    if (badgeCurso) badgeCurso.textContent = DataService.getCourses().length;
    if (badgeProf) badgeProf.textContent = DataService.getTeachers().length;

    const meta = DataService.getMeta();
    if (DOM.lastUpdateText) DOM.lastUpdateText.textContent = meta.lastUpdate;
  }

  // ==========================================================================
  // RENDERIZAÇÃO DO SELETOR DE ENTIDADES (TURMAS, CURSOS, PROFS)
  // ==========================================================================
  function openEntitySelector(type) {
    state.selectorOpen = true;
    if (DOM.selectorPanel) {
      DOM.selectorPanel.classList.remove("collapsed");
      DOM.selectorPanel.setAttribute("aria-hidden", "false");
    }
    if (DOM.queryNavigationSection) {
      DOM.queryNavigationSection.classList.remove("selector-collapsed");
    }
    if (type) renderEntitySelector(type);
  }

  function closeEntitySelector() {
    state.selectorOpen = false;
    state.selectedEntityId = null;
    state.selectorFilterText = "";
    if (DOM.selectorSearchInput) DOM.selectorSearchInput.value = "";
    if (DOM.selectorSearchClearBtn) DOM.selectorSearchClearBtn.style.display = "none";
    if (DOM.selectorPanel) {
      DOM.selectorPanel.classList.add("collapsed");
      DOM.selectorPanel.setAttribute("aria-hidden", "true");
    }
    if (DOM.queryNavigationSection) {
      DOM.queryNavigationSection.classList.add("selector-collapsed");
    }
    DOM.queryTabs.forEach(tab => {
      tab.classList.remove("active");
      tab.setAttribute("aria-selected", "false");
    });
    DOM.entityCardsGrid.querySelectorAll(".entity-card-option").forEach(card => {
      card.classList.remove("selected");
      card.setAttribute("aria-checked", "false");
    });
    if (DOM.scheduleResultSection) DOM.scheduleResultSection.style.display = "none";
  }

  function renderEntitySelector(type) {
    state.queryType = type;
    DOM.entityCardsGrid.innerHTML = "";

    // Atualiza classes ativas das abas
    DOM.queryTabs.forEach(tab => {
      const isActive = tab.getAttribute("data-type") === type;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    let items = [];
    let title = "";
    let itemRenderer = null;

    const filterText = state.selectorFilterText.toLowerCase().trim();

    if (type === "turma") {
      title = "Selecione uma Turma:";
      items = DataService.getClasses().filter(c => 
        !filterText || c.name.toLowerCase().includes(filterText) || c.code.toLowerCase().includes(filterText)
      );
      itemRenderer = (item) => {
        const course = DataService.getCourseById(item.courseId);
        const scheduleCount = DataService.getByCategory("turma", item.id).length;
        const isSelected = state.selectedEntityId === item.id;
        return `
          <button type="button" class="entity-card-option ${isSelected ? 'selected' : ''}" data-id="${item.id}" data-type="turma" role="radio" aria-checked="${isSelected}">
            <div class="card-option-header">
              <span class="card-option-title">${item.name}</span>
              <span class="card-option-badge">${item.period}</span>
            </div>
            <div class="card-option-sub">${course ? course.name : ''}</div>
            <div class="card-option-footer">
              <span>Turno: <strong>${capitalize(item.shift)}</strong></span>
              <span class="card-cta-arrow">${scheduleCount} aulas ›</span>
            </div>
          </button>
        `;
      };
    } else if (type === "curso") {
      title = "Selecione um Curso:";
      items = DataService.getCourses().filter(c => 
        !filterText || c.name.toLowerCase().includes(filterText) || c.code.toLowerCase().includes(filterText)
      );
      itemRenderer = (item) => {
        const classes = DataService.getClasses().filter(c => c.courseId === item.id);
        const scheduleCount = DataService.getByCategory("curso", item.id).length;
        const isSelected = state.selectedEntityId === item.id;
        return `
          <button type="button" class="entity-card-option ${isSelected ? 'selected' : ''}" data-id="${item.id}" data-type="curso" role="radio" aria-checked="${isSelected}">
            <div class="card-option-header">
              <span class="card-option-title">${item.name}</span>
              <span class="card-option-badge">${item.code}</span>
            </div>
            <div class="card-option-sub">${item.duration ? `${item.level} • ${item.duration}` : item.level}</div>
            <div class="card-option-footer">
              <span>${classes.length} turmas ativas</span>
              <span class="card-cta-arrow">${scheduleCount} aulas ›</span>
            </div>
          </button>
        `;
      };
    } else if (type === "professor") {
      title = "Selecione um(a) Docente:";
      items = DataService.getTeachers().filter(t => 
        !filterText || t.name.toLowerCase().includes(filterText) || t.areas.some(a => a.toLowerCase().includes(filterText))
      );
      itemRenderer = (item) => {
        const scheduleCount = DataService.getByCategory("professor", item.id).length;
        const isSelected = state.selectedEntityId === item.id;
        return `
          <button type="button" class="entity-card-option ${isSelected ? 'selected' : ''}" data-id="${item.id}" data-type="professor" role="radio" aria-checked="${isSelected}">
            <div class="card-option-header">
              <span class="card-option-title">${item.name}</span>
              <span class="card-option-badge">Docente</span>
            </div>
            <div class="card-option-sub">${item.title}</div>
            <div class="card-option-footer">
              <span>${item.department.replace("Unidade Acadêmica de ", "U.A. ")}</span>
              <span class="card-cta-arrow">${scheduleCount} horários ›</span>
            </div>
          </button>
        `;
      };
    }

    DOM.entitySelectionTitle.textContent = title;
    DOM.entityCounterChip.textContent = `${items.length} opções disponíveis`;

    if (items.length === 0) {
      DOM.entityCardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted);">
          Nenhum resultado correspondente a "<strong>${escapeHtml(filterText)}</strong>".
        </div>
      `;
      return;
    }

    DOM.entityCardsGrid.innerHTML = items.map(itemRenderer).join("");

    // Adiciona evento de clique a cada card de opção
    DOM.entityCardsGrid.querySelectorAll(".entity-card-option").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        const category = card.getAttribute("data-type");
        selectEntity(category, id, true);
      });
    });
  }

  // ==========================================================================
  // SELEÇÃO DE UMA ENTIDADE E CARREGAMENTO DOS HORÁRIOS
  // ==========================================================================
  function selectEntity(type, id, scrollToView = true) {
    state.queryType = type;
    state.selectedEntityId = id;

    // Reseta filtros internos da grade
    resetScheduleFilters(false);

    // Renderiza o cabeçalho das informações da entidade
    const entityInfo = DataService.getEntityInfo(type, id);
    if (!entityInfo) return;

    // Atualiza os cards visuais na lista de seleção
    DOM.entityCardsGrid.querySelectorAll(".entity-card-option").forEach(card => {
      const isSelected = card.getAttribute("data-id") === id && card.getAttribute("data-type") === type;
      card.classList.toggle("selected", isSelected);
      card.setAttribute("aria-checked", isSelected ? "true" : "false");
    });

    // Atualiza Breadcrumbs
    const typeNames = {
      turma: "Por Turma",
      curso: "Por Curso",
      professor: "Por Professor",
    };
    DOM.breadcrumbCurrent.textContent = `${typeNames[type]} › ${entityInfo.title}`;

    // Popula o Header da Entidade
    DOM.entityKindBadge.textContent = typeNames[type];
    DOM.entityCodeBadge.textContent = entityInfo.badge;
    DOM.entityMainName.textContent = entityInfo.title;
    DOM.entitySecondaryDesc.textContent = entityInfo.subtitle;

    // Ícone do Avatar
    DOM.entityInfoAvatar.innerHTML = getCategoryIconSvg(type);

    // Metadados
    DOM.entityMetadataGrid.innerHTML = entityInfo.details.map(d => `
      <div class="meta-item">
        <span class="meta-item-label">${d.label}</span>
        <span class="meta-item-val">${d.value}</span>
      </div>
    `).join("");

    // Exibe seção de resultado
    DOM.scheduleResultSection.style.display = "block";

    // Atualiza opções dos dropdowns de filtros dinâmicos de acordo com a consulta atual
    populateDynamicDropdownFilters();

    // Renderiza a grade com simulação de transição suave
    showLoadingAndRender();

    if (scrollToView) {
      setTimeout(() => {
        DOM.scheduleResultSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }

  // ==========================================================================
  // POPULAÇÃO DOS DROPDOWNS DE FILTROS DINÂMICOS
  // ==========================================================================
  function populateDynamicDropdownFilters() {
    const rawSchedules = DataService.getByCategory(state.queryType, state.selectedEntityId);

    // Professores presentes nesta consulta
    const teacherIds = [...new Set(rawSchedules.flatMap(getScheduleTeacherIds))];
    const teachers = teacherIds.map(id => DataService.getTeacherById(id)).filter(Boolean);
    
    DOM.filterTeacherSelect.innerHTML = `<option value="all">Todos os Docentes (${teachers.length})</option>` +
      teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join("");

  }

  // ==========================================================================
  // MOTOR DE FILTRAGEM DOS HORÁRIOS
  // ==========================================================================
  function getFilteredSchedules() {
    const all = DataService.getByCategory(state.queryType, state.selectedEntityId);
    const text = state.filters.search.toLowerCase().trim();
    const day = state.filters.day;
    const teacher = state.filters.teacher;

    return all.filter(item => {
      // Filtro por dia
      if (day !== "all" && String(item.day) !== String(day)) {
        return false;
      }

      // Filtro por professor
      if (teacher !== "all" && !getScheduleTeacherIds(item).includes(teacher)) {
        return false;
      }

      // Filtro de texto em tempo real (disciplina, professor ou turma)
      if (text) {
        const teacherNames = getScheduleTeacherIds(item).map(id => DataService.getTeacherById(id))
          .filter(Boolean).map(teacher => teacher.name);
        const classObj = DataService.getClassById(item.classId);

        const matchDiscipline = item.disciplineName.toLowerCase().includes(text);
        const matchTeacher = teacherNames.some(name => name.toLowerCase().includes(text));
        const matchClass = classObj && classObj.name.toLowerCase().includes(text);
        const matchObs = item.obs && item.obs.toLowerCase().includes(text);

        if (!matchDiscipline && !matchTeacher && !matchClass && !matchObs) {
          return false;
        }
      }

      return true;
    });
  }

  // ==========================================================================
  // TRANSIÇÃO DE CARREGAMENTO & RENDERIZAÇÃO
  // ==========================================================================
  function showLoadingAndRender() {
    DOM.scheduleLoadingState.style.display = "block";
    DOM.tableViewContainer.style.display = "none";
    DOM.listViewContainer.style.display = "none";
    DOM.scheduleEmptyState.style.display = "none";

    setTimeout(() => {
      DOM.scheduleLoadingState.style.display = "none";
      renderScheduleView();
    }, 180);
  }

  function renderScheduleView() {
    const filtered = getFilteredSchedules();

    if (filtered.length === 0) {
      DOM.scheduleEmptyState.style.display = "block";
      DOM.tableViewContainer.style.display = "none";
      DOM.listViewContainer.style.display = "none";
      DOM.emptyStateDesc.textContent = "Nenhuma disciplina foi encontrada com os filtros ou pesquisa aplicados.";
      return;
    }

    DOM.scheduleEmptyState.style.display = "none";

    if (state.viewMode === "table") {
      DOM.tableViewContainer.style.display = "block";
      DOM.listViewContainer.style.display = "none";
      renderTableView(filtered);
    } else {
      DOM.tableViewContainer.style.display = "none";
      DOM.listViewContainer.style.display = "block";
      renderListView(filtered);
    }
  }

  // ==========================================================================
  // 1. RENDERIZAÇÃO EM TABELA (GRADE SEMANAL)
  // ==========================================================================
  function renderTableView(schedules) {
    const shifts = DataService.getShifts();
    const weekDays = DataService.getWeekDays(); // 1 a 6
    let tbodyHtml = "";

    // Para detectar o dia e horário atual
    const now = new Date();
    const currentWeekDay = now.getDay(); // 0 = Dom, 1 = Seg ... 6 = Sáb
    const currentHourMin = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    shifts.forEach(shift => {
      // Verifica se há alguma aula cadastrada para esse turno na consulta atual
      const hasClassesInShift = schedules.some(s => s.shift === shift.id);

      // Renderiza separador de turno
      tbodyHtml += `
        <tr class="shift-divider-row">
          <td colspan="7">
            <div class="shift-divider-content">
              <span>TURNO ${shift.name.toUpperCase()}</span>
            </div>
          </td>
        </tr>
      `;

      shift.slots.forEach(slot => {
        let rowHtml = `<tr>`;

        // Coluna do Horário
        rowHtml += `
          <td class="time-cell">
            <span class="time-slot-label">${slot.label}</span>
            <span>${slot.time}</span>
          </td>
        `;

        // Colunas de Segunda a Sábado (1 a 6)
        weekDays.forEach(day => {
          // Identifica se este dia e slot coincidem com a aula
          const classItems = schedules.filter(s => s.day === day.id && s.shift === shift.id && s.slotStart === slot.id);

          // Verifica se é o horário corrente em tempo real
          const isCurrentSlot = (currentWeekDay === day.id && currentHourMin >= slot.start && currentHourMin <= slot.end);
          const cellCurrentClass = isCurrentSlot ? "active-current-slot" : "";

          if (classItems.length > 0) {
            rowHtml += `
              <td class="${cellCurrentClass}">
                ${isCurrentSlot ? '<span class="current-slot-pin" title="Horário Atual em Andamento"></span>' : ''}
                ${classItems.map(classItem => {
                  const teachers = getScheduleTeacherIds(classItem).map(id => DataService.getTeacherById(id)).filter(Boolean);
                  const classObj = DataService.getClassById(classItem.classId);
                  const teacherNames = teachers.map(teacher => escapeHtml(teacher.name)).join(" / ");
                  return `
                    <div class="class-schedule-block theme-${classItem.theme}" tabindex="0" role="button" data-schedule-id="${classItem.id}" title="Clique para ver os detalhes completos">
                      <div class="block-subject-name">${escapeHtml(classItem.disciplineName)}</div>
                      <div class="block-meta-row" title="Docente(s): ${teacherNames}">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="7" r="4"></circle>
                          <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"></path>
                        </svg>
                        <span>${teacherNames || "—"}</span>
                      </div>
                      <div class="block-bottom-pills">
                        <span class="badge-class" title="Turma: ${classObj ? escapeHtml(classObj.name) : ''}">
                          ${classObj ? escapeHtml(classObj.code) : ''}
                        </span>
                      </div>
                    </div>
                  `;
                }).join("")}
              </td>
            `;
          } else {
            rowHtml += `
              <td class="${cellCurrentClass}">
                ${isCurrentSlot ? '<span class="current-slot-pin" title="Horário Atual em Andamento"></span>' : ''}
                <div class="empty-cell-placeholder">—</div>
              </td>
            `;
          }
        });

        rowHtml += `</tr>`;
        tbodyHtml += rowHtml;
      });
    });

    DOM.academicTableBody.innerHTML = tbodyHtml;

    // Eventos de clique nas células de disciplinas
    DOM.academicTableBody.querySelectorAll(".class-schedule-block").forEach(block => {
      block.addEventListener("click", () => {
        const id = block.getAttribute("data-schedule-id");
        openClassDetailModal(id);
      });
      block.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const id = block.getAttribute("data-schedule-id");
          openClassDetailModal(id);
        }
      });
    });
  }

  // ==========================================================================
  // 2. RENDERIZAÇÃO EM LISTAGEM (LIST MODE)
  // ==========================================================================
  function renderListView(schedules) {
    const weekDays = DataService.getWeekDays();
    let listHtml = "";

    weekDays.forEach(day => {
      // Se tiver filtro de dia específico e não for este dia, ignora
      if (state.filters.day !== "all" && String(day.id) !== String(state.filters.day)) {
        return;
      }

      const daySchedules = schedules
        .filter(s => s.day === day.id)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      listHtml += `
        <article class="list-day-card">
          <header class="list-day-header">
            <h3 class="list-day-title">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${day.name}
            </h3>
            <span class="list-day-counter">${daySchedules.length} ${daySchedules.length === 1 ? 'aula' : 'aulas'}</span>
          </header>

          <div class="list-items-container">
            ${daySchedules.length > 0 ? daySchedules.map(item => {
              const teachers = getScheduleTeacherIds(item).map(id => DataService.getTeacherById(id)).filter(Boolean);
              const classObj = DataService.getClassById(item.classId);

              return `
                <div class="list-schedule-item theme-${item.theme}" tabindex="0" data-schedule-id="${item.id}" role="button">
                  <div class="list-item-time">
                    <span class="list-time-badge">${item.startTime} - ${item.endTime}</span>
                    <span class="list-slot-badge">${capitalize(item.shift)}</span>
                  </div>

                  <div class="list-item-info">
                    <h4 class="list-subject-title">${escapeHtml(item.disciplineName)}</h4>
                    <div class="list-subject-meta">
                      <span class="list-meta-chip">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="7" r="4"></circle>
                          <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"></path>
                        </svg>
                        <strong>Docente(s):</strong> ${teachers.length ? teachers.map(teacher => escapeHtml(teacher.name)).join(" / ") : "—"}
                      </span>
                      <span class="list-meta-chip">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                        <strong>Turma:</strong> ${classObj ? classObj.code : '—'}
                      </span>
                    </div>
                  </div>

                </div>
              `;
            }).join("") : `
              <div class="list-empty-day">Nenhuma aula agendada para ${day.name}.</div>
            `}
          </div>
        </article>
      `;
    });

    DOM.listDaysContainer.innerHTML = listHtml;

    // Adiciona evento de clique aos itens de listagem
    DOM.listDaysContainer.querySelectorAll(".list-schedule-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-schedule-id");
        openClassDetailModal(id);
      });
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const id = item.getAttribute("data-schedule-id");
          openClassDetailModal(id);
        }
      });
    });
  }

  // ==========================================================================
  // MODAL DE DETALHES DA DISCIPLINA
  // ==========================================================================
  function openClassDetailModal(scheduleId) {
    const all = DataService.getAllSchedules();
    const item = all.find(s => s.id === scheduleId);
    if (!item) return;

    const teachers = getScheduleTeacherIds(item).map(id => DataService.getTeacherById(id)).filter(Boolean);
    const classObj = DataService.getClassById(item.classId);
    const weekDays = DataService.getWeekDays();
    const day = weekDays.find(d => d.id === item.day);

    DOM.modalBadge.textContent = "Disciplina Regular";
    DOM.modalShiftBadge.textContent = `Turno ${capitalize(item.shift)}`;
    DOM.modalTitle.textContent = item.disciplineName;
    DOM.modalTeacher.textContent = teachers.length
      ? teachers.map(teacher => `${teacher.name} (${teacher.title})`).join(" / ")
      : "Sem docente atribuído";
    DOM.modalClass.textContent = classObj ? `${classObj.name} — ${classObj.period}` : "—";
    DOM.modalTime.textContent = `${day ? day.name : ''} • ${item.startTime} às ${item.endTime}`;
    DOM.modalObs.textContent = item.obs || "Nenhuma observação metodológica adicional registrada.";

    state.activeDetailScheduleId = scheduleId;
    if (DOM.modalDeleteScheduleBtn) {
      DOM.modalDeleteScheduleBtn.style.display = state.isAdmin ? "inline-flex" : "none";
    }

    DOM.classDetailModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeClassDetailModal() {
    state.activeDetailScheduleId = null;
    DOM.classDetailModal.style.display = "none";
    document.body.style.overflow = "";
  }

  // ==========================================================================
  // GESTÃO ADMINISTRATIVA E AUTENTICAÇÃO
  // ==========================================================================
  function updateAdminUI() {
    if (state.isAdmin) {
      if (DOM.btnNavAdminLogin) DOM.btnNavAdminLogin.style.display = "none";
      if (DOM.govAdminText) DOM.govAdminText.textContent = "Painel Administrativo";
      if (DOM.adminPanelSection) DOM.adminPanelSection.style.display = "block";

      // Atualiza e renderiza dados da seção administrativa
      populateSectionScheduleDropdowns();
      renderAdminSchedulesTable();
      renderAdminTeachersTable();
      renderAdminDisciplinesTable();
      updateAdminCounts();
    } else {
      if (DOM.btnNavAdminLogin) DOM.btnNavAdminLogin.style.display = "inline-flex";
      if (DOM.govAdminText) DOM.govAdminText.textContent = "Entrar como administrador";
      if (DOM.adminPanelSection) DOM.adminPanelSection.style.display = "none";
    }

    if (DOM.modalDeleteScheduleBtn) {
      DOM.modalDeleteScheduleBtn.style.display = (state.isAdmin && state.activeDetailScheduleId) ? "inline-flex" : "none";
    }
  }

  function updateAdminCounts() {
    if (DOM.adminCountSchedules) {
      DOM.adminCountSchedules.textContent = DataService.getAllSchedules().length;
    }
    if (DOM.adminCountTeachers) {
      DOM.adminCountTeachers.textContent = DataService.getTeachers().length;
    }
    if (DOM.adminCountDisciplines) {
      DOM.adminCountDisciplines.textContent = DataService.getDisciplines().length;
    }
  }

  function openLoginModal() {
    if (state.isAdmin) {
      triggerToast("Você já está autenticado como Administrador.");
      return;
    }
    if (DOM.loginErrorMsg) DOM.loginErrorMsg.style.display = "none";
    if (DOM.loginUser) DOM.loginUser.value = "";
    if (DOM.loginPass) DOM.loginPass.value = "";
    if (DOM.adminLoginModal) {
      DOM.adminLoginModal.style.display = "flex";
      document.body.style.overflow = "hidden";
      setTimeout(() => DOM.loginUser && DOM.loginUser.focus(), 100);
    }
  }

  function closeLoginModal() {
    if (DOM.adminLoginModal) {
      DOM.adminLoginModal.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const user = DOM.loginUser ? DOM.loginUser.value.trim().toLowerCase() : "";
    const pass = DOM.loginPass ? DOM.loginPass.value.trim() : "";

    if (window.HIFPBAdminAuth.login(user, pass)) {
      state.isAdmin = true;
      updateAdminUI();
      closeLoginModal();
      triggerToast("Autenticado com sucesso! Painel administrativo ativado.");
      renderScheduleView();

      // Rola suavemente até o painel administrativo
      if (DOM.adminPanelSection) {
        DOM.adminPanelSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      if (DOM.loginErrorMsg) {
        DOM.loginErrorMsg.style.display = "flex";
        if (DOM.loginErrorText) {
          DOM.loginErrorText.textContent = "Credenciais incorretas. Use 'admin' e 'admin' para acesso demonstrativo.";
        }
      }
    }
  }

  function handleLogout() {
    state.isAdmin = false;
    if (window.HIFPBAdminAuth) window.HIFPBAdminAuth.logout();
    updateAdminUI();
    triggerToast("Sessão administrativa encerrada com sucesso.");
    renderScheduleView();
  }

  // ==========================================================================
  // SEÇÃO ADMINISTRATIVA: POPULAÇÃO DE FORMULÁRIOS E SLOTS
  // ==========================================================================
  function populateSectionScheduleDropdowns() {
    const classes = DataService.getClasses();

    // Turmas na seção
    if (DOM.secSchedClassSelect) {
      DOM.secSchedClassSelect.innerHTML = classes.map(c => 
        `<option value="${c.id}" data-course="${c.courseId}" data-shift="${c.shift}">${c.name}</option>`
      ).join("");
    }

    populateScheduleDisciplineOptions(DOM.secSchedDisciplineSelect);
    syncSectionTeacherFromDiscipline();
    populateDisciplineTeacherOptions();

    updateSectionSlotOptions();
  }

  function populateDisciplineTeacherOptions() {
    if (!DOM.secDisciplineTeacherSelect) return;
    const teachers = DataService.getTeachers();
    DOM.secDisciplineTeacherSelect.innerHTML = `<option value="">Selecione um professor</option>${teachers.map(teacher =>
      `<option value="${escapeHtml(teacher.id)}">${escapeHtml(teacher.name)} (${escapeHtml(teacher.title)})</option>`
    ).join("")}`;
  }

  function syncSectionTeacherFromDiscipline() {
    setTeacherFromDiscipline(
      DOM.secSchedDisciplineSelect,
      DOM.secSchedTeacherSelect,
      DOM.secSchedClassSelect && DOM.secSchedClassSelect.value
    );
  }

  function syncTeacherFromDiscipline() {
    setTeacherFromDiscipline(
      DOM.schedDisciplineSelect,
      DOM.schedTeacherSelect,
      DOM.schedClassSelect && DOM.schedClassSelect.value
    );
  }

  function populateScheduleDisciplineOptions(select) {
    if (!select) return;
    const previousValue = select.value;
    const uniqueDisciplines = new Map();

    DataService.getDisciplines()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .forEach(discipline => {
        const normalizedName = discipline.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLocaleLowerCase("pt-BR")
          .trim();
        if (!uniqueDisciplines.has(normalizedName)) {
          uniqueDisciplines.set(normalizedName, discipline);
        }
      });

    const disciplines = [...uniqueDisciplines.values()];
    select.innerHTML = `<option value="">Selecione uma disciplina</option>${disciplines.map(discipline =>
      `<option value="${escapeHtml(discipline.id)}">${escapeHtml(discipline.name)}</option>`
    ).join("")}`;
    if (disciplines.some(discipline => discipline.id === previousValue)) select.value = previousValue;
  }

  function getCourseIdForClass(classId) {
    const selectedClass = DataService.getClassById(classId);
    if (!selectedClass) return "";
    if (selectedClass.courseId) return selectedClass.courseId;

    const name = selectedClass.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleUpperCase("pt-BR");

    if (name.includes("INFORMATICA")) return "informatica";
    if (name.includes("TCE")) return "tce";
    if (name.includes("ADS")) return "ads";
    if (name.includes("TED")) return "ted";
    if (name.includes("INSTRUMENTO MUSICAL") || /\bIM(?:A|B)?\b/.test(name)) return "im";
    if (name.includes("ENG") && name.includes("CIVIL")) return "eng-civil";
    return "";
  }

  function setTeacherFromDiscipline(disciplineSelect, teacherSelect, classId) {
    if (!disciplineSelect || !teacherSelect) return;
    const discipline = DataService.getDisciplineById(disciplineSelect.value);
    const teacherIds = discipline ? getDisciplineTeacherIds(discipline, classId) : [];
    const teachers = teacherIds.map(id => DataService.getTeacherById(id)).filter(Boolean);
    const option = document.createElement("option");
    option.value = teacherIds.join(",");
    option.textContent = teachers.length
      ? teachers.map(teacher => `${teacher.name} (${teacher.title})`).join(" / ")
      : discipline ? "Professor não definido para esta disciplina" : "Selecione uma disciplina primeiro";
    teacherSelect.replaceChildren(option);
    teacherSelect.disabled = true;
  }

  function updateSectionSlotOptions() {
    if (!DOM.secSchedShiftSelect || !DOM.secSchedSlotSelect) return;
    const shift = DOM.secSchedShiftSelect.value;
    const slots = DataService.getShifts().find(item => item.id === shift)?.slots || [];
    DOM.secSchedSlotSelect.innerHTML = slots.map(slot =>
      `<option value="${slot.id}" data-span="1" data-start="${slot.start}" data-end="${slot.end}">${slot.label}: ${slot.time}</option>`
    ).join("");
  }

  // ==========================================================================
  // SEÇÃO HORÁRIOS: CADASTRO COM VERIFICAÇÃO RIGOROSA DE CHOQUE
  // ==========================================================================
  function handleSectionAddSchedule(e) {
    e.preventDefault();
    const discipline = DOM.secSchedDisciplineSelect
      ? DataService.getDisciplineById(DOM.secSchedDisciplineSelect.value)
      : null;
    if (!discipline) {
      triggerToast("Selecione uma disciplina cadastrada antes de criar o horário.");
      if (DOM.secSchedDisciplineSelect) DOM.secSchedDisciplineSelect.focus();
      return;
    }

    const slotOpt = DOM.secSchedSlotSelect ? DOM.secSchedSlotSelect.selectedOptions[0] : null;
    const teacherIds = getDisciplineTeacherIds(discipline, DOM.secSchedClassSelect.value);
    if (teacherIds.length === 0 || teacherIds.some(id => !DataService.getTeacherById(id))) {
      triggerToast("A disciplina selecionada não possui um professor responsável cadastrado.");
      return;
    }
    if (!slotOpt) {
      triggerToast("Selecione uma faixa de horário válida.");
      if (DOM.secSchedSlotSelect) DOM.secSchedSlotSelect.focus();
      return;
    }
    const slotSpan = slotOpt ? parseInt(slotOpt.getAttribute("data-span") || "2") : 2;
    const slotStart = DOM.secSchedSlotSelect ? DOM.secSchedSlotSelect.value : "M1";

    const newSchedule = {
      id: "sch-custom-" + Date.now(),
      day: parseInt(DOM.secSchedDaySelect.value),
      shift: DOM.secSchedShiftSelect.value,
      slotStart: slotStart,
      slotSpan: slotSpan,
      startTime: slotOpt.getAttribute("data-start"),
      endTime: slotOpt.getAttribute("data-end"),
      disciplineId: discipline.id,
      disciplineName: discipline.name,
      courseId: getCourseIdForClass(DOM.secSchedClassSelect.value),
      classId: DOM.secSchedClassSelect.value,
      teacherIds,
      theme: DOM.secSchedThemeSelect ? DOM.secSchedThemeSelect.value : "emerald",
      obs: (DOM.secSchedObsInput && DOM.secSchedObsInput.value.trim()) ? DOM.secSchedObsInput.value.trim() : "Horário cadastrado pela coordenação acadêmica."
    };

    // VERIFICAÇÃO DE CHOQUE DE HORÁRIOS (Docente e Turma)
    const conflictResult = DataService.checkConflict(newSchedule);

    if (conflictResult.hasConflict) {
      if (DOM.sectionSchedConflictAlert) {
        DOM.sectionSchedConflictAlert.style.display = "block";
        DOM.sectionSchedConflictAlert.innerHTML = `
          <div class="choque-conflict-header">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>Bloqueio por Choque de Horários (${conflictResult.conflicts.length})</span>
          </div>
          <div class="choque-conflict-list">
            ${conflictResult.conflicts.map(c => `
              <div class="choque-conflict-item">
                <span class="choque-badge-type">${c.title || 'Choque'}</span>
                <span>${c.message}</span>
              </div>
            `).join("")}
          </div>
          <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-secondary" id="btnSecAjustarChoque">Ajustar Dia / Horário</button>
            <button type="button" class="btn btn-sm btn-primary" id="btnSecForcarChoque">Salvar Mesmo Com Choque</button>
          </div>
        `;

        document.getElementById("btnSecAjustarChoque").addEventListener("click", () => {
          DOM.sectionSchedConflictAlert.style.display = "none";
          if (DOM.secSchedDaySelect) DOM.secSchedDaySelect.focus();
        });

        document.getElementById("btnSecForcarChoque").addEventListener("click", () => {
          DOM.sectionSchedConflictAlert.style.display = "none";
          commitSectionSchedule(newSchedule);
        });

        DOM.sectionSchedConflictAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      return;
    }

    // Sem choque: salvar diretamente
    if (DOM.sectionSchedConflictAlert) DOM.sectionSchedConflictAlert.style.display = "none";
    commitSectionSchedule(newSchedule);
  }

  function commitSectionSchedule(scheduleItem) {
    DataService.addSchedule(scheduleItem);
    if (DOM.secSchedDisciplineSelect) DOM.secSchedDisciplineSelect.value = "";
    syncSectionTeacherFromDiscipline();
    if (DOM.secSchedObsInput) DOM.secSchedObsInput.value = "";
    if (DOM.sectionSchedConflictAlert) DOM.sectionSchedConflictAlert.style.display = "none";

    updateBadgesCounts();
    updateAdminCounts();
    populateDynamicDropdownFilters();
    renderAdminSchedulesTable();
    renderEntitySelector(state.queryType);
    showLoadingAndRender();
    triggerToast(`Aula de "${scheduleItem.disciplineName}" cadastrada com sucesso!`);
  }

  // ==========================================================================
  // SEÇÃO HORÁRIOS: TABELA GERENCIAL & REMOÇÃO
  // ==========================================================================
  function renderAdminSchedulesTable() {
    if (!DOM.adminSchedulesTableBody) return;
    const all = DataService.getAllSchedules();
    const weekDays = DataService.getWeekDays();
    const query = DOM.adminSchedSearchInput ? DOM.adminSchedSearchInput.value.toLowerCase().trim() : "";
    const filterDay = DOM.adminSchedFilterDay ? DOM.adminSchedFilterDay.value : "all";
    const filterShift = DOM.adminSchedFilterShift ? DOM.adminSchedFilterShift.value : "all";

    const filtered = all.filter(item => {
      if (filterDay !== "all" && String(item.day) !== String(filterDay)) return false;
      if (filterShift !== "all" && item.shift !== filterShift) return false;

      if (query) {
        const teachers = getScheduleTeacherIds(item).map(id => DataService.getTeacherById(id)).filter(Boolean);
        const cls = DataService.getClassById(item.classId);

        const matchDisc = item.disciplineName.toLowerCase().includes(query);
        const matchProf = teachers.some(teacher => teacher.name.toLowerCase().includes(query));
        const matchClass = cls && cls.name.toLowerCase().includes(query);

        if (!matchDisc && !matchProf && !matchClass) return false;
      }
      return true;
    });

    // Ordena por dia, turno, horário
    filtered.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.startTime.localeCompare(b.startTime);
    });

    if (filtered.length === 0) {
      DOM.adminSchedulesTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Nenhum horário acadêmico encontrado com os filtros aplicados.
          </td>
        </tr>
      `;
      return;
    }

    DOM.adminSchedulesTableBody.innerHTML = filtered.map(item => {
      const day = weekDays.find(d => d.id === item.day);
      const teachers = getScheduleTeacherIds(item).map(id => DataService.getTeacherById(id)).filter(Boolean);
      const cls = DataService.getClassById(item.classId);

      return `
        <tr>
          <td>
            <strong>${day ? day.short : ''}</strong>
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${capitalize(item.shift)}</span>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary-dark);">${item.startTime} - ${item.endTime}</span>
          </td>
          <td><strong>${escapeHtml(item.disciplineName)}</strong></td>
          <td>
            <span class="admin-class-badge">${cls ? cls.code : '—'}</span>
          </td>
          <td>
            ${teachers.length ? teachers.map(teacher => escapeHtml(teacher.name)).join(" / ") : "—"}
          </td>
          <td class="text-right">
            <button type="button" class="btn-delete-row" data-delete-sched-id="${item.id}" title="Remover este horário acadêmico">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Remover
            </button>
          </td>
        </tr>
      `;
    }).join("");

    // Adiciona evento de exclusão aos botões da tabela
    DOM.adminSchedulesTableBody.querySelectorAll(".btn-delete-row").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-delete-sched-id");
        const schedItem = all.find(s => s.id === id);
        if (!schedItem) return;

        if (confirm(`Deseja remover o horário de "${schedItem.disciplineName}" da grade acadêmica?`)) {
          DataService.deleteSchedule(id);
          updateBadgesCounts();
          updateAdminCounts();
          populateDynamicDropdownFilters();
          renderAdminSchedulesTable();
          renderEntitySelector(state.queryType);
          showLoadingAndRender();
          triggerToast("Horário acadêmico removido com sucesso.");
        }
      });
    });
  }

  // ==========================================================================
  // SEÇÃO PROFESSORES: CADASTRO, TABELA GERENCIAL & REMOÇÃO
  // ==========================================================================
  function handleSectionAddTeacher(e) {
    e.preventDefault();
    const name = DOM.secTeacherNameInput ? DOM.secTeacherNameInput.value.trim() : "";
    const email = DOM.secTeacherEmailInput ? DOM.secTeacherEmailInput.value.trim() : "";
    const title = DOM.secTeacherTitleInput ? DOM.secTeacherTitleInput.value : "Mestre";
    const areasRaw = DOM.secTeacherAreasInput ? DOM.secTeacherAreasInput.value.trim() : "";

    if (!name || !email) {
      triggerToast("Por favor, preencha o nome e o e-mail institucional do docente.");
      return;
    }

    const areas = areasRaw ? areasRaw.split(",").map(a => a.trim()).filter(Boolean) : ["Docência"];

    const newTeacher = {
      id: "prof-custom-" + Date.now(),
      name: name,
      title: title,
      department: "Campus Monteiro",
      email: email,
      areas: areas,
      isCustom: true
    };

    DataService.addTeacher(newTeacher);

    if (DOM.secTeacherNameInput) DOM.secTeacherNameInput.value = "";
    if (DOM.secTeacherEmailInput) DOM.secTeacherEmailInput.value = "";
    if (DOM.secTeacherAreasInput) DOM.secTeacherAreasInput.value = "";

    updateBadgesCounts();
    updateAdminCounts();
    populateSectionScheduleDropdowns();
    populateAddScheduleDropdowns();
    populateDynamicDropdownFilters();
    renderAdminTeachersTable();
    renderEntitySelector(state.queryType);
    triggerToast(`Professor(a) "${newTeacher.name}" cadastrado(a) com sucesso!`);
  }

  function renderAdminTeachersTable() {
    if (!DOM.adminTeachersTableBody) return;
    const teachers = DataService.getTeachers();
    const allSchedules = DataService.getAllSchedules();
    const query = DOM.adminTeacherSearchInput ? DOM.adminTeacherSearchInput.value.toLowerCase().trim() : "";

    const filtered = teachers.filter(t => {
      if (!query) return true;
      return t.name.toLowerCase().includes(query) ||
        t.department.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query) ||
        t.areas.some(a => a.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      DOM.adminTeachersTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Nenhum docente encontrado com os critérios de busca.
          </td>
        </tr>
      `;
      return;
    }

    DOM.adminTeachersTableBody.innerHTML = filtered.map(t => {
      const teacherSchedules = allSchedules.filter(s => getScheduleTeacherIds(s).includes(t.id));
      const scheduleCount = teacherSchedules.length;

      return `
        <tr>
          <td>
            <strong>${escapeHtml(t.name)}</strong>
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${escapeHtml(t.areas.slice(0, 3).join(", "))}</span>
          </td>
          <td>
            <span>${escapeHtml(t.title || "Docente")}</span>
          </td>
          <td>
            <span style="font-size: 0.8rem;">${escapeHtml(t.department ? t.department.replace("Unidade Acadêmica de ", "U.A. ") : "Não informado")}</span>
          </td>
          <td>
            ${t.email ? `<a href="mailto:${escapeHtml(t.email)}" style="font-size: 0.82rem; font-family: var(--font-mono);">${escapeHtml(t.email)}</a>` : "Não informado"}
          </td>
          <td>
            <span class="admin-class-badge" title="${scheduleCount} aulas registradas na grade">${scheduleCount} ${scheduleCount === 1 ? 'aula' : 'aulas'}</span>
          </td>
          <td class="text-right">
            <button type="button" class="btn-delete-row" data-delete-teacher-id="${t.id}" title="Remover este professor">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Remover
            </button>
          </td>
        </tr>
      `;
    }).join("");

    // Adiciona evento de exclusão aos botões da tabela de professores
    DOM.adminTeachersTableBody.querySelectorAll(".btn-delete-row").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-delete-teacher-id");
        const teacher = teachers.find(t => t.id === id);
        if (!teacher) return;

        const deleteResult = DataService.deleteTeacher(id);
        if (!deleteResult.success) {
          alert(`Bloqueio de Exclusão: ${deleteResult.reason}`);
          return;
        }

        updateBadgesCounts();
        updateAdminCounts();
        populateSectionScheduleDropdowns();
        populateAddScheduleDropdowns();
        populateDynamicDropdownFilters();
        renderAdminTeachersTable();
        renderEntitySelector(state.queryType);
        triggerToast(`Professor(a) "${teacher.name}" removido(a) com sucesso.`);
      });
    });
  }

  function handleSectionAddDiscipline(e) {
    e.preventDefault();
    const name = DOM.secDisciplineNameInput ? DOM.secDisciplineNameInput.value.trim() : "";
    const workload = DOM.secDisciplineWorkloadInput ? Number(DOM.secDisciplineWorkloadInput.value) : NaN;
    const teacherId = DOM.secDisciplineTeacherSelect ? DOM.secDisciplineTeacherSelect.value : "";

    if (!name) {
      triggerToast("Informe o nome da disciplina.");
      if (DOM.secDisciplineNameInput) DOM.secDisciplineNameInput.focus();
      return;
    }
    if (!Number.isInteger(workload) || workload < 1) {
      triggerToast("Informe uma carga horária válida, em horas inteiras.");
      if (DOM.secDisciplineWorkloadInput) DOM.secDisciplineWorkloadInput.focus();
      return;
    }
    if (!DataService.getTeacherById(teacherId)) {
      triggerToast("Selecione o professor responsável pela disciplina.");
      if (DOM.secDisciplineTeacherSelect) DOM.secDisciplineTeacherSelect.focus();
      return;
    }

    const tag = DOM.secDisciplineTagInput ? DOM.secDisciplineTagInput.value.trim() : "";
    const result = DataService.addDiscipline({
      name,
      ch: `${workload}h`,
      tag: tag || "geral",
      teacherId
    });
    if (!result.success) {
      triggerToast(result.reason);
      if (DOM.secDisciplineNameInput) DOM.secDisciplineNameInput.focus();
      return;
    }

    if (DOM.secDisciplineNameInput) DOM.secDisciplineNameInput.value = "";
    if (DOM.secDisciplineWorkloadInput) DOM.secDisciplineWorkloadInput.value = "";
    if (DOM.secDisciplineTagInput) DOM.secDisciplineTagInput.value = "";
    populateSectionScheduleDropdowns();
    populateAddScheduleDropdowns();
    updateAdminCounts();
    renderAdminDisciplinesTable();
    triggerToast(`Disciplina "${result.discipline.name}" cadastrada com sucesso.`);
  }

  function renderAdminDisciplinesTable() {
    if (!DOM.adminDisciplinesTableBody) return;
    const editingId = DOM.adminDisciplinesTableBody.dataset.editingId || "";
    const query = DOM.adminDisciplineSearchInput
      ? DOM.adminDisciplineSearchInput.value.toLocaleLowerCase("pt-BR").trim()
      : "";
    const disciplines = DataService.getDisciplines().filter(discipline => {
      const teacherIds = getDisciplineTeacherIds(discipline);
      const teacherNames = teacherIds.map(id => DataService.getTeacherById(id))
        .filter(Boolean).map(teacher => teacher.name);
      const searchable = [
        discipline.name,
        discipline.tag || "",
        teacherNames.join(" ")
      ].join(" ").toLocaleLowerCase("pt-BR");
      return !query || searchable.includes(query);
    });

    if (disciplines.length === 0) {
      DOM.adminDisciplinesTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Nenhuma disciplina encontrada.
          </td>
        </tr>
      `;
      return;
    }

    DOM.adminDisciplinesTableBody.innerHTML = disciplines.map(discipline => {
      const teacherIds = getDisciplineTeacherIds(discipline);
      const teacherNames = teacherIds.map(id => DataService.getTeacherById(id))
        .filter(Boolean).map(teacher => teacher.name);
      if (discipline.id === editingId) {
        const workload = parseInt(discipline.ch, 10) || "";
        const teacherOptions = DataService.getTeachers().map(teacher =>
          `<option value="${escapeHtml(teacher.id)}" ${teacherIds.includes(teacher.id) ? "selected" : ""}>${escapeHtml(teacher.name)}</option>`
        ).join("");
        return `
          <tr data-discipline-id="${escapeHtml(discipline.id)}">
            <td><strong>${escapeHtml(discipline.name)}</strong></td>
            <td>
              <input type="number" min="1" step="1" class="input-clean admin-discipline-workload" value="${workload}" aria-label="Carga horária de ${escapeHtml(discipline.name)}">
            </td>
            <td>
              <input type="text" class="input-clean admin-discipline-tag" value="${escapeHtml(discipline.tag || "")}" aria-label="Área ou categoria de ${escapeHtml(discipline.name)}">
            </td>
            <td>
              <select class="filter-select admin-discipline-teacher" aria-label="Professor responsável por ${escapeHtml(discipline.name)}">
                <option value="">Selecione um professor</option>
                ${teacherOptions}
              </select>
            </td>
            <td class="text-right">
              <button type="button" class="btn-edit-row" data-action="save-discipline" data-id="${escapeHtml(discipline.id)}">Salvar</button>
              <button type="button" class="btn-delete-row" data-action="cancel-discipline" data-id="${escapeHtml(discipline.id)}">Cancelar</button>
            </td>
          </tr>
        `;
      }
      return `
        <tr data-discipline-id="${escapeHtml(discipline.id)}">
          <td><strong>${escapeHtml(discipline.name)}</strong></td>
          <td>${escapeHtml(discipline.ch || "—")}</td>
          <td>${escapeHtml(discipline.tag || "—")}</td>
          <td>${escapeHtml(teacherNames.length ? teacherNames.join(" / ") : "—")}</td>
          <td class="text-right">
            <button type="button" class="btn-edit-row" data-action="edit-discipline" data-id="${escapeHtml(discipline.id)}">Editar</button>
            <button type="button" class="btn-delete-row" data-action="delete-discipline" data-id="${escapeHtml(discipline.id)}">Remover</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  function populateAddScheduleDropdowns() {
    const classes = DataService.getClasses();

    if (DOM.schedClassSelect) {
      DOM.schedClassSelect.innerHTML = classes.map(c => 
        `<option value="${c.id}" data-course="${c.courseId}" data-shift="${c.shift}">${c.name}</option>`
      ).join("");
    }

    populateScheduleDisciplineOptions(DOM.schedDisciplineSelect);
    syncTeacherFromDiscipline();

    // Ajusta o turno padrão com base na turma
    const selectedClass = classes.find(c => c.id === (DOM.schedClassSelect ? DOM.schedClassSelect.value : ""));
    if (selectedClass && DOM.schedShiftSelect) {
      DOM.schedShiftSelect.value = selectedClass.shift;
    }

    updateSlotOptions();
  }

  function updateSlotOptions() {
    if (!DOM.schedShiftSelect || !DOM.schedSlotSelect) return;
    const shift = DOM.schedShiftSelect.value;
    const slots = DataService.getShifts().find(item => item.id === shift)?.slots || [];
    DOM.schedSlotSelect.innerHTML = slots.map(slot =>
      `<option value="${slot.id}" data-span="1" data-start="${slot.start}" data-end="${slot.end}">${slot.label}: ${slot.time}</option>`
    ).join("");
  }

  function openAddScheduleModal() {
    if (!state.isAdmin) {
      triggerToast("Acesso restrito. Faça login como administrador para adicionar horários.");
      openLoginModal();
      return;
    }

    populateAddScheduleDropdowns();
    if (DOM.addSchedConflictBox) DOM.addSchedConflictBox.style.display = "none";
    if (DOM.schedDisciplineSelect) DOM.schedDisciplineSelect.value = "";
    syncTeacherFromDiscipline();
    if (DOM.schedObsInput) DOM.schedObsInput.value = "";

    if (DOM.adminAddScheduleModal) {
      DOM.adminAddScheduleModal.style.display = "flex";
      document.body.style.overflow = "hidden";
      setTimeout(() => DOM.schedDisciplineSelect && DOM.schedDisciplineSelect.focus(), 100);
    }
  }

  function closeAddScheduleModal() {
    if (DOM.adminAddScheduleModal) {
      DOM.adminAddScheduleModal.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  function handleSaveSchedule(e) {
    e.preventDefault();
    const discipline = DOM.schedDisciplineSelect
      ? DataService.getDisciplineById(DOM.schedDisciplineSelect.value)
      : null;
    if (!discipline) {
      triggerToast("Selecione uma disciplina cadastrada antes de criar o horário.");
      if (DOM.schedDisciplineSelect) DOM.schedDisciplineSelect.focus();
      return;
    }

    const slotOpt = DOM.schedSlotSelect.selectedOptions[0];
    const teacherIds = getDisciplineTeacherIds(discipline, DOM.schedClassSelect.value);
    if (teacherIds.length === 0 || teacherIds.some(id => !DataService.getTeacherById(id))) {
      triggerToast("A disciplina selecionada não possui um professor responsável cadastrado.");
      return;
    }
    if (!slotOpt) {
      triggerToast("Selecione uma faixa de horário válida.");
      if (DOM.schedSlotSelect) DOM.schedSlotSelect.focus();
      return;
    }
    const slotSpan = slotOpt ? parseInt(slotOpt.getAttribute("data-span") || "2") : 2;
    const slotStart = DOM.schedSlotSelect.value || "M1";

    const newSchedule = {
      id: "sch-custom-" + Date.now(),
      day: parseInt(DOM.schedDaySelect.value),
      shift: DOM.schedShiftSelect.value,
      slotStart: slotStart,
      slotSpan: slotSpan,
      startTime: slotOpt.getAttribute("data-start"),
      endTime: slotOpt.getAttribute("data-end"),
      disciplineId: discipline.id,
      disciplineName: discipline.name,
      courseId: getCourseIdForClass(DOM.schedClassSelect.value),
      classId: DOM.schedClassSelect.value,
      teacherIds,
      theme: DOM.schedThemeSelect ? DOM.schedThemeSelect.value : "emerald",
      obs: (DOM.schedObsInput && DOM.schedObsInput.value.trim()) ? DOM.schedObsInput.value.trim() : "Horário cadastrado pela coordenação acadêmica."
    };

    // Verificação inteligente de conflito de docente e turma
    const conflictResult = DataService.checkConflict(newSchedule);
    if (conflictResult.hasConflict) {
      if (DOM.addSchedConflictBox) {
        DOM.addSchedConflictBox.style.display = "block";
        DOM.addSchedConflictBox.innerHTML = `
          <strong>⚠️ Atenção: Conflito de Horário Detectado!</strong>
          ${conflictResult.conflicts.map(c => `<div>• ${c.message}</div>`).join("")}
          <div style="margin-top: 10px; display: flex; gap: 8px;">
            <button type="button" class="btn btn-sm btn-primary" id="btnForceSaveSched">Confirmar e Salvar Mesmo Assim</button>
            <button type="button" class="btn btn-sm btn-secondary" id="btnCancelConflict">Ajustar Dados</button>
          </div>
        `;

        document.getElementById("btnForceSaveSched").addEventListener("click", () => {
          commitSaveSchedule(newSchedule);
        });
        document.getElementById("btnCancelConflict").addEventListener("click", () => {
          DOM.addSchedConflictBox.style.display = "none";
        });
      }
      return;
    }

    commitSaveSchedule(newSchedule);
  }

  function commitSaveSchedule(scheduleItem) {
    DataService.addSchedule(scheduleItem);
    closeAddScheduleModal();
    updateBadgesCounts();
    updateAdminCounts();
    populateDynamicDropdownFilters();
    renderEntitySelector(state.queryType);
    showLoadingAndRender();
    triggerToast(`Aula de "${scheduleItem.disciplineName}" inserida com sucesso!`);
  }

  function handleDeleteSchedule() {
    if (!state.activeDetailScheduleId) return;
    const all = DataService.getAllSchedules();
    const item = all.find(s => s.id === state.activeDetailScheduleId);
    if (!item) return;

    if (confirm(`Tem certeza que deseja remover o horário de "${item.disciplineName}" da grade acadêmica?`)) {
      DataService.deleteSchedule(state.activeDetailScheduleId);
      closeClassDetailModal();
      updateBadgesCounts();
      populateDynamicDropdownFilters();
      renderEntitySelector(state.queryType);
      showLoadingAndRender();
      triggerToast("Horário acadêmico excluído com sucesso.");
    }
  }
  function resetScheduleFilters(showToast = true) {
    state.filters.search = "";
    state.filters.day = "all";
    state.filters.teacher = "all";

    if (DOM.filterSearchInput) DOM.filterSearchInput.value = "";
    if (DOM.filterSearchClearBtn) DOM.filterSearchClearBtn.style.display = "none";
    if (DOM.filterDaySelect) DOM.filterDaySelect.value = "all";
    if (DOM.filterTeacherSelect) DOM.filterTeacherSelect.value = "all";

    // Reseta abas de dias no mobile
    DOM.mobileDayButtons.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-day") === "all");
    });

    renderScheduleView();

    if (showToast) {
      triggerToast("Filtros de consulta resetados.");
    }
  }

  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================
  function triggerToast(message) {
    if (window.HIFPBToast) window.HIFPBToast.show(message);
  }

  // ==========================================================================
  // CONFIGURAÇÃO DE EVENT LISTENERS
  // ==========================================================================
  function setupEventListeners() {
    document.querySelectorAll('.footer-link-btn[data-action="pickCourse"]').forEach(button => {
      button.addEventListener("click", () => {
        const courseId = button.getAttribute("data-id");
        if (courseId && DataService.getCourseById(courseId)) {
          openEntitySelector("curso");
          selectEntity("curso", courseId);
        }
      });
    });

    // 1. Alternância entre abas de consulta (Turma, Curso, Professor)
    DOM.queryTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const type = tab.getAttribute("data-type");
        const isSameActiveTab = tab.classList.contains("active");
        if (isSameActiveTab && state.selectorOpen) {
          closeEntitySelector();
          return;
        }
        state.selectorFilterText = "";
        if (DOM.selectorSearchInput) DOM.selectorSearchInput.value = "";
        if (DOM.selectorSearchClearBtn) DOM.selectorSearchClearBtn.style.display = "none";
        openEntitySelector(type);
      });
    });

    // 2. Filtro rápido dentro da lista de seleção
    if (DOM.selectorSearchInput) {
      DOM.selectorSearchInput.addEventListener("input", (e) => {
        state.selectorFilterText = e.target.value;
        if (DOM.selectorSearchClearBtn) {
          DOM.selectorSearchClearBtn.style.display = state.selectorFilterText ? "block" : "none";
        }
        renderEntitySelector(state.queryType);
      });
    }

    if (DOM.selectorSearchClearBtn) {
      DOM.selectorSearchClearBtn.addEventListener("click", () => {
        DOM.selectorSearchInput.value = "";
        state.selectorFilterText = "";
        DOM.selectorSearchClearBtn.style.display = "none";
        renderEntitySelector(state.queryType);
      });
    }

    // 3. Botão para voltar à seleção / trocar consulta
    if (DOM.btnBackToSelection) {
      DOM.btnBackToSelection.addEventListener("click", () => {
        openEntitySelector(state.queryType);
        if (DOM.selectorPanel) {
          DOM.selectorPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    if (DOM.breadcrumbHome) {
      DOM.breadcrumbHome.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // 4. Impressão / Salvar PDF
    if (DOM.btnPrintSchedule) {
      DOM.btnPrintSchedule.addEventListener("click", () => {
        triggerToast("Preparando documento para impressão / PDF...");
        setTimeout(() => {
          window.print();
        }, 300);
      });
    }

    // 5. Pesquisa em tempo real na grade de horários
    if (DOM.filterSearchInput) {
      DOM.filterSearchInput.addEventListener("input", (e) => {
        state.filters.search = e.target.value;
        if (DOM.filterSearchClearBtn) {
          DOM.filterSearchClearBtn.style.display = state.filters.search ? "block" : "none";
        }
        renderScheduleView();
      });
    }

    if (DOM.filterSearchClearBtn) {
      DOM.filterSearchClearBtn.addEventListener("click", () => {
        DOM.filterSearchInput.value = "";
        state.filters.search = "";
        DOM.filterSearchClearBtn.style.display = "none";
        renderScheduleView();
      });
    }

    // 6. Filtros dropdown (Dia, Professor)
    if (DOM.filterDaySelect) {
      DOM.filterDaySelect.addEventListener("change", (e) => {
        state.filters.day = e.target.value;
        // Sincroniza com as abas de dia mobile
        DOM.mobileDayButtons.forEach(btn => {
          btn.classList.toggle("active", btn.getAttribute("data-day") === state.filters.day);
        });
        renderScheduleView();
      });
    }

    if (DOM.filterTeacherSelect) {
      DOM.filterTeacherSelect.addEventListener("change", (e) => {
        state.filters.teacher = e.target.value;
        renderScheduleView();
      });
    }

    // 7. Botão Limpar Filtros
    if (DOM.btnClearFilters) {
      DOM.btnClearFilters.addEventListener("click", () => {
        resetScheduleFilters(true);
      });
    }

    if (DOM.btnEmptyReset) {
      DOM.btnEmptyReset.addEventListener("click", () => {
        resetScheduleFilters(true);
      });
    }

    // 8. Alternar entre Modo Tabela e Modo Lista
    if (DOM.btnViewTable) {
      DOM.btnViewTable.addEventListener("click", () => {
        if (state.viewMode === "table") return;
        state.viewMode = "table";
        DOM.btnViewTable.classList.add("active");
        DOM.btnViewTable.setAttribute("aria-checked", "true");
        DOM.btnViewList.classList.remove("active");
        DOM.btnViewList.setAttribute("aria-checked", "false");
        showLoadingAndRender();
      });
    }

    if (DOM.btnViewList) {
      DOM.btnViewList.addEventListener("click", () => {
        if (state.viewMode === "list") return;
        state.viewMode = "list";
        DOM.btnViewList.classList.add("active");
        DOM.btnViewList.setAttribute("aria-checked", "true");
        DOM.btnViewTable.classList.remove("active");
        DOM.btnViewTable.setAttribute("aria-checked", "false");
        showLoadingAndRender();
      });
    }

    // 9. Abas de Seleção de Dia no Celular
    DOM.mobileDayButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const day = btn.getAttribute("data-day");
        state.filters.day = day;
        DOM.filterDaySelect.value = day;
        DOM.mobileDayButtons.forEach(b => b.classList.toggle("active", b === btn));
        renderScheduleView();
      });
    });

    // 10. Fechamento do Modal
    if (DOM.modalCloseBtn) {
      DOM.modalCloseBtn.addEventListener("click", closeClassDetailModal);
    }
    if (DOM.modalCloseBtnAction) {
      DOM.modalCloseBtnAction.addEventListener("click", closeClassDetailModal);
    }
    if (DOM.classDetailModal) {
      DOM.classDetailModal.addEventListener("click", (e) => {
        if (e.target === DOM.classDetailModal) {
          closeClassDetailModal();
        }
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && DOM.classDetailModal.style.display === "flex") {
        closeClassDetailModal();
      }
    });

    // 11. Links do Rodapé (Atalhos diretos para cursos)
    document.querySelectorAll(".footer-link-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const courseId = btn.getAttribute("data-id");
        openEntitySelector("curso");
        selectEntity("curso", courseId, true);
      });
    });

    // 12. Gestão Administrativa e Autenticação
    if (DOM.btnNavAdminLogin) {
      DOM.btnNavAdminLogin.addEventListener("click", openLoginModal);
    }
    if (DOM.govAdminBtn) {
      DOM.govAdminBtn.addEventListener("click", () => {
        if (state.isAdmin) {
          if (DOM.adminPanelSection) {
            DOM.adminPanelSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        } else {
          openLoginModal();
        }
      });
    }
    // Ações do Painel Administrativo em Seção (Horários, Professores, Sair)
    if (DOM.btnAdminSectionLogout) {
      DOM.btnAdminSectionLogout.addEventListener("click", () => {
        if (confirm("Deseja realmente encerrar a sessão administrativa?")) {
          handleLogout();
        }
      });
    }

    // Alternância de Abas Principais da Seção Admin
    if (DOM.adminTabBtnHorarios) {
      DOM.adminTabBtnHorarios.addEventListener("click", () => {
        DOM.adminTabBtnHorarios.classList.add("active");
        DOM.adminTabBtnHorarios.setAttribute("aria-selected", "true");
        [DOM.adminTabBtnProfessores, DOM.adminTabBtnDisciplinas].forEach(tab => {
          if (tab) {
            tab.classList.remove("active");
            tab.setAttribute("aria-selected", "false");
          }
        });
        if (DOM.adminPanelHorarios) DOM.adminPanelHorarios.style.display = "block";
        if (DOM.adminPanelProfessores) DOM.adminPanelProfessores.style.display = "none";
        if (DOM.adminPanelDisciplinas) DOM.adminPanelDisciplinas.style.display = "none";
      });
    }

    if (DOM.adminTabBtnProfessores) {
      DOM.adminTabBtnProfessores.addEventListener("click", () => {
        DOM.adminTabBtnProfessores.classList.add("active");
        DOM.adminTabBtnProfessores.setAttribute("aria-selected", "true");
        [DOM.adminTabBtnHorarios, DOM.adminTabBtnDisciplinas].forEach(tab => {
          if (tab) {
            tab.classList.remove("active");
            tab.setAttribute("aria-selected", "false");
          }
        });
        if (DOM.adminPanelProfessores) DOM.adminPanelProfessores.style.display = "block";
        if (DOM.adminPanelHorarios) DOM.adminPanelHorarios.style.display = "none";
        if (DOM.adminPanelDisciplinas) DOM.adminPanelDisciplinas.style.display = "none";
        renderAdminTeachersTable();
      });
    }

    if (DOM.adminTabBtnDisciplinas) {
      DOM.adminTabBtnDisciplinas.addEventListener("click", () => {
        DOM.adminTabBtnDisciplinas.classList.add("active");
        DOM.adminTabBtnDisciplinas.setAttribute("aria-selected", "true");
        [DOM.adminTabBtnHorarios, DOM.adminTabBtnProfessores].forEach(tab => {
          if (tab) {
            tab.classList.remove("active");
            tab.setAttribute("aria-selected", "false");
          }
        });
        if (DOM.adminPanelDisciplinas) DOM.adminPanelDisciplinas.style.display = "block";
        if (DOM.adminPanelHorarios) DOM.adminPanelHorarios.style.display = "none";
        if (DOM.adminPanelProfessores) DOM.adminPanelProfessores.style.display = "none";
        populateDisciplineTeacherOptions();
        renderAdminDisciplinesTable();
      });
    }

    // Sub-ações do Módulo Horários
    if (DOM.btnAdminShowNovoHorario) {
      DOM.btnAdminShowNovoHorario.addEventListener("click", () => {
        DOM.btnAdminShowNovoHorario.classList.add("active");
        if (DOM.btnAdminShowVerHorarios) DOM.btnAdminShowVerHorarios.classList.remove("active");
        if (DOM.adminSubViewNovoHorario) DOM.adminSubViewNovoHorario.style.display = "block";
        if (DOM.adminSubViewVerHorarios) DOM.adminSubViewVerHorarios.style.display = "none";
      });
    }

    if (DOM.btnAdminShowVerHorarios) {
      DOM.btnAdminShowVerHorarios.addEventListener("click", () => {
        DOM.btnAdminShowVerHorarios.classList.add("active");
        if (DOM.btnAdminShowNovoHorario) DOM.btnAdminShowNovoHorario.classList.remove("active");
        if (DOM.adminSubViewVerHorarios) DOM.adminSubViewVerHorarios.style.display = "block";
        if (DOM.adminSubViewNovoHorario) DOM.adminSubViewNovoHorario.style.display = "none";
        renderAdminSchedulesTable();
      });
    }

    // Sub-ações do Módulo Professores
    if (DOM.btnAdminShowNovoProfessor) {
      DOM.btnAdminShowNovoProfessor.addEventListener("click", () => {
        DOM.btnAdminShowNovoProfessor.classList.add("active");
        if (DOM.btnAdminShowVerProfessores) DOM.btnAdminShowVerProfessores.classList.remove("active");
        if (DOM.adminSubViewNovoProfessor) DOM.adminSubViewNovoProfessor.style.display = "block";
        if (DOM.adminSubViewVerProfessores) DOM.adminSubViewVerProfessores.style.display = "none";
      });
    }

    if (DOM.btnAdminShowVerProfessores) {
      DOM.btnAdminShowVerProfessores.addEventListener("click", () => {
        DOM.btnAdminShowVerProfessores.classList.add("active");
        if (DOM.btnAdminShowNovoProfessor) DOM.btnAdminShowNovoProfessor.classList.remove("active");
        if (DOM.adminSubViewVerProfessores) DOM.adminSubViewVerProfessores.style.display = "block";
        if (DOM.adminSubViewNovoProfessor) DOM.adminSubViewNovoProfessor.style.display = "none";
        renderAdminTeachersTable();
      });
    }

    if (DOM.btnAdminShowNovaDisciplina) {
      DOM.btnAdminShowNovaDisciplina.addEventListener("click", () => {
        DOM.btnAdminShowNovaDisciplina.classList.add("active");
        if (DOM.btnAdminShowVerDisciplinas) DOM.btnAdminShowVerDisciplinas.classList.remove("active");
        if (DOM.adminSubViewNovaDisciplina) DOM.adminSubViewNovaDisciplina.style.display = "block";
        if (DOM.adminSubViewVerDisciplinas) DOM.adminSubViewVerDisciplinas.style.display = "none";
      });
    }

    if (DOM.btnAdminShowVerDisciplinas) {
      DOM.btnAdminShowVerDisciplinas.addEventListener("click", () => {
        DOM.btnAdminShowVerDisciplinas.classList.add("active");
        if (DOM.btnAdminShowNovaDisciplina) DOM.btnAdminShowNovaDisciplina.classList.remove("active");
        if (DOM.adminSubViewVerDisciplinas) DOM.adminSubViewVerDisciplinas.style.display = "block";
        if (DOM.adminSubViewNovaDisciplina) DOM.adminSubViewNovaDisciplina.style.display = "none";
        renderAdminDisciplinesTable();
      });
    }

    // Formulário de Cadastro de Novo Horário na Seção
    if (DOM.sectionAddScheduleForm) {
      DOM.sectionAddScheduleForm.addEventListener("submit", handleSectionAddSchedule);
      DOM.sectionAddScheduleForm.addEventListener("reset", () => {
        setTimeout(syncSectionTeacherFromDiscipline, 0);
      });
    }
    if (DOM.sectionAddDisciplineForm) {
      DOM.sectionAddDisciplineForm.addEventListener("submit", handleSectionAddDiscipline);
    }
    if (DOM.adminDisciplineSearchInput) {
      DOM.adminDisciplineSearchInput.addEventListener("input", renderAdminDisciplinesTable);
    }
    if (DOM.adminDisciplinesTableBody) {
      DOM.adminDisciplinesTableBody.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const disciplineId = button.dataset.id;
        const action = button.dataset.action;

        if (action === "edit-discipline") {
          DOM.adminDisciplinesTableBody.dataset.editingId = disciplineId;
          renderAdminDisciplinesTable();
          return;
        }

        if (action === "cancel-discipline") {
          delete DOM.adminDisciplinesTableBody.dataset.editingId;
          renderAdminDisciplinesTable();
          return;
        }

        if (action === "delete-discipline") {
          const discipline = DataService.getDisciplineById(disciplineId);
          if (!discipline) return;
          if (!confirm(`Deseja remover a disciplina "${discipline.name}"?`)) return;
          const result = DataService.deleteDiscipline(disciplineId);
          if (!result.success) {
            triggerToast(result.reason);
            return;
          }
          delete DOM.adminDisciplinesTableBody.dataset.editingId;
          updateAdminCounts();
          populateScheduleDisciplineOptions(DOM.secSchedDisciplineSelect);
          populateScheduleDisciplineOptions(DOM.schedDisciplineSelect);
          renderAdminDisciplinesTable();
          triggerToast(`Disciplina "${result.discipline.name}" removida.`);
          return;
        }

        if (action === "save-discipline") {
          const row = button.closest("tr");
          const workloadInput = row.querySelector(".admin-discipline-workload");
          const tagInput = row.querySelector(".admin-discipline-tag");
          const teacherSelect = row.querySelector(".admin-discipline-teacher");
          const result = DataService.updateDiscipline(disciplineId, {
            workload: Number(workloadInput.value),
            tag: tagInput.value,
            teacherId: teacherSelect.value
          });
          if (!result.success) {
            triggerToast(result.reason);
            return;
          }
          delete DOM.adminDisciplinesTableBody.dataset.editingId;
          updateAdminCounts();
          renderAdminSchedulesTable();
          renderScheduleView();
          renderAdminDisciplinesTable();
          triggerToast(`Disciplina "${result.discipline.name}" atualizada.`);
        }
      });
    }
    if (DOM.secSchedDisciplineSelect) {
      DOM.secSchedDisciplineSelect.addEventListener("change", syncSectionTeacherFromDiscipline);
    }
    if (DOM.secSchedClassSelect) {
      DOM.secSchedClassSelect.addEventListener("change", () => {
        const selectedOption = DOM.secSchedClassSelect.selectedOptions[0];
        const shift = selectedOption ? selectedOption.getAttribute("data-shift") : "";
        if (shift && DOM.secSchedShiftSelect) {
          DOM.secSchedShiftSelect.value = shift;
          updateSectionSlotOptions();
        }
        populateScheduleDisciplineOptions(DOM.secSchedDisciplineSelect);
        syncSectionTeacherFromDiscipline();
      });
    }
    if (DOM.secSchedShiftSelect) {
      DOM.secSchedShiftSelect.addEventListener("change", updateSectionSlotOptions);
    }
    if (DOM.adminSchedSearchInput) {
      DOM.adminSchedSearchInput.addEventListener("input", renderAdminSchedulesTable);
    }
    if (DOM.adminSchedFilterDay) {
      DOM.adminSchedFilterDay.addEventListener("change", renderAdminSchedulesTable);
    }
    if (DOM.adminSchedFilterShift) {
      DOM.adminSchedFilterShift.addEventListener("change", renderAdminSchedulesTable);
    }

    // Formulário de Cadastro de Novo Professor na Seção
    if (DOM.sectionAddTeacherForm) {
      DOM.sectionAddTeacherForm.addEventListener("submit", handleSectionAddTeacher);
    }
    if (DOM.adminTeacherSearchInput) {
      DOM.adminTeacherSearchInput.addEventListener("input", renderAdminTeachersTable);
    }
    if (DOM.adminLoginForm) {
      DOM.adminLoginForm.addEventListener("submit", handleLoginSubmit);
    }
    if (DOM.loginModalCloseBtn) {
      DOM.loginModalCloseBtn.addEventListener("click", closeLoginModal);
    }
    if (DOM.loginModalCancelBtn) {
      DOM.loginModalCancelBtn.addEventListener("click", closeLoginModal);
    }
    if (DOM.adminLoginModal) {
      DOM.adminLoginModal.addEventListener("click", (e) => {
        if (e.target === DOM.adminLoginModal) closeLoginModal();
      });
    }
    if (DOM.btnTogglePass && DOM.loginPass) {
      DOM.btnTogglePass.addEventListener("click", () => {
        DOM.loginPass.type = DOM.loginPass.type === "password" ? "text" : "password";
      });
    }
    if (DOM.btnDemoAutofill) {
      DOM.btnDemoAutofill.addEventListener("click", () => {
        if (DOM.loginUser) DOM.loginUser.value = "admin";
        if (DOM.loginPass) DOM.loginPass.value = "admin";
        if (DOM.loginErrorMsg) DOM.loginErrorMsg.style.display = "none";
        triggerToast("Credenciais preenchidas. Clique em 'Entrar como Administrador'.");
        if (DOM.loginPass) DOM.loginPass.focus();
      });
    }

    // Formulário de Cadastro de Novo Horário
    if (DOM.schedClassSelect) {
      DOM.schedClassSelect.addEventListener("change", () => {
        const selectedOption = DOM.schedClassSelect.selectedOptions[0];
        const shift = selectedOption ? selectedOption.getAttribute("data-shift") : "";
        if (shift && DOM.schedShiftSelect) {
          DOM.schedShiftSelect.value = shift;
          updateSlotOptions();
        }
        populateScheduleDisciplineOptions(DOM.schedDisciplineSelect);
        syncTeacherFromDiscipline();
      });
    }
    if (DOM.schedDisciplineSelect) {
      DOM.schedDisciplineSelect.addEventListener("change", syncTeacherFromDiscipline);
    }
    if (DOM.schedShiftSelect) {
      DOM.schedShiftSelect.addEventListener("change", updateSlotOptions);
    }
    if (DOM.addScheduleForm) {
      DOM.addScheduleForm.addEventListener("submit", handleSaveSchedule);
    }
    if (DOM.addSchedModalCloseBtn) {
      DOM.addSchedModalCloseBtn.addEventListener("click", closeAddScheduleModal);
    }
    if (DOM.addSchedCancelBtn) {
      DOM.addSchedCancelBtn.addEventListener("click", closeAddScheduleModal);
    }
    if (DOM.adminAddScheduleModal) {
      DOM.adminAddScheduleModal.addEventListener("click", (e) => {
        if (e.target === DOM.adminAddScheduleModal) closeAddScheduleModal();
      });
    }
    if (DOM.modalDeleteScheduleBtn) {
      DOM.modalDeleteScheduleBtn.addEventListener("click", handleDeleteSchedule);
    }

    // Tecla Escape para modais administrativos
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (DOM.adminLoginModal && DOM.adminLoginModal.style.display === "flex") {
          closeLoginModal();
        }
        if (DOM.adminAddScheduleModal && DOM.adminAddScheduleModal.style.display === "flex") {
          closeAddScheduleModal();
        }
      }
    });
  }

  // ==========================================================================
  // FUNÇÕES AUXILIARES / UTILITÁRIOS
  // ==========================================================================
  function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/[&<>"']/g, (m) => {
      switch (m) {
        case "&": return "&amp;";
        case "<": return "&lt;";
        case ">": return "&gt;";
        case '"': return "&quot;";
        case "'": return "&#039;";
        default: return m;
      }
    });
  }

  function getCategoryIconSvg(category) {
    switch (category) {
      case "turma":
        return `
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        `;
      case "curso":
        return `
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
        `;
      case "professor":
        return `
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="7" r="4"></circle>
            <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"></path>
            <line x1="12" y1="11" x2="12" y2="15"></line>
          </svg>
        `;
      default:
        return "";
    }
  }

  // Executa inicialização da aplicação
  init();
});
