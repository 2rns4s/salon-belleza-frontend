import { iniciarRouter, navegarA, registrarRuta } from "../shared/router/router.js";
import { limpiarSesion } from "../shared/state/authStore.js";
import { setUnauthorizedHandler } from "../shared/services/httpClient.js";

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

    setUnauthorizedHandler(() => {
        limpiarSesion();

        const currentPath = window.location.hash.replace("#", "") || "/";
        if (currentPath !== "/auth") {
            navegarA("/auth");
        }
    });

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

