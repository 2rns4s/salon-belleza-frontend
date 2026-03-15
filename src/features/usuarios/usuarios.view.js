import { USUARIOS_CATALOG_STATUS, USUARIOS_UI_MESSAGES } from "./usuarios.constants.js";
import { escapeHtml } from "../../shared/ui/escapeHtml.js";

// Obtiene el mensaje de error de un campo buscando por múltiples aliases
function getFieldError(fieldErrors, aliases = []) {
    for (const alias of aliases) {
        const fieldError = fieldErrors?.[alias];
        if (fieldError) {
            return String(fieldError);
        }
    }
    return "";
}

// Renderiza un badge de rol con modificador BEM
function renderRoleBadge(role) {
    const modifier = String(role || "").toLowerCase() === "owner" ? "owner" : "receptionist";
    const label = String(role || "").toUpperCase();
    return `<span class="usuarios__badge usuarios__badge--${escapeHtml(modifier)}">${escapeHtml(label)}</span>`;
}

// Renderiza el select de empleados según el estado del catálogo
function renderEmployeeSelect(catalog = [], catalogStatus = USUARIOS_CATALOG_STATUS.IDLE, selectedId = null) {
    if (catalogStatus === USUARIOS_CATALOG_STATUS.LOADING) {
        return `<p class="usuarios__catalog-status">${escapeHtml(USUARIOS_UI_MESSAGES.loadingEmployees)}</p>`;
    }

    if (catalogStatus === USUARIOS_CATALOG_STATUS.ERROR) {
        return `<p class="usuarios__catalog-status usuarios__catalog-status--error">Error al cargar empleados.</p>`;
    }

    if (catalogStatus === USUARIOS_CATALOG_STATUS.EMPTY || (catalogStatus === USUARIOS_CATALOG_STATUS.READY && !catalog.length)) {
        return `<p class="usuarios__catalog-status usuarios__catalog-status--empty">${escapeHtml(USUARIOS_UI_MESSAGES.noEmployees)}</p>`;
    }

    const optionsHtml = catalog
        .map((emp) => {
            const isSelected = Number(emp.id) === Number(selectedId) ? "selected" : "";
            return `<option value="${escapeHtml(emp.id)}" ${isSelected}>${escapeHtml(emp.fullName)}</option>`;
        })
        .join("");

    return `
        <select class="usuarios__form-select" id="usuarios-employee-select" name="idEmpleado" required>
            <option value="">Seleccionar empleado</option>
            ${optionsHtml}
        </select>
    `;
}

// Renderiza las filas de la tabla de usuarios
function renderUserRows(users = [], loadingList = false) {
    if (loadingList) {
        return `
            <tr class="usuarios__table-row usuarios__table-row--loading">
                <td class="usuarios__table-cell usuarios__table-cell--empty" colspan="7">Cargando usuarios...</td>
            </tr>
        `;
    }

    if (!users.length) {
        return `
            <tr class="usuarios__table-row usuarios__table-row--empty">
                <td class="usuarios__table-cell usuarios__table-cell--empty" colspan="7">${escapeHtml(USUARIOS_UI_MESSAGES.emptyList)}</td>
            </tr>
        `;
    }

    return users
        .map((user) => `
            <tr class="usuarios__table-row usuarios__table-row--data">
                <td class="usuarios__table-cell">${escapeHtml(user.id)}</td>
                <td class="usuarios__table-cell usuarios__table-cell--username">${escapeHtml(user.username)}</td>
                <td class="usuarios__table-cell usuarios__table-cell--badge">${renderRoleBadge(user.role)}</td>
                <td class="usuarios__table-cell">${escapeHtml(user.employeeId)}</td>
                <td class="usuarios__table-cell usuarios__table-cell--badge">
                    <span class="usuarios__badge usuarios__badge--${user.active ? "active" : "inactive"}">${user.active ? "Activo" : "Inactivo"}</span>
                </td>
                <td class="usuarios__table-cell">
                    ${user.mfaEnabled ? "✓" : "✗"}
                </td>
                <td class="usuarios__table-cell usuarios__table-cell--actions">
                    <button
                        class="usuarios__btn usuarios__btn--secondary"
                        type="button"
                        data-action="open-edit-modal"
                        data-user-id="${escapeHtml(user.id)}"
                    >Editar</button>
                    <button
                        class="usuarios__btn usuarios__btn--danger"
                        type="button"
                        data-action="open-deactivate-modal"
                        data-user-id="${escapeHtml(user.id)}"
                        data-user-name="${escapeHtml(user.username)}"
                        ${!user.active ? "disabled" : ""}
                    >Desactivar</button>
                </td>
            </tr>
        `)
        .join("");
}

