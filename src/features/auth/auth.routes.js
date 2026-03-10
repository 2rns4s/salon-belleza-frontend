import { inicializarAuth } from "./auth.controller.js";

function renderAuthRoute() {
    const appContent = document.querySelector(".app__content");

    if (!appContent) {
        return;
    }

    inicializarAuth(appContent);
}

const existingFeatureRoutes = window.appFeatureRoutes || [];

existingFeatureRoutes.push(
    { path: "/", handler: renderAuthRoute },
    { path: "/auth", handler: renderAuthRoute },
);

window.appFeatureRoutes = existingFeatureRoutes;