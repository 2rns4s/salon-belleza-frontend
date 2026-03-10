// Renderiza el formulario de inicio de sesion
export function renderLoginForm({ error = null, loading = false } = {}) {
    return `
        <section class="auth">
            <div class="auth__card">
                <h2 class="auth__title">Iniciar sesión</h2>
                ${error ? `<p class="auth__error" role="alert">${error}</p>` : ""}
                <form class="auth__form" id="login-form" novalidate>
                    <div class="auth__field">
                        <label class="auth__label" for="nombreUsuario">Usuario</label>
                        <input
                            class="auth__input"
                            type="text"
                            id="nombreUsuario"
                            name="nombreUsuario"
                            autocomplete="username"
                            required
                        />
                        <span class="auth__field-error" id="error-nombreUsuario"></span>
                    </div>
                    <div class="auth__field">
                        <label class="auth__label" for="contrasena">Contraseña</label>
                        <input
                            class="auth__input"
                            type="password"
                            id="contrasena"
                            name="contrasena"
                            autocomplete="current-password"
                            required
                        />
                        <span class="auth__field-error" id="error-contrasena"></span>
                    </div>
                    <button class="auth__btn auth__btn--primary" type="submit" ${loading ? "disabled" : ""}>
                        ${loading ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>
            </div>
        </section>
    `;
}

// Renderiza el formulario de verificacion de dos factores (TOTP)
export function renderMfaForm({ error = null, loading = false } = {}) {
    return `
        <section class="auth">
            <div class="auth__card">
                <h2 class="auth__title">Verificación en dos pasos</h2>
                <p class="auth__description">
                    Ingresa el código de 6 dígitos de tu aplicación autenticadora.
                </p>
                ${error ? `<p class="auth__error" role="alert">${error}</p>` : ""}
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
                        <span class="auth__field-error" id="error-totpCode"></span>
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
