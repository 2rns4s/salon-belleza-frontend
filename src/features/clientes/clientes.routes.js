import { initClientes } from "./clientes.controller.js";
import { requireAuth } from "../../shared/router/requireAuth.js";

function renderClientesRoute() {
  if (!requireAuth()) return;

  void initClientes();
}

const existingFeatureRoutes = window.appFeatureRoutes || [];

const hasClientesRoute = existingFeatureRoutes.some((routeDefinition) => routeDefinition?.path === "/clientes");
if (!hasClientesRoute) {
  existingFeatureRoutes.push({
    path: "/clientes",
    handler: renderClientesRoute,
  });
}

window.appFeatureRoutes = existingFeatureRoutes;
/**
 * Protege la entrada al directorio de clientes.
 * @requisito RF-009 Gestión de clientes
 */
