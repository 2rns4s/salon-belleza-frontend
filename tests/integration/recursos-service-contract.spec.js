import { beforeEach, describe, expect, it, vi } from "vitest";
import { createErrorResponseFixture } from "../fixtures/shared/error-response.fixture.js";

function createJsonResponse({ ok = true, status = 200, data = {} } = {}) {
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

const RESOURCE_RESPONSE = { idRecurso: 1, nombre: "Tijeras", cantidadTotal: 5 };
const RESOURCES_LIST = [RESOURCE_RESPONSE, { idRecurso: 2, nombre: "Tinte", cantidadTotal: 10 }];

describe("recursos service contract", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it("RECURSOS-SVC-01: GET /api/v1/recursos devuelve array mapeado con idRecurso → id", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: RESOURCES_LIST }),
        );

        const { getResources } = await import("../../src/features/recursos/recursos.service.js");
        const result = await getResources();

        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/recursos",
            expect.objectContaining({ method: "GET" }),
        );
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ id: 1, name: "Tijeras", totalQuantity: 5 });
        expect(result[1]).toEqual({ id: 2, name: "Tinte", totalQuantity: 10 });
    });

    it("RECURSOS-SVC-02: POST /api/v1/recursos envía CrearRecursoRequest exacto { nombre, cantidadTotal }", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 201, data: RESOURCE_RESPONSE }),
        );

        const { createResource } = await import("../../src/features/recursos/recursos.service.js");
        const result = await createResource({ name: "Tijeras", totalQuantity: 5 });

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/recursos");
        expect(options.method).toBe("POST");
        expect(JSON.parse(options.body)).toEqual({ nombre: "Tijeras", cantidadTotal: 5 });
        expect(result).toEqual({ id: 1, name: "Tijeras", totalQuantity: 5 });
    });

    it("RECURSOS-SVC-03: PUT /api/v1/recursos/{id} envía ActualizarRecursoRequest exacto { nombre, cantidadTotal }", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: { idRecurso: 1, nombre: "Tijeras Pro", cantidadTotal: 8 } }),
        );

        const { updateResource } = await import("../../src/features/recursos/recursos.service.js");
        const result = await updateResource(1, { name: "Tijeras Pro", totalQuantity: 8 });

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/recursos/1");
        expect(options.method).toBe("PUT");
        expect(JSON.parse(options.body)).toEqual({ nombre: "Tijeras Pro", cantidadTotal: 8 });
        expect(result).toEqual({ id: 1, name: "Tijeras Pro", totalQuantity: 8 });
    });

    it("RECURSOS-SVC-04: DELETE /api/v1/recursos/{id} llama al endpoint correcto sin body", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 204, data: null }),
        );

        const { deleteResource } = await import("../../src/features/recursos/recursos.service.js");
        await deleteResource(3);

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/recursos/3");
        expect(options.method).toBe("DELETE");
    });

    it("RECURSOS-SVC-05: POST 400 propaga ErrorResponse con details[] para validacion", async () => {
        const badRequestError = createErrorResponseFixture(400, {
            message: "Error en los datos enviados",
            details: ["cantidadTotal: debe ser mayor o igual a 1"],
        });

        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: false, status: 400, data: badRequestError }),
        );

        const { createResource } = await import("../../src/features/recursos/recursos.service.js");

        await expect(
            createResource({ name: "Tijeras", totalQuantity: 0 }),
        ).rejects.toMatchObject({
            status: 400,
            data: badRequestError,
        });
    });
});
