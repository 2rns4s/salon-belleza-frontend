# Integración con la API

El frontend consume una API REST mediante `src/shared/services/httpClient.js`. Este documento distingue el consumo comprobado en el código de los DTO y comportamientos que pertenecen al backend y requieren confirmación.

## Configuración vigente

| Aspecto | Valor comprobado |
|---|---|
| Host base | `http://localhost:8080` |
| Prefijo de endpoints | `/api/v1`, incluido en las constantes de cada feature |
| Transporte | `fetch` |
| Timeout por defecto | 30 000 ms |
| Contenido | `Content-Type: application/json` |
| Autorización | `Authorization: Bearer <token>` cuando existe JWT |
| Respuesta | JSON si `content-type` incluye `application/json`; texto en otro caso |

No existe configuración por ambiente ni HTTPS comprobado. Swagger, OpenAPI, Spring y propiedades del servidor citados en documentos anteriores no pertenecen a este repositorio y no se presentan como verificados.

## Comportamiento del cliente HTTP

1. Concatena el host base y el endpoint, salvo que reciba una URL absoluta.
2. Crea un `AbortController` y combina una señal externa mediante `AbortSignal.any` cuando existe.
3. Agrega cabeceras JSON y el Bearer token almacenado.
4. Convierte abort por timeout en error con `status: 0` y `detail: "timeout"`.
5. Convierte fallos de transporte en `NETWORK_ERROR`, también con `status: 0`.
6. En respuestas no exitosas conserva `status` e intenta leer `data` como JSON.
7. Para `401` o `403` ejecuta el handler global, salvo `skipUnauthorizedHandler`.

## Catálogo de endpoints consumidos

Las rutas se verificaron en Services y constantes del frontend. El éxito, las reglas de negocio y todos los códigos de respuesta siguen siendo responsabilidad del backend.

| Área | Método y endpoint | Uso frontend comprobado |
|---|---|---|
| Auth | `POST /api/v1/auth/login` | Enviar `nombreUsuario` y `contrasena`. |
| Auth | `POST /api/v1/auth/verify-mfa` | Enviar `preAuthToken`, `totpCode` y opcionalmente `nombreUsuario`. |
| Auth | `POST /api/v1/auth/employee-signup` | Enviar `email`, `username`, `password`; no estaba en el manual anterior. |
| Clientes | `GET /api/v1/clientes` | Listar clientes. |
| Clientes | `GET /api/v1/clientes/{id}` | Consultar cliente desde el flujo de citas. |
| Clientes | `GET /api/v1/clientes/buscar` | Buscar con filtros de teléfono, documento o nombre construidos por el consumidor. |
| Clientes | `POST /api/v1/clientes` | Crear cliente. |
| Clientes | `PUT /api/v1/clientes/{id}` | Contrato suministrado históricamente; confirmar uso/soporte backend. |
| Clientes | `DELETE /api/v1/clientes/{id}` | Contrato suministrado históricamente; confirmar uso/soporte backend. |
| Empleados | `GET /api/v1/empleados` | Listar empleados y poblar catálogos. |
| Empleados | `GET /api/v1/empleados/{id}` | Obtener detalle. |
| Empleados | `POST /api/v1/empleados` | Crear empleado. |
| Empleados | `PUT /api/v1/empleados/{id}` | Actualizar empleado. |
| Empleados | `DELETE /api/v1/empleados/{id}` | Eliminar o desactivar según contrato backend. |
| Servicios | `GET /api/v1/servicios` | Listar servicios y poblar catálogos. |
| Servicios | `GET /api/v1/servicios/{id}` | Obtener detalle. |
| Servicios | `POST /api/v1/servicios` | Crear servicio. |
| Servicios | `PUT /api/v1/servicios/{id}` | Actualizar servicio. |
| Servicios | `DELETE /api/v1/servicios/{id}` | Eliminar según contrato backend. |
| Recursos | `GET /api/v1/recursos` | Listar recursos y poblar el formulario de servicios. |
| Recursos | `GET /api/v1/recursos/{id}` | Obtener detalle. |
| Recursos | `POST /api/v1/recursos` | Crear recurso. |
| Recursos | `PUT /api/v1/recursos/{id}` | Actualizar recurso. |
| Recursos | `DELETE /api/v1/recursos/{id}` | Eliminar según contrato backend. |
| Citas | `GET /api/v1/citas` | Listar con filtros opcionales `fecha`, `idServicio`, `idEmpleado`. |
| Citas | `GET /api/v1/citas/{idCita}` | Contrato de consulta individual suministrado; confirmar consumidor actual. |
| Citas | `POST /api/v1/citas` | Crear cita. |
| Citas | `PUT /api/v1/citas/{idCita}` | Cambiar estado. |
| Citas | `DELETE /api/v1/citas/{idCita}` | Eliminar cita. |
| Disponibilidad | `GET /api/v1/disponibilidad` | Consultar por `fecha`, `idServicio` e `idEmpleado` opcional. |
| Usuarios | `GET /api/v1/usuarios` | Listar usuarios. |
| Usuarios | `GET /api/v1/usuarios/{id}` | Obtener detalle. |
| Usuarios | `POST /api/v1/usuarios` | Crear usuario. |
| Usuarios | `PUT /api/v1/usuarios/{id}` | Actualizar usuario. |
| Usuarios | `DELETE /api/v1/usuarios/{id}` | Desactivar/eliminar según contrato backend. |
| MFA | `GET /api/v1/usuarios/me/mfa/setup` | Obtener `secret` y `qrCodeUrl`. |
| MFA | `POST /api/v1/usuarios/me/mfa/enable` | Confirmar `secret` y `code`; el frontend acepta token rotado. |

