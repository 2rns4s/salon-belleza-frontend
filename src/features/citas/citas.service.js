/**
 * Servicio de citas: capa de transporte HTTP del módulo de agendamiento.
 * Forma payloads/queries y delega en httpClient; no manipula DOM ni decide UI.
 *
 * Trazabilidad SRS (ver docs/desarrollo/trazabilidad-requisitos.md):
 * @requisito RF-001 Motor de control de concurrencia (consulta de disponibilidad empleado Y recurso)
 * @requisito RF-004 Filtro de disponibilidad por servicio (query idServicio/idEmpleado)
 * @requisito RF-007 Mostrar solo horarios válidos (getAvailability retorna slots ya validados por backend)
 * @requisito RF-008 Registrar cita (createAppointment) y refresco de agenda (getAppointments)
 * @requisito RF-009 Gestión de clientes en el flujo de cita (searchClients, createClient, getClientById)
 * @rnf RNF-008 Integridad/anti-overbooking: el 409 del backend es la autoridad; el front consume y reconcilia (BACKEND)
 * @rnf RNF-015 Manejo de errores: conserva status/data para que el controller muestre mensajes accionables
 * @hu HU-01, HU-04, HU-07, HU-08, HU-09
 * @narrativa Como Recepcionista, quiero que el sistema valide la disponibilidad del empleado Y del
 *            recurso físico al mismo tiempo, para agendar citas complejas sin errores de doble reserva.
 */
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

// @requisito RF-001/RF-007 — Consulta al motor de concurrencia: el backend valida
// empleado Y recurso y retorna solo los intervalos válidos para la fecha/servicio/empleado.
// @rnf RNF-005 — El backend debe retornar los intervalos en <=0.5s (medición instrumentada aparte).
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

export async function getClientById(clientId, { signal } = {}) {
    const payload = await httpClient(CITAS_ENDPOINTS.clientById(clientId), { signal });
    return mapClient(payload);
}

export async function createClient(clientPayload = {}) {
    const requestBody = mapCreateClientPayload(clientPayload);

    const payload = await httpClient(CITAS_ENDPOINTS.createClient, {
        method: "POST",
        body: JSON.stringify(requestBody),
    });

    return mapClient(payload);
}

// @requisito RF-008 — Registrar cita. Un 409 del backend (RNF-008 anti-overbooking)
// indica que la disponibilidad cambió; el controller debe reconciliar, no asumir éxito.
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
