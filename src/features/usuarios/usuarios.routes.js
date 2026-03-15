import { initUsuarios } from "./usuarios.controller.js";

function renderUsuariosRoute() {
    void initUsuarios();
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
