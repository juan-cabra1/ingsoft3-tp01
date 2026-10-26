# Decisiones - TP1

## 1. Por qué Git no pudo resolver el conflicto solo — y qué habría tenido que pasar para que nunca apareciera.
    Git no pudo resolver el conflicto solo ya que los dos pull request hacian cambios en las mismas lineas de un mismo archivo, ademas de eso ambas ramas nacieron desde main sin enterarse de los cambios del otro. Para que nunca apareciera ese conflicto lo  primero que tendria que haber pasado es que no se hagan cambios en la misma linea y en el mismo archivo, para ello debe haber comunicacion en el equipo, pero soy consciente de que a veces existe esa falta de comunicacion por lo tanto la otra forma de evitarlo es manteniendo las ramas actualizadas con un pull antes de modificar mi rama para empezar a realizar cambios con los ultimos cambios recientes.

## 2. Qué problemas encontraste y cómo los solucionaste.
    El primer commit que hice lo hice con otra cuenta pero antes de pushear me di cuenta, para solucionarlo busque como hacerlo y me encontre con dos soluciones, cambiar el autor del commit o deshacer el commit y volverlo a hacer con la cuenta correcta; me quede con la opcion 1 ya que era mas simple primero me tuve que logear con mi cuenta y despues usar el comando "git commit --amend --reset-author" este comando lo que hace es modificar el ultimo commit en vez de crear otro y a su vez descarta la informacion del autor original del commit y la reemplaza con la cuenta que logee por ultimo.

## 3. Declaración de uso de IA:
    Utilice inteligencia artificial para el problema que tuve con el commit de la cuenta incorrecta. Verifique que el comando que me dio era correcto porque cuando entre a ver los commits en el repo el autor era mi cuenta correcta para los trabajos de la facultad.

# TP2 - Contenedores

## 1. Elección de la app del semestre

Elegi Bako, un e-commerce que vengo desarrollando y manteniendo yo (backend FastAPI + SQLAlchemy + MySQL, frontend React + Vite). La traje a este repo desde su repo original sin conservar el historial de commits fue decision mia, preferia arrancar limpio en el repo del semestre.

### Criterios de la guia

**1. ¿Corre local hoy?** Si probe el flujo completo backend, frontend, MySQL local y en el camino encontre y resolvi: un conflicto de puerto 8000 con un contenedor Docker de otro proyecto mio que me tapaba el backend con rutas de otra app.

**2. ¿Conozco los comandos de build/run?** Si
- Backend: `python -m venv venv` → `pip install -r requirements.txt` → `uvicorn main:app --reload --port 8000`
- Frontend: `npm install` → `npm run dev` (build de produccion: `npm run build`, Vite)

**3. ¿La conexión a la base está parametrizada por variable de entorno?** Si completamente. `DATABASE_URL` se lee vía `pydantic-settings` (`backend/config.py`), sin nada hardcodeado en el codigo. Para Docker Compose solo hace falta cambiar el host, nada de código.

**4. ¿Tiene reglas de negocio reales para testear?** Si, conte mas de 6 reglas de backend y mas de 3 comportamientos de frontend.

Backend:
- Cantidad del carrito debe ser > 0
- Nombre del cliente: no vacio
- Email con formato válido
- Stock insuficiente bloquea el checkout
- Login rechaza usuario inexistente o password incorrecta con 401
- Rutas de admin requieren JWT válido
Esas son las reglas mas relevantes, tiene mas todavia.

Frontend:
- El formulario de checkout no deja enviar con datos invalidos
- El total del carrito se recalcula automaticamente
- El boton de submit se deshabilita segun el estado del carrito
- Bajar la cantidad a 0 elimina el item del carrito

*Pendiente para el TP5:* ni el backend ni el frontend tienen todavía instalado un framework de testing falta `pytest` + `httpx` en el back, `vitest` + `@testing-library/react` en el front.

**5. ¿La entiendo lo suficiente para modificarla en vivo?** Si la vengo desarrollando y manteniendo yo.

## 2. Decisiones de contenerizacion
Decisiones de contenerizacion

- Imagenes base: elegi python:3.13-slim para el backend porque es una version recortada de la completa, a diferencia de la completa, esta version elimina documentacion, paginas de manual y muchos paquetes del sistema operativo no esenciales (linux debian), es el estandar comun para produccion y tiene un tamaño aprox de 60MB. Para el frontend use node:22-alpine en la etapa de build ya que mi aplicacion tambien esta hecha en React y nginx:alpine para servir los estaticos ya compilados, porque una vez que Vite genera el build no hace falta node adentro de la imagen final porque es html, css y js puro, solo un servidor de archivos estaticos. Para la base de datos use mysql:8.0 porque .

- Estructura multi-stage: los dos Dockerfiles (backend y frontend) tienen dos etapas cada uno. En el backend, la primera etapa instala las dependencias de requirements.txt con pip (usando --no-cache-dir porque evita almacenar archivos temporales innecesarios en la capa de la imagen, reduciendo significativamente su tamaño final. --user, que las deja en /root/.local), y la segunda copia solo esa carpeta mas el codigo fuente a una imagen limpia, sin arrastrar herramientas de compilacion. En el frontend, la primera etapa corre npm ci y npm run build, y la segunda es una imagen de nginx que copia unicamente la carpeta dist generada, sin node ni node_modules adentro de la imagen final.

- Que persiste y que no? lo unico que persiste entre reinicios es la base de datos, con un volumen nombrado (db_data:/var/lib/mysql) declarado en el compose. Backend y frontend son efimeros, si se borra el contenedor se pierde cualquier cambio que no este en la imagen o en la base. Las dependencias (node_modules, las librerias de python) tampoco persisten como carpetas propias, se instalan de nuevo en cada build. La configuracion (contraseñas, urls, secretos) no vive dentro de la imagen en ningun caso, entra siempre por variables de entorno en el momento de correr el contenedor.

## 3. Problemas encontrados y como los resolvi

- Al instalar las dependencias del frontend con npm install me tiraba un error ERESOLVE porque react-helmet-async todavia no declara react 19 como version soportada en su package.json, aunque funciona bien en la practica. Lo resolvi con --legacy-peer-deps.
- El puerto 8000 en mi maquina ya estaba ocupado por un contenedor Docker de otro proyecto mio, asi que mi backend nunca respondia ahi aunque estuviera corriendo bien. Lo solucione corriendo mi backend en otro puerto (8001) y ajustando el VITE_API_URL del frontend para que apunte ahi.
- En el healthcheck de mysql, la primera vez que lo escribi le faltaba la palabra clave CMD en el array del test, y cuando la agregue como CMD-SHELL, el comando quedo separado en varios elementos de la lista en vez de un solo string, asi que mysqladmin se ejecutaba sin argumentos y siempre fallaba. Lo arregle usando la forma CMD (exec), con cada palabra del comando como un elemento separado del array.
- Al servicio frontend del compose le faltaba pasarle el VITE_API_URL como build arg, sino compilaba con el puerto por default (8000) en vez del real (8001) de mi backend. Lo agregue en build.args.
- Cuando arme el compose completo, el backend no se conectaba a la base y tiraba connection refused, aunque la base figuraba sana (healthy). El problema era que el DATABASE_URL tenia el puerto 3307, que es el puerto que habia usado antes para conectarme desde mi maquina a un mysql en contenedor suelto, fuera del compose. Dentro de la red interna del compose, mysql siempre escucha en su puerto real, el 3306, sin importar que puerto publique hacia afuera. Lo corregi cambiando el puerto en el DATABASE_URL.

## 4. Declaracion de uso de IA
- Para traducir el patron multi-stage del Dockerfile de .NET del ejemplo de la catedra a mi stack (python/FastAPI), ya que no tenia experiencia con multi-stage en python. Lo verifique corriendo docker build y comprobando que la imagen se construye y el contenedor responde en /health, como asi tambien comparando los tamaños de los 2 stages.
- para diagnosticar por que el backend no se conectaba a la base dentro del compose (connection refused) aunque la base estaba sana. Se verifico con un contenedor de prueba conectandose directo a db:3306, lo que confirmo que el problema era el puerto equivocado en mi propio DATABASE_URL.
- Para revisar mi docker-compose.yml antes de correrlo. Encontro tres errores (healthcheck, variables obligatorias faltantes, build arg faltante). Lo verifique yo mismo confirmando en mi propio config.py que esos campos no tienen valor por default.
- Para entender conceptos que no tenia claros (la flag -m de python, la diferencia entre CMD y CMD-SHELL, por que no hace falta venv dentro de un contenedor, la diferencia entre build args y variables de entorno). Los fui verificando probando cada cosa en mi propia terminal despues de cada explicacion.

# TP3 - Planificacion - DevOps

## 1. Duracion del Sprint:
- Para la duracion de los sprints elegi como plazo 1 semana, esto porque cada semana tenemos TP nuevo, y con esa semana me alcanza (y a veces sobra tiempo) para terminar el trabajo.
## 2. Limite de trabajo en progreso
- El numero limite de trabajo en progreso puse 2 porque como soy el unico desarrollador dentro del proyecto como maximo es la cantidad de personas del equipo mas 1, para no tener mas tareas en progreso al mismo tiempo y seguir avanzando y terminando las tareas que suman al proyecto.
## 3. Diagnostico de la historia mal escrita
- La historia esta mal escrita por varios motivos: 1. No sigue el formato de una HU, Como (rol) quiero (accion) para (beneficio/valor). En el "para" no explica ningun valor del negocio, no tiene que describir la implementacion sino justificar porque le importa a alguien. 2. Es una tarea no una historia, es un cómo, osea una decision de implementacion, no un qué necesita el negocio. Deberia ser una subtarea dentro de la historia real. 3. No aporta contexto del negocio ni tampoco tiene criterios de aceptacion.
Como la reescribiria:
COMO visitante del sitio
QUIERO registrarme con mi email y contraseña
PARA poder acceder a las funcionalidades exclusivas de usuarios registrados

Criterios de aceptación:
- El sistema valida que el email no esté ya registrado
- La contraseña se almacena hasteada, nunca en texto plano
- Tras el registro exitoso, el usuario recibe confirmación y queda autenticado
## 4. Problemas que hubo y como los resolviste
- No hubo problemas que resolver
## 5. Declaracion de uso de la IA
- Me ayude con la IA para redactar como reescribi la historia de usuario. Verifique que sea correcta por las buenas practicas de una historia de usuario.

# TP4 - CI: Pipelines as Code

