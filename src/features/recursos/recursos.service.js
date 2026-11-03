import { createCrudService } from "../../shared/services/crudService.js";
import { RECURSOS_ENDPOINTS } from "./recursos.constants.js";
import {
    mapResourcesResponse,
    mapResourceResponse,
    mapCreateResourcePayload,
    mapUpdateResourcePayload,
} from "./recursos.mappers.js";

// CRUD estandar de recursos: la fabrica compartida arma las 4 operaciones HTTP
// (ver shared/services/crudService.js); aqui solo se declaran la ruta y los mappers.
const recursosCrud = createCrudService({
    listEndpoint: RECURSOS_ENDPOINTS.LIST,
    detailEndpoint: RECURSOS_ENDPOINTS.DETAIL,
    mapList: mapResourcesResponse,
    mapOne: mapResourceResponse,
    mapCreate: mapCreateResourcePayload,
    mapUpdate: mapUpdateResourcePayload,
});

export const getResources = recursosCrud.list;
export const createResource = recursosCrud.create;
export const updateResource = recursosCrud.update;
export const deleteResource = recursosCrud.remove;
