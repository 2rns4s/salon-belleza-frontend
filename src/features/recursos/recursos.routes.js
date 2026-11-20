import { AUTH_ROLES } from "../../shared/state/authStore.js";
import { requireRole } from "../../shared/router/requireRole.js";
import { initRecursos } from "./recursos.controller.js";

window.appFeatureRoutes = window.appFeatureRoutes || [];
window.appFeatureRoutes.push({
  path: "/recursos",
  handler: (container) => {
    if (!requireRole(AUTH_ROLES.OWNER)) {
      return;
    }
    initRecursos(container);
  },
});
/**
 * Limita la gestión de recursos físicos al propietario.
 * @requisito RF-003 Gestión de recursos físicos
 */