// Renderiza el modal de creación de usuario
function renderCreateModal(state = {}) {
    if (!state.createModal?.isOpen) {
        return "";
    }

    const { form = {}, fieldErrors = {}, errorFeedback = null, saving = false } = state.createModal;

    return `
        <div class="usuarios__modal-overlay" data-action="close-create-modal">
            <section class="usuarios__modal" role="dialog" aria-modal="true" aria-labelledby="usuarios-create-title">
                <header class="usuarios__modal-header">
                    <h3 class="usuarios__modal-title" id="usuarios-create-title">Nuevo usuario</h3>
                    <button class="usuarios__btn usuarios__btn--secondary" type="button" data-action="close-create-modal" aria-label="Cerrar modal">
                        Cerrar
                    </button>
                </header>

                <form class="usuarios__form" id="usuarios-create-form" data-form="create-user" novalidate>
                    <div class="usuarios__form-group">
                        <label class="usuarios__form-label" for="usuarios-username">Nombre de usuario</label>
                        <input
                            class="usuarios__form-input"
                            id="usuarios-username"
                            name="nombreUsuario"
                            type="text"
                            value="${escapeHtml(form.nombreUsuario ?? "")}"
                            autocomplete="username"
                            required
                        />
                        <span class="usuarios__form-error">${escapeHtml(getFieldError(fieldErrors, ["nombreUsuario", "username"]))}</span>
                    </div>

                    <div class="usuarios__form-group">
                        <label class="usuarios__form-label" for="usuarios-password">Contraseña</label>
                        <input
                            class="usuarios__form-input"
                            id="usuarios-password"
                            name="contrasena"
                            type="password"
                            autocomplete="new-password"
                            required
                        />
                        <span class="usuarios__form-error">${escapeHtml(getFieldError(fieldErrors, ["contrasena", "password"]))}</span>
                    </div>

                    <div class="usuarios__form-group">
                        <label class="usuarios__form-label" for="usuarios-rol">Rol</label>
                        <select class="usuarios__form-select" id="usuarios-rol" name="rol" required>
                            <option value="">Seleccionar rol</option>
                            <option value="OWNER" ${form.rol === "OWNER" ? "selected" : ""}>Propietario (OWNER)</option>
                            <option value="RECEPTIONIST" ${form.rol === "RECEPTIONIST" ? "selected" : ""}>Recepcionista (RECEPTIONIST)</option>
                        </select>
                        <span class="usuarios__form-error">${escapeHtml(getFieldError(fieldErrors, ["rol", "role"]))}</span>
                    </div>

                    <div class="usuarios__form-group">
                        <label class="usuarios__form-label" for="usuarios-employee-select">Empleado</label>
                        ${renderEmployeeSelect(state.employeesCatalog, state.employeesCatalogStatus, form.idEmpleado)}
                        <span class="usuarios__form-error">${escapeHtml(getFieldError(fieldErrors, ["idEmpleado", "employeeId"]))}</span>
                    </div>

                    ${errorFeedback
        ? `<p class="usuarios__form-feedback usuarios__form-feedback--error" role="alert">${escapeHtml(errorFeedback)}</p>`
        : ""}

                    <footer class="usuarios__modal-actions">
                        <button class="usuarios__btn usuarios__btn--secondary" type="button" data-action="close-create-modal">
                            Cancelar
                        </button>
                        <button
                            class="usuarios__btn usuarios__btn--primary"
                            type="submit"
                            ${saving ? "disabled" : ""}
                        >
                            ${saving ? "Guardando..." : "Crear usuario"}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    `;
}

// Renderiza el modal de edición de usuario
function renderEditModal(state = {}) {
    if (!state.editModal?.isOpen) {
        return "";
    }

    const { form = {}, fieldErrors = {}, errorFeedback = null, saving = false } = state.editModal;

    return `
        <div class="usuarios__modal-overlay" data-action="close-edit-modal">
            <section class="usuarios__modal" role="dialog" aria-modal="true" aria-labelledby="usuarios-edit-title">
                <header class="usuarios__modal-header">
                    <h3 class="usuarios__modal-title" id="usuarios-edit-title">Editar usuario</h3>
                    <button class="usuarios__btn usuarios__btn--secondary" type="button" data-action="close-edit-modal" aria-label="Cerrar modal">
                        Cerrar
                    </button>
                </header>

                <form class="usuarios__form" id="usuarios-edit-form" data-form="edit-user" novalidate>
                    <div class="usuarios__form-group">
                        <label class="usuarios__form-label" for="usuarios-edit-username">Nombre de usuario</label>
                        <input
                            class="usuarios__form-input"
                            id="usuarios-edit-username"
                            name="nombreUsuario"
                            type="text"
                            value="${escapeHtml(form.nombreUsuario ?? "")}"
                            autocomplete="username"
                        />
                        <span class="usuarios__form-error">${escapeHtml(getFieldError(fieldErrors, ["nombreUsuario", "username"]))}</span>
                    </div>

                    <div class="usuarios__form-group">
                        <label class="usuarios__form-label" for="usuarios-edit-password">Contraseña</label>
                        <input
                            class="usuarios__form-input"
                            id="usuarios-edit-password"
                            name="contrasena"
                            type="password"
                            placeholder="Dejar vacío para no cambiar"
                            autocomplete="new-password"
                        />
                        <span class="usuarios__form-error">${escapeHtml(getFieldError(fieldErrors, ["contrasena", "password"]))}</span>
                    </div>

                    <div class="usuarios__form-group">
                        <label class="usuarios__form-label" for="usuarios-edit-rol">Rol</label>
                        <select class="usuarios__form-select" id="usuarios-edit-rol" name="rol">
                            <option value="">Sin cambio</option>
                            <option value="OWNER" ${form.rol === "OWNER" ? "selected" : ""}>Propietario (OWNER)</option>
                            <option value="RECEPTIONIST" ${form.rol === "RECEPTIONIST" ? "selected" : ""}>Recepcionista (RECEPTIONIST)</option>
                        </select>
                        <span class="usuarios__form-error">${escapeHtml(getFieldError(fieldErrors, ["rol", "role"]))}</span>
                    </div>

                    <div class="usuarios__form-group usuarios__form-group--checkbox">
                        <label class="usuarios__form-label usuarios__form-label--checkbox" for="usuarios-edit-activo">
                            <input
                                class="usuarios__form-checkbox"
                                id="usuarios-edit-activo"
                                name="activo"
                                type="checkbox"
                                ${form.activo ? "checked" : ""}
                            />
                            Activo
                        </label>
                    </div>

                    ${errorFeedback
        ? `<p class="usuarios__form-feedback usuarios__form-feedback--error" role="alert">${escapeHtml(errorFeedback)}</p>`
        : ""}

                    <footer class="usuarios__modal-actions">
                        <button class="usuarios__btn usuarios__btn--secondary" type="button" data-action="close-edit-modal">
                            Cancelar
                        </button>
                        <button
                            class="usuarios__btn usuarios__btn--primary"
                            type="submit"
                            ${saving ? "disabled" : ""}
                        >
                            ${saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    `;
}

