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