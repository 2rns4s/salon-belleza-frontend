import { httpClient } from "../../shared/services/httpClient.js";
import { CLIENTES_ENDPOINTS } from "./clientes.constants.js";
import { mapClient, mapClientsResponse, mapCreateClientPayload, mapUpdateClientPayload } from "./clientes.mappers.js";

export async function getClients() {
  const responseData = await httpClient(CLIENTES_ENDPOINTS.clients);
  return mapClientsResponse(responseData);
}

export async function createClient(clientInput = {}) {
  const requestBody = mapCreateClientPayload(clientInput);

  const responseData = await httpClient(CLIENTES_ENDPOINTS.clients, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  return mapClient(responseData);
}

// The server returns the complete updated client for the list.
export async function updateClient(id, clientInput = {}) {
  const responseData = await httpClient(CLIENTES_ENDPOINTS.clientById(id), {
    method: "PUT",
    body: JSON.stringify(mapUpdateClientPayload(clientInput)),
  });

  return mapClient(responseData);
}
