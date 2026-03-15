function escapeHtml(rawValue) {
    return String(rawValue ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export function renderLayoutShell({ salonTitle }) {
    return `
        <section class="layout">
            <header class="layout__header">
                <div class="layout__brand">
                    <h1 class="layout__salon-title">${escapeHtml(salonTitle)}</h1>
                    <p class="layout__salon-subtitle">Gestion integral del salon de belleza</p>
                </div>

                <div id="layout-nav-context" class="layout__navigation-container"></div>
                <div class="layout__session" id="layout-session-context"></div>
            </header>

            <main class="app__content layout__content"></main>
        </section>
    `;
}

export function renderLayoutUserContext({ username, roleLabel, hasSession }) {
    const safeUsername = String(username || "Invitado").trim() || "Invitado";
    const safeRole = String(roleLabel || "Sin rol").trim() || "Sin rol";
    const sessionStatus = hasSession ? "Sesion activa" : "Sesion no iniciada";

    return `
        <div class="layout__user" aria-live="polite">
            <span class="layout__user-label">Usuario</span>
            <strong class="layout__user-value">${escapeHtml(safeUsername)}</strong>
            <span class="layout__role-badge">${escapeHtml(safeRole)}</span>
            <span class="layout__session-status">${escapeHtml(sessionStatus)}</span>
        </div>

        <button class="layout__logout-button" id="layout-logout-btn" type="button">
            Cerrar Sesion
        </button>
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