Los endpoints históricos `/clientes/buscar?…`, `/servicios/buscar?nombre=…` y `/recursos/buscar?nombre=…` deben confirmarse con backend cuando no exista un consumidor vigente que los pruebe.

## DTO de solicitudes

### Contratos comprobados en consumidores

| Operación | Forma enviada por el frontend |
|---|---|
| Login | `{ nombreUsuario, contrasena }` |
| Verificación MFA de login | `{ preAuthToken, totpCode, nombreUsuario? }` |
| Registro de credenciales de empleado | `{ email, username, password }` |
| Activación MFA | `{ secret, code }`, con `code` de seis dígitos validado en UI |
| Crear cita | `{ idCliente, idServicio, idEmpleado, fechaInicio }` |
| Cambiar estado de cita | `{ estado }`; estados UI: `PENDIENTE`, `CONFIRMADA`, `CANCELADA`, `REALIZADA` |
| Disponibilidad | Query `fecha`, `idServicio`, `idEmpleado?` |

### Contratos de referencia migrados

La tabla conserva el contrato suministrado anteriormente para coordinación, pero tipos Java, anotaciones, mínimos, regex y obligatoriedad deben validarse contra OpenAPI o backend antes de tratarlos como definitivos.

| DTO | Campos de referencia |
|---|---|
| `CrearClienteRequest` | `nombre`, `apellido`, `telefono`, `documento` |
| `ActualizarClienteRequest` | `nombre`, `apellido`, `telefono` |
| `CrearFranjaRequest` | `dia`, `horaInicio`, `horaFin` |
| `CrearEmpleadoRequest` | `nombre`, `apellido`, `correo`, `telefono`, `franjasLaborales[]`, `serviciosIds[]` |
| `ActualizarEmpleadoRequest` | `nombre?`, `apellido?`, `correo?`, `telefono?` |
| `RecursoRequerido` | `idRecurso`, `cantidadRequerida` |
| `CrearServicioRequest` | `nombre`, `duracion`, `recursos[]` |
| `CrearRecursoRequest` | `nombre`, `cantidadTotal` |
| `ActualizarRecursoRequest` | `nombre`, `cantidadTotal` |
| `CrearCitaRequest` | `idCliente`, `idServicio`, `idEmpleado`, `fechaInicio` ISO local |
| `ActualizarCitaRequest` | `estado` |
| `CrearUsuarioRequest` | `nombreUsuario`, `contrasena`, `rol`, `idEmpleado` |
| `ActualizarUsuarioRequest` | `nombreUsuario?`, `contrasena?`, `rol?`, `activo?` |
| `MfaEnableRequest` | `secret`, `code` |

