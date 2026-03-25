import {
    AUTH_ROLES,
    limpiarSesion,
    obtenerEstadoAuth,
    resolveAuthUserContext,
} from "../../state/authStore.js";
import { navegarA } from "../../router/router.js";
import { renderLayoutNavigation, renderLayoutShell, renderLayoutUserContext } from "./layout.view.js";

const DEFAULT_LAYOUT_OPTIONS = Object.freeze({
    salonTitle: "Sistema de Gestion del Salon de Belleza",
});

let layoutRoot = null;
let sessionContextContainer = null;
let navContextContainer = null;
let contentContainer = null;
let layoutOptions = { ...DEFAULT_LAYOUT_OPTIONS };
let layoutClickHandler = null;
let hashChangeHandler = null;

function resolveRoleLabel(normalizedRole) {
    if (normalizedRole === AUTH_ROLES.RECEPTIONIST) {
        return "Recepcionista";
    }

    if (normalizedRole === AUTH_ROLES.OWNER) {
        return "Propietario";
    }

    return "Sin rol";
}

function resolveUserContext(authStateOverride = null) {
    const authContext = resolveAuthUserContext(authStateOverride);

    return {
        username: authContext.username,
        roleLabel: resolveRoleLabel(authContext.normalizedRole),
        hasSession: authContext.hasSession,
        isTokenExpired: authContext.isTokenExpired,
        isTokenMalformed: authContext.isTokenMalformed,
        normalizedRole: authContext.normalizedRole,
    };
}


function enforceActiveSession(userContext) {
    if (!userContext?.isTokenExpired && !userContext?.isTokenMalformed) {
        return userContext;
    }

    limpiarSesion();

    if (typeof window !== "undefined") {
        const currentPath = window.location.hash.replace("#", "") || "/";
        if (currentPath !== "/auth") {
            navegarA("/auth");
        }
    }

    return resolveUserContext(obtenerEstadoAuth());
}

function resolveLayoutContainer(container) {
    if (container instanceof Element) {
        return container;
    }

    if (typeof document === "undefined") {
        return null;
    }

    const appContainer = document.querySelector("#app");
    return appContainer instanceof Element ? appContainer : null;
}

function removeLayoutListeners() {
    if (layoutRoot && layoutClickHandler) {
        layoutRoot.removeEventListener("click", layoutClickHandler);
        layoutClickHandler = null;
    }

    if (hashChangeHandler) {
        window.removeEventListener("hashchange", hashChangeHandler);
        hashChangeHandler = null;
    }
}

function registerLayoutListeners() {
    if (!layoutRoot) {
        return;
    }

    layoutClickHandler = (event) => {
        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        // Handle user dropdown menu toggle
        const userMenuButton = target.closest("#layout-user-menu-btn");
        if (userMenuButton) {
            event.preventDefault();
            const dropdown = layoutRoot?.querySelector("#layout-user-dropdown");
            if (dropdown instanceof HTMLElement) {
                const isHidden = dropdown.hasAttribute("hidden");
                if (isHidden) {
                    dropdown.removeAttribute("hidden");
                    userMenuButton.setAttribute("aria-expanded", "true");
                } else {
                    dropdown.setAttribute("hidden", "");
                    userMenuButton.setAttribute("aria-expanded", "false");
                }
            }
            return;
        }

        // Close dropdown when clicking outside
        const userMenu = target.closest(".layout__user-menu-wrapper");
        if (!userMenu) {
            const dropdown = layoutRoot?.querySelector("#layout-user-dropdown");
            if (dropdown instanceof HTMLElement && !dropdown.hasAttribute("hidden")) {
                dropdown.setAttribute("hidden", "");
                const btn = layoutRoot?.querySelector("#layout-user-menu-btn");
                if (btn instanceof HTMLElement) {
                    btn.setAttribute("aria-expanded", "false");
                }
            }
        }

        // Handle logout button
        const logoutButton = target.closest("#layout-logout-btn");
        if (logoutButton) {
            event.preventDefault();

            try {
                limpiarSesion();
            } finally {
                updateLayoutUserContext();
                navegarA("/auth");
            }
        }
    };

    hashChangeHandler = () => {
        updateLayoutUserContext();
    };

    layoutRoot.addEventListener("click", layoutClickHandler);
    window.addEventListener("hashchange", hashChangeHandler);
}

export function updateLayoutUserContext(authState = null) {
    if (!sessionContextContainer) {
        return;
    }

    const userContext = enforceActiveSession(resolveUserContext(authState));
    sessionContextContainer.innerHTML = renderLayoutUserContext(userContext);

    if (navContextContainer) {
        const currentPath = typeof window !== "undefined"
            ? (window.location.hash.replace("#", "") || "/")
            : "/";
        navContextContainer.innerHTML = renderLayoutNavigation({
            userRole: userContext.normalizedRole,
            currentPath,
        });
    }
}

export function mountLayout(container, options = {}) {
    cleanupLayout();

    layoutRoot = resolveLayoutContainer(container);
    if (!layoutRoot) {
        return {
            contentContainer: null,
        };
    }

    layoutOptions = {
        ...DEFAULT_LAYOUT_OPTIONS,
        ...options,
    };

    layoutRoot.innerHTML = renderLayoutShell({
        salonTitle: layoutOptions.salonTitle,
    });

    sessionContextContainer = layoutRoot.querySelector("#layout-session-context");
    navContextContainer = layoutRoot.querySelector("#layout-nav-context");
    contentContainer = layoutRoot.querySelector(".app__content");

    updateLayoutUserContext();
    registerLayoutListeners();

    return {
        contentContainer,
    };
}

export function cleanupLayout() {
    removeLayoutListeners();

    sessionContextContainer = null;
    navContextContainer = null;
    contentContainer = null;
    layoutRoot = null;
}
