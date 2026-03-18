import { iniciarRouter, navegarA, registrarRuta } from "../shared/router/router.js";
import { limpiarSesion, obtenerToken, rehydrateAuthSession } from "../shared/state/authStore.js";
import { setUnauthorizedHandler } from "../shared/services/httpClient.js";
import { mountLayout, updateLayoutUserContext } from "../shared/components/layout/layout.controller.js";
import "../features/usuarios/usuarios.routes.js";
import "../features/empleados/empleados.routes.js";
import "../features/recursos/recursos.routes.js";
import "../features/servicios/servicios.routes.js";
import "../features/clientes/clientes.routes.js";
import "../features/citas/citas.routes.js";
import "../features/auth/auth.routes.js";

function renderDashboardPlaceholder(container) {
    container.innerHTML = "<p class=\"app__text\">Autenticación completada correctamente. Panel principal pendiente de implementación.</p>";
}

function renderNotFound(container) {
    container.innerHTML = "<p class=\"app__text\">ruta no encontrada.</p>";
}

function resolveAppContentContainer() {
    const appRoot = document.querySelector("#app");

    if (appRoot instanceof Element) {
        const { contentContainer } = mountLayout(appRoot, {
            salonTitle: "Sistema de Gestion del Salon de Belleza",
        });

        if (contentContainer instanceof Element) {
            return contentContainer;
        }
    }

    const fallbackContent = document.querySelector(".app__content");
    return fallbackContent instanceof Element ? fallbackContent : null;
}

function registerBaseRoutes(appContent) {
    registrarRuta("/dashboard", () => {
        updateLayoutUserContext();
        renderDashboardPlaceholder(appContent);
    });

    registrarRuta("/404", () => {
        updateLayoutUserContext();
        renderNotFound(appContent);
    });

    const featureRoutes = window.appFeatureRoutes || [];
    featureRoutes.forEach((routeDefinition) => {
        if (!routeDefinition) {
            return;
        }

        const { path, handler } = routeDefinition;
        if (typeof path === "string" && typeof handler === "function") {
            registrarRuta(path, () => {
                updateLayoutUserContext();
                handler(appContent);
            });
        }
    });
}

export function initializeApp() {
    const tokenBeforeRehydration = obtenerToken();
    rehydrateAuthSession();
    const tokenAfterRehydration = obtenerToken();

    if (tokenBeforeRehydration && !tokenAfterRehydration) {
        const currentPath = window.location.hash.replace("#", "") || "/";
        if (currentPath !== "/auth") {
            navegarA("/auth");
        }
    }

    const appContent = resolveAppContentContainer();

    if (!appContent) {
        return;
    }

    setUnauthorizedHandler(() => {
        limpiarSesion();
        updateLayoutUserContext();

        const currentPath = window.location.hash.replace("#", "") || "/";
        if (currentPath !== "/auth") {
            navegarA("/auth");
        }
    });

    registerBaseRoutes(appContent);

    iniciarRouter();
}

