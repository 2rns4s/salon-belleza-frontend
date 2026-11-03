import { RECURSOS_VALIDATION } from "./recursos.constants.js";
// Escape HTML compartido contra XSS (fuente unica en shared/ui/escapeHtml.js).
import { escapeHtml } from "../../shared/ui/escapeHtml.js";

function renderFeedbackMessage(message, modifier, role) {
    if (!message) return "";
    return `<p class="resource-list__message resource-list__message--${modifier}" role="${role}">${escapeHtml(message)}</p>`;
}

function renderResourceRows({ resources = [], loadingList = false }) {
    if (loadingList) {
        return `
            <tr class="resource-list__table-row resource-list__table-row--loading">
                <td class="resource-list__table-cell resource-list__table-cell--empty" colspan="4">Cargando recursos...</td>
            </tr>
        `;
    }

    if (!resources.length) {
        return `
            <tr class="resource-list__table-row resource-list__table-row--empty">
                <td class="resource-list__table-cell resource-list__table-cell--empty" colspan="4">No hay recursos registrados.</td>
            </tr>
        `;
    }

    return resources
        .map((r) => `
            <tr class="resource-list__table-row resource-list__table-row--data">
                <td class="resource-list__table-cell">${escapeHtml(r.id)}</td>
                <td class="resource-list__table-cell resource-list__table-cell--name">${escapeHtml(r.name)}</td>
                <td class="resource-list__table-cell">${escapeHtml(r.totalQuantity)}</td>
                <td class="resource-list__table-cell resource-list__table-cell--actions">
                    <button class="resource-actions__btn resource-actions__btn--edit"
                        data-resource-edit-id="${escapeHtml(r.id)}"
                        type="button">Editar</button>
                    <button class="resource-actions__btn resource-actions__btn--delete"
                        data-resource-delete-id="${escapeHtml(r.id)}"
                        type="button">Eliminar</button>
                </td>
            </tr>
        `)
        .join("");
}

function renderFormModal({ formModal }) {
    if (!formModal.isOpen) return "";

    const { form, fieldErrors, errorMessage, mode } = formModal;
    const isEdit = mode === "edit";
    const title = isEdit ? "Editar recurso" : "Nuevo recurso";
    const submitLabel = isEdit ? "Guardar cambios" : "Crear recurso";

    const nameError = fieldErrors?.name ? `<span class="resource-form__field-error">${escapeHtml(fieldErrors.name)}</span>` : "";
    const qtyError = fieldErrors?.totalQuantity ? `<span class="resource-form__field-error">${escapeHtml(fieldErrors.totalQuantity)}</span>` : "";

    return `
        <div class="resource-modal__overlay" data-resources-close="overlay">
            <section class="resource-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="resource-form-title">
                <header class="resource-modal__header">
                    <h3 class="resource-modal__title" id="resource-form-title">${escapeHtml(title)}</h3>
                    <button class="resource-modal__close-btn" id="resources-close-modal-btn" type="button" aria-label="Cerrar modal">Cerrar</button>
                </header>
                <form class="resource-form" id="resources-form" novalidate>
                    ${renderFeedbackMessage(errorMessage, "error", "alert")}
                    <label class="resource-form__field" for="resources-name">
                        <span class="resource-form__label">Nombre</span>
                        <input class="resource-form__input${fieldErrors?.name ? " resource-form__input--invalid" : ""}"
                            id="resources-name" name="name" type="text"
                            minlength="${RECURSOS_VALIDATION.NOMBRE_MIN}" maxlength="${RECURSOS_VALIDATION.NOMBRE_MAX}"
                            value="${escapeHtml(form?.name ?? "")}" autocomplete="off" />
                        ${nameError}
                    </label>
                    <label class="resource-form__field" for="resources-total-quantity">
                        <span class="resource-form__label">Cantidad total</span>
                        <input class="resource-form__input${fieldErrors?.totalQuantity ? " resource-form__input--invalid" : ""}"
                            id="resources-total-quantity" name="totalQuantity" type="number"
                            min="${RECURSOS_VALIDATION.CANTIDAD_MIN}"
                            value="${escapeHtml(form?.totalQuantity ?? "")}" />
                        ${qtyError}
                    </label>
                    <div class="resource-form__actions">
                        <button class="resource-form__btn resource-form__btn--cancel" id="resources-cancel-btn" type="button">Cancelar</button>
                        <button class="resource-form__btn resource-form__btn--submit" type="submit">${escapeHtml(submitLabel)}</button>
                    </div>
                </form>
            </section>
        </div>
    `;
}

function renderDeleteConfirm({ deleteConfirm }) {
    if (!deleteConfirm.isOpen) return "";

    return `
        <div class="resource-modal__overlay" data-resources-close="overlay">
            <section class="resource-modal__dialog resource-modal__dialog--confirm" role="dialog" aria-modal="true">
                <p class="resource-modal__confirm-text">¿Eliminar el recurso <strong>${escapeHtml(deleteConfirm.resourceName)}</strong>? Esta acción no se puede deshacer.</p>
                <div class="resource-modal__confirm-actions">
                    <button class="resource-form__btn resource-form__btn--cancel" id="resources-cancel-delete-btn" type="button">Cancelar</button>
                    <button class="resource-form__btn resource-form__btn--danger" id="resources-confirm-delete-btn" type="button">Eliminar</button>
                </div>
            </section>
        </div>
    `;
}

export function renderRecursosPage(state) {
    const {
        resources = [],
        loadingList = false,
        errorMessage = "",
        successMessage = "",
        formModal = { isOpen: false },
        deleteConfirm = { isOpen: false },
    } = state;

    return `
        <section class="resource-list">
            <header class="resource-list__header">
                <h2 class="resource-list__title">Gestión de Recursos</h2>
                <div class="resource-list__header-actions">
                    <button class="resource-actions__btn resource-actions__btn--refresh" id="resources-refresh-btn" type="button">Actualizar</button>
                    <button class="resource-actions__btn resource-actions__btn--create" id="resources-open-create-btn" type="button">Nuevo recurso</button>
                </div>
            </header>

            ${renderFeedbackMessage(errorMessage, "error", "alert")}
            ${renderFeedbackMessage(successMessage, "success", "status")}

            <table class="resource-list__table">
                <thead class="resource-list__table-head">
                    <tr>
                        <th class="resource-list__table-header">ID</th>
                        <th class="resource-list__table-header">Nombre</th>
                        <th class="resource-list__table-header">Cantidad total</th>
                        <th class="resource-list__table-header">Acciones</th>
                    </tr>
                </thead>
                <tbody class="resource-list__table-body" id="resources-table-body">
                    ${renderResourceRows({ resources, loadingList })}
                </tbody>
            </table>

            ${renderFormModal({ formModal })}
            ${renderDeleteConfirm({ deleteConfirm })}
        </section>
    `;
}
