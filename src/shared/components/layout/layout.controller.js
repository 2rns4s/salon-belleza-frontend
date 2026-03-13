import {
    AUTH_ROLES,
    limpiarSesion,
    normalizeAuthRole,
    obtenerEstadoAuth,
    obtenerToken,
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

function resolveUnixTimestamp(value) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
}

function isExpiredTokenPayload(tokenPayload) {
    if (!tokenPayload || typeof tokenPayload !== "object") {
        return false;
    }

    const tokenExpiry = resolveUnixTimestamp(tokenPayload.exp);
    if (!tokenExpiry) {
        return false;
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    return tokenExpiry <= currentTimestamp;
}

function decodeBase64Url(base64UrlValue) {
    const normalized = String(base64UrlValue || "")
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    if (!normalized) {
        return "";
    }

    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    const encoded = `${normalized}${padding}`;

    if (typeof atob === "function") {
        return atob(encoded);
    }

    if (typeof Buffer !== "undefined") {
        return Buffer.from(encoded, "base64").toString("binary");
    }

    return "";
}

function decodeJwtPayload(token) {
    try {
        const tokenParts = String(token || "").split(".");
        if (tokenParts.length !== 3) {
            return null;
        }

        const binaryPayload = decodeBase64Url(tokenParts[1]);
        if (!binaryPayload) {
            return null;
        }

        const decodedPayload = decodeURIComponent(
            binaryPayload
                .split("")
                .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
                .join(""),
        );

        return JSON.parse(decodedPayload);
    } catch {
        return null;
    }
}

function sanitizeRoleValue(rawRole) {
    if (typeof rawRole !== "string") {
        return null;
    }

    const normalizedRole = rawRole.trim().toUpperCase();
    if (!normalizedRole) {
        return null;
    }

    return normalizedRole.startsWith("ROLE_") ? normalizedRole.slice(5) : normalizedRole;
}

function extractRoleFromClaim(claimValue) {
    if (typeof claimValue === "string") {
        return sanitizeRoleValue(claimValue);
    }

    if (claimValue && typeof claimValue === "object" && typeof claimValue.authority === "string") {
        return sanitizeRoleValue(claimValue.authority);
    }

    if (!Array.isArray(claimValue)) {
        return null;
    }

    for (const roleItem of claimValue) {
        if (typeof roleItem === "string") {
            const normalizedRole = sanitizeRoleValue(roleItem);
            if (normalizedRole) {
                return normalizedRole;
            }
        }

        if (roleItem && typeof roleItem === "object" && typeof roleItem.authority === "string") {
            const normalizedRole = sanitizeRoleValue(roleItem.authority);
            if (normalizedRole) {
                return normalizedRole;
            }
        }
    }

    return null;
}

function resolveRoleFromTokenPayload(tokenPayload) {
    if (!tokenPayload || typeof tokenPayload !== "object") {
        return null;
    }

    const roleClaims = [tokenPayload.rol, tokenPayload.role, tokenPayload.roles, tokenPayload.authorities];

    for (const claim of roleClaims) {
        const normalizedRole = extractRoleFromClaim(claim);
        if (normalizedRole) {
            return normalizedRole;
        }
    }

    return null;
}

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
    const authState = authStateOverride && typeof authStateOverride === "object"
        ? authStateOverride
        : obtenerEstadoAuth();

    const token = obtenerToken();
    const tokenPayload = decodeJwtPayload(token);
    const isTokenExpired = Boolean(token) && isExpiredTokenPayload(tokenPayload);

    const usernameFromState = String(authState?.usuario || "").trim();
    const usernameFromToken = String(
        tokenPayload?.nombreUsuario
            || tokenPayload?.username
            || tokenPayload?.sub
            || "",
    ).trim();

    const roleFromAuthState = normalizeAuthRole(authState?.rol);
    const roleFromToken = normalizeAuthRole(resolveRoleFromTokenPayload(tokenPayload));
    const normalizedRole = roleFromAuthState || roleFromToken;

    return {
        username: isTokenExpired ? "Invitado" : (usernameFromState || usernameFromToken || "Invitado"),
        roleLabel: isTokenExpired ? "Sin rol" : resolveRoleLabel(normalizedRole),
        hasSession: !isTokenExpired && Boolean(authState?.sesionIniciada || token),
        isTokenExpired,
        normalizedRole: isTokenExpired ? null : normalizedRole,
    };
}


function enforceActiveSession(userContext) {
    if (!userContext?.isTokenExpired) {
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

        const logoutButton = target.closest("#layout-logout-btn");
        if (!logoutButton) {
            return;
        }

        event.preventDefault();

        try {
            limpiarSesion();
        } finally {
            updateLayoutUserContext();
            navegarA("/auth");
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
