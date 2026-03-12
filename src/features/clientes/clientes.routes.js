import { initClientes } from "./clientes.controller.js";

function renderClientesRoute() {
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
