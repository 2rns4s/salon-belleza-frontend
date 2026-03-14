export function toTrimmedString(value) {
    return String(value ?? "").trim();
}

export function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function getFirstValue(source, keys = [], fallback = null) {
    for (const key of keys) {
        const value = source?.[key];

        if (value !== undefined && value !== null) {
            return value;
        }
    }

    return fallback;
}

export function buildFullName(firstNameOrParts, lastName = "") {
    const parts = Array.isArray(firstNameOrParts)
        ? firstNameOrParts
        : [firstNameOrParts, lastName];

    return parts
        .map((part) => toTrimmedString(part))
        .filter(Boolean)
        .join(" ")
        .trim();
}

export function normalizeDateTimeValue(localDateTimeValue) {
    const rawValue = toTrimmedString(localDateTimeValue);

    if (!rawValue) {
        return "";
    }

    if (rawValue.includes("T") && rawValue.split("T")[1]?.length === 5) {
        return `${rawValue}:00`;
    }

    return rawValue;
}

export function toBackendLocalTime(value) {
    const rawValue = toTrimmedString(value);

    if (!rawValue) {
        return "";
    }

    if (/^\d{2}:\d{2}$/.test(rawValue)) {
        return `${rawValue}:00`;
    }

    return rawValue;
}
