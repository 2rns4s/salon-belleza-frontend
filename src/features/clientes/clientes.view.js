import { CLIENTES_UI_MESSAGES } from "./clientes.constants.js";

function escapeHtml(rawValue) {
    return String(rawValue ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function getFieldError(fieldErrors, aliases = []) {
    for (const alias of aliases) {
        const fieldError = fieldErrors?.[alias];

        if (fieldError) {
            return String(fieldError);
        }
    }

    return "";
}

function renderFeedbackMessage(message, modifier, role) {
    if (!message) {
        return "";
    }

    return `<p class="clients__message clients__message--${modifier}" role="${role}">${escapeHtml(message)}</p>`;
}

function renderClientRows({ clients = [], loadingList = false }) {
    if (loadingList) {
        return `
            <tr class="clients__table-row clients__table-row--loading">
                <td class="clients__table-cell clients__table-cell--empty" colspan="5">Cargando clientes...</td>
            </tr>
        `;
    }

    if (!clients.length) {
        return `
            <tr class="clients__table-row clients__table-row--empty">
                <td class="clients__table-cell clients__table-cell--empty" colspan="5">${escapeHtml(CLIENTES_UI_MESSAGES.emptyList)}</td>
            </tr>
        `;
    }

    return clients
        .map((client) => `
            <tr class="clients__table-row clients__table-row--data">
                <td class="clients__table-cell">${escapeHtml(client.id)}</td>
                <td class="clients__table-cell clients__table-cell--name">${escapeHtml(client.fullName)}</td>
                <td class="clients__table-cell">${escapeHtml(client.documentNumber || "Sin documento")}</td>
                <td class="clients__table-cell">${escapeHtml(client.phone || "Sin telefono")}</td>
                <td class="clients__table-cell">${escapeHtml(client.firstName || "-")}</td>
            </tr>
        `)
        .join("");
}

function renderCreateModal({ isCreateModalOpen, createForm, fieldErrors, createErrorMessage, savingCreate }) {
    if (!isCreateModalOpen) {
        return "";
    }

    return `
        <div class="clients__modal-overlay" data-clients-close="overlay">
            <section class="clients__modal" role="dialog" aria-modal="true" aria-labelledby="clients-create-title">
                <header class="clients__modal-header">
                    <h3 class="clients__modal-title" id="clients-create-title">Registrar cliente</h3>
                    <button class="clients__icon-button" id="clients-close-modal-btn" type="button" aria-label="Cerrar modal">
                        Cerrar
                    </button>
                </header>

                <form class="clients__form" id="clients-create-form" novalidate>
                    <label class="clients__field" for="clients-first-name">
                        <span class="clients__field-label">Nombre</span>
                        <input
                            class="clients__input"
                            id="clients-first-name"
                            name="firstName"
                            value="${escapeHtml(createForm.firstName)}"
                            autocomplete="given-name"
                            required
                        />
                        <span class="clients__field-error">${escapeHtml(getFieldError(fieldErrors, ["firstName", "nombre"]))}</span>
                    </label>

                    <label class="clients__field" for="clients-last-name">
                        <span class="clients__field-label">Apellido</span>
                        <input
                            class="clients__input"
                            id="clients-last-name"
                            name="lastName"
                            value="${escapeHtml(createForm.lastName)}"
                            autocomplete="family-name"
                            required
                        />
                        <span class="clients__field-error">${escapeHtml(getFieldError(fieldErrors, ["lastName", "apellido"]))}</span>
                    </label>

                    <label class="clients__field" for="clients-phone">
                        <span class="clients__field-label">Telefono</span>
                        <input
                            class="clients__input"
                            id="clients-phone"
                            name="phone"
                            value="${escapeHtml(createForm.phone)}"
                            inputmode="numeric"
                            autocomplete="tel"
                            required
                        />
                        <span class="clients__field-error">${escapeHtml(getFieldError(fieldErrors, ["phone", "telefono"]))}</span>
                    </label>

                    <label class="clients__field" for="clients-document">
                        <span class="clients__field-label">Documento</span>
                        <input
                            class="clients__input"
                            id="clients-document"
                            name="documentNumber"
                            value="${escapeHtml(createForm.documentNumber)}"
                            inputmode="numeric"
                            required
                        />
                        <span class="clients__field-error">${escapeHtml(getFieldError(fieldErrors, ["documentNumber", "documento"]))}</span>
                    </label>

                    ${createErrorMessage
        ? `<p class="clients__form-message clients__form-message--error" role="alert">${escapeHtml(createErrorMessage)}</p>`
        : ""}

                    <footer class="clients__modal-actions">
                        <button class="clients__button clients__button--secondary" id="clients-cancel-create-btn" type="button">
                            Cancelar
                        </button>

                        <button
                            class="clients__button clients__button--primary"
                            id="clients-submit-create-btn"
                            type="submit"
                            ${savingCreate ? "disabled" : ""}
                        >
                            ${savingCreate ? "Guardando cliente..." : "Guardar cliente"}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    `;
}

export function renderClientesPage(state = {}) {
    const clients = Array.isArray(state.clients) ? state.clients : [];

    return `
        <section class="clients">
            <header class="clients__header">
                <div class="clients__header-copy">
                    <h2 class="clients__title">${escapeHtml(CLIENTES_UI_MESSAGES.title)}</h2>
                    <p class="clients__subtitle">${escapeHtml(CLIENTES_UI_MESSAGES.subtitle)}</p>
                </div>

                <div class="clients__toolbar">
                    <button class="clients__button clients__button--secondary" id="clients-refresh-btn" type="button">
                        Actualizar listado
                    </button>

                    <button class="clients__button clients__button--primary" id="clients-open-create-btn" type="button">
                        Nuevo cliente
                    </button>
                </div>
            </header>

            ${renderFeedbackMessage(state.errorMessage, "error", "alert")}
            ${renderFeedbackMessage(state.successMessage, "success", "status")}

            <section class="clients__panel">
                <div class="clients__table-wrapper">
                    <table class="clients__table" aria-describedby="clients-table-caption">
                        <caption class="clients__table-caption" id="clients-table-caption">
                            Listado de clientes registrados
                        </caption>
                        <thead class="clients__table-head">
                            <tr class="clients__table-head-row">
                                <th class="clients__table-head-cell" scope="col">ID</th>
                                <th class="clients__table-head-cell" scope="col">Nombre completo</th>
                                <th class="clients__table-head-cell" scope="col">Documento</th>
                                <th class="clients__table-head-cell" scope="col">Telefono</th>
                                <th class="clients__table-head-cell" scope="col">Nombre base</th>
                            </tr>
                        </thead>

                        <tbody class="clients__table-body">
                            ${renderClientRows({ clients, loadingList: Boolean(state.loadingList) })}
                        </tbody>
                    </table>
                </div>
            </section>

            ${renderCreateModal({
        isCreateModalOpen: Boolean(state.isCreateModalOpen),
        createForm: state.createForm || {},
        fieldErrors: state.fieldErrors || {},
        createErrorMessage: state.createErrorMessage || "",
        savingCreate: Boolean(state.savingCreate),
    })}
        </section>
    `;
}
