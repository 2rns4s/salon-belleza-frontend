import { httpClient } from "../../shared/services/httpClient.js";
import { CITAS_ENDPOINTS } from "./citas.constants.js";
import {
    mapAppointment,
    mapAppointmentsResponse,
    mapAvailabilityResponse,
    mapClient,
    mapClientsResponse,
    mapCreateAppointmentPayload,
    mapCreateClientPayload,
    mapEmployeesCatalogResponse,
    mapServicesCatalogResponse,
    mapUpdateAppointmentPayload,
} from "./citas.mappers.js";

function buildQueryString(params = {}) {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }

        queryParams.set(key, String(value));
    });

    const query = queryParams.toString();
    return query ? `?${query}` : "";
}

export async function getAvailability({ date, serviceId, employeeId, signal } = {}) {
    const query = buildQueryString({
        fecha: date,
        idServicio: serviceId,
        idEmpleado: employeeId,
    });

    const payload = await httpClient(`${CITAS_ENDPOINTS.availability}${query}`, { signal });
    return mapAvailabilityResponse(payload);
}

export async function getAppointments({ date, serviceId, employeeId, signal } = {}) {
    const query = buildQueryString({
        fecha: date,
        idServicio: serviceId,
        idEmpleado: employeeId,
    });

    const payload = await httpClient(`${CITAS_ENDPOINTS.appointments}${query}`, { signal });
    return mapAppointmentsResponse(payload);
}

export async function searchClients({ documentNumber, phone, name } = {}) {
    const query = buildQueryString({
        documento: documentNumber,
        telefono: phone,
        nombre: name,
    });

    const payload = await httpClient(`${CITAS_ENDPOINTS.searchClients}${query}`);
    return mapClientsResponse(payload);
}

export async function createClient(clientPayload = {}) {
    const requestBody = mapCreateClientPayload(clientPayload);

    const payload = await httpClient(CITAS_ENDPOINTS.createClient, {
        method: "POST",
        body: JSON.stringify(requestBody),
    });

    return mapClient(payload);
}

export async function createAppointment(appointmentPayload = {}) {
    const requestBody = mapCreateAppointmentPayload(appointmentPayload);

    const payload = await httpClient(CITAS_ENDPOINTS.appointments, {
        method: "POST",
        body: JSON.stringify(requestBody),
    });

    return mapAppointment(payload);
}

export async function updateAppointment(appointmentId, appointmentPayload = {}) {
    const requestBody = mapUpdateAppointmentPayload(appointmentPayload);

    const payload = await httpClient(CITAS_ENDPOINTS.updateAppointmentById(appointmentId), {
        method: "PUT",
        body: JSON.stringify(requestBody),
    });

    return mapAppointment(payload);
}

export async function deleteAppointment(appointmentId) {
    await httpClient(CITAS_ENDPOINTS.deleteAppointmentById(appointmentId), {
        method: "DELETE",
    });

    return { success: true };
}

// Obtiene el catalogo completo de servicios.
export async function getServices() {
    const payload = await httpClient(CITAS_ENDPOINTS.services);
    return mapServicesCatalogResponse(payload);
}

// Obtiene el catalogo completo de empleados.
export async function getEmployees() {
    const payload = await httpClient(CITAS_ENDPOINTS.employees);
    return mapEmployeesCatalogResponse(payload);
}
