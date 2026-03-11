# Manual Frontend - API Salon de Belleza

Referencia funcional para consumo de la API desde frontend.

## 1) Base de la API

- Base URL: `http://localhost:8080/api/v1`
- Prefijo configurado: `api.base-path=/api/v1` en `src/main/resources/application.properties`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## 2) Autenticacion y seguridad

- Publico (sin JWT): `POST /api/v1/auth/login`, `POST /api/v1/auth/verify-mfa`
- Privado (con JWT): todos los demas endpoints
- Header para endpoints privados: `Authorization: Bearer <token>`

## 3) Formato de error

El backend usa el objeto `ErrorResponse` (`GlobalExceptionHandler`) con este formato:

```json
{
  "timestamp": "2026-03-11T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Error en los datos enviados",
  "details": [
    "campo: mensaje de validacion"
  ]
}
```

Campos:

- `timestamp`: fecha/hora del error
- `status`: codigo HTTP
- `error`: texto HTTP (`Bad Request`, `Unauthorized`, etc.)
- `message`: mensaje principal
- `details`: lista opcional de detalles (normalmente validaciones)

## 4) Codigos HTTP mas comunes

- `200`: consulta/actualizacion exitosa
- `201`: creado
- `204`: eliminado o desactivado sin contenido
- `400`: validacion o datos invalidos
- `401`: no autenticado / credenciales invalidas
- `403`: acceso denegado
- `404`: recurso no encontrado
- `409`: conflicto de negocio (duplicados, solapamiento, etc.)
- `500`: error interno

## 5) Catalogo de endpoints por controller

> Nota: cuando un endpoint referencia un DTO como `XRequest` o `XResponse`, su estructura completa (atributos + tipo) esta en la seccion **6) Contratos DTO detallados**.

---

## AuthController (`/auth`)

### `POST /api/v1/auth/login`

- Que hace: inicia autenticacion por usuario/contrasena.
- Entrada (Body: `LoginRequest`):
  - `nombreUsuario` (string, obligatorio)
  - `contrasena` (string, obligatorio)
- Salida 200 (Body: `LoginResponse`):
  - `token` (string)
  - `mfaRequired` (boolean)
  - `mensaje` (string)
- Errores: `400`, `401`, `500`

### `POST /api/v1/auth/verify-mfa`

- Que hace: valida TOTP y completa login MFA.
- Entrada (Body: `MfaVerificationRequest`):
  - `nombreUsuario` (string, obligatorio)
  - `totpCode` (string, obligatorio, regex `^\\d{6}$`)
  - `preAuthToken` (string, obligatorio)
- Salida 200 (Body: `LoginResponse`)
- Errores: `400`, `401`, `500`

---

## ClienteController (`/clientes`)

### `GET /api/v1/clientes`

- Que hace: lista clientes.
- Entrada: sin body.
- Salida 200: `ClienteResponse[]`
- Errores: `500`

### `GET /api/v1/clientes/{id}`

- Que hace: obtiene cliente por id.
- Entrada: `id` (path, long)
- Salida 200: `ClienteResponse`
- Errores: `404`, `500`

### `GET /api/v1/clientes/buscar`

- Que hace: busqueda por `telefono`, `documento` o `nombre`.
- Entrada (query params opcionales):
  - `telefono` (string)
  - `documento` (string)
  - `nombre` (string)
- Salida 200:
  - por telefono/documento: `ClienteResponse`
  - por nombre: `ClienteResponse[]`
- Errores:
  - `404` (si no existe en busqueda unica)
  - `400` (si no envias ningun parametro; actualmente retorna string plano)
  - `500`

### `POST /api/v1/clientes`

- Que hace: crea cliente.
- Entrada (Body: `CrearClienteRequest`):
  - `nombre` (string, 3-100, obligatorio)
  - `apellido` (string, 3-100, obligatorio)
  - `telefono` (string, regex `^3\\d{9}$`, obligatorio)
  - `documento` (string, regex `^\\d{8,10}$`, obligatorio)
