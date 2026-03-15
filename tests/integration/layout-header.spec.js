import { beforeEach, describe, expect, it } from "vitest";
import { initializeApp } from "../../src/app/bootstrap.js";
import { guardarSesion, limpiarSesion, obtenerEstadoAuth, obtenerToken } from "../../src/shared/state/authStore.js";
import { setAuthToken } from "../../src/shared/storage/authTokenStorage.js";

function encodeBase64Url(value) {
    return btoa(value)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function createJwtToken(payload = {}) {
    const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = encodeBase64Url(JSON.stringify(payload));

    return `${header}.${body}.signature`;
}

function mountAppShell() {
    document.body.innerHTML = "<div id=\"app\" class=\"app\"></div>";
    window.appFeatureRoutes = [
        {
            path: "/auth",
            handler: () => {},
        },
        {
            path: "/",
            handler: () => {},
        },
    ];
}

describe("layout shared header integration", () => {
    beforeEach(() => {
        limpiarSesion();
        localStorage.clear();
        window.location.hash = "#/dashboard";
        document.body.innerHTML = "";
    });

    it("muestra titulo, usuario y rol cuando hay sesion activa", () => {
        guardarSesion({
            usuario: "recepcion",
            rol: "OWNER",
            token: createJwtToken({ rol: "OWNER", nombreUsuario: "recepcion" }),
        });

        mountAppShell();
        initializeApp();

        expect(document.querySelector(".layout__salon-title")?.textContent).toContain("Sistema de Gestion");
        expect(document.querySelector(".layout__user-value")?.textContent).toContain("recepcion");
        expect(document.querySelector(".layout__role-badge")?.textContent).toContain("Propietario");
    });

    it("LAYOUT-MOUNT-01: monta estructura BEM del layout sin estilos inline", () => {
        guardarSesion({
            usuario: "owner",
            rol: "OWNER",
            token: createJwtToken({ rol: "OWNER", nombreUsuario: "owner" }),
        });

        mountAppShell();
        initializeApp();

        const layoutRoot = document.querySelector(".layout");
        const layoutHeader = document.querySelector(".layout__header");
        const layoutContent = document.querySelector(".layout__content");

        expect(layoutRoot).not.toBeNull();
        expect(layoutHeader).not.toBeNull();
        expect(layoutContent).not.toBeNull();
        expect(layoutRoot?.firstElementChild).toBe(layoutHeader);
        expect(layoutRoot?.lastElementChild).toBe(layoutContent);
        expect(layoutRoot?.querySelectorAll("[style]").length).toBe(0);
    });

    it("usa fallback de JWT authorities para rol cuando authStore no tiene rol", () => {
        guardarSesion({
            usuario: "ana",
            rol: null,
            token: createJwtToken({ authorities: [{ authority: "ROLE_RECEPTIONIST" }], nombreUsuario: "ana" }),
        });

        mountAppShell();
        initializeApp();

        expect(document.querySelector(".layout__user-value")?.textContent).toContain("ana");
        expect(document.querySelector(".layout__role-badge")?.textContent).toContain("Recepcionista");
    });

    it("LAYOUT-USERCTX-01: usa etiqueta de rol fallback no vacia si el rol no es reconocido", () => {
        guardarSesion({
            usuario: "carla",
            rol: null,
            token: createJwtToken({ role: "GESTOR", nombreUsuario: "carla" }),
        });

        mountAppShell();
        initializeApp();

        const roleBadge = document.querySelector(".layout__role-badge")?.textContent?.trim() || "";

        expect(document.querySelector(".layout__user-value")?.textContent).toContain("carla");
        expect(roleBadge.length).toBeGreaterThan(0);
        expect(roleBadge).toContain("Sin rol");
    });

    it("LAYOUT-LOGOUT-01: logout limpia sesion y redirige a /auth", () => {
        guardarSesion({
            usuario: "owner",
            rol: "OWNER",
            token: createJwtToken({ rol: "OWNER", nombreUsuario: "owner" }),
        });

        mountAppShell();
        initializeApp();

        const logoutButton = document.querySelector("#layout-logout-btn");
        expect(logoutButton).not.toBeNull();

        logoutButton.dispatchEvent(new Event("click", { bubbles: true }));

        expect(obtenerEstadoAuth().sesionIniciada).toBe(false);
        expect(obtenerToken()).toBeNull();
        expect(window.location.hash).toBe("#/auth");
    });

    it("LAYOUT-LOGOUT-01: logout es idempotente cuando no hay token activo", () => {
        mountAppShell();
        initializeApp();

        const logoutButton = document.querySelector("#layout-logout-btn");
        expect(logoutButton).not.toBeNull();

        expect(() => {
            logoutButton.dispatchEvent(new Event("click", { bubbles: true }));
            logoutButton.dispatchEvent(new Event("click", { bubbles: true }));
        }).not.toThrow();

        expect(obtenerEstadoAuth().sesionIniciada).toBe(false);
        expect(obtenerToken()).toBeNull();
        expect(window.location.hash).toBe("#/auth");
    });

    it("expira token JWT y fuerza limpieza de sesion con redireccion inmediata", () => {
        guardarSesion({
            usuario: "expired-user",
            rol: "OWNER",
            token: createJwtToken({
                rol: "OWNER",
                nombreUsuario: "expired-user",
                exp: Math.floor(Date.now() / 1000) - 60,
            }),
        });

        mountAppShell();
        initializeApp();

        expect(obtenerEstadoAuth().sesionIniciada).toBe(false);
        expect(obtenerToken()).toBeNull();
        expect(window.location.hash).toBe("#/auth");
        expect(document.querySelector(".layout__session-status")?.textContent).toContain("Sesion no iniciada");
    });

    it("LAYOUT-REHYDRATE-INVALID-01: token malformado persistido limpia sesion y redirige a /auth", () => {
        setAuthToken("invalid-token");

        mountAppShell();
        initializeApp();

        expect(obtenerEstadoAuth().sesionIniciada).toBe(false);
        expect(obtenerToken()).toBeNull();
        expect(window.location.hash).toBe("#/auth");
        expect(document.querySelector(".layout__session-status")?.textContent).toContain("Sesion no iniciada");
    });

    it("LAYOUT-NAV-OWNER: OWNER ve Clientes, Citas, Usuarios, Empleados, Servicios y Recursos en la navegacion", () => {
        guardarSesion({ usuario: "owner", rol: "OWNER", token: createJwtToken({ rol: "OWNER", nombreUsuario: "owner" }) });
        mountAppShell();
        initializeApp();
        expect(document.querySelector("#layout-nav-context")).not.toBeNull();
        expect(document.querySelector("[data-layout-route='/clientes']")).not.toBeNull();
        expect(document.querySelector("[data-layout-route='/citas']")).not.toBeNull();
        expect(document.querySelector("[data-layout-route='/usuarios']")).not.toBeNull();
        expect(document.querySelector("[data-layout-route='/empleados']")).not.toBeNull();
        expect(document.querySelector("[data-layout-route='/servicios']")).not.toBeNull();
        expect(document.querySelector("[data-layout-route='/recursos']")).not.toBeNull();
    });

    it("LAYOUT-NAV-RECEPTIONIST: RECEPTIONIST ve solo Clientes y Citas, sin Usuarios, Empleados, Servicios ni Recursos", () => {
        guardarSesion({ usuario: "recep", rol: "RECEPTIONIST", token: createJwtToken({ rol: "RECEPTIONIST", nombreUsuario: "recep" }) });
        mountAppShell();
        initializeApp();
        expect(document.querySelector("[data-layout-route='/clientes']")).not.toBeNull();
        expect(document.querySelector("[data-layout-route='/citas']")).not.toBeNull();
        expect(document.querySelector("[data-layout-route='/usuarios']")).toBeNull();
        expect(document.querySelector("[data-layout-route='/empleados']")).toBeNull();
        expect(document.querySelector("[data-layout-route='/servicios']")).toBeNull();
        expect(document.querySelector("[data-layout-route='/recursos']")).toBeNull();
    });

    it("LAYOUT-NAV-NOAUTH: sin sesion el contenedor de nav existe pero no tiene links", () => {
        mountAppShell();
        initializeApp();
        const navContext = document.querySelector("#layout-nav-context");
        expect(navContext).not.toBeNull();
        expect(navContext?.querySelector("[data-layout-route]")).toBeNull();
    });

    it("LAYOUT-NAV-ACTIVE: el hash activo marca el link correspondiente con la clase activa", () => {
        guardarSesion({ usuario: "owner", rol: "OWNER", token: createJwtToken({ rol: "OWNER", nombreUsuario: "owner" }) });
        window.location.hash = "#/servicios";
        mountAppShell();
        initializeApp();
        const activeLink = document.querySelector(".layout__nav-link--active");
        expect(activeLink).not.toBeNull();
        expect(activeLink?.getAttribute("data-layout-route")).toBe("/servicios");
        const otherLinks = document.querySelectorAll(".layout__nav-link:not(.layout__nav-link--active)");
        expect(otherLinks.length).toBeGreaterThan(0);
        otherLinks.forEach((link) => {
            expect(link.classList.contains("layout__nav-link--active")).toBe(false);
        });
    });

    it("LAYOUT-REHYDRATE-OWNER-01: rehidrata sesion en memoria desde token persistido al iniciar app", () => {
        setAuthToken(
            createJwtToken({
                rol: "OWNER",
                nombreUsuario: "owner-reload",
                exp: Math.floor(Date.now() / 1000) + 3600,
            }),
        );

        mountAppShell();
        initializeApp();

        const authState = obtenerEstadoAuth();

        expect(authState.sesionIniciada).toBe(true);
        expect(authState.rol).toBe("OWNER");
        expect(authState.usuario).toBe("owner-reload");
        expect(document.querySelector(".layout__role-badge")?.textContent).toContain("Propietario");
    });
});
