export const CLIENTES_ENDPOINTS = Object.freeze({
    clients: "/api/v1/clientes",
});

export const CLIENTES_HTTP_MESSAGES = Object.freeze({
    400: "Hay errores de validacion en el formulario. Revisa los campos e intenta nuevamente.",
    409: "Ya existe un cliente con el documento o telefono registrado.",
});

export const CLIENTES_UI_MESSAGES = Object.freeze({
    title: "Gestion de clientes",
    subtitle: "Consulta el listado y registra nuevos clientes.",
    emptyList: "Aun no hay clientes registrados.",
    createSuccess: "Cliente registrado correctamente.",
    localValidation: "Corrige los campos marcados antes de continuar.",
});

export const CLIENTES_VALIDATION_RULES = Object.freeze({
    firstNameMinLength: 3,
    firstNameMaxLength: 100,
    lastNameMinLength: 3,
    lastNameMaxLength: 100,
    phonePattern: /^3\d{9}$/,
    documentPattern: /^\d{8,10}$/,
});

export const DEFAULT_CLIENTES_ERROR_MESSAGE = "No fue posible completar la operacion. Intenta nuevamente.";
