import { describe, expect, it, vi } from "vitest";

function createJsonResponse({ ok = true, status = 200, data = [] } = {}) {
    return {
        ok,
        status,
        headers: {
            get: () => "application/json",
        },
        json: async () => data,
        text: async () => JSON.stringify(data),
    };
}

function flushPromises() {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

describe("clientes module smoke", () => {
    it("registers /clientes route and renders feature shell", async () => {
        document.body.innerHTML = "<main class=\"app__content\"></main>";

        const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => (
            Promise.resolve(createJsonResponse({
                ok: true,
                status: 200,
                data: [],
            }))
        ));

        await import("../../src/features/clientes/clientes.routes.js");

        const clientesRoute = window.appFeatureRoutes.find((route) => route?.path === "/clientes");
        expect(clientesRoute).toBeTruthy();

        clientesRoute.handler();
        await flushPromises();
        await flushPromises();

        expect(document.querySelector(".clients__title")?.textContent).toContain("Gestion de clientes");
        expect(fetchSpy).toHaveBeenCalled();
    });
});
