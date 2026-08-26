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