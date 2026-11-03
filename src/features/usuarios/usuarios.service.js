import { httpClient } from "../../shared/services/httpClient.js";
import { createCrudService } from "../../shared/services/crudService.js";
import { USUARIOS_ENDPOINTS } from "./usuarios.constants.js";
import {
    mapUser,
    mapUsersResponse,
    mapCreateUserPayload,
    mapUpdateUserPayload,
} from "./usuarios.mappers.js";

// CRUD estandar de usuarios armado por la fabrica compartida
// (ver shared/services/crudService.js): solo se declaran ruta y mappers.
// Nota: deleteUser es un soft delete (el backend marca activo=false).
const usuariosCrud = createCrudService({
    listEndpoint: USUARIOS_ENDPOINTS.users,
    detailEndpoint: USUARIOS_ENDPOINTS.userById,
    mapList: mapUsersResponse,
    mapOne: mapUser,
    mapCreate: mapCreateUserPayload,
    mapUpdate: mapUpdateUserPayload,
});

export const getUsers = usuariosCrud.list;
export const createUser = usuariosCrud.create;
export const updateUser = usuariosCrud.update;
export const deleteUser = usuariosCrud.remove;

// GET /api/v1/usuarios/{id} -> un usuario (propio de usuarios, no es parte del CRUD de lista)
export async function getUserById(id) {
    const responseData = await httpClient(USUARIOS_ENDPOINTS.userById(id));
    return mapUser(responseData);
}
