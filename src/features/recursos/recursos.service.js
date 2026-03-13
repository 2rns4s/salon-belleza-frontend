import { httpClient } from "../../shared/services/httpClient.js";
import { RECURSOS_ENDPOINTS } from "./recursos.constants.js";
import {
    mapResourcesResponse,
    mapResourceResponse,
    mapCreateResourcePayload,
    mapUpdateResourcePayload,
} from "./recursos.mappers.js";

// GET /api/v1/recursos → RecursoResponse[]
export async function getResources() {
    const data = await httpClient(RECURSOS_ENDPOINTS.LIST);
    return mapResourcesResponse(data);
}

// POST /api/v1/recursos → RecursoResponse
export async function createResource(formState) {
    const payload = mapCreateResourcePayload(formState);
    const data = await httpClient(RECURSOS_ENDPOINTS.LIST, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return mapResourceResponse(data);
}

// PUT /api/v1/recursos/{id} → RecursoResponse
export async function updateResource(id, formState) {
    const payload = mapUpdateResourcePayload(formState);
    const data = await httpClient(RECURSOS_ENDPOINTS.DETAIL(id), {
        method: "PUT",
        body: JSON.stringify(payload),
    });
    return mapResourceResponse(data);
}

// DELETE /api/v1/recursos/{id}
export async function deleteResource(id) {
    await httpClient(RECURSOS_ENDPOINTS.DETAIL(id), { method: "DELETE" });
}
