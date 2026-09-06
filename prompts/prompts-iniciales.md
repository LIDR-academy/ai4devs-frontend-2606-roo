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
- `frontend/src/hooks/usePositionBoard.ts`
- `frontend/src/components/PositionDetail.tsx`
- `frontend/src/components/StageColumn.tsx`
- `frontend/src/components/CandidateCard.tsx`
- `frontend/src/components/PositionDetail.css`
- `frontend/src/i18n/texts.ts`

**Modificados**

- `frontend/src/App.js` — ruta `/positions/:id` con carga diferida.
- `frontend/src/components/Positions.tsx` — `id` en el modelo y `Link` en "Ver proceso".
- `frontend/package.json` — `eslint-plugin-jsx-a11y` en el linter.

---

## Prompt 2 — Aplicar los estándares de frontend de calidad (2026)

> Has realizado el ejercicio entero, ahora vas a seguir estos estándares: [documento del curso
> sobre estructura y mantenibilidad, calidad de código, rendimiento y Core Web Vitals, seguridad,
> experiencia de usuario y accesibilidad, KISS, librerías, i18n e IA aplicada].

### Alcance: qué se aplicó y qué no

El documento describe un stack objetivo (Next.js 16, Tailwind v4, shadcn/ui, Biome, next-intl) que
**no** se ha adoptado: el ejercicio parte de Create React App con react-bootstrap y migrar el stack
convertiría la entrega en otro proyecto, no en una mejora revisable. Se ha aplicado todo lo que sí
encaja en este código, que es la mayoría de los principios. Esto es también aplicar la sección 6
(KISS): el documento avisa de que la IA tiende a sobre-construir, y cambiar de framework para cumplir
una checklist es exactamente eso.

### 1. Estructura y mantenibilidad

- Lógica extraída a un custom hook, `usePositionBoard.ts`: carga, resolución de fase por nombre a id
  de columna y movimiento optimista. `PositionDetail.tsx` se queda con la presentación y el estado
  del arrastre. Cada componente está por debajo de las ~110 líneas y tiene una responsabilidad.
- Carpetas nuevas por capa: `hooks/`, `i18n/`, junto a las ya existentes `components/` y `services/`.

### 2. Calidad de código y TypeScript estricto

- `tsconfig.json` ya venía con `"strict": true`.
- **Cero `any`.** Quedaban dos en el servicio (`request<any>` y el desanidado de `interviewFlow`);
  ahora la respuesta entra como `unknown` y se estrecha con type guards (`isRecord`, `parseInterviewStep`,
  `parseCandidate`).
- `eslint-plugin-jsx-a11y` (`plugin:jsx-a11y/recommended`) añadido al `eslintConfig`, de modo que la
  accesibilidad se verifica en cada `npm run build`. Detectó un `role="list"` marcado como redundante;
  se ha mantenido con un `eslint-disable-next-line` justificado, porque Safari/VoiceOver retira la
  semántica de lista cuando se aplica `list-style: none`.
- No se ha migrado a Biome ni a ESLint 9 flat config: `react-scripts` ejecuta su propio ESLint 8
  durante el build, y sustituirlo obligaría a expulsar CRA.
- Comentarios reescritos para explicar el *por qué* (el doble anidado del backend, el `setData` que
  necesita Firefox, por qué el rol redundante no lo es), no el *qué*.

### 3. Rendimiento

- **Code-splitting**: `PositionDetail` se carga con `React.lazy` + `Suspense` en `App.js`. El bundle
  inicial baja de **160,91 kB a 147,29 kB gzip**, y el tablero pasa a chunks aparte
  (3,43 kB JS + 894 B CSS, más el chunk de las dependencias del menú).
- Los candidatos se agrupan por fase **una sola vez** con `useMemo` (antes era un `filter` por columna
  en cada render, O(columnas × candidatos) en cada arrastre).
- `CandidateCard` envuelto en `React.memo`: durante un arrastre el tablero re-renderiza y sin memo se
  repintaban todas las tarjetas.
- Handlers estabilizados con `useCallback` para que el `memo` sirva de algo.
- No hay imágenes en esta vista, así que no aplica la parte de AVIF/WebP/`fetchpriority`. **No se han
  medido Core Web Vitals reales**: requiere la app desplegada con backend y datos, y medir en local
  sobre `localhost` daría números que no representan a ningún usuario.

### 4. Seguridad

