import { AUTH_ROLES } from "../../shared/state/authStore.js";
import { requireRole } from "../../shared/router/requireRole.js";
import { initEmpleados } from "./empleados.controller.js";

window.appFeatureRoutes = window.appFeatureRoutes || [];
window.appFeatureRoutes.push({
  path: "/empleados",
  handler: (container) => {
    if (!requireRole(AUTH_ROLES.OWNER)) {
      return;
    }
    initEmpleados(container);
  },
});