- Salida 201: `ClienteResponse`
- Errores: `400`, `409`, `500`

### `PUT /api/v1/clientes/{id}`

- Que hace: actualiza cliente.
- Entrada:
  - `id` (path, long)
  - Body `ActualizarClienteRequest`:
    - `nombre` (string, 3-100, obligatorio)
    - `apellido` (string, 3-100, obligatorio)
    - `telefono` (string, regex `^3\\d{9}$`, obligatorio)
- Salida 200: `ClienteResponse`
- Errores: `400`, `404`, `409`, `500`

### `DELETE /api/v1/clientes/{id}`

- Que hace: elimina cliente.
- Entrada: `id` (path, long)
- Salida 204: sin contenido
- Errores: `404`, `500`

---

## EmpleadoController (`/empleados`)

### `GET /api/v1/empleados`

- Que hace: lista empleados.
- Entrada: sin body.
- Salida 200: `EmpleadoResponse[]`
- Errores: `500`

### `GET /api/v1/empleados/{id}`

- Que hace: obtiene empleado por id.
- Entrada: `id` (path, long)
- Salida 200: `EmpleadoResponse`
- Errores: `404`, `500`

### `POST /api/v1/empleados`

- Que hace: crea empleado.
- Entrada (Body: `CrearEmpleadoRequest`):
  - `nombre` (string, obligatorio)
  - `apellido` (string, obligatorio)
  - `correo` (string email, obligatorio)
  - `telefono` (string, regex `^3\\d{9}$`, obligatorio)
  - `franjasLaborales` (`CrearFranjaRequest[]`, minimo 1, obligatorio)
  - `serviciosIds` (`Long[]`, minimo 1, obligatorio)
- Salida 201: `EmpleadoResponse`
- Errores: `400`, `404`, `409`, `500`

### `PUT /api/v1/empleados/{id}`

- Que hace: actualizacion parcial de empleado.
- Entrada:
  - `id` (path, long)
  - Body `ActualizarEmpleadoRequest` (todos opcionales):
    - `nombre` (string, 2-100)
    - `apellido` (string, 2-100)
    - `correo` (string email)
    - `telefono` (string, regex `^3\\d{9}$`)
- Salida 200: `EmpleadoResponse`
- Errores: `400`, `404`, `409`, `500`

### `DELETE /api/v1/empleados/{id}`

- Que hace: elimina empleado.
- Entrada: `id` (path, long)
- Salida 204: sin contenido
- Errores: `404`, `500`

---

## ServicioController (`/servicios`)

### `GET /api/v1/servicios`

- Que hace: lista servicios.
- Entrada: sin body.
- Salida 200: `ServicioResponse[]`
- Errores: `500`

### `GET /api/v1/servicios/{id}`

- Que hace: obtiene servicio por id.
- Entrada: `id` (path, long)
- Salida 200: `ServicioResponse`
- Errores: `404`, `500`

### `GET /api/v1/servicios/buscar?nombre=...`

- Que hace: busca servicio por nombre exacto (insensible a mayusculas/minusculas).
- Entrada: `nombre` (query, string, obligatorio)
- Salida 200: `ServicioResponse`
- Errores: `404`, `500`

### `POST /api/v1/servicios`

- Que hace: crea servicio.
- Entrada (Body: `CrearServicioRequest`):
  - `nombre` (string, 3-100, obligatorio)
  - `duracion` (int, minimo 1, obligatorio)
  - `recursos` (`RecursoRequerido[]`, minimo 1, obligatorio)
- Salida 201: `ServicioResponse`
- Errores: `400`, `409`, `500`

### `PUT /api/v1/servicios/{id}`

- Que hace: actualiza servicio.
- Entrada:
  - `id` (path, long)
  - Body `CrearServicioRequest` (mismo contrato del POST)
- Salida 200: `ServicioResponse`
- Errores: `400`, `404`, `409`, `500`

### `DELETE /api/v1/servicios/{id}`

