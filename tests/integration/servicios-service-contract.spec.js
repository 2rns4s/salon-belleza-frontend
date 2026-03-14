import { beforeEach, describe, expect, it, vi } from "vitest";
import { createErrorResponseFixture } from "../fixtures/shared/error-response.fixture.js";

function createJsonResponse({ ok = true, status = 200, data = {} } = {}) {
    return {
        ok,
        status,
        headers: { get: () => "application/json" },
        json: async () => data,
        text: async () => JSON.stringify(data),
    };
}

const SERVICE_RESPONSE = {
    idServicio: 1,
    nombre: "Corte de cabello",
    duracion: 30,
    recursos: [{ idRecurso: 1, nombre: "Tijeras", cantidadRequerida: 1 }],
};

const SERVICES_LIST = [
    SERVICE_RESPONSE,
    { idServicio: 2, nombre: "Tinte completo", duracion: 90, recursos: [] },
];

const CATALOG_RESOURCES = [
    { idRecurso: 1, nombre: "Tijeras", cantidadTotal: 5 },
    { idRecurso: 2, nombre: "Tinte", cantidadTotal: 10 },
];

describe("servicios service contract", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it("SERVICIOS-SVC-01: GET /api/v1/servicios devuelve array mapeado con idServicio → id y recursos anidados", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: SERVICES_LIST }),
        );

        const { getServices } = await import("../../src/features/servicios/servicios.service.js");
        const result = await getServices();

        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/servicios",
            expect.objectContaining({ method: "GET" }),
        );
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ id: 1, name: "Corte de cabello", duration: 30 });
        expect(result[0].resources).toHaveLength(1);
        expect(result[0].resources[0]).toEqual({ resourceId: 1, name: "Tijeras", requiredQuantity: 1 });
    });

    it("SERVICIOS-SVC-02: POST /api/v1/servicios envía CrearServicioRequest exacto { nombre, duracion, recursos }", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 201, data: SERVICE_RESPONSE }),
        );

        const { createService } = await import("../../src/features/servicios/servicios.service.js");
        await createService({
            name: "Corte de cabello",
            duration: 30,
            requiredResources: [{ rowId: "local-1", resourceId: 1, quantity: 1 }],
        });

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/servicios");
        expect(options.method).toBe("POST");
        const body = JSON.parse(options.body);
        expect(body).toEqual({
            nombre: "Corte de cabello",
            duracion: 30,
            recursos: [{ idRecurso: 1, cantidadRequerida: 1 }],
        });
        // rowId NO debe aparecer en el payload
        expect(JSON.stringify(body)).not.toContain("rowId");
    });

    it("SERVICIOS-SVC-03: PUT /api/v1/servicios/{id} envía ActualizarServicioRequest exacto", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: { ...SERVICE_RESPONSE, nombre: "Corte premium" } }),
        );

        const { updateService } = await import("../../src/features/servicios/servicios.service.js");
        await updateService(1, {
            name: "Corte premium",
            duration: 45,
            requiredResources: [{ rowId: "local-2", resourceId: 2, quantity: 2 }],
        });

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/servicios/1");
        expect(options.method).toBe("PUT");
        expect(JSON.parse(options.body)).toEqual({
            nombre: "Corte premium",
            duracion: 45,
            recursos: [{ idRecurso: 2, cantidadRequerida: 2 }],
        });
    });

    it("SERVICIOS-SVC-04: DELETE /api/v1/servicios/{id} llama al endpoint correcto sin body", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 204, data: null }),
        );

        const { deleteService } = await import("../../src/features/servicios/servicios.service.js");
        await deleteService(5);

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/servicios/5");
        expect(options.method).toBe("DELETE");
    });

    it("SERVICIOS-SVC-05: GET catálogo de recursos usa /api/v1/recursos y mapea idRecurso → id", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: CATALOG_RESOURCES }),
        );

        const { getResourcesCatalog } = await import("../../src/features/servicios/servicios.service.js");
        const result = await getResourcesCatalog();

        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/recursos",
            expect.objectContaining({ method: "GET" }),
        );
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ id: 1, name: "Tijeras" });
        expect(result[1]).toEqual({ id: 2, name: "Tinte" });
    });

    it("SERVICIOS-SVC-06: POST 409 propaga ErrorResponse con details[] sin perder status", async () => {
        const conflictError = createErrorResponseFixture(409, {
            message: "Ya existe un servicio con ese nombre",
            details: ["nombre: ya existe un servicio con ese nombre"],
        });

        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: false, status: 409, data: conflictError }),
        );

        const { createService } = await import("../../src/features/servicios/servicios.service.js");

        await expect(
            createService({
                name: "Corte de cabello",
                duration: 30,
                requiredResources: [{ rowId: "local-1", resourceId: 1, quantity: 1 }],
            }),
        ).rejects.toMatchObject({
            status: 409,
            data: conflictError,
        });
    });
});
