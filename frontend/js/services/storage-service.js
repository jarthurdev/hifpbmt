/**
 * Persistencia local da aplicacao.
 * Centraliza nomes de chaves e leitura/escrita segura no localStorage.
 */
(function (global) {
  "use strict";

  const STORAGE_KEYS = {
    adminLogged: "hifpb_admin_logged",
    datasetVersion: "hifpb_dataset_version",
    allSchedules: "hifpb_all_schedules",
    customSchedules: "hifpb_custom_schedules",
    allTeachers: "hifpb_all_teachers",
    customTeachers: "hifpb_custom_teachers",
    customDisciplines: "hifpb_custom_disciplines",
    allDisciplines: "hifpb_all_disciplines"
  };

  const StorageService = {
    keys: STORAGE_KEYS,

    get(key) {
      try {
        return global.localStorage ? global.localStorage.getItem(key) : null;
      } catch (error) {
        console.error("Erro ao ler armazenamento local:", error);
        return null;
      }
    },

    set(key, value) {
      try {
        if (global.localStorage) {
          global.localStorage.setItem(key, String(value));
          return true;
        }
      } catch (error) {
        console.error("Erro ao escrever no armazenamento local:", error);
      }
      return false;
    },

    remove(key) {
      try {
        if (global.localStorage) {
          global.localStorage.removeItem(key);
        }
      } catch (error) {
        console.error("Erro ao remover armazenamento local:", error);
      }
    },

    getJson(key) {
      const stored = this.get(key);
      if (!stored) return null;
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Erro ao ler dados JSON locais:", error);
        return null;
      }
    },

    setJson(key, value) {
      try {
        return this.set(key, JSON.stringify(value));
      } catch (error) {
        console.error("Erro ao serializar dados locais:", error);
        return false;
      }
    }
  };

  global.HIFPBStorage = StorageService;
})(window);
