import { initCitas } from "./citas.controller.js";

function renderCitasRoute() {
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
