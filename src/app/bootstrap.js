import { iniciarRouter, registrarRuta } from "../shared/router/router.js";

function renderDashboardPlaceholder(container) {
    container.innerHTML = "<p class=\"app__text\">Autenticación completada correctamente. Panel principal pendiente de implementación.</p>";
}

function renderNotFound(container) {
    container.innerHTML = "<p class=\"app__text\">ruta no encontrada.</p>";
}

export function initializeApp() {
    const appContent = document.querySelector(".app__content");

    if (!appContent) {
        return;
    }

    registrarRuta("/dashboard", () => renderDashboardPlaceholder(appContent));
    registrarRuta("/404", () => renderNotFound(appContent));

    const featureRoutes = window.appFeatureRoutes || [];
    featureRoutes.forEach((routeDefinition) => {
        if (!routeDefinition) {
            return;
        }

        const { path, handler } = routeDefinition;
        if (typeof path === "string" && typeof handler === "function") {
            registrarRuta(path, handler);
        }
    });

    iniciarRouter();
}

