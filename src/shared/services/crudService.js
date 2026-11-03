import { httpClient } from "./httpClient.js";

/**
 * Fabrica de servicios CRUD.
 *
 * Los modulos de gestion (recursos, servicios, empleados, usuarios, clientes)
 * hacen exactamente las mismas 4 operaciones HTTP contra el backend:
 *   - listar  (GET    a la ruta de coleccion)
 *   - crear   (POST   a la ruta de coleccion)
 *   - editar  (PUT    a la ruta de detalle /{id})
 *   - borrar  (DELETE a la ruta de detalle /{id})
 *
 * Lo unico que cambia entre modulos es la ruta y como se traducen los datos
 * (los "mappers"). En vez de copiar este mismo bloque en cada modulo, se define
 * una sola vez aqui: cada feature llama a createCrudService con SU ruta y SUS
 * mappers, y recibe las 4 funciones ya armadas. Asi el patron CRUD se explica
 * en un solo lugar y cada modulo solo declara lo que tiene de propio.
 *
 * @param {object} config
 * @param {string} config.listEndpoint           Ruta de la coleccion (GET lista / POST crea).
 * @param {(id:(string|number)) => string} config.detailEndpoint  Ruta de detalle /{id} (PUT edita / DELETE borra).
 * @param {(raw:any) => any} config.mapList       Traduce la respuesta de la lista al modelo interno.
 * @param {(raw:any) => any} config.mapOne        Traduce la respuesta de un item al modelo interno.
 * @param {(form:any) => any} config.mapCreate    Traduce el formulario al payload de creacion.
 * @param {(form:any) => any} config.mapUpdate    Traduce el formulario al payload de edicion.
 * @returns {{ list: Function, create: Function, update: Function, remove: Function }}
 */
export function createCrudService({
    listEndpoint,
    detailEndpoint,
    mapList,
    mapOne,
    mapCreate,
    mapUpdate,
}) {
    async function list() {
        const data = await httpClient(listEndpoint);
        return mapList(data);
    }

    async function create(formState) {
        const payload = mapCreate(formState);
        const data = await httpClient(listEndpoint, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        return mapOne(data);
    }

    async function update(id, formState) {
        const payload = mapUpdate(formState);
        const data = await httpClient(detailEndpoint(id), {
            method: "PUT",
            body: JSON.stringify(payload),
        });
        return mapOne(data);
    }

    async function remove(id) {
        await httpClient(detailEndpoint(id), { method: "DELETE" });
    }

    return { list, create, update, remove };
}
