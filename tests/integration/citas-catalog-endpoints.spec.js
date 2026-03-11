import { beforeEach, describe, expect, it, vi } from "vitest";

const httpClientMock = vi.fn();

vi.mock("../../src/shared/services/httpClient.js", () => ({
    httpClient: (...args) => httpClientMock(...args),
}));

import { getEmployees, getServices } from "../../src/features/citas/citas.service.js";

describe("citas catalog endpoints integration", () => {
    beforeEach(() => {
        httpClientMock.mockReset();
    });

    it("consume endpoints y mapea servicios+empleados al modelo interno", async () => {
        httpClientMock
            .mockResolvedValueOnce([
                { idServicio: 5, nombre: "Lavado Premium", duracion: 30 },
            ])
            .mockResolvedValueOnce([
                {
                    idEmpleado: 2,
                    nombre: "Ana",
                    apellido: "Lopez",
                    serviciosIds: [5, "7"],
                },
            ]);

        const services = await getServices();
        const employees = await getEmployees();

        expect(httpClientMock).toHaveBeenNthCalledWith(1, "/api/v1/servicios");
        expect(httpClientMock).toHaveBeenNthCalledWith(2, "/api/v1/empleados");

        expect(services).toEqual([
            { id: 5, name: "Lavado Premium", duration: 30 },
        ]);

        expect(employees).toEqual([
            {
                id: 2,
                firstName: "Ana",
                lastName: "Lopez",
                fullName: "Ana Lopez",
                serviceIds: [5, 7],
            },
        ]);
    });
});
