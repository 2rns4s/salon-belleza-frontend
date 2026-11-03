import { httpClient } from "../../shared/services/httpClient.js";
import { createCrudService } from "../../shared/services/crudService.js";
import { SERVICIOS_ENDPOINTS } from "./servicios.constants.js";
import {
    mapServicesResponse,
    mapServiceResponse,
    mapCreateServicePayload,
    mapUpdateServicePayload,
    mapCatalogResourcesResponse,
} from "./servicios.mappers.js";

// CRUD estandar de servicios armado por la fabrica compartida
// (ver shared/services/crudService.js): solo se declaran ruta y mappers.
const serviciosCrud = createCrudService({
    listEndpoint: SERVICIOS_ENDPOINTS.LIST,
    detailEndpoint: SERVICIOS_ENDPOINTS.DETAIL,
    mapList: mapServicesResponse,
    mapOne: mapServiceResponse,
    mapCreate: mapCreateServicePayload,
    mapUpdate: mapUpdateServicePayload,
});

export const getServices = serviciosCrud.list;
export const createService = serviciosCrud.create;
export const updateService = serviciosCrud.update;
export const deleteService = serviciosCrud.remove;

// GET /api/v1/recursos — catálogo para poblar el selector dentro del formulario de servicios.
// Es propio de servicios (no es parte del CRUD) y no importa nada de src/features/recursos/.
export async function getResourcesCatalog() {
    const data = await httpClient(SERVICIOS_ENDPOINTS.RECURSOS_CATALOG);
    return mapCatalogResourcesResponse(data);
}