Las validaciones locales observadas incluyen teléfonos colombianos `^3\d{9}$`, documentos `^\d{8,10}$`, nombres con límites por feature, contraseñas de 8–100 caracteres y roles `OWNER`/`RECEPTIONIST`. Son validaciones de experiencia de usuario, no prueba de reglas backend.

## DTO de respuestas de referencia

| DTO | Campos esperados por documentación/consumidores |
|---|---|
| `LoginResponse` | `token`, `mfaRequired`, `mensaje`; el flujo también maneja pre-auth según respuesta. |
| `ClienteResponse` | `idCliente`, `nombre`, `apellido`, `documento`, `telefono` |
| `FranjaLaboralResponse` | `idFranjaLaboral`, `dia`, `horaInicio`, `horaFin` |
| `EmpleadoResponse` | `idEmpleado`, datos personales, `franjasLaborales[]`, `serviciosIds[]` |
| `ServicioResponse` | `idServicio`, `nombre`, `duracion`, `recursos[]` |
| `RecursoResponse` | `idRecurso`, `nombre`, `cantidadTotal` |
| `CitaResponse` | `idCita`, IDs relacionados, `fechaInicio`, `fechaFin`, `estado`, `recursosAsignados[]` |
| `DisponibilidadResponse` | `fecha`, `horariosDisponibles[]` |
| `UsuarioResponse` | `idUsuario`, `nombreUsuario`, `rol`, `idEmpleado`, `activo`, indicador MFA |
| `MfaSetupResponse` | `secret`, `qrCodeUrl` como data URI de imagen |

Los mappers aceptan variaciones de nombres y tipos para desacoplar la interfaz. Esa tolerancia no define un contrato canónico del backend.

## Errores

`src/shared/mappers/httpErrorNormalizer.js` reconoce mensajes en `message`, `mensaje`, `error` o `detail`, además de `details`, `fieldErrors` y `errors`. Deriva categorías para `400`, `401`, `403`, `404`, `409` y `5xx`.

Forma de referencia histórica:

```json
{
  "timestamp": "2026-03-11T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Error en los datos enviados",
  "details": ["campo: mensaje de validación"]
}
```

| Código | Interpretación de UI | Límite |
|---:|---|---|
| 400 | Datos o validación inválidos. | Los campos exactos dependen de la respuesta. |
| 401 | Sesión no autenticada o expirada. | El handler global puede limpiar sesión. |
| 403 | Acceso denegado. | No distingue por sí solo sesión y rol. |
| 404 | Recurso no encontrado. | La búsqueda puede usarlo como ausencia esperada. |
| 409 | Conflicto de negocio, duplicado o disponibilidad. | En citas debe actualizarse la agenda. |
| 5xx | Fallo del servidor. | No se debe inventar recuperación exitosa. |
| 0 | Timeout o fallo de red/CORS. | Estado sintético del cliente. |

## Contrato MFA pendiente

El documento histórico declaraba `204 No Content` para `POST /usuarios/me/mfa/enable`. El controller vigente persiste un JWT nuevo cuando la respuesta contiene `{ token }`. Debe acordarse con backend si el éxito definitivo es vacío o entrega token rotado; no deben mantenerse ambos como garantías simultáneas.

## Responsabilidades no verificables aquí

- Anotaciones y validaciones Java, excepciones específicas y `GlobalExceptionHandler`.
- Persistencia, soft delete y reglas transaccionales de concurrencia.
- Cifrado en reposo, logging, auditoría, backups y disponibilidad.
- Swagger/OpenAPI y configuración Spring.
- Códigos exactos por endpoint y entrega de notificaciones.

Requisitos relacionados: [Análisis y requisitos](../analisis/analisis-y-requisitos.md). Seguridad: [Autenticación y MFA](../seguridad/autenticacion-y-mfa.md).