import { USER_SETTINGS_STEPS, USER_SETTINGS_MESSAGES } from "./user-settings.constants.js";

export function renderUserSettingsPage(state) {
    if (state.currentStep === USER_SETTINGS_STEPS.MFA_SETUP) {
        return renderMfaSetupRedirect();
    }

    return renderSettingsMenu(state);
}

function renderSettingsMenu({ isMfaEnabled = false } = {}) {
    const disabledClass = isMfaEnabled ? " user-settings__menu-item--disabled" : "";
    const disabledAttribute = isMfaEnabled ? " disabled aria-disabled=\"true\"" : "";
    const statusBadge = isMfaEnabled
        ? '<span class="user-settings__status-badge user-settings__status-badge--active">Ya activo</span>'
        : '<span class="user-settings__status-badge">Pendiente</span>';

    return `
        <div class="user-settings">
            <div class="user-settings__card">
                <h1 class="user-settings__title">${USER_SETTINGS_MESSAGES.WELCOME}</h1>
                <p class="user-settings__subtitle">Administra la seguridad y preferencias de tu cuenta</p>

                <div class="user-settings__menu">
                    <button id="user-settings-mfa-btn" class="user-settings__menu-item user-settings__menu-item--mfa${disabledClass}" type="button"${disabledAttribute}>
                        <div class="user-settings__menu-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                        <div class="user-settings__menu-content">
                            <h3 class="user-settings__menu-title">${USER_SETTINGS_MESSAGES.MFA_TITLE}</h3>
                            <p class="user-settings__menu-desc">${USER_SETTINGS_MESSAGES.MFA_DESC}</p>
                        </div>
                        <div class="user-settings__menu-meta">
                            ${statusBadge}
                            <span class="user-settings__menu-arrow" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderMfaSetupRedirect() {
    // Este paso es solo transitorio - inmediatamente redirige al módulo MFA
    // No se renderiza nada aquí, solo indica que hay que cargar MFA
    return `
        <div class="user-settings">
            <div class="user-settings__loading">Cargando configuración...</div>
        </div>
    `;
}