## 1. Estructura elegida del pipeline
- Decidi separar el pipeline en dos jobs, build-backend y build-frontend, porque son dos imagenes independientes que no dependen entre si: no hace falta que una espere a la otra para saber si compila. Al correr en paralelo, en dos runners distintos al mismo tiempo, el CI tarda menos en darme el resultado sobre el PR, en vez de sumar el tiempo de las dos construcciones una atras de la otra.

## 2. Que cachea el pipeline y que pasa si el cache desaparece
- El cache reutiliza las capas que no cambian seguido: la imagen base (python:3.13-slim en el backend) y la instalacion de dependencias (requirements.txt con pip, package.json con npm en el frontend), porque el Dockerfile copia esos archivos antes que el codigo fuente. La capa que copia el codigo nunca se reutiliza a proposito, tiene que rehacerse en cada corrida para reflejar los cambios nuevos. Si GitHub borra el cache (puede pasar, tiene limite de tamaño y se desaloja cuando quiere), el pipeline no se rompe: reconstruye todas las capas de cero, tarda un poco mas, pero el resultado (que compile o no) es exactamente el mismo. El cache es solo una optimizacion de velocidad, nunca una dependencia funcional del pipeline.

## 3. Por que el pipeline construye con el Dockerfile en vez de compilar por su cuenta
- El pipeline construye con el mismo Dockerfile del TP2 en vez de correr pip install o npm run build directo en el YAML porque asi hay una sola definicion de build. Si el workflow compilara por su cuenta, tendria dos formas distintas de construir la misma app: la que usa el pipeline para verificar y la que usa el Dockerfile para desplegar despues. Esas dos definiciones tarde o temprano divergen (una version de dependencia distinta, un paso que se olvida actualizar en una sola), y terminaria verificando algo que no es exactamente lo que despues corre en produccion. Usando el Dockerfile como unica fuente de verdad, lo que el pipeline construye en el PR es literalmente lo mismo que se va a desplegar.

## 4. Problemas encontrados y como los resolvi
- Durante este TP encontre un problema real, aunque no fue en el pipeline en si sino en el README: despues de agregar el badge, al entrar a la web el archivo perdio todo el formato de Markdown. Revisando el diff con git aparecia "Binary files a/README.md and b/README.md differ", lo que significaba que Git estaba tratando el archivo como binario. La causa fue haber corrido un comando (echo '' >> README.md) en PowerShell en vez de en Git Bash: PowerShell escribe esa redireccion en una codificacion que inserta bytes nulos, y Git detecta cualquier archivo con un byte nulo como binario, asi que GitHub dejo de interpretar el Markdown. Lo solucione reescribiendo el archivo completo en UTF-8 puro sin bytes nulos, verificando con el comando file que el archivo pasara de decir "data" a "Unicode text, UTF-8 text", y confirmando que la cantidad de bytes 0x00 quedara en cero. Como leccion, evito usar echo con redireccion en PowerShell para tocar archivos de texto del repo, uso Git Bash o edito el archivo directamente.

## 5. Declaracion de uso de IA
- Use IA tambien para diagnosticar la corrupcion del README (bytes nulos por PowerShell). Verifique el diagnostico yo mismo revisando los bytes del archivo con xxd, corriendo el comando file antes y despues del fix, y confirmando el render correcto en GitHub.

# TP5 - Testing y Calidad

## 1. Qué lógica elegí testear y por qué

Elegí las reglas de checkout (validación del carrito, cantidad > 0, stock insuficiente, datos del cliente) y las de auth (hashing de password, JWT, guard de rutas admin) porque son las mismas que ya había identificado en el TP2 como las más relevantes: un bug ahí significa una venta mal cobrada o una ruta de admin sin proteger. Backend: 38 tests repartidos en 8 reglas distintas (sumé la decisión de Cache-Control del §3 más abajo). Frontend: 36 tests sobre la lógica del carrito (`src/lib/carrito.js`), la resolución de imágenes (`src/lib/resolveImageUrl.js`) y el login (`src/services/api.js`).

## 2. Umbral de coverage

**Backend: 28%.** Con `pytest-cov`, el `fail_under` que declarás en `.coveragerc` mide una métrica **combinada** de línea+rama, no las separa como `coverlet` en .NET — antes de las demos del §3.5 mi cobertura real era 30,04% (31,91% de línea, 18,75% de rama por separado), así que puse el umbral un poco por debajo para tener margen sin volverlo inofensivo.

**Frontend: `lines: 16, branches: 12`.** Acá sí pude poner un número para cada métrica por separado (vitest lo permite). Antes de las demos medía 18,18% de línea y 14,75% de rama.

Los dos números están anclados en mi medición real de esa semana, no en un "número que suena bien".

El resumen de cobertura (línea y rama, backend y frontend) y el reporte descargable de la corrida más reciente en `main`: https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/36349081935

## 3. Qué dejé afuera de la cuenta de cobertura

**Backend** (vía `omit` en `.coveragerc`):
- `main.py`, `database.py`, `config.py`, `logging_config.py`, `middleware/*` — arranque y configuración de servicios, sin reglas de negocio.
- `migrate_cloudinary.py`, `migrate_imagenes.py` — scripts de migración de datos, se corren una vez a mano.
- `models/admin_user.py`, `models/drop.py` — son clases ORM/Pydantic sin un solo `field_validator`, sólo propiedades.

Lo que **no** excluí: `models/checkout.py` y `models/product.py`, aunque también tienen clases de datos, porque ahí sí hay validadores con reglas reales (`quantity_must_be_positive`, `email_valid`, etc.) — excluir el archivo entero hubiera escondido justo lo que tengo que probar.

**Frontend** (vía `include` en `vite.config.js`, apuntando sólo a `src/lib/**` y `src/services/**`, y `exclude` para `src/lib/sentry.js`): todo lo demás (componentes, páginas) queda afuera porque testearlos como componente pide jsdom + Testing Library, que la guía marca como opcional — la UI se cubre end-to-end en el TP7. `sentry.js` es sólo wiring del SDK de Sentry (arranque de una herramienta externa, sin reglas propias), la misma categoría que `logging_config.py` del lado del backend. Usé `include` en vez de dejarlo por default a propósito: sin él, vitest 4+ sólo mide lo que tus tests importan, así que un archivo nuevo sin tests **no aparece** en la cuenta y el número queda ciego justo para lo que el umbral tiene que frenar.

**La trampa del §2.4, que encontré en mi propio código.** Antes de dar esto por cerrado, releí qué había adentro de cada archivo que excluí — no alcanza con el nombre del archivo, hay que mirar el contenido. Y encontré una: `main.py` tenía un middleware (`cache_control_middleware`) con una decisión real adentro (qué header `Cache-Control` mandar, según método/ruta/status), no sólo wiring. Era exactamente la trampa que la guía advierte: "si todavía tenés reglas adentro, primero sacalas, y recién después excluís". La extraje a `utils/cache_control.py` como función pura (`calcular_cache_control`), le escribí 11 tests sobre sus 5 caminos, y recién ahí `main.py` quedó siendo arranque de verdad. También encontré `resolveImageUrl.js` en el frontend: sí tiene una regla (cómo resolver una imagen subida vs. una URL externa) y estaba en la carpeta que mido, pero sin un solo test — le agregué 3.

## 4. Por qué coverage alto no garantiza calidad — mi ejemplo real

No hizo falta inventar un ejemplo: mis metricas fueron realizadas con un numero **bajo**. Antes de las demos, mi backend completo estaba en 30% — bajo a propósito, porque servicios enteros como `drop_service.py` y `product_service.py`, o casi todos los routers, no tienen ni un test. Es exactamente lo que dice el §2.4: coverage bajo **sí** es señal confiable de que hay código sin ejercitar; el número no mentía.

Y el caso inverso, el de "cobertura sin verdad": si escribiera `expect(calcularTotal(cart))` sin ningún `.toBe(...)` después, esa línea de `calcularTotal` quedaría 100% cubierta y no estaría verificando absolutamente nada — el mismo problema que el `CoberturaSinVerdad` de la guía, con mi propia función.

## 5. Mi Pull Request bloqueado

Hice dos demostraciones, no una:

- **PR #25** (mergeada): agregué tres reglas nuevas al frontend (`calcularDescuentoPorCantidad`, `calcularCostoEnvio`, `clasificarCliente`) sin ningún test. El job de frontend se puso en rojo por **líneas** (15,56% contra el 16% requerido) — log: `ERROR: Coverage for lines (15.56%) does not meet global threshold (16%)`, corrida: https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/36187301105. Arreglé escribiendo 13 tests (uno por cada camino que las tres funciones declaran), el check pasó a verde y mergeé. Secuencia completa en https://github.com/juan-cabra1/ingsoft3-tp01/pull/25.
- **PR #26**: agregué cuatro métodos nuevos a `CheckoutService` en el backend, también sin tests. Rompe por el **combinado** línea+rama (27,41% contra el 28% requerido) — log: `FAIL Required test coverage of 28.0% not reached. Total coverage: 27.41%`, corrida: https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/36189044904. No la corregí: https://github.com/juan-cabra1/ingsoft3-tp01/pull/26.

En los dos casos, todo compilaba perfecto y los tests existentes pasaban en verde — el merge se bloqueó únicamente por el número de cobertura.

## 6. Refactor para poder mockear

En el frontend, `useCart.js` (un hook de React con `useState`) no se podía testear como función pura. Extraje la lógica a `src/lib/carrito.js` (`calcularTotal`, `agregarItem`, `actualizarCantidad`) y el hook ahora delega ahí — mismo comportamiento, pero testeable sin React ni DOM.

Dato aparte para el backend: **no** tuve que refactorizar nada para meter el mock de `ProductRepository.get_by_id` en `CheckoutService.validate_cart`. En Python `unittest.mock.patch("services.checkout_service.ProductRepository.get_by_id")` reemplaza el método directamente donde se importa, sin tocar el código de producción.

## 7. Mi stack no es el de la cátedra (backend en Python, no .NET)

| Fila de la tabla | Lo que usé |
|---|---|
| Dónde viven los tests | `backend/tests/`, carpeta aparte |
| Parametrizado | `@pytest.mark.parametrize` |
| Doble/mock | `unittest.mock.patch` |
| Medir cobertura | `pytest-cov` (`--cov-branch` para rama) |
| Umbral que rompe el build | `fail_under` en `.coveragerc` |
| Qué entra en la cuenta | `omit` en `.coveragerc` |
| Reporte legible | HTML nativo de `coverage.py` (no usé ReportGenerator — el propio `--cov-report=html` de Python ya da un sitio navegable, sin instalar nada del ecosistema .NET) |
| Que las deps de test entren al Dockerfile | `requirements-dev.txt` instalado en una etapa `test` aparte, `FROM build`, que nunca llega a la imagen final |

