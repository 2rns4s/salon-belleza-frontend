# Trazabilidad de requisitos en código y pruebas

Este estándar define cómo etiquetar el código y las pruebas para que cada pieza
declare, de forma verificable, a qué requisito del SRS responde. El objetivo es
operativo: al abrir un archivo o leer el nombre de una prueba, debe quedar claro
frente a qué RF, RNF e historia de usuario estamos, sin tener que deducirlo.

No introduce ninguna herramienta nueva. Se apoya en Vitest (stack vigente) y en
comentarios de código. No es BDD con Cucumber/Gherkin; es documentación de
comportamiento trazable al requisito.

## Fuentes de verdad

- **RF / RNF**: numeración del SRS IEEE 830 del proyecto (RF-001..RF-010,
  RNF-001..RNF-015).
- **HU**: historias de usuario del SRS (HU-01..HU-10).
- **Narrativa de la HU**: el campo "Descripción de la historia de usuario" del
  SRS, con el formato `Como <rol>, quiero <capacidad>, para <beneficio>`. Es la
  voz del usuario levantada en el análisis y se usa como equivalente a la
  evidencia de entrevista, porque es la fuente real y verificable disponible en
  el proyecto.

Regla innegociable: no se inventan requisitos ni citas de entrevista. Si un
comportamiento del código no mapea a un requisito del SRS, se documenta como
decisión de implementación, no se le asigna un RF/RNF falso.

## Etiquetas en comentarios de código

En la cabecera del archivo (o de la función relevante) se usa un bloque con
estas etiquetas. Solo se incluyen las que apliquen:

```js
/**
 * Servicio de citas: transporte HTTP del módulo de agendamiento.
 *
 * @requisito RF-001 Motor de control de concurrencia (empleado Y recurso)
 * @requisito RF-008 Registrar cita
 * @rnf RNF-008 Integridad: evitar sobre-reserva (overbooking)
 * @hu HU-01, HU-08
 * @narrativa Como Recepcionista, quiero que el sistema valide la disponibilidad
 *            del empleado Y del recurso físico al mismo tiempo, para agendar
 *            citas complejas sin errores de doble reserva.
 */
```

| Etiqueta | Significado |
|---|---|
| `@requisito RF-00X <nombre>` | Requisito funcional que la pieza implementa o soporta. |
| `@rnf RNF-00X <atributo>` | Requisito no funcional que la pieza respeta o mide. |
| `@hu HU-0X` | Historia(s) de usuario asociada(s). |
| `@narrativa` | Cita textual (o fiel) de la descripción de la HU del SRS. |

## Etiquetas en pruebas

Los `describe`/`it` llevan el requisito en el propio texto, de modo que el
reporte de Vitest sea legible como evidencia:

```js
describe("RF-001 / HU-01 — Motor de control de concurrencia", () => {
  it("Dado un servicio que requiere empleado y recurso, cuando se consulta disponibilidad, entonces solo muestra horarios con ambos libres", () => {
    // ...
  });
});
```

Convención de nombres:

- `describe`: `"<RF/RNF> / <HU> — <nombre corto del requisito>"`.
- `it`: redactado en estilo `Dado ... cuando ... entonces ...`, citando el
  criterio de aceptación del SRS cuando exista uno aplicable.

## Matriz de trazabilidad

Cada módulo mantiene una matriz `RF/RNF/HU ↔ archivo ↔ prueba` en
`docs/testing/<modulo>-trazabilidad-requisitos.md`. Es el índice que se usa para
explicar la cobertura frente al SRS. Estados de cobertura:

- `AUTO`: verificado por prueba automatizada (se cita el archivo y el caso).
- `MANUAL`: verificado por protocolo/documentación (RNF medidos, responsive).
- `PARCIAL`: cubierto con alcance reducido o con una decisión vigente distinta
  al SRS; se explica la diferencia.
- `BACKEND`: el requisito es responsabilidad del backend; el frontend solo
  consume o refleja el resultado. Se marca para no atribuir al frontend una
  garantía que no le corresponde.

## Alcance honesto

- El frontend no garantiza por sí solo RNF de integridad (RNF-008) ni de
  seguridad de datos (RNF-009): esas garantías viven en el backend. El código de
  frontend se etiqueta como "refleja/consume" esos requisitos, no como "los
  cumple".
- Los umbrales de rendimiento (RNF-001, RNF-005) se instrumentan en el frontend
  pero su resultado depende del entorno; se documentan como medición, no como
  certificación.