- **Validación en tiempo de ejecución de la respuesta del backend** antes de que entre en el estado de
  React: se descartan fases sin `id`/`name` y candidatos sin `id`/`applicationId`. No se ha añadido Zod
  ni Valibot porque el contrato son tres endpoints y la dependencia no se paga sola; el principio —no
  confiar en la forma de los datos de red— sí se aplica.
- Sin `dangerouslySetInnerHTML` en ningún punto: todo el contenido de usuario pasa por el escapado
  automático de JSX, así que no hace falta DOMPurify.
- **Sin secretos en el cliente**: la única variable de entorno es `REACT_APP_API_URL`, que es la URL
  pública del backend. Documentado en la cabecera del servicio para que nadie meta ahí una API key.
- `encodeURIComponent` sobre el `positionId` que llega de la URL antes de interpolarlo en el endpoint.
- **`npm audit`: 68 vulnerabilidades (3 críticas, 35 altas), todas transitivas de `react-scripts@5.0.1`**
  — `webpack-dev-server`, `shell-quote`, `form-data`, `websocket-driver`, `postcss`. Son cadena de build
  y servidor de desarrollo: no viajan en el bundle del navegador. **No se ha ejecutado `npm audit fix
  --force`** porque degradaría o rompería `react-scripts`. La solución real es salir de CRA (Vite o
  Next.js), que queda fuera del alcance de este ejercicio pero conviene registrarlo como deuda.

### 5. Accesibilidad (WCAG 2.2 AA) y UX

- **SC 2.5.7 Dragging Movements**: arrastrar no puede ser la única forma de hacer algo. Cada tarjeta
  tiene un menú "Mover a" operable con un solo clic y con teclado, que además es la vía real en móvil
  (el drag & drop HTML5 no dispara con eventos táctiles).
- **SC 2.5.8 Target Size**: el botón de menú mide 24×24 px mínimo y la flecha de volver 44×44.
- **SC 4.1.3 Status Messages**: región `aria-live="polite"` que anuncia "X movido a Y" sin robar el
  foco; los errores van en `role="alert"`.
- **Contraste**: los grises se han oscurecido a `#5c636a` (5,5:1 sobre el fondo de columna) — el
  `#adb5bd` anterior daba ~1,9:1 y **fallaba AA**. Las estrellas pasan de `text-warning` (`#ffc107`,
  1,5:1) a `#997404` (4,3:1), que cumple el 3:1 de SC 1.4.11 para gráficos.
- **Semántica**: `<main>` en el contenedor, `<section>` por fase enlazada a su `<h3>` con
  `aria-labelledby`, y las tarjetas en `<ul>`/`<li>` para que el lector de pantalla anuncie
  "lista de N elementos".
- **Lectura por lector de pantalla**: nombre, puntuación y fase se anuncian como un único texto
  (`visually-hidden`); las cinco estrellas van `aria-hidden` para no leer "estrella estrella
  estrella…".
- **Foco visible** con `:focus-visible` y `outline-offset`, también sobre fondo claro.
- **`prefers-reduced-motion`**: se desactivan las transiciones de la columna.
- Texto de ayuda visible bajo el título explicando las dos formas de mover una tarjeta.

### 6. Container queries

La columna declara `container-type: inline-size` y la tarjeta se adapta al ancho de **su columna**, no
del viewport. Es el caso de uso exacto para el que existen: la misma tarjeta vive en una columna
estrecha en escritorio y a ancho completo en móvil.

### 7. i18n

Todas las cadenas están en `src/i18n/texts.ts`, tipado y con funciones para las que interpolan. **No se
ha añadido react-i18next ni next-intl**: con un solo idioma sería sobre-construir. Lo que sí se ha hecho
es separar contenido de estructura, que es la parte cara de la migración; cambiar a i18next consiste en
sustituir ese objeto por su catálogo sin tocar los componentes.

### Verificación de esta segunda fase

- `npx tsc --noEmit` → sin errores, sin `any`.
- `npx react-scripts build` con `jsx-a11y/recommended` activo → compila; el único warning es
  preexistente y ajeno (`AddCandidateForm.js`).
- Bundle inicial: 160,91 kB → 147,29 kB gzip.
- **No ejecutado**: `axe-core` en navegador ni auditoría Lighthouse. Requieren la app servida contra un
  backend con datos. El linter de accesibilidad cubre la parte estática; el resto de hallazgos de esta
  lista salen de revisión manual contra WCAG 2.2, no de una herramienta.
