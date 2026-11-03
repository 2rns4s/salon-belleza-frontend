// Escape HTML compartido contra XSS (fuente unica en shared/ui/escapeHtml.js).
import { escapeHtml } from "../../ui/escapeHtml.js";

export function renderLayoutShell({ salonTitle }) {
    return `
        <section class="layout">
            <header class="layout__header">
                <div class="layout__brand">
                    <h1 class="layout__salon-title">${escapeHtml(salonTitle)}</h1>
                    <p class="layout__salon-subtitle">Gestión integral del salón de belleza</p>
                </div>

                <div id="layout-nav-context" class="layout__navigation-container"></div>
                <div class="layout__session" id="layout-session-context"></div>
            </header>

            <main class="app__content layout__content"></main>
        </section>
    `;
}

export function renderLayoutUserContext({ username, roleLabel, hasSession }) {
    // Sin sesion iniciada no se muestra el bloque de usuario/rol ni el menu de cuenta:
    // un usuario no autenticado no debe ver chrome de sesion (login/signup solo ven la marca).
    if (!hasSession) {
        return "";
    }

    const safeUsername = String(username || "Invitado").trim() || "Invitado";
    const safeRole = String(roleLabel || "Sin rol").trim() || "Sin rol";

    return `
        <div class="layout__user-menu-wrapper">
            <button class="layout__user-menu-trigger" id="layout-user-menu-btn" aria-expanded="false" type="button" aria-live="polite">
                <span class="layout__user-label">Usuario</span>
                <strong class="layout__user-value">${escapeHtml(safeUsername)}</strong>
                <span class="layout__role-badge">${escapeHtml(safeRole)}</span>
                <span class="layout__menu-arrow" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg></span>
            </button>

            <div class="layout__user-dropdown" id="layout-user-dropdown" hidden>
                <a class="layout__user-dropdown-item" href="#/user-settings" id="layout-settings-link">
                    <svg class="layout__dropdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Opciones de cuenta
                </a>
                <hr class="layout__user-dropdown-divider" />
                <button class="layout__user-dropdown-item layout__user-dropdown-item--logout" id="layout-logout-btn" type="button">
                    <svg class="layout__dropdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Cerrar sesión
                </button>
            </div>
        </div>
    `;
}

export function renderLayoutNavigation({ userRole, currentPath = "" }) {
    if (userRole !== "OWNER" && userRole !== "RECEPTIONIST") {
        return "";
    }

    const links = [
        { path: "/clientes", label: "Clientes" },
        { path: "/citas", label: "Citas" },
    ];

    if (userRole === "OWNER") {
        links.push(
            { path: "/usuarios", label: "Usuarios" },
            { path: "/empleados", label: "Empleados" },
            { path: "/servicios", label: "Servicios" },
            { path: "/recursos", label: "Recursos" },
        );
    }

    const linksHtml = links
        .map(({ path, label }) => {
            const isActive = currentPath === path;
            const activeClass = isActive ? " layout__nav-link--active" : "";
            return `<a class="layout__nav-link${activeClass}" href="#${path}" data-layout-route="${path}">${escapeHtml(label)}</a>`;
        })
        .join("");

    return `<nav id="layout-primary-nav" class="layout__nav" aria-label="Navegacion principal">${linksHtml}</nav>`;
}
