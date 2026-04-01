import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("mfa active access guard", () => {
    beforeEach(() => {
        vi.resetModules();
        localStorage.clear();
        document.body.innerHTML = "";
        window.location.hash = "#/";
        window.appFeatureRoutes = [];
    });

    it("bloquea ruta /mfa-setup y redirige a /user-settings cuando MFA ya esta activo", async () => {
        setAuthToken(createJwtToken({ rol: "OWNER", nombreUsuario: "owner", mfaActivo: true }));

        await import("../../src/features/mfa/mfa.routes.js");

        const mfaRoute = window.appFeatureRoutes.find((route) => route?.path === "/mfa-setup");
        expect(mfaRoute).toBeTruthy();

        const container = document.createElement("main");
        mfaRoute.handler(container);

        expect(window.location.hash).toBe("#/user-settings");
        expect(container.querySelector("#btn-setup-start")).toBeNull();
    });

    it("deshabilita CTA MFA en user-settings cuando MFA ya esta activo", async () => {
        setAuthToken(createJwtToken({ rol: "OWNER", nombreUsuario: "owner", mfaEnabled: true }));

        const { initUserSettings } = await import("../../src/features/user-settings/user-settings.controller.js");

        const container = document.createElement("main");
        document.body.appendChild(container);

        initUserSettings(container);

        const mfaButton = container.querySelector("#user-settings-mfa-btn");
        const statusBadge = container.querySelector(".user-settings__status-badge--active");

        expect(mfaButton).toBeTruthy();
        expect(mfaButton?.hasAttribute("disabled")).toBe(true);
        expect(mfaButton?.getAttribute("aria-disabled")).toBe("true");
        expect(statusBadge?.textContent).toContain("Ya activo");

        window.location.hash = "#/user-settings";
        mfaButton?.dispatchEvent(new Event("click", { bubbles: true }));
        expect(window.location.hash).toBe("#/user-settings");
    });

    it("mantiene CTA habilitado cuando MFA aun no esta activo", async () => {
        setAuthToken(createJwtToken({ rol: "OWNER", nombreUsuario: "owner", mfaActivo: false }));

        const { initUserSettings } = await import("../../src/features/user-settings/user-settings.controller.js");

        const container = document.createElement("main");
        document.body.appendChild(container);

        initUserSettings(container);

        const mfaButton = container.querySelector("#user-settings-mfa-btn");

        expect(mfaButton).toBeTruthy();
        expect(mfaButton?.hasAttribute("disabled")).toBe(false);
    });

    it("bloquea ruta /mfa-setup cuando MFA esta activo con claim mfa_enabled (snake_case del backend)", async () => {
        setAuthToken(createJwtToken({ rol: "OWNER", nombreUsuario: "owner", mfa_enabled: true }));

        await import("../../src/features/mfa/mfa.routes.js");

        const mfaRoute = window.appFeatureRoutes.find((route) => route?.path === "/mfa-setup");
        expect(mfaRoute).toBeTruthy();

        const container = document.createElement("main");
        mfaRoute.handler(container);

        expect(window.location.hash).toBe("#/user-settings");
        expect(container.querySelector("#btn-setup-start")).toBeNull();
    });

    it("deshabilita CTA MFA en user-settings con claim mfa_enabled (snake_case del backend)", async () => {
        setAuthToken(createJwtToken({ rol: "OWNER", nombreUsuario: "owner", mfa_enabled: true }));

        const { initUserSettings } = await import("../../src/features/user-settings/user-settings.controller.js");

        const container = document.createElement("main");
        document.body.appendChild(container);

        initUserSettings(container);

        const mfaButton = container.querySelector("#user-settings-mfa-btn");
        const statusBadge = container.querySelector(".user-settings__status-badge--active");

        expect(mfaButton).toBeTruthy();
        expect(mfaButton?.hasAttribute("disabled")).toBe(true);
        expect(mfaButton?.getAttribute("aria-disabled")).toBe("true");
        expect(statusBadge?.textContent).toContain("Ya activo");
    });
});
