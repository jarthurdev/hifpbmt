const initialState = {
  activeQueryType: "turma",
  selectedEntityId: null,
  activeFilters: { search: "", dayOfWeek: "all", professorId: "all" },
  viewMode: "table",
  semester: "2026.2",
  data: { courses: [], classGroups: [], professors: [], rooms: [], schedules: [] },
  loading: false,
  error: null,
  authentication: { token: null, authenticated: false }
};

let state = structuredClone(initialState);
const listeners = new Set();

export const store = {
  getState: () => state,

  update(updater) {
    state = typeof updater === "function" ? updater(state) : { ...state, ...updater };
    for (const listener of listeners) listener(state);
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setAuthToken(token) {
    this.update(current => ({
      ...current,
      authentication: { token: token || null, authenticated: Boolean(token) }
    }));
  }
};
