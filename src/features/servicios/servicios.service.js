import { httpClient } from "../../shared/services/httpClient.js";
import { SERVICIOS_ENDPOINTS } from "./servicios.constants.js";
import {
    mapServicesResponse,
    mapServiceResponse,
    mapCreateServicePayload,
    mapUpdateServicePayload,
    mapCatalogResourcesResponse,
} from "./servicios.mappers.js";

// GET /api/v1/servicios → ServicioResponse[]
export async function getServices() {
    const data = await httpClient(SERVICIOS_ENDPOINTS.LIST);
    return mapServicesResponse(data);
}

// POST /api/v1/servicios → ServicioResponse
export async function createService(formState) {
    const payload = mapCreateServicePayload(formState);
    const data = await httpClient(SERVICIOS_ENDPOINTS.LIST, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return mapServiceResponse(data);
}

// PUT /api/v1/servicios/{id} → ServicioResponse
export async function updateService(id, formState) {
    const payload = mapUpdateServicePayload(formState);
    const data = await httpClient(SERVICIOS_ENDPOINTS.DETAIL(id), {
        method: "PUT",
        body: JSON.stringify(payload),
    });
    return mapServiceResponse(data);
}

// DELETE /api/v1/servicios/{id}
export async function deleteService(id) {
    await httpClient(SERVICIOS_ENDPOINTS.DETAIL(id), { method: "DELETE" });
}

// GET /api/v1/recursos — catálogo para poblar el selector dentro del formulario de servicios
// No importa nada de src/features/recursos/
export async function getResourcesCatalog() {
    const data = await httpClient(SERVICIOS_ENDPOINTS.RECURSOS_CATALOG);
    return mapCatalogResourcesResponse(data);
}
