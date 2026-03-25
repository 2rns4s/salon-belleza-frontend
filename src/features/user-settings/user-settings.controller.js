import { USER_SETTINGS_STEPS } from "./user-settings.constants.js";
import { renderUserSettingsPage } from "./user-settings.view.js";
import { navegarA } from "../../shared/router/router.js";
import { resolveAuthUserContext } from "../../shared/state/authStore.js";

let settingsState = {
    currentStep: USER_SETTINGS_STEPS.MENU,
    isMfaEnabled: false,
};

function updateStateAndRender(container) {
    const html = renderUserSettingsPage(settingsState);
    container.innerHTML = html;
    attachEventListeners(container);
}

function attachEventListeners(container) {
    const mfaBtnElement = container.querySelector("#user-settings-mfa-btn");
    if (mfaBtnElement instanceof HTMLElement) {
        mfaBtnElement.addEventListener("click", () => {
            if (settingsState.isMfaEnabled) {
                return;
            }
            navegarA("/mfa-setup");
        });
    }
}

export function initUserSettings(container) {
    if (!(container instanceof Element)) {
        return;
    }

    const userContext = resolveAuthUserContext();

    settingsState = {
        currentStep: USER_SETTINGS_STEPS.MENU,
        isMfaEnabled: Boolean(userContext?.isMfaEnabled),
    };

    updateStateAndRender(container);
}