- Que hace: elimina servicio.
- Entrada: `id` (path, long)
- Salida 204: sin contenido
- Errores: `404`, `500`

---

## RecursoController (`/recursos`)

### `GET /api/v1/recursos`

- Que hace: lista recursos.
- Entrada: sin body.
- Salida 200: `RecursoResponse[]`
- Errores: `500`

### `GET /api/v1/recursos/{id}`

- Que hace: obtiene recurso por id.
- Entrada: `id` (path, long)
- Salida 200: `RecursoResponse`
- Errores: `404`, `500`

### `GET /api/v1/recursos/buscar?nombre=...`

- Que hace: busca recurso por nombre exacto (insensible a mayusculas/minusculas).
- Entrada: `nombre` (query, string, obligatorio)
- Salida 200: `RecursoResponse`
- Errores: `404`, `500`

### `POST /api/v1/recursos`

- Que hace: crea recurso.
- Entrada (Body: `CrearRecursoRequest`):
  - `nombre` (string, 3-100, obligatorio)
  - `cantidadTotal` (int, minimo 1, obligatorio)
- Salida 201: `RecursoResponse`
- Errores: `400`, `409`, `500`

### `PUT /api/v1/recursos/{id}`

- Que hace: actualiza recurso.
- Entrada:
  - `id` (path, long)
  - Body `ActualizarRecursoRequest`:
    - `nombre` (string, 3-100, obligatorio)
    - `cantidadTotal` (int, obligatorio)
- Salida 200: `RecursoResponse`
- Errores: `400`, `404`, `409`, `500`

### `DELETE /api/v1/recursos/{id}`

- Que hace: elimina recurso.
- Entrada: `id` (path, long)
- Salida 204: sin contenido
- Errores: `404`, `500`

---

## CitaController (`/citas`)

### `GET /api/v1/citas`

- Que hace: lista citas.
- Entrada: sin body.
- Salida 200: `CitaResponse[]`
- Errores: `500`

### `GET /api/v1/citas/{idCita}`

- Que hace: obtiene cita por id.
- Entrada: `idCita` (path, long)
- Salida 200: `CitaResponse`
- Errores: `404`, `500`

### `POST /api/v1/citas`

- Que hace: crea cita con validacion de reglas (horario, disponibilidad, recursos, solapamientos).
- Entrada (Body: `CrearCitaRequest`):
  - `idCliente` (long, obligatorio)
  - `idServicio` (long, obligatorio)
  - `idEmpleado` (long, obligatorio)
  - `fechaInicio` (`LocalDateTime`, obligatorio, futura)
- Salida 201: `CitaResponse`
- Errores: `400`, `404`, `409`, `500`

### `PUT /api/v1/citas/{idCita}`

- Que hace: actualiza estado de cita.
- Entrada:
  - `idCita` (path, long)
  - Body `ActualizarCitaRequest`:
    - `estado` enum obligatorio: `PENDIENTE | CONFIRMADA | CANCELADA | REALIZADA`
- Salida 200: `CitaResponse`
- Errores: `400`, `404`, `500`

### `DELETE /api/v1/citas/{idCita}`

- Que hace: elimina cita.
- Entrada: `idCita` (path, long)
- Salida 204: sin contenido
- Errores: `404`, `500`

---

## DisponibilidadController (`/disponibilidad`)

### `GET /api/v1/disponibilidad`

- Que hace: consulta horarios disponibles para agendar.
- Entrada (query params, `DisponibilidadRequest`):
  - `fecha` (`YYYY-MM-DD`, obligatorio, presente o futura)
  - `idServicio` (long positivo, obligatorio)
  - `idEmpleado` (long positivo, opcional)
- Salida 200 (Body: `DisponibilidadResponse`):
  - `fecha` (date)
  - `horariosDisponibles` (`LocalTime[]`, formato `HH:mm:ss`)
- Errores: `400`, `404`, `500`

---

## UsuarioController (`/usuarios`)

### `GET /api/v1/usuarios`