El frontend sí usa el mismo stack que la guía (vitest).

## 8. El ejercicio de la rama sin cubrir

Elegí `models/checkout.py`, línea 51 — el `raise ValueError("El teléfono es requerido")` dentro de `if not v or not v.strip()`. El test existente de teléfono sólo probaba `"abc123"` (letras), así que nunca se recorría el lado del `or` donde `v` es directamente un string vacío. La entrada que la ejercita es `telefono=""`. Decidí agregarla como test (PR #27: https://github.com/juan-cabra1/ingsoft3-tp01/pull/27) porque, a diferencia de lo que pensé al principio, no es una rama muerta: `telefono` es `str` en el modelo (no `Optional`), así que Pydantic nunca deja pasar un `None`, pero sí deja pasar `""` — es un input real que un cliente podría mandar.

## 9. Problemas encontrados y cómo los resolví

- El contenedor de tests no tiene `.env` (nunca se copia, es secreto), así que `Settings` fallaba por `DATABASE_URL`, `JWT_SECRET_KEY` y `WHATSAPP_NUMBER` faltantes. Se lo pasé como variables de entorno dummy en el `docker run` del pipeline — los tests no tocan una base real, así que alcanza con un valor sintácticamente válido.
- `.coverage`, `.pytest_cache` y `htmlcov/` generados en mi máquina se colaban en la imagen de Docker porque el `.dockerignore` no los excluía, y contaminaban la corrida del contenedor con datos de una corrida anterior. Se resolvió agregándolos al `.dockerignore`.
- Al revisar mis propias exclusiones de cobertura antes de cerrar el TP, encontré que `main.py` tenía una regla real escondida: el middleware `cache_control_middleware` decidía qué header `Cache-Control` mandar según el método HTTP, la ruta y el status code — eso es una decisión, no wiring. La resolví extrayéndola a una función pura, `utils/cache_control.calcular_cache_control(metodo, ruta, status)`, que devuelve el header (o `None`) sin tocar `request`/`response` de FastAPI. Le escribí 11 tests parametrizados cubriendo los 5 caminos (método distinto de GET, status de error, ruta de admin, rutas dinámicas, ruta estática). `main.py` ahora sólo llama a esa función y setea el header si no es `None` — mismo comportamiento, cero lógica propia. PR: https://github.com/juan-cabra1/ingsoft3-tp01/pull/28.

## 10. Declaración de uso de IA

Usé Claude Code para: escribir la suite de tests de los dos lados (backend y frontend) a partir de las reglas que yo ya tenía identificadas del TP2, calcular exactamente cuánta cobertura hacía falta bajar para que el umbral rompiera de verdad en las demos del §3.5, armar la configuración de `pytest-cov`/`vitest coverage` y las etapas de test en los Dockerfiles, y escribir los pasos nuevos del `ci.yml`. Verifiqué cada pieza corriendo los tests y el pipeline real antes de aceptarla: localmente con Docker antes de tocar el YAML, y después mirando los logs de las corridas reales en GitHub Actions para confirmar que el mensaje de error decía exactamente lo que esperaba.

# TP6 - CD: environments, aprobaciones y deployment patterns

## Enlaces de este TP

- **Paquetes públicos** (los dos etiquetados con el commit del merge del PR #30, `d98c48af3a07e8892045f9ba8a9e7eae1bfb17ba`; bajan sin credenciales):
  - Backend: https://github.com/juan-cabra1/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend
  - Frontend: https://github.com/juan-cabra1/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend
  - `docker pull --platform linux/amd64 ghcr.io/juan-cabra1/ingsoft3-tp01-backend:sha-d98c48af3a07e8892045f9ba8a9e7eae1bfb17ba`
  - `docker pull --platform linux/amd64 ghcr.io/juan-cabra1/ingsoft3-tp01-frontend:sha-d98c48af3a07e8892045f9ba8a9e7eae1bfb17ba`
- **La cadena del registry** (los dos eslabones que no se ven navegando):
  - Un PR con los tests en verde donde «Entrar al registry» aparece **salteado** (corrida del PR #30): https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/39321249297/job/118295565946
  - La lista de pasos de una corrida de `main`, donde «Construir y publicar la imagen del backend» es el **último** paso (el 10, después de los tests): https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/39321629419/job/118296859395
- **Entornos vivos:**
  - QA: front https://bako-front-qa.onrender.com · api https://bako-api-qa.onrender.com/health
  - PROD: front https://bako-front-prod.onrender.com · api https://bako-api-prod.onrender.com/health
- **Release:** https://github.com/juan-cabra1/ingsoft3-tp01/releases/tag/v6.0.0

## 1. Por qué el artefacto se publica sólo con la verificación en verde

La imagen se publica en el último paso del mismo job que corrió los tests. Si los tests fallan, el job muere ahí y ese paso nunca llega a correr: la condición no está escrita en ningún `if`, está en el orden de los pasos. Se sostiene por tres eslabones encadenados: nada entra a `main` sin los dos checks en verde (el gate del TP4 más el umbral del TP5), sólo lo que entra a `main` se publica (`push: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}`) y publicar es lo último del job.

Si el registry recibiera imágenes aunque los tests fallen, que una imagen esté publicada dejaría de querer decir «esto pasó la verificación» y pasaría a ser un depósito de cosas que alguien construyó alguna vez. Lo que **no** garantiza: alguien con permisos puede hacer un `docker push` a mano desde su máquina y entra igual. La cadena garantiza lo que publica *el pipeline*, no lo que físicamente puede entrar. Y una etiqueta `sha-…` apunta a un commit pero se podría re-etiquetar; lo que identifica el contenido exacto es el digest (`sha256:…`), que hoy no uso para desplegar (los digests de las dos imágenes del PR #30 son `sha256:63a5f0a0da26b1e3218016fa8e04db7e6dd58e98c5e593be535948e51cfe2a53` el backend y `sha256:a94acfc883422299fa358efbf2540679c135f5817a1ae0a75f8d4aac710f7566` el frontend).

## 2. Continuous Delivery vs Continuous Deployment

Implementé **Continuous Delivery**: cada cambio verificado llega solo a QA, pero a PROD sólo llega si un humano lo aprueba en el environment `production`. No implementé Continuous Deployment (sacar al humano) porque mi red de seguridad todavía es floja: la cobertura es de ~32% en el backend y ~33% en el frontend, no tengo tests end-to-end ni métricas que me avisen si un deploy empeora algo. Si saco la aprobación, automatizo la propagación de errores. Para tener Deployment me faltaría más cobertura sobre las rutas críticas (checkout, admin), tests end-to-end y observabilidad (alertas sobre errores y latencia).

## 3. Qué proveedor usé y cómo cumplo los cinco puntos del contrato

Usé Render (los contenedores) y Neon (Postgres), con GitHub Actions y los environments de GitHub.
1. **Dos entornos separados con URL pública:** QA y PROD, cada uno con front y api (4 servicios web).
2. **Una base por entorno:** `bako_qa` y `bako_prod` en el mismo proyecto de Neon.
3. **Front y back como contenedores desde mis Dockerfiles:** los 4 servicios están creados con runtime Docker.
4. **El deploy lo dispara el pipeline con el commit verificado:** Auto-Deploy en `Off` en los cuatro y deploy hooks llamados con `&ref=$GITHUB_SHA`.
5. **PROD detrás de la aprobación:** environment `production` con required reviewer (yo) y *Prevent self-review* desactivado.

**Qué quedó por variable y qué quedó dentro de la imagen.** Por variable de entorno: en la api, `DATABASE_URL`, `JWT_SECRET_KEY`, `WHATSAPP_NUMBER`, `ADMIN_DEFAULT_PASSWORD`, `ENVIRONMENT` y `PORT`; en el front, `BACKEND_URL` y `DNS_RESOLVER`. El commit que corre lo inyecta Render solo (`RENDER_GIT_COMMIT`). Dentro de la imagen quedó el código, las dependencias y los valores por defecto de desarrollo (`BACKEND_URL=http://backend:8000`, para que `docker compose up` siga andando). La dirección del backend ya **no** está en la imagen del front: el front le pide a su mismo origen (`/api/...`) y nginx lee `BACKEND_URL` al arrancar desde una plantilla (`default.conf.template`) y le saca el prefijo `/api` antes de reenviar, porque mis rutas del backend no tienen ese prefijo (`/products`, `/drops`, …). Lo comprobamos construyendo una sola imagen y corriéndola con y sin variables: el `resolver` y el `set $backend_api` cambiaron según el entorno. Eso es lo que hace posible el TP7, donde la misma imagen tiene que servir en QA y en PROD.

**Cómo comprobé que cada entorno usa su propia base.** Inserté un producto `SOY PROD` sólo en `bako_prod` desde el SQL Editor de Neon: aparece en la api de PROD (9 productos) y no en la de QA (8 productos). Los deploy hooks de PROD apuntan a los servicios de PROD: comparé el id `srv-…` de cada hook con el de su servicio en Render y coinciden.

## 4. El diseño de la cadena y el alcance de cada secret

```
build-backend ┐
              ├─► deploy-qa (needs ambos; if main; environment: qa) ─► deploy-prod (needs deploy-qa; environment: production)
build-frontend┘
```

- `needs:` encadena la promoción: sin los dos builds en verde no hay deploy a QA, y sin QA vivo no hay deploy a PROD.
- `if: github.ref == 'refs/heads/main'` está sólo en `deploy-qa`: los PRs verifican pero no despliegan. `deploy-prod` no lo repite a propósito, lo hereda por la cadena (se ve en el PR #34: los dos jobs de deploy salen *skipped*).
- `environment: qa` y `environment: production` conectan cada job con sus secrets, sus reglas y su historial en *Deployments*. QA no tiene reglas porque es automático a propósito.
- **Alcance de los secrets:** los hooks de QA (`RENDER_HOOK_API_QA`, `RENDER_HOOK_FRONT_QA`) viven en el environment `qa`, y los de PROD (`RENDER_HOOK_API_PROD`, `RENDER_HOOK_FRONT_PROD`) en `production`. No hay ninguno a nivel repositorio (se comprueba con `gh secret list --env qa`, `gh secret list --env production` y `gh secret list`). Si los de PROD estuvieran en el repo, cualquier job de cualquier rama podría desplegar a producción sin pasar por la aprobación; en el environment, sólo un job aprobado hacia `production` los puede leer.
- `&ref=$GITHUB_SHA` en los hooks: el hook pelado despliega la punta de la rama, no el commit que verifiqué. En PROD importa más todavía, porque entre que la corrida queda esperando y yo la apruebo `main` se puede mover: sin el `ref`, aprobaría el commit A y subiría lo último. En la primera corrida a QA miré en *Deploys* de Render que los dos servicios decían el commit del merge (`708ff15`).
- `concurrency: deploy-prod` (con `cancel-in-progress: false`) para que dos deploys a PROD no se pisen. Ver la observación del §9: no ordena la cola de aprobaciones.

## 5. Qué mira mi aprobador antes de aprobar

Antes de apretar *Approve* miro: que `deploy-qa` esté en verde **y** que su smoke haya visto el commit nuevo corriendo (no uno viejo); qué cambia el PR de esa corrida (si toca variables, la connection string o la base, lo miro con más calma); que no haya otra corrida más nueva esperando (si la hay, la vieja se rechaza para no hacer retroceder PROD); y que no sea un momento en el que no convenga desplegar. Lo que mi aprobador **no** puede ver hoy: cómo se va a comportar el cambio con tráfico real (no tengo métricas de errores ni de latencia por entorno) ni si un cambio de esquema de base es compatible hacia atrás. Me falta observabilidad para decidir mejor que «QA verde y el diff parece razonable».

## 6. La letra chica del free tier y cómo la maneja mi pipeline

- **Render:** el servicio duerme a los ~15 minutos sin tráfico y el primer request tarda en despertarlo (el primer `/health` de la api de QA tardó ~24 segundos). Las 750 horas por mes son del workspace, no de cada servicio; como mis cuatro servicios duermen solos, no las agoto, y por eso no dejé nada haciendo ping para mantenerlos despiertos (eso sí las consumiría y podría suspender los servicios hasta fin de mes). Los minutos de build son 500 por mes en el workspace gratuito: cada promoción reconstruye hasta cuatro servicios. Consumo al día de hoy, según el panel de Render: 6 de los 500 minutos de pipeline incluidos.
- **Neon:** suspende el cómputo a los ~5 minutos de inactividad y se despierta solo; el almacenamiento es de 0,5 GB. El engine de SQLAlchemy usa `pool_pre_ping=True`, que descarta una conexión muerta tras la suspensión y abre otra.
- **Cómo lo maneja el pipeline:** el smoke reintenta 30 veces cada 20 segundos (unos 10 minutos) y cada `curl` lleva `--max-time 10`, porque un servicio despertando acepta la conexión y no contesta; sin ese tope, el job se colgaría hasta el límite del runner. Un `curl` seco habría dado falsos rojos.
- **Elegí Neon y no el Postgres de Render** porque el gratuito de Render expira a los 30 días; el de Neon es permanente.
- **Connection pooling de Neon (lo dejé apagado).** Vi que podía activar connection pooling e investigué qué era. Abrir una conexión nueva con la base es costoso (conexión TCP, handshake, autenticación), así que en vez de abrir una por cada pedido, un pool mantiene conexiones ya abiertas y las reutiliza, ahorrando recursos y tiempo. El pooling de Neon hace eso del lado del servidor: distintos usuarios comparten un conjunto de conexiones ya abiertas, que se les prestan mientras las necesitan. En mi caso lo apagué porque ya lo tengo contemplado dentro de mi código: el engine de SQLAlchemy mantiene su propio pool de conexiones (`pool_size=5`, `max_overflow=10`, `pool_pre_ping=True`) y hay una sola instancia por entorno, así que un segundo pool encima no me aportaba nada.

## 7. Qué garantía pierdo porque Render reconstruye desde el repo

Mi pipeline publica en ghcr.io la imagen que verificó, pero Render **no** ejecuta esa imagen: vuelve a construir el mismo commit desde el repositorio. Lo que corre en QA y en PROD es otra construcción del mismo código. Si entre un build y el otro cambió algo (una dependencia sin versión fija —mi `requirements.txt` no tiene versiones pinneadas— o una imagen base como `python:3.13-slim` que se actualizó), puede salir distinto de lo que mis tests aprobaron, y no tendría cómo enterarme. Se rompe el principio de «se promueve lo mismo que se verificó»: promuevo el mismo *commit*, no la misma *imagen*. Es lo que resuelve el TP7 desplegando la imagen del registry; esta sección del TP6 es lo que lo hace posible.

Una buena práctica que mencionó Ariel (mi profe) en clase, y que podría agregar para reducir ese riesgo, es **fijar las versiones (pinnear) y no usar `latest` ni etiquetas que se mueven**. En mi backend hoy `requirements.txt` no tiene versiones (`fastapi`, `sqlalchemy`, … a secas), así que dos construcciones del mismo commit pueden instalar versiones distintas; fijándolas (`fastapi==x.y.z`) las dos construcciones instalarían lo mismo. Lo mismo con las imágenes base de los Dockerfiles: `python:3.13-slim`, `node:22-alpine` y sobre todo `nginx:alpine` son etiquetas que se mueven con el tiempo; fijar la versión exacta (o el digest) hace que la imagen base tampoco cambie sin que yo lo decida. En el frontend el riesgo ya es menor porque el Dockerfile usa `npm ci`, que instala exactamente lo que dice el `package-lock.json`.

## 8. Qué prueba mi smoke test y qué no

`scripts/smoke.sh` reintenta hasta que, a la vez: la api reporta en `/health` el commit esperado, el front reporta ese commit en `/version`, la base responde (`/products` toca la base) y el proxy del front hacia su api devuelve JSON (`/api/products`). No prueba que el flujo de compra funcione ni que el admin ande: es un chequeo de vida, no una prueba funcional.

**Lo que aprendí con la primera corrida a QA.** Mi smoke inicial sólo pedía status 200 de varias URLs, y dio verde **un segundo** después de disparar los hooks, mientras Render todavía construía: seguía sirviendo la versión anterior, y la versión anterior de mi front respondía hasta `/api/health` con el `index.html` de la SPA y un 200. Lo detectamos comparando la hora del hook con la hora del verde y pidiéndole `/api/health` al front de QA. El arreglo fue que la api devuelva en `/health` el commit que corre (Render inyecta `RENDER_GIT_COMMIT`), que el front lo exponga en `/version`, y que el smoke falle hasta que ambos coincidan con `github.sha`. En la corrida siguiente `deploy-qa` tardó 48 segundos y vio dos veces la versión vieja antes de dar verde: https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/39346836304

## 9. Problemas encontrados y cómo los resolví

- **Mi app era MySQL y Neon sólo ofrece Postgres.** Decidí migrar el motor en vez de cambiar de proveedor para quedarme en el free tier permanente. Como uso SQLAlchemy, el cambio fue chico: reemplacé `pymysql` por `psycopg`, pasé el compose local a `postgres:16-alpine` y reescribí lo que estaba atado a MySQL (un SQL crudo con `AUTO_INCREMENT` en `utils/db_setup.py`, que en una base nueva ni corría porque `create_all` ya crea las tablas; lo borré y declaré los índices en los modelos). No migré datos: el seed vuelve a cargar los productos. Lo verificamos contra un Postgres real (health, seed y CRUD del admin).
- **No sabía qué runtime elegir en Render:** para el backend me ofrecía Python 3 y para el front no había una opción obvia. Con Python 3 Render ignora mi Dockerfile y construye a su manera, así que usé Docker en los cuatro (la columna Runtime del Dashboard lo confirma).
- **No tenía una contraseña local de Postgres:** el contenedor de `postgres` exige `POSTGRES_PASSWORD`, así que la agregué a mi `.env`.
- **Mi merge del PR #35 fue rechazado** («2 of 2 required status checks are expected»): al mergear antes el #34, `main` avanzó y mi rama quedó atrasada, y la protección de `main` (que exige la rama al día) lo frenó. Actualizamos la rama, esperamos los checks de nuevo y mergeó.
- **Rechacé la corrida A sin escribir el comentario** y tuve que volver a correr el job fallido; para reordenar la cola también rechacé y volví a correr la B, así A quedaba primero. Los rechazos sin nota del intento 1 quedan en el historial, pero el que vale es el del intento 2, con mi motivo escrito.
- **Mi observación sobre `concurrency`.** La guía dice que no se midió qué pasa con `concurrency` cuando una corrida está esperando aprobación. Lo vi en mi repo: con A esperando revisión, el `deploy-prod` de B quedó **bloqueado detrás** de A («a job in this workflow is waiting for deploy-prod (CI #45) to complete before running») y sólo A mostraba *Review deployments*. O sea que `concurrency` evita que dos deploys se pisen, pero no ordena ni cancela la cola de aprobaciones, y me obligó a decidir primero sobre la vieja.

**El gate funcionando, con mis dos corridas:**
- **Rechazo** (corrida A, commit `513e5d4`, sólo agregaba el job de PROD): «Rechace el deploy porque seria aprobar una version de main atrasada, si apruebo y despliego el commit siguiente a este despliego una vez (tambien ahorro recursos y tiempo).» https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/39350001231
- **Aprobación** (corrida B, commit `e04d554`, con el título nuevo «Gorras Anashe» visible en PROD): https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/39350179159 — `deploy-prod` terminó en verde en 48 segundos y el smoke vio el commit nuevo corriendo.

## 10. Deployment pattern para una producción real

Para Bako en una producción real elegiría **blue-green**. Es un e-commerce: un deploy malo en horario de ventas cuesta ventas, y blue-green me da un rollback instantáneo (volver el switch) sin ventana de downtime. Cuesta el doble de infraestructura (dos entornos completos) y eso lo acepto porque la app es chica. Canary no lo elijo hoy porque no tengo la observabilidad que necesita para ser algo más que una ruleta: sin métricas de errores y latencia por versión no tengo cómo saber que el canario «sangra». Rolling lo descarto porque durante el reemplazo conviven dos versiones y mi app hace cambios de esquema sin migraciones formales. Feature flags sí los usaría para cosas puntuales (por ejemplo, prender una funcionalidad nueva del checkout sólo para mí primero), porque desacoplan el deploy del release. Lo que me falta hoy para ejecutar bien blue-green o canary: métricas y alertas por entorno, migraciones de base versionadas (hoy dependo de `create_all`) y un switch de tráfico real, cosa que el free tier de Render no me da.

## 11. Plan de rollback y su tiempo medido

**Plan, paso a paso, si un deploy aprobado sale mal:**
1. Detectar: el smoke en rojo, `/health` degradado o un problema que reporte un usuario.
2. Elegir el último commit bueno: el de la release anterior o el que figura en *Deployments → production*. Para este TP, `v6.0.0` = `e04d554aaf1fb09c3435e2aff0975255ff82e827`.
3. Llamar los dos deploy hooks de PROD con ese commit (`&ref=<sha>`), copiándolos de Render porque el secret de GitHub no se puede volver a leer.
4. Esperar a que en *Deploys* de cada servicio de PROD ese commit figure como **live**.
5. Comprobar `/health` y `/version`: tienen que mostrar el commit anterior.
6. Revertir el cambio en `main` con un PR, para que el próximo merge no vuelva a desplegar lo roto.

**Tiempo medido:** **Unos 38 segundos** según Render (43 s en mi propia medición desde afuera). Hice el rollback de verdad una vez: con PROD en `857aa45` («Nueva Temporada»), llamé a los dos hooks de PROD con el commit de `v6.0.0` a las 16:25:56; consultando `/health` y `/version` cada 5 segundos, la api ya mostraba `e04d554` a los 37 s y el front a los 43 s, y PROD volvió a mostrar «Nueva Colección». Mi medición desde afuera tiene resolución de ±5 s. El rastro oficial está en *Deploys* de `bako-api-prod` y de `bako-front-prod`: Render marca el deploy de `e04d554` iniciado a las 16:25:58 (GMT-3) en los dos servicios, con una duración de 34,2 s en la api y 36,3 s en el front. Contando desde que llamé a los hooks (16:25:56) hasta que el último servicio quedó *live* (16:26:34) son unos 38 segundos. Es la métrica DORA de **tiempo de recuperación** (time to restore service).

**Lo que el rollback de código no deshace:** los datos. Mi `SOY PROD` sigue en `bako_prod` aunque vuelva atrás, y una migración que borrara una columna seguiría borrada. Para eso haría falta migraciones reversibles y copias de la base antes de desplegar cambios de esquema. Y una decisión consciente: el rollback por hook **se salta el CI y la aprobación** (el hook es un secret que sólo yo tengo); lo acepto porque es una emergencia y la decisión humana la estoy tomando yo, pero lo dejo anotado como una puerta lateral.

## 12. Qué pasa entre el merge y PROD (en mis palabras)

Mergeo un PR a `main`. El workflow arranca: construyen y testean `build-backend` y `build-frontend` en paralelo, y cada uno termina publicando su imagen en ghcr.io como último paso. Cuando los dos terminan en verde, `deploy-qa` lee los hooks del environment `qa` y llama a Render con el commit exacto (`&ref=$GITHUB_SHA`), y el smoke espera hasta que api y front de QA reporten ese commit. Con QA verde, `deploy-prod` queda en *Waiting for review* porque el environment `production` exige un reviewer. Yo miro (§5) y apruebo o rechazo. Si apruebo, el job lee los hooks de PROD, llama a Render con el mismo commit y el smoke espera a que PROD corra ese commit. Después etiqueto lo que quedó en PROD con `v6.0.0` y publico la release.

## 13. Declaración de uso de IA

Usé Claude Code (CLI) como asistente durante todo el TP. **Lo que escribió la IA** y yo revisé: los jobs `deploy-qa` y `deploy-prod` del `ci.yml`, el cambio del build/publicación de imágenes, `scripts/smoke.sh`, la plantilla de nginx, el cambio de MySQL a Postgres (`database.py`, `utils/database_url.py`, los índices en los modelos, el compose) y sus tests, el campo `commit` en `/health` y el `/version` del front. También hizo los PRs, los merges y la release a pedido mío, y armó el script con el que se corrió el rollback. **Lo que decidí yo:** pasar de MySQL a Postgres, usar el proxy de nginx en vez de una configuración en runtime, borrar `db_setup.py`, arrancar de cero sin migrar datos, el texto de los cambios visibles del front («Gorras Anashe», «Nueva Temporada»), qué comentario escribir al rechazar, aprobar y rechazar las corridas de PROD, y hacer públicos los paquetes. **Lo que hice yo en las plataformas:** crear las cuentas y los servicios de Neon y Render, cargar los secrets de los environments, apagar el Auto-Deploy y probar con `SOY PROD` que cada entorno usa su base. El rollback lo ejecuté yo desde mi PowerShell, con un script que armó Claude (pide los deploy hooks con la pantalla oculta, los llama con el commit de `v6.0.0` y cronometra): los hooks los pegué yo, nunca pasaron por la IA.

**Cómo lo verifiqué:** leí los diffs antes de mergear; corrimos los tests y levantamos el stack completo con Docker contra un Postgres real; comprobamos desde afuera qué commit corre en cada entorno (`/health` y `/version`); miré en Render qué commit decía cada deploy; y revisamos en los logs de Actions que el smoke esperara de verdad. Puedo explicar cada compuerta entre el merge y PROD (§12), cada secret (§4) y por qué el smoke de la primera versión daba verde sin probar nada (§8).

# TP7 - Contenedores en el pipeline + pruebas de integración y e2e

## Enlaces del TP7

- **Paquetes públicos** (los dos etiquetados con el commit de la release `v7.0.0`, que es el commit que contiene este mismo documento y que se obtiene con `git rev-list -n1 v7.0.0`; bajan sin credenciales):
  - Backend: https://github.com/juan-cabra1/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend
  - Frontend: https://github.com/juan-cabra1/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend
  - `docker pull --platform linux/amd64 ghcr.io/juan-cabra1/ingsoft3-tp01-backend:sha-$(git rev-list -n1 v7.0.0)`
  - `docker pull --platform linux/amd64 ghcr.io/juan-cabra1/ingsoft3-tp01-frontend:sha-$(git rev-list -n1 v7.0.0)`
- **Primer deploy por imagen** (PR #38; en el log del job `deploy-qa` se ven los dos `imgURL` con el `sha-` del commit y el smoke esperando ese commit): https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/39523356172
- **Integración VERDE y e2e ROJA frenando la promoción:**
  - El commit que rompió la app (cambié `nombre` por `name` en el formulario de alta de productos del admin; PR #40 https://github.com/juan-cabra1/ingsoft3-tp01/pull/40): https://github.com/juan-cabra1/ingsoft3-tp01/commit/d0f50065be214395f246a8dc38aac64f7edb7695
  - La corrida (smoke verde, integración verde, e2e roja, `deploy-prod` sin arrancar): https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/39634369312
  - Reporte de integración (verde): https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/39634369312/artifacts/12360098563
  - Reporte e2e (rojo, con screenshot y traza): https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/39634369312/artifacts/12360293716
- **Corrida completa en verde hasta PROD** (la del arreglo, PR #41 https://github.com/juan-cabra1/ingsoft3-tp01/pull/41; la aprobé y PROD quedó en `7595c926a8e41a054657af2b0dedf69b4813829f`, antes de mover el tag: ver sección 3): https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/39648575886
- **Entornos vivos:**
  - QA: front https://bako-front-qa.onrender.com · api https://bako-api-qa.onrender.com/health
  - PROD: front https://bako-front-prod.onrender.com · api https://bako-api-prod.onrender.com/health
- **Release:** https://github.com/juan-cabra1/ingsoft3-tp01/releases/tag/v7.0.0

## 1. Build once, deploy many: qué problema del TP6 resuelve

En el TP6 mi pipeline construía y publicaba la imagen en ghcr.io, pero Render no la usaba: en cada deploy volvía a construir el mismo commit desde el repositorio. Entonces lo que corría en QA y en PROD no era lo que mis tests habían aprobado, sino otra construcción del mismo código. Un ejemplo propio: mi `requirements.txt` no tiene versiones fijadas (`fastapi`, `sqlalchemy`, … ), así que dos construcciones del mismo commit podían instalar versiones distintas y yo no tenía cómo enterarme. A mí no me pasó que PROD se rompiera por eso, pero tampoco podía demostrar que no podía pasar.

Ahora la imagen se construye una sola vez, en el job de build, y QA y PROD ejecutan esa misma imagen. El hook de Render recibe qué imagen ejecutar con `imgURL=ghcr.io/juan-cabra1/ingsoft3-tp01-backend:sha-<commit>` (y lo mismo con el frontend). `deploy-prod` manda exactamente el mismo `sha-<commit>` que `deploy-qa`: en el log de la corrida se leen los dos `imgURL` iguales. Lo que se verifica en QA es lo que se promueve.

Para que eso fuera posible no creé servicios nuevos: a los cuatro servicios de Render les cambié la fuente a *Existing Image* (Settings → Source). Así conservé las URLs, las variables de entorno y los deploy hooks, y no hubo servicios viejos que borrar. Antes de tocar nada comprobé con `docker pull` (sin sesión iniciada) que las dos imágenes del último merge existían y eran públicas, y cambié primero **un solo** servicio, `bako-api-qa`, que probé a mano con el hook antes de seguir con los otros tres y de tocar el pipeline.

## 2. Mi estrategia de etiquetas

- **`sha-<commit>` en el registry:** cada merge a `main` publica las dos imágenes con una sola etiqueta, la del commit completo (40 caracteres). Dice de qué commit salió esa imagen, y es la que usa la promoción: QA y PROD reciben el mismo `sha-…`.
- **Por qué mi pipeline no publica `latest`:** `latest` es un puntero, no una versión: hoy apunta a una imagen y mañana a otra. Si desplegara `latest`, después no podría decir qué desplegué, y la promoción de «lo mismo que verificó QA» no se podría demostrar. Con una sola etiqueta por imagen, la de su commit, no hay forma de desplegar algo sin decir exactamente qué es.
- **`v7.0.0` en git:** le pone nombre a una versión que sé que anduvo en PROD. Apunta al commit que está en PROD (sección 3), y de ahí llego a la imagen.
- **Qué no garantiza cada una:** una etiqueta `sha-…` se puede volver a publicar (por ejemplo si vuelvo a correr la corrida de ese commit) y el contenido podría ya no ser el mismo. Lo único que nadie puede mover es el digest (`imagen@sha256:…`). Hoy promuevo por etiqueta, que es la convención de la materia, y el hook de Render acepta también el digest; usarlo sería el paso siguiente.
- **Con qué imagen configuré los servicios de Render, y por qué no es la que corre:** los cuatro servicios quedaron configurados con la imagen del merge `68b4b2525e8af1e94302cf7b72dd59474befb35e`, porque Render pide la dirección de una imagen para aceptar el cambio de fuente y esa ya la había comprobado con el `pull`. Pero lo que corre no es esa: lo que corre lo decide cada deploy del pipeline con su `imgURL`, y Render solo exige que coincidan el registry y el nombre de la imagen; la etiqueta puede ser otra. Después de cambiar la fuente no volví a tocar esa configuración: lo que corre en cada momento lo muestra `/health` de la api, que contesta el commit del último deploy y no el de la imagen que dejé en *Settings*.
- **Lo que me costó entender:** al principio pensaba que el `sha` que pegué en Render era «el» sha del servicio y que había que actualizarlo en cada merge. Lo que quedó claro es que cada commit tiene su propia imagen, como una caja distinta con su rótulo, y que lo que pegué en Render es solo el punto de partida: cada deploy le dice a Render qué caja ejecutar.

## 3. De la release a la imagen en un paso

`git rev-list -n1 v7.0.0` devuelve el commit de la release, y la etiqueta `sha-<ese commit>` está en mis dos paquetes (`-backend` y `-frontend`): ahí está el binario exacto de esa versión. Volver a ella sería mandarle esa imagen al hook, el mismo mecanismo del deploy; en este TP no lo practiqué porque el rollback ya lo medí en el TP6.

El tag va sobre el commit que está en PROD y no sobre el último de `main`, porque entre mi última aprobación y el momento de etiquetar podría haber entrado otro merge que rechacé o que todavía espera aprobación; etiquetar ese nombraría una versión que nunca corrió en PROD. Por eso el commit lo saqué de *Deployments* (`gh api 'repos/{owner}/{repo}/deployments?environment=production'`) y creé el tag con `--verify-tag`. Lo hice en dos pasos y quiero dejarlo escrito. Primero etiqueté `7595c926a8e41a054657af2b0dedf69b4813829f`, el commit de PROD con el último arreglo. Después me di cuenta de que ese tag no incluía este `decisiones.md`, que es parte de la entrega y que quien corrige ve navegando el tag. Entonces mergeé el PR que agrega esta sección, aprobé el `deploy-prod` de esa corrida (el código es el mismo que el de `7595c92`, pero PROD pasa a correr la imagen de ese commit, que el pipeline publicó con su propia etiqueta `sha-…`) y moví `v7.0.0` y la release a ese commit, que de nuevo es el que figura en *Deployments*. Como un documento no puede contener el sha de su propio commit, acá no lo escribo: se obtiene con `git rev-list -n1 v7.0.0`. Lo que me costó: reescribí un tag que ya había publicado, algo que normalmente no se hace; lo hice porque era recién publicado y todavía no lo había usado nadie.

## 4. Cómo compruebo desde afuera que un entorno ejecuta mi imagen, y qué no prueba el smoke

Esta parte la vi pasar en vivo. Después de cambiarle la fuente a `bako-api-qa` y dispararle el hook a mano con el `imgURL`, miré `/health` y contestaba `"commit":"unknown"`. Antes contestaba `68b4b25…`. La razón: ese commit lo ponía Render con la variable `RENDER_GIT_COMMIT` porque construía desde el repo; con una imagen ya hecha Render no construye nada, no conoce el commit y esa variable ya no existe. Mi `scripts/smoke.sh` del TP6 compara ese commit con el de la corrida, así que habría quedado en rojo para siempre.

Tenía dos caminos: aflojar el smoke a «¿responde?», o hornear el commit dentro de la imagen. Elegí lo segundo, porque aflojarlo era perder lo que había construido en el TP6 (un smoke que espera a que el entorno corra *ese* commit y no da verde contra la versión vieja). Lo que hice: los dos Dockerfiles reciben un `ARG COMMIT_SHA` que queda como variable de entorno dentro de la imagen, y los pasos del pipeline que publican le pasan `COMMIT_SHA=${{ github.sha }}`. La api lo informa en `/health` y el front en `/version`. La guía deja esto como concepto y no lo pide; lo implementé porque sin eso mi smoke dejaba de servir. Lo comprobé antes de mergear: construí las imágenes con un commit inventado y sin el argumento, y con el argumento informan ese commit y sin él informan `unknown`.

Hoy se comprueba así, sin entrar a ningún panel:
- `curl https://bako-api-prod.onrender.com/health` → el campo `commit`.
- `curl https://bako-front-prod.onrender.com/version` → el commit del front.
- En la primera corrida real (https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/39523356172) el smoke vio la imagen vieja (`api=unknown`) en el intento 1 y recién dio verde cuando los dos servicios informaron el commit nuevo.
- Lo único que no se puede linkear son los *Events* de Render: ahí cada deploy dice «Triggered via Deploy Hook» y nombra el `sha-` de la corrida. Eso lo muestro en vivo en la defensa.

**Lo que el smoke no prueba:** que la app *funcione*. Solo pregunta si el entorno responde y corre el commit esperado. La corrida roja lo muestra: el smoke dio verde («QA corre d0f5006») con el alta de productos rota. Eso lo ve la e2e. Tampoco prueba que los bytes de la imagen sean los que se verificaron: si alguien re-publicara la etiqueta `sha-…` con otro contenido, el smoke seguiría viendo el mismo commit; eso solo lo cerraría el digest.

## 5. Cómo logré que la misma imagen del front sirva en QA y en PROD

Por variable de entorno, en tiempo de ejecución: el front recibe `BACKEND_URL` (la api de **su** entorno) y `DNS_RESOLVER`, y nginx las lee al arrancar desde una plantilla; la api recibe `DATABASE_URL`, `JWT_SECRET_KEY`, `WHATSAPP_NUMBER` y `ADMIN_DEFAULT_PASSWORD`. Dentro de la imagen quedó el código, las dependencias, los valores por defecto de desarrollo (para que `docker compose up` siga andando) y, desde este TP, el commit del que sale (`COMMIT_SHA`). Ese commit es por imagen y no por entorno: para un mismo `sha-…` es igual en QA y en PROD, que es justamente lo que quiero. Lo que distingue a los dos entornos son solo las variables. La separación de las bases ya la había comprobado en el TP6.

## 6. Qué pruebas elegí para integración y e2e, y qué dejé afuera

**Integración** (`frontend/e2e/api.spec.js`, 3 pruebas, sin navegador y sin dobles, contra la api de QA con su base de verdad):
1. Alta, verificación y borrado: me logueo como admin, creo un producto con un nombre único, lo busco en `GET /products`, lo borro y compruebo que ya no está.
2. Un precio inválido (`"abc"`) lo rechaza la api con `422` y no se crea nada.
3. El checkout rechaza pedir más unidades que el stock (`400`, «Stock insuficiente») y el stock del producto queda igual.

La tercera la elegí por la regla de negocio que protege: es la que evita venderle a alguien una gorra que no existe. Si se rompe, el que me escribe es un cliente. Todas las que crean datos usan un nombre con la hora adentro y borran lo que crearon; la del precio inválido no crea nada, y lo que comprueba es justamente eso.

**e2e** (`frontend/e2e/tienda.spec.js`, 3 flujos con navegador real, contra el front de QA):
1. Crear un producto desde el panel de admin, verlo en la tabla y borrarlo (con la confirmación del `confirm()` incluida).
2. Entrar al panel con una clave incorrecta: el usuario ve «Credenciales incorrectas» y no llega al panel. Pasa por front, nginx, api y base.
3. Agregar una gorra al carrito y quitarla: es lo que hace un cliente todos los días.

El flujo de error lo hice con el login y no con el checkout inválido porque el checkout valida todo del lado del cliente, sin llamar a la api: ese test habría probado solo el front. Con el login el error viaja por todo el sistema.

**Qué no puse, y por qué (pirámide):**
- En **e2e** no puse el checkout completo (termina en un link de WhatsApp, que es externo), ni la subida de imágenes, ni reordenar con drag and drop, ni el CRUD de drops y subcategorías. Son caros de sostener y los puedo cubrir más abajo. Tampoco repito ahí las validaciones del formulario del checkout, que son reglas del front.
- En **integración** no puse los endpoints de drops, ni el límite de intentos del login (5 por minuto): la suite comparte ese límite con el e2e y probarlo la volvería frágil.
- Los **unitarios** del TP5 siguen cubriendo las reglas aisladas, y solo `src/lib` y `src/services` del front.

**Qué clase de bug mi gate no ataja:** todo lo que ninguno de esos 6 recorridos toca (la subida de imágenes, los drops, el checkout hasta WhatsApp); lo que solo pasa con la configuración de PROD (una variable mal cargada en `bako-api-prod`, que ni la integración ni la e2e ven porque corren contra QA); y lo visual o de responsive, que ningún `expect` mira.

## 7. Integración y e2e: qué prueba cada una y por qué no es lo mismo

La integración le habla a la api directo: ve si la api y su base se entienden (qué acepta, qué rechaza, qué guarda). No sabe si la pantalla usa ese endpoint. La e2e maneja un navegador y ve la pantalla, pero cuando se pone roja no dice **quién** se rompió. Juntas dan un diagnóstico.

Lo viví con mi corrida roja (https://github.com/juan-cabra1/ingsoft3-tp01/actions/runs/39634369312). Cambié en el formulario del admin `nombre:` por `name:`, en una sola línea de `AdminPanel.jsx`, sin tocar `e2e/`:
- Los 36 tests unitarios dieron verde: ninguno afirma ese campo, porque el payload se arma dentro del componente.
- El smoke dio verde («QA corre d0f5006»): el sistema respondía.
- La **integración dio verde**: le habla a la api con `nombre`, y la api y la base guardan y borran sin problema.
- La **e2e dio roja**: el flujo de crear un producto falló los dos intentos, mientras los otros dos flujos pasaron.
- `deploy-prod` quedó salteado, nunca pidió aprobación, y PROD siguió en el commit anterior.

Lo diagnostiqué con los reportes y no leyendo el código: en la traza de la e2e, pestaña *Network*, el navegador hizo `POST /api/admin/products` y la api contestó `422` con `missing → body → nombre`. Como la integración estaba verde, la api y la base estaban sanas: el que no usa bien la api es el front. Es la primera fila de la tabla de la guía (integración verde, e2e roja).

Si en cambio hubiera roto la api, la integración se habría puesto roja y la e2e no habría corrido (su `needs` no se cumple). Eso no lo probé: lo explico por cómo está armada la cadena.

## 8. Por qué mi integración es la amplia y no la estrecha

Mi integración le habla a la api **ya desplegada** en QA. La estrecha sería levantar mi api dentro del pipeline con una base descartable (por ejemplo un Postgres como `services:` del job) y probar ahí, sin desplegar nada.

- **Qué gano con la amplia:** muchísima menos configuración, porque QA ya existe y corre la imagen exacta de la corrida; y prueba además que el despliegue quedó bien: la base real de Neon, las variables, el driver de Postgres, el contenedor de verdad.
- **Qué pierdo:** no corre antes del deploy, así que código malo sí puede llegar a QA (me lo pregunté yo mismo mirando el pipeline). No es un problema del diseño: QA existe para eso, y lo que se protege es PROD, donde el gate frena. También pierdo aislamiento: QA es uno solo y lo comparten todas las corridas, así que depende de que nadie más lo use, y depende de Render y del cold start.

Con la estrecha, el código roto ni siquiera llegaría a QA, pero armarla costaba bastante más que el resto del práctico. Para el tamaño de mi app, la amplia me daba el mismo concepto con una fracción del trabajo.

## 9. Cold start del free tier, y qué es un test flaky

QA duerme y despierta lento. Lo manejo en dos lugares: el smoke de `deploy-qa` ya despierta y espera a los servicios (30 intentos cada 20 s), así que cuando arrancan las pruebas QA ya está vivo; y la configuración de Playwright tiene tiempos largos (60 s por test, 15 s por aserción) y **un** reintento (`retries: 1`). No uso `sleep` ni salteo tests si el entorno no responde: el cold start se resuelve con tiempos de espera.

Un test **flaky** es el que a veces pasa y a veces falla con el mismo código. Es peor que no tener test porque entrena al equipo a ignorar el rojo: después, cuando falla de verdad, nadie le cree. Con el reintento, un test que pasa recién en el segundo intento aparece en el reporte como *flaky* aunque la corrida salga en verde, y por eso hay que abrir el reporte igual. En mis corridas en CI no apareció ninguno: las dos suites pasaron limpias (la integración en ~7 s y la e2e en ~12 s), y el test que falló en la corrida roja falló los dos intentos, o sea que fue un fallo real y no una demora.

## 10. Límite conocido de mi cadena: QA es uno solo

QA es un único entorno y lo comparten todas las corridas. Si hago dos merges seguidos, la corrida B puede redesplegar QA mientras la integración o la e2e de la corrida A todavía lo están usando: QA cambia de imagen con las pruebas de A a medio correr.

- **Qué vería:** un rojo en la integración o en la e2e de A que no es de mi código, o algo peor porque no avisa: un verde que en parte probó la imagen de B.
- **Cómo lo reconocería:** en *Events* del servicio de QA miro qué imagen está corriendo; si es la de B, miro en *Actions* a qué hora corrió el `deploy-qa` de B. Si fue mientras corría la e2e de A, esa e2e no vale. Y si dudo de un rojo, desempata la e2e de B.
- **Qué haría:** rechazar la corrida A con el motivo escrito (rechazarla es cosa mía, no la hace el `concurrency`: ese mecanismo cancela lo que está en cola, y un job esperando mi aprobación no está en cola), y no re-correr sus jobs de pruebas, porque probarían la imagen de B. La que vale es la B.
- **Cómo me cuido hoy:** un merge por vez. Antes de mergear miro *Actions* y espero a que la corrida anterior termine `integracion` y `e2e`. En este TP lo hice así en todos los merges.
- **Cómo lo resolvería un equipo real:** con un entorno por corrida, que nace con ella y se destruye al terminar. Queda fuera de este práctico.

## 11. Problemas que tuve y cómo los resolví

- **Cargué mal la clave del admin en el secret.** Las pruebas de integración y la e2e de creación necesitan loguearse como admin en QA, y la clave la leen de un secret del environment `qa` (`ADMIN_PASSWORD`). Al cargarlo me di cuenta de que me había equivocado. Lo resolví volviendo a correr el mismo `gh secret set ADMIN_PASSWORD --env qa`, que pisa el valor anterior, y comprobé con `gh secret list --env qa` que quedara con la fecha nueva (solo muestra el nombre, nunca el valor). Lo arreglé antes de mergear; si hubiera quedado mal, el login habría dado `401` y la integración se habría puesto roja por una razón que no es de la app.
- **Pensé que el `sha` de Render había que actualizarlo en cada merge.** Al cambiar la fuente de los servicios a *Existing Image* pegué la imagen de un merge, y me pregunté si eso era «la» imagen del servicio. Pedí que me lo explicara de nuevo hasta entenderlo: ese `sha` es solo el punto de partida que Render exige, y lo que corre lo decide cada deploy con el `imgURL`. Lo comprobé mirando `/health`, que contesta el commit del último deploy y no el que quedó en *Settings*.
- **Me pregunté si las pruebas de integración y e2e no debían correr antes de `deploy-qa`,** porque así código malo podía llegar a QA. Lo resolví entendiendo para qué sirven: las dos le hablan a algo que tiene que estar corriendo, por eso van después del deploy, y QA existe justamente para que ahí se frene lo que se rompe y no llegue a PROD. La alternativa que sí corre antes del deploy es la integración estrecha, que explico en la sección 8.

## 12. Declaración de uso de IA

Usé Claude (Claude Code) en el TP. Qué hizo la IA y qué hice yo:

- **La IA escribió:** los cambios de los Dockerfiles y del `ci.yml` (el `build-arg` del commit, el `imgURL` en los hooks, los jobs `integracion` y `e2e` y el encadenado de `needs`), los dos archivos de Playwright (`api.spec.js` y `tienda.spec.js`) y su configuración, los `htmlFor`/`id` y el `aria-label` que hacían falta para encontrar los campos, y el borrador de este documento. La tercera prueba de integración y el tercer flujo e2e los propuso la IA y yo los acepté.
- **Lo decidí yo:** hornear el commit dentro de la imagen en vez de aflojar el smoke; hacer el flujo de error con el login admin y no con el checkout; qué línea romper para la evidencia (`nombre` por `name` en el formulario del admin); aprobar cada corrida a PROD; y publicar la release. También hice a mano lo que usa secretos: cambié la fuente de los cuatro servicios en Render, disparé el primer hook con `imgURL` y cargué el secret.
- **Cómo lo verifiqué:** corrí las 6 pruebas contra mi compose local antes de subirlas; después miré en *Actions* que las dos suites pasaran en CI contra QA; en la corrida roja bajé los dos reportes y vi en la traza el `422`; y comprobé desde afuera, con `curl` a `/health` y `/version`, que QA y PROD corrieran el commit esperado, además de *Deployments* y *Events* de Render.
- **Un error de la IA que se corrigió durante el trabajo:** había afirmado que el checkout dejaba órdenes sin forma de borrarlas, y al mirar el código se vio que no guarda nada en la base (genera el pedido y el link de WhatsApp). Por eso las pruebas de escritura usan el alta de productos del admin y no el checkout.

# TP8 - Infraestructura como Código

## 1. Qué riel elegí y qué versiones fijé

Elegí el riel de la guía: **Terraform** con el provider de **Neon** y el de **Render**, que son los mismos proveedores que vengo usando desde el TP6. Instalé Terraform 1.16.6 con `winget` (la cátedra midió con 1.15.8 y la guía dice que sirve cualquiera posterior).

Los providers están fijados por versión en `infra/main.tf`: `kislerdm/neon` **0.18.0** y `render-oss/render` **1.9.1**, y el `.terraform.lock.hcl` está commiteado para que también quede fijado el hash. El de Neon tiene un riesgo que quiero dejar anotado: su repositorio está archivado y Neon va a publicar uno oficial con otro nombre (`neondatabase/neon`). Cuando salga, el cambio es el `source`, un `terraform init -upgrade` y leer el plan.

**Qué declaré:** un entorno **nuevo**, `preprod`, que no existía: un proyecto de Neon con su rol y su base, y dos servicios de Render (api y front) que ejecutan la imagen de la release v7.0.0 (`sha-260d343…`). No toqué mi QA ni mi producción. Elegí un entorno nuevo y no pasar a código los que ya tenía porque así la respuesta a «necesito un entorno más» es un archivo y un `apply`, y porque Render no deja modificar un servicio del plan gratuito: por eso preprod solo se **crea** y se **destruye**, nunca se edita.

Cómo quedó el código:
- Las claves de los providers (`NEON_API_KEY`, `RENDER_API_KEY`, `RENDER_OWNER_ID`) las leen de variables de entorno; no hay ninguna escrita en el HCL.
- La cadena de conexión de la api (`DATABASE_URL`) se **arma** con lo que devuelve Neon (usuario, contraseña y host directo), y la `BACKEND_URL` del front sale de la URL de su propia api. No copié ninguna de las dos a mano.
- La clave JWT, la clave del admin y mi número de WhatsApp no están en el repo: van en un `preprod.auto.tfvars` local que está en el `.gitignore`.
- El estado vive en mi máquina y está ignorado desde antes del primer `apply`, junto con `.terraform/` y los `*.tfvars`.
- No declaré la variable del commit en el servicio: la imagen ya lo trae horneado desde el TP7, y una variable del servicio la pisaría.

## 2. Problemas que tuve y cómo los resolví

- **Pegué `export` en PowerShell y no lo reconoció.** `export` es de bash. Pasé a Git Bash para cargar las tres claves.
- **`invalid ownerID` en el primer `apply` de Render.** Había exportado el id que empieza con `usr-` (el de mi usuario), pero mis servicios están en un workspace de tipo equipo. Lo resolví preguntándole a la API de Render qué dueños tenía mi clave (`/v1/owners`): devolvió un solo workspace, con un id `tea-…`. Lo exporté y repetí el `apply`. No había quedado nada creado a medias.
- **La región de Neon cambió entre dos creaciones.** La primera vez el proyecto nació en `us-east-2` y después de un `destroy` y un `apply` nació en `us-east-1`, porque no había declarado `region_id` y lo elegía el provider. Lo noté comparando el host de los `output`. Lo fijé en el código con `region_id = "aws-us-east-1"`, que es la región de mis proyectos de QA y producción, y el `plan` dio `No changes`.
- **Mis servicios de preprod aparecieron «sin grupo» en Render.** Mis cuatro servicios de QA y producción están dentro de un proyecto del dashboard y los dos de preprod no, porque Terraform los creó sin ese agrupamiento y yo no lo declaré. No lo resolví: lo dejo anotado como algo que sigue siendo distinto entre lo clickeado y lo escrito.

Algo que pude medir y la guía dejaba abierto: al destruir y volver a crear los servicios con el mismo nombre, Render devolvió **las mismas URLs**, sin sufijo.

## 3. Declaración de uso de IA

Usé Claude (Claude Code) en el TP.

- **La IA escribió:** el HCL de `infra/` (`main.tf`, `variables.tf`, `outputs.tf`), las reglas del `.gitignore` y la forma de armar la `DATABASE_URL` para mi api. También me guió con los comandos y me explicó cómo leer cada plan.
- **Lo hice yo:** instalé Terraform, creé las claves de Neon y de Render y las cargué en mi terminal, escribí mi `preprod.auto.tfvars` con mis propios valores, y corrí **yo** cada `plan`, `apply` y `destroy` desde mi terminal. También hice los experimentos de drift (borrar una base a mano y crear una intrusa) y el de `prevent_destroy`, y revisé en las consolas de Neon y Render que preprod apareciera y desapareciera.
- **Cómo lo verifiqué:** leí cada plan antes de aplicar; el segundo `plan` dio `No changes`; comprobé que preprod respondiera como entorno (`/health`, `/products` y el front hablando con su propia api, con el mismo commit que QA y producción); y confirmé desde afuera que QA y producción no se tocaron.
- **Un error de la IA que se corrigió:** había dicho que mi Neon estaba en `us-east-2`, y lo había deducido del primer host de preprod. Al preguntarte la región real de QA y producción resultó ser `us-east-1`.

# TP9 - DevSecOps, observabilidad y feedback continuo

## 1. El PR de Dependabot que mergeé: `vite` 7.3.1 → 7.3.7

Al prender las actualizaciones de seguridad de Dependabot, el mismo repositorio me abrió cuatro PRs en minutos (los #44 al #47), y después de mergear el `dependabot.yml` abrió ocho más (los #49 al #56, de las actions y del frontend). Elegí el **#45, `vite`**: https://github.com/juan-cabra1/ingsoft3-tp01/pull/45

- **Qué actualizaba:** `vite`, el empaquetador que construye mi frontend, es una dependencia de desarrollo. Un salto de **patch** (SemVer) dentro de la serie 7.3, con cambios solo en `package.json` y `package-lock.json`.
- **Qué decía el changelog:** correcciones de errores y un cambio chico de funcionalidad (permitir `esbuild 0.28`). Ninguna entrada hablaba de cambios incompatibles.
- **Por qué me animé:** cerraba **cinco alertas** de seguridad abiertas en mi repositorio, una de ellas de gravedad alta (en `launch-editor`, que `vite` trae adentro). Las cinco eran de alcance desarrollo, o sea del servidor de desarrollo y no del sitio construido, así que el riesgo real para producción era bajo, pero igual era una alta abierta. Y porque mi pipeline lo validaba: los 36 tests y el `vite build` real en `build-frontend`, y después la integración y la e2e contra QA, con el gate de PROD detrás. Después del merge las alertas de `vite` pasaron de 5 a 0.
- **Algo que me pasó con ese PR:** quise ponerlo al día con `@dependabot rebase` y contestó que no podía, porque ese PR lo había creado la función de actualizaciones de seguridad y no una entrada del `dependabot.yml`. Lo resolví actualizando la rama desde el botón de GitHub y esperando a que el pipeline volviera a quedar en verde.

## 2. Mi monitor, mi Sentry, y qué dato me llevé

**Cuánto tardó el monitor en avisarme.** Monitoreé el `/health` de mi api de producción con UptimeRobot, cada 5 minutos, con aviso por email. Provoqué la caída suspendiendo el servicio `bako-api-prod` en Render a las **20:01** (figura en *Events*, «Suspended by you»). El aviso de **DOWN** me llegó a las **20:06**, unos **5 minutos** después, que es justo el intervalo del monitor. Reanudé el servicio a las 20:06 y el aviso de **UP** llegó a las **20:16**: 10 minutos, porque Render deja el servicio dormido y le contesta 503 al monitor mientras arranca. Sin el monitor me habría enterado cuando un usuario avisara. Al terminar **pausé el monitor**: despierto todo el mes consume las 750 horas que comparten mis servicios, y Render suspendería también producción.

**Sentry.** Puse un proyecto para la api (`bako-api`) y otro para el front (`bako-front`). El DSN de la api va como variable `SENTRY_DSN` solo en el servicio de producción. El del front está escrito en el código, porque un DSN de front solo sirve para enviar datos y la imagen se construye una sola vez para QA y producción. Cada evento del front lleva como `environment` el nombre del sitio.

- **Mi operación más usada:** `GET /products`, con **9 pedidos** en las últimas 24 horas según Sentry (le siguen `POST /debug/report-error` con 5 y `GET /drops` con 5). Son pocos porque es tráfico de prueba y mío, y parte lo generó la IA (ver la declaración de abajo); en un sitio con visitantes reales esos números serían otros, pero el orden tiene sentido: el catálogo es lo primero que pide cualquier visita.
- **Mi operación más lenta:** también `GET /products`, con un **P95 de 1,08 s** (el P50 es 267 ms): casi todos los pedidos tardan menos de 1,1 s, pero el 5 % más lento lo supera. La diferencia entre la mitad y el extremo sugiere el primer pedido después de que la base gratuita de Neon se durmió, pero no lo comprobé. `GET /drops` tiene un P95 de 540 ms y `GET /products/{id}` de 288 ms. No hay ninguna transacción de `GET /health` en el período porque el monitor estaba pausado.
- **Qué haría con ese dato:** lo más llamativo es que la operación más usada es también la más lenta. Mi front ya guarda la respuesta 3,5 minutos en memoria, así que lo que se siente es el primer pedido de cada visita. Lo que haría es medir primero cuánto de ese P95 es el despertar de la base, y según eso mostrar un estado de carga o evitar que la base se duerma con un chequeo barato (con el límite de horas de Render, TP8 §2.6, en mente).
- **Un error que vi:** `SyntaxError: Unexpected token '<'`, **sin manejar**, en el front de producción: 4 eventos, tres de producción y uno de QA (el de mi e2e, hecho con un Chrome sin interfaz). Mi primera hipótesis fue que una pestaña abierta pedía un archivo del build que ya no existía después de un deploy. **Estaba equivocado**: el stack de Sentry apunta a `/_vercel/speed-insights/script.js`. Mi `App.jsx` todavía incluye `<SpeedInsights />` de `@vercel/speed-insights`, un resto de cuando el front estaba en Vercel; ese componente pide un script que solo existe en Vercel, y en Render mi nginx cae al `index.html` y contesta 200 con HTML, que el navegador intenta ejecutar como JavaScript. Lo comprobé con `curl`: esa ruta devuelve `text/html` en producción y en QA. Pasa en cada carga de página y no rompe nada visible, pero ensucia Sentry con un error falso que podría tapar uno real. Ese es el dato que me llevé al tablero.
- **La tarjeta de mi tablero** («IngSoft3 - Mi App Devops», columna *Todo*): https://github.com/users/juan-cabra1/projects/1/views/2?pane=issue&itemId=282931753 Título: «Sacar `<SpeedInsights />`, que rompe en cada carga fuera de Vercel». Con el número adentro: 4 eventos del `SyntaxError` en 24 horas, y el dato de que `GET /products` es a la vez la operación más usada (9 pedidos) y la más lenta (P95 de 1,08 s).

## 3. Problemas que tuve y declaración de uso de IA

**Problemas:**
- **El `/health` de mi api contestaba 405 a un pedido HEAD.** El plan gratuito de UptimeRobot pregunta con HEAD, y mi ruta solo aceptaba GET, así que el monitor habría marcado producción como caída con la app viva. Lo detecté antes de crear el monitor (con `curl -I`), lo arreglé aceptando también HEAD y lo llevé a producción por el pipeline.
- **Confundí qué corrida había aprobado.** Después de suspender la api me di cuenta de que creía haber aprobado el deploy del PR #62, pero esa corrida seguía esperando; la que había aprobado era la anterior. No pasó nada porque el estado de la corrida y *Deployments* lo mostraban, y esperé a reanudar el servicio antes de aprobarla para que el hook no le pegara a un servicio apagado.
- **Mi Sentry del front probablemente no mandaba datos:** leía el DSN de una variable de Vite que se resuelve al construir, y mi imagen se construye una sola vez sin ese dato. Lo resolví escribiendo el DSN en el código, como indica la guía.
- **CodeQL encontró cinco cosas** que arreglé: una cadena de formato controlada desde afuera en un `console.error` (real pero de impacto bajo: solo afectaba lo que se ve en la consola del navegador de quien abre el link) y cuatro jobs del workflow sin permisos declarados. Después del merge las cinco alertas pasaron a *fixed*.

**Declaración de uso de IA.** Usé Claude (Claude Code) durante todo el TP.
- **La IA hizo:** el `dependabot.yml`; prender por la API de GitHub las alertas, las actualizaciones de seguridad y CodeQL; el arreglo de `/health` para HEAD; el análisis y el arreglo de los hallazgos de CodeQL; los cambios de código de Sentry; y, a pedido mío por falta de tiempo, generar el uso y el error de prueba en el sitio de producción manejando un navegador. Parte de esos datos de uso y los eventos de `Falla de prueba TP9` los generó la IA y no son tráfico de usuarios reales; el `SyntaxError` del script de Vercel, en cambio, apareció solo, con mi uso de producción.
- **Lo hice yo:** crear mi cuenta y el monitor de UptimeRobot, suspender y reanudar el servicio, leer los avisos y anotar las horas, crear los dos proyectos de Sentry y cargar el `SENTRY_DSN` en Render, elegir el PR de Dependabot que mergear, y aprobar cada despliegue a producción.
- **Cómo lo verifiqué:** comprobé desde afuera, con `curl`, qué commit corría producción después de cada despliegue; que `/health` contestara 200 a GET y a HEAD; que CodeQL cerrara las alertas después del merge; que el DSN estuviera en el JavaScript que sirve producción; y los horarios del monitor contra los *Events* de Render.
- Conozco estas herramientas de prácticos anteriores y las puedo mostrar funcionando en la defensa, pero quiero dejar claro qué parte la ejecutó la IA.
