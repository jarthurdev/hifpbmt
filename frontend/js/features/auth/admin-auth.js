/**
 * Responsabilidade: autenticacao administrativa demonstrativa.
 */
(function (global) {
  "use strict";

  const validUsers = ["admin", "coordenacao", "monteiro"];
  const validPasses = ["admin", "123456", "ifpb2026"];

  const AdminAuth = {
    isAuthenticated() {
      return global.HIFPBStorage
        ? global.HIFPBStorage.get(global.HIFPBStorage.keys.adminLogged) === "true"
        : false;
    },

    login(user, pass) {
      const normalizedUser = String(user || "").trim().toLowerCase();
      const normalizedPass = String(pass || "").trim();

      if (validUsers.includes(normalizedUser) && validPasses.includes(normalizedPass)) {
        global.HIFPBStorage.set(global.HIFPBStorage.keys.adminLogged, "true");
        return true;
      }
      return false;
    },

    logout() {
      global.HIFPBStorage.remove(global.HIFPBStorage.keys.adminLogged);
    }
  };

  global.HIFPBAdminAuth = AdminAuth;
})(window);
