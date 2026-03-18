/**
 * Utility for validating that a date is not in the past.
 * @module utils/dateValidator
 */

/**
 * Validates that a date is not in the past.
 * @param {string|Date} date - The date to validate (ISO string or Date object)
 * @returns {{ valid: boolean, error?: string }} - Object with valid flag and optional error message
 */
export function validateDateNotPast(date) {
    let parsedDate;

    if (date instanceof Date) {
        parsedDate = date;
    } else if (typeof date === "string") {
        parsedDate = new Date(date);
    } else {
        return {
            valid: false,
            error: "Formato de fecha inválido",
        };
    }

    if (Number.isNaN(parsedDate.getTime())) {
        return {
            valid: false,
            error: "Fecha inválida",
        };
    }

    // Get start of today (midnight) for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get start of the provided date
    const dateToCheck = new Date(parsedDate);
    dateToCheck.setHours(0, 0, 0, 0);

    if (dateToCheck < today) {
        return {
            valid: false,
            error: "No se pueden agendar citas en fechas pasadas",
        };
    }

    return { valid: true };
}

/**
 * Validates that a datetime is not in the past (includes time).
 * @param {string|Date} dateTime - The datetime to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDateTimeNotPast(dateTime) {
    let parsedDateTime;

    if (dateTime instanceof Date) {
        parsedDateTime = dateTime;
    } else if (typeof dateTime === "string") {
        parsedDateTime = new Date(dateTime);
    } else {
        return {
            valid: false,
            error: "Formato de fecha y hora inválido",
        };
    }

    if (Number.isNaN(parsedDateTime.getTime())) {
        return {
            valid: false,
            error: "Fecha y hora inválida",
        };
    }

    const now = new Date();

    if (parsedDateTime < now) {
        return {
            valid: false,
            error: "No se pueden agendar citas en fechas u horarios pasados",
        };
    }

    return { valid: true };
}