- Que hace: lista usuarios.
- Entrada: sin body.
- Salida 200: `UsuarioResponse[]`
- Errores: `500`

### `GET /api/v1/usuarios/{id}`

- Que hace: obtiene usuario por id.
- Entrada: `id` (path, long)
- Salida 200: `UsuarioResponse`
- Errores: `404`, `500`

### `POST /api/v1/usuarios`

- Que hace: crea usuario de acceso.
- Entrada (Body: `CrearUsuarioRequest`):
  - `nombreUsuario` (string, 4-50, obligatorio)
  - `contrasena` (string, 8-100, obligatorio)
  - `rol` (string obligatorio: `OWNER | RECEPTIONIST`)
  - `idEmpleado` (long positivo, obligatorio)
- Salida 201: `UsuarioResponse`
- Errores: `400`, `409`, `500`

### `PUT /api/v1/usuarios/{id}`

- Que hace: actualizacion parcial de usuario.
- Entrada:
  - `id` (path, long)
  - Body `ActualizarUsuarioRequest` (todos opcionales):
    - `nombreUsuario` (string, 4-50)
    - `contrasena` (string, 8-100)
    - `rol` (`OWNER | RECEPTIONIST`)
    - `activo` (boolean)
- Salida 200: `UsuarioResponse`
- Errores: `400`, `404`, `500`

### `DELETE /api/v1/usuarios/{id}`

- Que hace: desactiva usuario (soft delete, `activo=false`).
- Entrada: `id` (path, long)
- Salida 204: sin contenido
- Errores: `404`, `500`

## 6) Contratos DTO detallados (Request y Response)

### 6.1 Request DTOs

#### `LoginRequest`
- `nombreUsuario`: `string`
- `contrasena`: `string`

#### `MfaVerificationRequest`
- `nombreUsuario`: `string`
- `totpCode`: `string` (6 digitos, regex `^\\d{6}$`)
- `preAuthToken`: `string`

#### `CrearClienteRequest`
- `nombre`: `string`
- `apellido`: `string`
- `telefono`: `string`
- `documento`: `string`

#### `ActualizarClienteRequest`
- `nombre`: `string`
- `apellido`: `string`
- `telefono`: `string`

#### `CrearFranjaRequest`
- `dia`: `enum DayOfWeek` (`MONDAY` ... `SUNDAY`)
- `horaInicio`: `LocalTime` (formato `HH:mm:ss`)
- `horaFin`: `LocalTime` (formato `HH:mm:ss`)

#### `CrearEmpleadoRequest`
- `nombre`: `string`
- `apellido`: `string`
- `correo`: `string` (email)
- `telefono`: `string`
- `franjasLaborales`: `CrearFranjaRequest[]`
- `serviciosIds`: `long[]`

#### `ActualizarEmpleadoRequest`
- `nombre`: `string` (opcional)
- `apellido`: `string` (opcional)
- `correo`: `string` (email, opcional)
- `telefono`: `string` (opcional)

#### `RecursoRequerido`
- `idRecurso`: `long`
- `cantidadRequerida`: `int`

#### `CrearServicioRequest`
- `nombre`: `string`
- `duracion`: `int`
- `recursos`: `RecursoRequerido[]`

#### `CrearRecursoRequest`
- `nombre`: `string`
- `cantidadTotal`: `int`

#### `ActualizarRecursoRequest`
- `nombre`: `string`
- `cantidadTotal`: `int`

#### `CrearCitaRequest`
- `idCliente`: `long`
- `idServicio`: `long`
- `idEmpleado`: `long`
- `fechaInicio`: `LocalDateTime` (formato ISO `yyyy-MM-dd'T'HH:mm:ss`)

#### `ActualizarCitaRequest`
- `estado`: `enum EstadoCita` (`PENDIENTE | CONFIRMADA | CANCELADA | REALIZADA`)

#### `DisponibilidadRequest` (query params en `GET /disponibilidad`)
- `fecha`: `LocalDate` (formato `yyyy-MM-dd`)
- `idServicio`: `long`
- `idEmpleado`: `long` (opcional)

