import { initUsuarios } from "./usuarios.controller.js";
import { AUTH_ROLES, tieneRol } from "../../shared/state/authStore.js";
import { navegarA } from "../../shared/router/router.js";

function renderUsuariosRoute(container) {
    // Solo OWNER puede acceder a la gestion de usuarios
    if (!tieneRol(AUTH_ROLES.OWNER)) {
        navegarA("/dashboard");
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
