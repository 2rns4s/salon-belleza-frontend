import { httpClient } from "../../shared/services/httpClient.js";
import { EMPLEADOS_ENDPOINTS } from "./empleados.constants.js";
import {
    mapEmployeesResponse,
    mapEmployeeResponse,
    mapCreateEmployeePayload,
    mapUpdateEmployeePayload,
    mapServicesCatalogResponse,
} from "./empleados.mappers.js";

// GET /api/v1/empleados -> EmpleadoResponse[]
export async function getEmployees() {
    const data = await httpClient(EMPLEADOS_ENDPOINTS.LIST);
    return mapEmployeesResponse(data);
}

// GET /api/v1/empleados/{id} -> EmpleadoResponse
export async function getEmployeeById(id) {
    const data = await httpClient(EMPLEADOS_ENDPOINTS.DETAIL(id));
    return mapEmployeeResponse(data);
}

// POST /api/v1/empleados -> EmpleadoResponse
export async function createEmployee(formState = {}) {
    const payload = mapCreateEmployeePayload(formState);
    const data = await httpClient(EMPLEADOS_ENDPOINTS.LIST, {
        method: "POST",
        body: JSON.stringify(payload),
    });

    return mapEmployeeResponse(data);
}

// PUT /api/v1/empleados/{id} -> EmpleadoResponse (actualizacion parcial)
export async function updateEmployee(id, formState = {}) {
    const payload = mapUpdateEmployeePayload(formState);
    const data = await httpClient(EMPLEADOS_ENDPOINTS.DETAIL(id), {
        method: "PUT",
        body: JSON.stringify(payload),
    });

    return mapEmployeeResponse(data);
}

// DELETE /api/v1/empleados/{id}
export async function deleteEmployee(id) {
    await httpClient(EMPLEADOS_ENDPOINTS.DETAIL(id), { method: "DELETE" });
}

// GET /api/v1/servicios -> catalogo silencioso para serviciosIds
export async function getServicesCatalog() {
    const data = await httpClient(EMPLEADOS_ENDPOINTS.SERVICES_CATALOG);
    return mapServicesCatalogResponse(data);
}