import { initUsuarios } from "./usuarios.controller.js";
import { AUTH_ROLES } from "../../shared/state/authStore.js";
import { requireRole } from "../../shared/router/requireRole.js";

function renderUsuariosRoute(container) {
  if (!requireRole(AUTH_ROLES.OWNER)) {
    return;
  }

  void initUsuarios(container);
}

const existingFeatureRoutes = window.appFeatureRoutes || [];

const hasUsuariosRoute = existingFeatureRoutes.some(
  (routeDefinition) => routeDefinition?.path === "/usuarios",
);

if (!hasUsuariosRoute) {
  existingFeatureRoutes.push({
    path: "/usuarios",
    handler: renderUsuariosRoute,
  });
}

window.appFeatureRoutes = existingFeatureRoutes;
/**
 * Registra la gestión de usuarios para propietarios.
 * @requisito RF-012 Administración de usuarios y roles
 */
