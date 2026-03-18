/**
 * Generic state machine utility for managing state transitions.
 * @module utils/stateMachine
 */

/**
 * Creates a state machine with configurable states and transitions.
 * @param {Object} config - Configuration object
 * @param {string[]} config.states - Array of valid states
 * @param {Object.<string, string[]>} config.transitions - Map of allowed transitions { fromState: [toState1, toState2, ...] }
 * @param {string} config.initialState - The initial state
 * @returns {Object} State machine instance
 */
export function createStateMachine(config) {
    const { states = [], transitions = {}, initialState = "" } = config;

    if (!states.includes(initialState)) {
        throw new Error(`Estado inicial "${initialState}" no es válido`);
    }

    let currentState = initialState;

    return {
        /**
         * Gets the current state.
         * @returns {string} Current state
         */
        getState() {
            return currentState;
        },

        /**
         * Attempts to transition to a new state.
         * @param {string} newState - The target state
         * @returns {{ success: boolean, error?: string, newState?: string }}
         */
        transition(newState) {
            if (!states.includes(newState)) {
                return {
                    success: false,
                    error: `Estado "${newState}" no es válido`,
                };
            }

            const allowedTransitions = transitions[currentState] || [];

            if (currentState === newState) {
                return {
                    success: true,
                    newState: currentState,
                };
            }

            if (!allowedTransitions.includes(newState)) {
                return {
                    success: false,
                    error: `Transición de "${currentState}" a "${newState}" no permitida`,
                };
            }

            currentState = newState;

            return {
                success: true,
                newState: currentState,
            };
        },

        /**
         * Resets the state machine to initial state.
         */
        reset() {
            currentState = initialState;
        },

        /**
         * Checks if a transition is valid without performing it.
         * @param {string} newState - The target state
         * @returns {boolean}
         */
        canTransition(newState) {
            if (!states.includes(newState)) {
                return false;
            }

            const allowedTransitions = transitions[currentState] || [];

            if (currentState === newState) {
                return true;
            }

            return allowedTransitions.includes(newState);
        },

        /**
         * Gets all valid next states from current state.
         * @returns {string[]} Array of valid next states
         */
        getValidTransitions() {
            if (currentState === "") {
                return states;
            }
            return transitions[currentState] || [];
        },
    };
}

/**
 * Predefined state machine for appointment status transitions.
 * @returns {Object} State machine instance for appointments
 */
export function createAppointmentStateMachine() {
    return createStateMachine({
        states: ["PENDIENTE", "CONFIRMADA", "CANCELADA", "REALIZADA"],
        transitions: {
            PENDIENTE: ["CONFIRMADA", "CANCELADA"],
            CONFIRMADA: ["REALIZADA", "CANCELADA"],
            CANCELADA: [],
            REALIZADA: [],
        },
        initialState: "PENDIENTE",
    });
}
