# Prompts iniciales — Vista "position" (kanban de candidatos)

Asistente: Claude Code (Opus 5).
Autor: Emilio Fernández Pérez (EFP).

---

## Prompt 1 — Enunciado completo del ejercicio

> En LTI ya tenemos la funcionalidad para listar las diferentes posiciones requeridas por la empresa.
> Está disponible en una página "positions" que muestra una lista de tarjetas que describen cada posición.
> Cuenta con filtros para poder buscar por texto, fecha límite, estado y manager responsable.
>
> Queremos que al hacer clic en el botón "Ver proceso" de cualquiera de las posiciones, nos lleve a la
> vista de detalle de cada posición, denominada "position".
>
> Tu misión en este ejercicio es crear la interfaz "position", una página en la que poder visualizar y
> gestionar los diferentes candidatos de una posición específica.
>
> Se ha decidido que la interfaz sea tipo kanban, mostrando los candidatos como tarjetas en diferentes
> columnas que representan las fases del proceso de contratación, y pudiendo actualizar la fase en la que
> se encuentra un candidato solo arrastrando su tarjeta.
>
> Requerimientos del equipo de diseño:
> - Mostrar el título de la posición en la parte superior, para dar contexto.
> - Añadir una flecha a la izquierda del título que permita volver al listado de posiciones.
> - Mostrar tantas columnas como fases haya en el proceso.
> - La tarjeta de cada candidato/a debe situarse en la fase correspondiente, y mostrar su nombre completo
>   y su puntuación media.
> - Si es posible, debe mostrarse adecuadamente en móvil (las fases en vertical ocupando todo el ancho).
>
> Observaciones:
> - Asume que la página de posiciones ya existe.
> - Asume que existe la estructura global de la página (menú superior y footer). Lo que estás creando es
>   el contenido interno de la página.
>
> Endpoints disponibles:
> - `GET /positions/:id/interviewFlow` → `positionName` + `interviewSteps` (id y nombre de cada fase).
> - `GET /positions/:id/candidates` → `fullName`, `currentInterviewStep`, `averageScore`.
> - `PUT /candidates/:id/stage` → body `{ applicationId, currentInterviewStep }`.

---

## Cómo se abordó

### 1. Exploración del repositorio antes de escribir código

Se revisó primero el código existente en lugar de asumir el enunciado:

- `frontend/src/App.js` — es el fichero que CRA resuelve (tiene prioridad sobre `App.tsx`, que sigue
  siendo la plantilla por defecto de Create React App). Aquí vive el `BrowserRouter` con las rutas.
- `frontend/src/components/Positions.tsx` — listado existente con datos mock.
- `backend/src/index.ts`, `backend/src/routes/*.ts`, `backend/src/presentation/controllers/*.ts` y
  `backend/src/application/services/positionService.ts` — para conocer las rutas y el contrato real.

### 2. Discrepancias detectadas entre el enunciado y el backend real

| Enunciado | Backend real en este repositorio |
| --- | --- |
| `GET /positions/:id/interviewFlow` | `GET /position/:id/interviewflow` (`app.use('/position', positionRoutes)`) |
| `GET /positions/:id/candidates` | `GET /position/:id/candidates` |
| `PUT /candidates/:id/stage` | `PUT /candidates/:id` |

Además, `getInterviewFlowByPosition` en el controller envuelve el resultado del servicio en
`{ interviewFlow }`, con lo que la respuesta real llega **doblemente anidada**:

```json
{ "interviewFlow": { "positionName": "...", "interviewFlow": { "id": 1, "interviewSteps": [] } } }
```

**Decisión:** usar las rutas reales del backend (son las que funcionan) y normalizar la respuesta en la
capa de servicio, aceptando también la forma plana del enunciado por si el backend se corrige.

También se comprobó que `GET /position/:id/candidates` devuelve dos campos extra no documentados en el
enunciado, ambos necesarios para poder guardar el movimiento: `id` (id del candidato, que va en la URL
del `PUT`) y `applicationId` (que va en el body).

### 3. Diseño de la solución

- **Servicio** `frontend/src/services/positionService.ts`: tipos TypeScript del dominio y las tres
  llamadas. Se usa `fetch` en lugar de `axios` porque `axios` no está declarado en
  `frontend/package.json` (lo importa `candidateService.js`, que es una dependencia implícita ya
  existente); así no se añaden dependencias nuevas al proyecto.
- **`PositionDetail.tsx`**: carga en paralelo el flujo y los candidatos, ordena las fases por
  `orderIndex` y resuelve el nombre de fase de cada candidato a id de columna (si no hay coincidencia,
  la tarjeta cae en la primera fase). Mantiene el estado del tablero y orquesta el movimiento.
- **`StageColumn.tsx`**: una columna = una fase; zona de drop y contador de candidatos.
- **`CandidateCard.tsx`**: tarjeta arrastrable con nombre completo y puntuación media (estrellas + valor).
- **`PositionDetail.css`**: tablero flex con scroll horizontal en escritorio y **columnas apiladas a
  ancho completo por debajo de 768 px**.

### 4. Decisiones técnicas relevantes

- **Drag & drop nativo HTML5** (`draggable`, `onDragStart` / `onDragOver` + `preventDefault` / `onDrop`),
  sin añadir `react-beautiful-dnd` ni ninguna otra librería. El `dataTransfer.setData` es necesario para
  que Firefox inicie el arrastre.
- **Fallback táctil y accesible:** el drag & drop HTML5 no funciona con eventos táctiles, así que cada
  tarjeta incluye un menú "Mover a" con el resto de fases. En móvil es la vía real de cambio de fase, y
  en escritorio es la alternativa accesible por teclado.
- **Actualización optimista:** la tarjeta se mueve en el acto y, si el `PUT` falla, vuelve a su columna
  de origen y se muestra un aviso. Evita la sensación de lag sin mentir sobre el estado real.
- **Navegación:** ruta `/positions/:id` en `App.js`; el botón "Ver proceso" de `Positions.tsx` es ahora un
  `Link` a esa ruta (se añadió `id` al tipo `Position` y a los datos mock), y la flecha `ArrowLeft`
  devuelve al listado.

### 5. Verificación

- `npx tsc --noEmit` → sin errores.
- `npx react-scripts build` → compila. El único warning es preexistente y ajeno a este cambio
  (`AddCandidateForm.js`: `'InputGroup' is defined but never used`).

---

## Ficheros creados / modificados

**Nuevos**

- `frontend/src/services/positionService.ts`
- `frontend/src/components/PositionDetail.tsx`
- `frontend/src/components/StageColumn.tsx`
- `frontend/src/components/CandidateCard.tsx`
- `frontend/src/components/PositionDetail.css`

**Modificados**

- `frontend/src/App.js` — ruta `/positions/:id`.
- `frontend/src/components/Positions.tsx` — `id` en el modelo y `Link` en "Ver proceso".
