import { httpClient } from "../../shared/services/httpClient.js";
import { createCrudService } from "../../shared/services/crudService.js";
import { EMPLEADOS_ENDPOINTS } from "./empleados.constants.js";
import {
    mapEmployeesResponse,
    mapEmployeeResponse,
    mapCreateEmployeePayload,
    mapUpdateEmployeePayload,
    mapServicesCatalogResponse,
} from "./empleados.mappers.js";

// CRUD estandar de empleados armado por la fabrica compartida
// (ver shared/services/crudService.js): solo se declaran ruta y mappers.
const empleadosCrud = createCrudService({
    listEndpoint: EMPLEADOS_ENDPOINTS.LIST,
    detailEndpoint: EMPLEADOS_ENDPOINTS.DETAIL,
    mapList: mapEmployeesResponse,
    mapOne: mapEmployeeResponse,
    mapCreate: mapCreateEmployeePayload,
    mapUpdate: mapUpdateEmployeePayload,
});

export const getEmployees = empleadosCrud.list;
export const createEmployee = empleadosCrud.create;
export const updateEmployee = empleadosCrud.update;
export const deleteEmployee = empleadosCrud.remove;

// GET /api/v1/empleados/{id} -> EmpleadoResponse (propio de empleados, no es parte del CRUD de lista)
export async function getEmployeeById(id) {
    const data = await httpClient(EMPLEADOS_ENDPOINTS.DETAIL(id));
    return mapEmployeeResponse(data);
}

// GET /api/v1/servicios -> catalogo silencioso para serviciosIds (propio de empleados)
export async function getServicesCatalog() {
    const data = await httpClient(EMPLEADOS_ENDPOINTS.SERVICES_CATALOG);
    return mapServicesCatalogResponse(data);
}
