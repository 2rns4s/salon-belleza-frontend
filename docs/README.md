# Documentación del frontend

Este índice organiza la documentación mantenida por función. Para comprender el producto, comience por el análisis; para modificarlo, continúe con arquitectura, estructura y convenciones.

## Ruta de lectura recomendada

1. [Análisis y requisitos](analisis/analisis-y-requisitos.md): problema, entrevista simulada, alcance, RF, RNF, historias de usuario y trazabilidad.
2. [Arquitectura frontend](arquitectura/arquitectura-frontend.md): límites, flujos, hash routing y seguridad entre módulos.
3. [Estructura del proyecto](desarrollo/estructura-del-proyecto.md): mapa de directorios y responsabilidades.
4. [Convenciones de desarrollo](desarrollo/convenciones.md): reglas observadas para JavaScript, MVC-like, mappers, errores y CSS.
5. [Integración API](api/integracion-api.md): cliente HTTP, endpoints consumidos y límites de los contratos.

## Documentos mantenidos

| Área | Documento | Contenido |
|---|---|---|
| Entrada | [README del repositorio](../README.md) | Propósito, estado, inicio rápido y comandos. |
| Análisis | [Análisis y requisitos](analisis/analisis-y-requisitos.md) | Documento autoritativo de la fase de análisis. |
| Arquitectura | [Arquitectura frontend](arquitectura/arquitectura-frontend.md) | Diseño vigente y límites de responsabilidad. |
| Desarrollo | [Estructura del proyecto](desarrollo/estructura-del-proyecto.md) | Módulos, carpetas y dependencias. |
| Desarrollo | [Convenciones](desarrollo/convenciones.md) | Nomenclatura, código, errores y contribución. |
| API | [Integración API](api/integracion-api.md) | Consumo REST, DTO de referencia y errores. |
| Seguridad | [Autenticación y MFA](seguridad/autenticacion-y-mfa.md) | JWT, pre-auth, TOTP, almacenamiento y guardas. |
| Calidad | [Estrategia de pruebas](calidad/estrategia-de-pruebas.md) | Vitest/jsdom, suites, comandos y límites de evidencia. |
| Calidad | [Accesibilidad y usabilidad](calidad/accesibilidad-y-usabilidad.md) | Prácticas comprobadas y objetivos pendientes. |
| Estilos | [Sistema de diseño](estilos/sistema-de-diseno.md) | Tokens CSS, BEM, componentes y responsive. |

## Reportes históricos de pruebas

Estos archivos se conservan sin modificación. Sus resultados pertenecen a la fecha y al entorno indicados en cada reporte; no representan automáticamente el estado actual.

- [Especificación de RNF de citas](testing/citas-rnf.md)
- [Resultados de RNF de citas](testing/citas-rnf-results.md)
- [Trazabilidad de especificación de citas](testing/citas-spec-traceability.md)
- [Reporte de pruebas de citas](testing/citas-test-report.md)
- [Baseline de refactor y hardening](testing/refactor-hardening-baseline.md)
- [Reporte de refactor y hardening](testing/refactor-hardening-report.md)

## Límites documentales

- Los requisitos del producto se definen una sola vez en [Análisis y requisitos](analisis/analisis-y-requisitos.md); los documentos técnicos enlazan ese origen en lugar de duplicarlo.
- Los endpoints se catalogan una sola vez en [Integración API](api/integracion-api.md).
- Los comportamientos de backend, infraestructura o producción se marcan como contrato de referencia o no verificados cuando este repositorio no aporta evidencia.