#### `CrearUsuarioRequest`
- `nombreUsuario`: `string`
- `contrasena`: `string`
- `rol`: `string` (`OWNER | RECEPTIONIST`)
- `idEmpleado`: `long`

#### `ActualizarUsuarioRequest`
- `nombreUsuario`: `string` (opcional)
- `contrasena`: `string` (opcional)
- `rol`: `string` (`OWNER | RECEPTIONIST`, opcional)
- `activo`: `boolean` (opcional)

### 6.2 Response DTOs

#### `LoginResponse`
- `token`: `string`
- `mfaRequired`: `boolean`
- `mensaje`: `string`

#### `ClienteResponse`
- `idCliente`: `long`
- `nombre`: `string`
- `apellido`: `string`
- `documento`: `string`
- `telefono`: `string`

#### `FranjaLaboralResponse`
- `idFranjaLaboral`: `long`
- `dia`: `enum DayOfWeek`
- `horaInicio`: `LocalTime`
- `horaFin`: `LocalTime`

#### `EmpleadoResponse`
- `idEmpleado`: `long`
- `nombre`: `string`
- `apellido`: `string`
- `correo`: `string`
- `telefono`: `string`
- `franjasLaborales`: `FranjaLaboralResponse[]`
- `serviciosIds`: `long[]`

#### `RecursoEnServicioResponse`
- `idRecurso`: `long`
- `nombre`: `string`
- `cantidadRequerida`: `int`

#### `ServicioResponse`
- `idServicio`: `long`
- `nombre`: `string`
- `duracion`: `int`
- `recursos`: `RecursoEnServicioResponse[]`

#### `RecursoResponse`
- `idRecurso`: `long`
- `nombre`: `string`
- `cantidadTotal`: `int`

#### `CitaRecursoResponse`
- `idCitaRecurso`: `long`
- `idRecurso`: `long`

#### `CitaResponse`
- `idCita`: `long`
- `idCliente`: `long`
- `idServicio`: `long`
- `idEmpleado`: `long`
- `fechaInicio`: `LocalDateTime`
- `fechaFin`: `LocalDateTime`
- `estado`: `enum EstadoCita`
- `recursosAsignados`: `CitaRecursoResponse[]`

#### `DisponibilidadResponse`
- `fecha`: `LocalDate`
- `horariosDisponibles`: `LocalTime[]`

#### `UsuarioResponse`
- `idUsuario`: `long`
- `nombreUsuario`: `string`
- `rol`: `string`
- `idEmpleado`: `long`
- `activo`: `boolean`
- `mfaEnabled`: `boolean`

#### `ErrorResponse`
- `timestamp`: `LocalDateTime`
- `status`: `int`
- `error`: `string`
- `message`: `string`
- `details`: `array` (normalmente `string[]`, puede venir `null`)

## 7) Excepciones de negocio mapeadas por el backend

Segun `GlobalExceptionHandler`, entre otras:

- `ClienteNoEncontradoException` -> `404`
- `ClienteExistenteException` -> `409`
- `EmpleadoNoExistenteException` -> `404`
- `EmpleadoExistenteException` -> `409`
- `ServicioNoEncontradoException` -> `404`
- `ServicioExistenteException` -> `409`
- `RecursoNoEncontradoException` -> `404`
- `RecursoExistenteException` -> `409`
- `CitaNoEncontradaException` -> `404`
- `CitaExistenteException` -> `409`
- `SolapamientoException` -> `409`
- `CitaFueraDeHorarioException` -> `400`
- `EmpleadoNoTrabajaEnEseHorarioException` -> `400`
- `UsuarioNoExistenteException` -> `404`
- `UsuarioExistenteException` -> `409`
- `AccesoDenegadoException` -> `403`
- `AuthenticationException` -> `401`
- `MethodArgumentNotValidException` -> `400` con `details[]`
- `Exception` generica -> `500`

---

Documento alineado con controllers y DTOs actuales en `src/main/java/...`.
