import { AUTH_ROLES } from "../../shared/state/authStore.js";
import { requireRole } from "../../shared/router/requireRole.js";
import { initServicios } from "./servicios.controller.js";

window.appFeatureRoutes = window.appFeatureRoutes || [];
window.appFeatureRoutes.push({
  path: "/servicios",
  handler: (container) => {
    if (!requireRole(AUTH_ROLES.OWNER)) {
      return;
    }
    initServicios(container);
  },
});
