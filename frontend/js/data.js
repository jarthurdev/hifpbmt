/**
 * Compatibilidade temporaria para consumidores externos.
 * O repositorio academico vive em js/academic-repository.js.
 */
(function (global) {
  "use strict";

  if (global.DataService) {
    global.AcademicRepository = global.DataService;
  }
})(window);
