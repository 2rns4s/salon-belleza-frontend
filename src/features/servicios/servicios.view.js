import { SERVICIOS_VALIDATION, RESOURCE_CATALOG_STATUS } from "./servicios.constants.js";

function escapeHtml(rawValue) {
    return String(rawValue ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function renderFeedbackMessage(message, modifier, role) {
    if (!message) return "";
    return `<p class="service-list__message service-list__message--${modifier}" role="${role}">${escapeHtml(message)}</p>`;
}

function renderServiceRows({ services = [], loadingList = false }) {
    if (loadingList) {
        return `
            <tr class="service-list__table-row service-list__table-row--loading">
                <td class="service-list__table-cell service-list__table-cell--empty" colspan="4">Cargando servicios...</td>
            </tr>
        `;
    }

    if (!services.length) {
        return `
            <tr class="service-list__table-row service-list__table-row--empty">
                <td class="service-list__table-cell service-list__table-cell--empty" colspan="4">No hay servicios registrados.</td>
            </tr>
        `;
    }

    return services
        .map((s) => `
            <tr class="service-list__table-row service-list__table-row--data">
                <td class="service-list__table-cell">${escapeHtml(s.id)}</td>
                <td class="service-list__table-cell service-list__table-cell--name">${escapeHtml(s.name)}</td>
                <td class="service-list__table-cell">${escapeHtml(s.duration)} min</td>
                <td class="service-list__table-cell">${s.resources.length} recurso(s)</td>
                <td class="service-list__table-cell service-list__table-cell--actions">
                    <button class="service-actions__btn service-actions__btn--edit"
                        data-service-edit-id="${escapeHtml(s.id)}"
                        type="button">Editar</button>
                    <button class="service-actions__btn service-actions__btn--delete"
                        data-service-delete-id="${escapeHtml(s.id)}"
                        type="button">Eliminar</button>
                </td>
            </tr>
        `)
        .join("");
}

function renderCatalogBanner(resourcesCatalogStatus) {
    if (resourcesCatalogStatus === RESOURCE_CATALOG_STATUS.LOADING) {
        return `<p class="service-catalog-banner service-catalog-banner--loading">Cargando catálogo de recursos...</p>`;
    }
    if (resourcesCatalogStatus === RESOURCE_CATALOG_STATUS.ERROR) {
        return `<p class="service-catalog-banner service-catalog-banner--error">No se pudo cargar el catálogo de recursos.</p>`;
    }
    if (resourcesCatalogStatus === RESOURCE_CATALOG_STATUS.EMPTY) {
        return `<p class="service-catalog-banner service-catalog-banner--empty">No hay recursos disponibles para asociar.</p>`;
    }
    return "";
}

function renderResourceOptions(catalog = []) {
    if (!catalog.length) return `<option value="">-- Sin recursos disponibles --</option>`;
    const options = catalog
        .map((r) => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.name)}</option>`)
        .join("");
    return `<option value="">-- Seleccionar recurso --</option>${options}`;
}

function renderRequiredResourceRows(rows = [], catalog = []) {
    if (!rows.length) return "";
    return rows
        .map((row) => {
            const selectedOptions = catalog.map((r) => `
                <option value="${escapeHtml(r.id)}" ${String(row.resourceId) === String(r.id) ? "selected" : ""}>${escapeHtml(r.name)}</option>
            `).join("");
            const resourceOptions = catalog.length
                ? `<option value="">-- Seleccionar recurso --</option>${selectedOptions}`
                : `<option value="">-- Sin recursos disponibles --</option>`;

            return `
                <div class="service-resource-row" data-required-resource-row-id="${escapeHtml(row.rowId)}">
                    <select class="service-resource-row__select"
                        data-required-resource-field="resourceId"
                        aria-label="Recurso">
                        ${resourceOptions}
                    </select>
                    <input class="service-resource-row__qty-input"
                        type="number"
                        min="1"
                        value="${escapeHtml(row.quantity ?? "")}"
                        data-required-resource-field="quantity"
                        aria-label="Cantidad requerida" />
                    <button class="service-resource-row__remove-btn"
                        type="button"
                        data-required-resource-remove="${escapeHtml(row.rowId)}"
                        aria-label="Quitar recurso">Quitar</button>
                </div>
            `;
        })
        .join("");
}

function renderFormModal({ formModal, resourcesCatalog = [], resourcesCatalogStatus }) {
    if (!formModal.isOpen) return "";

    const { form, fieldErrors, errorMessage, mode } = formModal;
    const isEdit = mode === "edit";
    const title = isEdit ? "Editar servicio" : "Nuevo servicio";
    const submitLabel = isEdit ? "Guardar cambios" : "Crear servicio";

    const nameError = fieldErrors?.name ? `<span class="service-form__field-error">${escapeHtml(fieldErrors.name)}</span>` : "";
    const durationError = fieldErrors?.duration ? `<span class="service-form__field-error">${escapeHtml(fieldErrors.duration)}</span>` : "";
    const resourcesError = fieldErrors?.requiredResources ? `<span class="service-form__field-error">${escapeHtml(fieldErrors.requiredResources)}</span>` : "";

    return `
        <div class="service-modal__overlay" data-services-close="overlay">
            <section class="service-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="service-form-title">
                <header class="service-modal__header">
                    <h3 class="service-modal__title" id="service-form-title">${escapeHtml(title)}</h3>
                    <button class="service-modal__close-btn" id="services-close-modal-btn" type="button" aria-label="Cerrar modal">Cerrar</button>
                </header>
                <form class="service-form" id="services-form" novalidate>
                    ${renderFeedbackMessage(errorMessage, "error", "alert")}
                    <label class="service-form__field" for="services-name">
                        <span class="service-form__label">Nombre del servicio</span>
                        <input class="service-form__input${fieldErrors?.name ? " service-form__input--invalid" : ""}"
                            id="services-name" name="name" type="text"
                            minlength="${SERVICIOS_VALIDATION.NOMBRE_MIN}" maxlength="${SERVICIOS_VALIDATION.NOMBRE_MAX}"
                            value="${escapeHtml(form?.name ?? "")}" autocomplete="off" />
                        ${nameError}
                    </label>
                    <label class="service-form__field" for="services-duration">
                        <span class="service-form__label">Duración (minutos)</span>
                        <input class="service-form__input${fieldErrors?.duration ? " service-form__input--invalid" : ""}"
                            id="services-duration" name="duration" type="number"
                            min="${SERVICIOS_VALIDATION.DURACION_MIN}"
                            value="${escapeHtml(form?.duration ?? "")}" />
                        ${durationError}
                    </label>

                    <div class="service-form__resources-section">
                        <div class="service-form__resources-header">
                            <span class="service-form__label">Recursos requeridos</span>
                            <button class="service-actions__btn service-actions__btn--add-resource"
                                id="services-add-resource-btn" type="button">+ Agregar recurso</button>
                        </div>
                        ${renderCatalogBanner(resourcesCatalogStatus)}
                        <div id="services-required-resources-container">
                            ${renderRequiredResourceRows(form?.requiredResources ?? [], resourcesCatalog)}
                        </div>
                        ${resourcesError}
                    </div>

                    <div class="service-form__actions">
                        <button class="service-form__btn service-form__btn--cancel" id="services-cancel-btn" type="button">Cancelar</button>
                        <button class="service-form__btn service-form__btn--submit" type="submit">${escapeHtml(submitLabel)}</button>
                    </div>
                </form>
            </section>
        </div>
    `;
}

function renderDeleteConfirm({ deleteConfirm }) {
    if (!deleteConfirm.isOpen) return "";

    return `
        <div class="service-modal__overlay" data-services-close="overlay">
            <section class="service-modal__dialog service-modal__dialog--confirm" role="dialog" aria-modal="true">
                <p class="service-modal__confirm-text">¿Eliminar el servicio <strong>${escapeHtml(deleteConfirm.serviceName)}</strong>? Esta acción no se puede deshacer.</p>
                <div class="service-modal__confirm-actions">
                    <button class="service-form__btn service-form__btn--cancel" id="services-cancel-delete-btn" type="button">Cancelar</button>
                    <button class="service-form__btn service-form__btn--danger" id="services-confirm-delete-btn" type="button">Eliminar</button>
                </div>
            </section>
        </div>
    `;
}

function readRequiredResourcesFromDom(container, fallbackRows = []) {
    const rowsContainer = container?.querySelector("#services-required-resources-container");
    if (!(rowsContainer instanceof Element)) {
        return Array.isArray(fallbackRows)
            ? fallbackRows.map((row) => ({ ...row }))
            : [];
    }

    const rows = rowsContainer.querySelectorAll("[data-required-resource-row-id]");
    if (!rows.length) {
        return [];
    }

    return Array.from(rows).map((row) => {
        const rowId = row.getAttribute("data-required-resource-row-id") || "";
        const resourceId = row.querySelector("[data-required-resource-field='resourceId']")?.value ?? "";
        const quantity = row.querySelector("[data-required-resource-field='quantity']")?.value ?? "";

        return { rowId, resourceId, quantity };
    });
}

// Lee el estado del formulario desde el DOM para mantener el controller sin scraping manual.
export function readServicesFormState(container, fallbackForm = {}) {
    const safeContainer = container instanceof Element ? container : null;

    const nameInput = safeContainer?.querySelector("#services-name");
    const durationInput = safeContainer?.querySelector("#services-duration");

    return {
        name: nameInput?.value ?? (fallbackForm.name ?? ""),
        duration: durationInput?.value ?? (fallbackForm.duration ?? ""),
        requiredResources: readRequiredResourcesFromDom(safeContainer, fallbackForm.requiredResources),
    };
}

export function renderServiciosPage(state) {
    const {
        services = [],
        loadingList = false,
        errorMessage = "",
        successMessage = "",
        formModal = { isOpen: false },
        deleteConfirm = { isOpen: false },
        resourcesCatalog = [],
        resourcesCatalogStatus = RESOURCE_CATALOG_STATUS.IDLE,
    } = state;

    return `
        <section class="service-list">
            <header class="service-list__header">
                <h2 class="service-list__title">Gestión de Servicios</h2>
                <div class="service-list__header-actions">
                    <button class="service-actions__btn service-actions__btn--refresh" id="services-refresh-btn" type="button">Actualizar</button>
                    <button class="service-actions__btn service-actions__btn--create" id="services-open-create-btn" type="button">Nuevo servicio</button>
                </div>
            </header>

            ${renderFeedbackMessage(errorMessage, "error", "alert")}
            ${renderFeedbackMessage(successMessage, "success", "status")}

            <table class="service-list__table">
                <thead class="service-list__table-head">
                    <tr>
                        <th class="service-list__table-header">ID</th>
                        <th class="service-list__table-header">Nombre</th>
                        <th class="service-list__table-header">Duración</th>
                        <th class="service-list__table-header">Recursos</th>
                        <th class="service-list__table-header">Acciones</th>
                    </tr>
                </thead>
                <tbody class="service-list__table-body" id="services-table-body">
                    ${renderServiceRows({ services, loadingList })}
                </tbody>
            </table>

            ${renderFormModal({ formModal, resourcesCatalog, resourcesCatalogStatus })}
            ${renderDeleteConfirm({ deleteConfirm })}
        </section>
    `;
}
