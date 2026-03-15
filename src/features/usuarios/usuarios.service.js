import { httpClient } from "../../shared/services/httpClient.js";
import { USUARIOS_ENDPOINTS } from "./usuarios.constants.js";
import {
    mapUser,
    mapUsersResponse,
    mapCreateUserPayload,
    mapUpdateUserPayload,
} from "./usuarios.mappers.js";

// Obtiene la lista completa de usuarios del sistema
export async function getUsers() {
    const responseData = await httpClient(USUARIOS_ENDPOINTS.users);
    return mapUsersResponse(responseData);
}

// Obtiene un usuario por su ID
export async function getUserById(id) {
    const responseData = await httpClient(USUARIOS_ENDPOINTS.userById(id));
    return mapUser(responseData);
}

// Crea un nuevo usuario asociado a un empleado existente
export async function createUser(formState = {}) {
    const requestBody = mapCreateUserPayload(formState);

    const responseData = await httpClient(USUARIOS_ENDPOINTS.users, {
        method: "POST",
        body: JSON.stringify(requestBody),
    });

    return mapUser(responseData);
}

// Actualiza parcialmente un usuario existente
export async function updateUser(id, formState = {}) {
    const requestBody = mapUpdateUserPayload(formState);

    const responseData = await httpClient(USUARIOS_ENDPOINTS.userById(id), {
        method: "PUT",
        body: JSON.stringify(requestBody),
    });

    return mapUser(responseData);
}

// Desactiva un usuario (soft delete: activo=false en el backend)
export async function deleteUser(id) {
    await httpClient(USUARIOS_ENDPOINTS.userById(id), {
        method: "DELETE",
    });
}
