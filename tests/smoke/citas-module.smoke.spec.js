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

describe("citas module smoke", () => {
    it("registers the /citas route and renders the feature shell", async () => {
        document.body.innerHTML = "<main class=\"app__content\"></main>";

        const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => (
            Promise.resolve(createJsonResponse({
                ok: true,
                status: 200,
                data: [],
            }))
        ));

        await import("../../src/features/citas/citas.routes.js");

        const citasRoute = window.appFeatureRoutes.find((route) => route?.path === "/citas");
        expect(citasRoute).toBeTruthy();

        citasRoute.handler();
        await flushPromises();
        await flushPromises();

        expect(document.querySelector(".citas__title")?.textContent).toContain("Agenda de citas");
        expect(document.querySelector(".appointments")).toBeTruthy();
        expect(document.querySelector(".appointments__title")?.textContent).toContain("Agenda de citas");
        expect(fetchSpy).toHaveBeenCalled();
    });
});
