import { initUserSettings } from "./user-settings.controller.js";
import { requireAuth } from "../../shared/router/requireAuth.js";

/**
 * Handler para la ruta user-settings
 * Protegida: solo usuarios autenticados
 */
function renderUserSettingsRoute(container) {
  if (!requireAuth()) return;

  void initUserSettings(container);
}

// Registrar la ruta en el sistema global de features
const existingFeatureRoutes = window.appFeatureRoutes || [];

const hasUserSettingsRoute = existingFeatureRoutes.some(
  (routeDefinition) => routeDefinition?.path === "/user-settings",
);

if (!hasUserSettingsRoute) {
  existingFeatureRoutes.push({
    path: "/user-settings",
    handler: renderUserSettingsRoute,
  });
}

window.appFeatureRoutes = existingFeatureRoutes;
