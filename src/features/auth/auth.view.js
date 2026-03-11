function escapeHtml(rawValue) {
    return String(rawValue ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function renderGlobalError(errorMessage) {
    if (!errorMessage) {
        return "";
    }

    return `<p class="auth__error" role="alert">${escapeHtml(errorMessage)}</p>`;
}

function renderFieldError(message) {
    return escapeHtml(message || "");
}

// Renderiza la pantalla de inicio de sesion.
export function renderLoginPage({
    loading = false,
    errorMessage = "",
    fieldErrors = {},
    username = "",
} = {}) {
    return `
        <section class="auth">
            <div class="auth__card">
                <h2 class="auth__title">Iniciar sesión</h2>
                ${renderGlobalError(errorMessage)}
                <form class="auth__form" id="login-form" novalidate>
                    <div class="auth__field">
                        <label class="auth__label" for="username">Usuario</label>
                        <input
                            class="auth__input"
                            type="text"
                            id="username"
                            name="username"
                            value="${escapeHtml(username)}"
                            autocomplete="username"
                            required
                        />
                        <span class="auth__field-error" id="error-username">${renderFieldError(fieldErrors.username)}</span>
                    </div>
                    <div class="auth__field">
                        <label class="auth__label" for="password">Contraseña</label>
                        <input
                            class="auth__input"
                            type="password"
                            id="password"
                            name="password"
                            autocomplete="current-password"
                            required
                        />
                        <span class="auth__field-error" id="error-password">${renderFieldError(fieldErrors.password)}</span>
                    </div>
                    <button class="auth__btn auth__btn--primary" type="submit" ${loading ? "disabled" : ""}>
                        ${loading ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>
            </div>
        </section>
    `;
}

// Renderiza la pantalla de verificacion MFA.
export function renderMfaPage({
    loading = false,
    errorMessage = "",
    fieldErrors = {},
} = {}) {
    return `
        <section class="auth">
            <div class="auth__card">
                <h2 class="auth__title">Verificación en dos pasos</h2>
                <p class="auth__description">
                    Ingresa el código de 6 dígitos de tu aplicación autenticadora.
                </p>
                ${renderGlobalError(errorMessage)}
                <form class="auth__form" id="mfa-form" novalidate>
                    <div class="auth__field">
                        <label class="auth__label" for="totpCode">Código de verificación</label>
                        <input
                            class="auth__input auth__input--otp"
                            type="text"
                            id="totpCode"
                            name="totpCode"
                            inputmode="numeric"
                            pattern="[0-9]{6}"
                            maxlength="6"
                            autocomplete="one-time-code"
                            required
                        />
                        <span class="auth__field-error" id="error-totpCode">${renderFieldError(fieldErrors.totpCode)}</span>
                    </div>
                    <button class="auth__btn auth__btn--primary" type="submit" ${loading ? "disabled" : ""}>
                        ${loading ? "Verificando..." : "Verificar"}
                    </button>
                    <button class="auth__btn auth__btn--secondary" type="button" id="btn-back">
                        Volver al inicio de sesión
                    </button>
                </form>
            </div>
        </section>
    `;
}

// Renderiza el estado de carga general para operaciones de auth.
export function renderLoadingState({ currentState = "login" } = {}) {
    const message = currentState === "mfa"
        ? "Validando código de verificación..."
        : "Iniciando sesión...";

    return `
        <section class="auth">
            <div class="auth__card">
                <h2 class="auth__title">Procesando</h2>
                <p class="auth__description">${escapeHtml(message)}</p>
            </div>
        </section>
    `;
}