// Renderiza el modal de confirmación de desactivación
function renderDeactivateConfirmModal(state = {}) {
    if (!state.deactivateConfirm?.isOpen) {
        return "";
    }

    const { userName = "" } = state.deactivateConfirm;

    return `
        <div class="usuarios__modal-overlay" data-action="cancel-deactivate">
            <section class="usuarios__modal usuarios__modal--confirm" role="alertdialog" aria-modal="true" aria-labelledby="usuarios-deactivate-title">
                <header class="usuarios__modal-header">
                    <h3 class="usuarios__modal-title" id="usuarios-deactivate-title">Confirmar desactivación</h3>
                </header>

                <div class="usuarios__modal-body">
                    <p class="usuarios__modal-text">${escapeHtml(USUARIOS_UI_MESSAGES.deactivateConfirm(userName))}</p>
                </div>

                <footer class="usuarios__modal-actions">
                    <button class="usuarios__btn usuarios__btn--secondary" type="button" data-action="cancel-deactivate">
                        Cancelar
                    </button>
                    <button class="usuarios__btn usuarios__btn--danger" type="button" data-action="confirm-deactivate">
                        Desactivar
                    </button>
                </footer>
            </section>
        </div>
    `;
}

// Renderiza la página principal del módulo de usuarios
export function renderUsuariosPage(state = {}) {
    const users = Array.isArray(state.users) ? state.users : [];

    return `
        <section class="usuarios">
            <header class="usuarios__header">
                <div class="usuarios__header-copy">
                    <h2 class="usuarios__title">${escapeHtml(USUARIOS_UI_MESSAGES.title)}</h2>
                    <p class="usuarios__subtitle">${escapeHtml(USUARIOS_UI_MESSAGES.subtitle)}</p>
                </div>
                <div class="usuarios__toolbar">
                    <button class="usuarios__btn usuarios__btn--primary" type="button" data-action="open-create-modal">
                        Nuevo usuario
                    </button>
                </div>
            </header>

            ${state.errorFeedback
        ? `<p class="usuarios__message usuarios__message--error" role="alert">${escapeHtml(state.errorFeedback)}</p>`
        : ""}
            ${state.successMessage
        ? `<p class="usuarios__message usuarios__message--success" role="status">${escapeHtml(state.successMessage)}</p>`
        : ""}

            <section class="usuarios__panel">
                <div class="usuarios__table-wrapper">
                    <table class="usuarios__table" aria-describedby="usuarios-table-caption">
                        <caption class="usuarios__table-caption" id="usuarios-table-caption">
                            Listado de usuarios del sistema
                        </caption>
                        <thead class="usuarios__table-head">
                            <tr class="usuarios__table-head-row">
                                <th class="usuarios__table-head-cell" scope="col">ID</th>
                                <th class="usuarios__table-head-cell" scope="col">Nombre de usuario</th>
                                <th class="usuarios__table-head-cell" scope="col">Rol</th>
                                <th class="usuarios__table-head-cell" scope="col">ID Empleado</th>
                                <th class="usuarios__table-head-cell" scope="col">Estado</th>
                                <th class="usuarios__table-head-cell" scope="col">MFA</th>
                                <th class="usuarios__table-head-cell" scope="col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="usuarios__table-body">
                            ${renderUserRows(users, Boolean(state.loadingList))}
                        </tbody>
                    </table>
                </div>
            </section>

            ${renderCreateModal(state)}
            ${renderEditModal(state)}
            ${renderDeactivateConfirmModal(state)}
        </section>
    `;
}
