import { initCitas } from "./citas.controller.js";
import { requireAuth } from "../../shared/router/requireAuth.js";

function renderCitasRoute() {
  if (!requireAuth()) return;

  initCitas();
}

const existingFeatureRoutes = window.appFeatureRoutes || [];

const hasCitasRoute = existingFeatureRoutes.some((routeDefinition) => routeDefinition?.path === "/citas");
if (!hasCitasRoute) {
  existingFeatureRoutes.push({
    path: "/citas",
    handler: renderCitasRoute,
  });
}

window.appFeatureRoutes = existingFeatureRoutes;
/**
 * Protege la entrada al módulo de agenda.
 * @requisito RF-008 Registro de citas
 */
