#!/usr/bin/env bash
# Smoke test post-deploy. Espera (con reintentos) a que el entorno corra EL commit esperado
# y responda de punta a punta. Un 200 no alcanza: mientras Render construye, sigue sirviendo
# la versión anterior y también contesta 200.
#
# Variables: URL_API, URL_FRONT, EXPECTED_SHA (obligatorias)
#            ENV_NAME, SMOKE_RETRIES (30), SMOKE_WAIT (20 s) (opcionales)
set -u
: "${URL_API:?falta URL_API}" "${URL_FRONT:?falta URL_FRONT}" "${EXPECTED_SHA:?falta EXPECTED_SHA}"
NAME="${ENV_NAME:-entorno}"
RETRIES="${SMOKE_RETRIES:-30}"
WAIT="${SMOKE_WAIT:-20}"
# Un intérprete que realmente corra (en Windows, python3 puede ser un alias de la Store que no ejecuta nada)
PY=""
for candidato in python3 python; do
  if "$candidato" -c "import json" > /dev/null 2>&1; then PY="$candidato"; break; fi
done
[ -n "$PY" ] || { echo "❌ no hay un python que funcione para leer el JSON"; exit 2; }

# --max-time en cada curl: un servicio despertando de un cold start acepta la conexión y
# no contesta; sin tope, el job se cuelga hasta el límite del runner.
api_commit() {
  curl -fsS --max-time 10 "$URL_API/health" 2>/dev/null \
    | "$PY" -c "import sys,json; print(json.load(sys.stdin).get('commit',''))" 2>/dev/null
}
front_commit() { curl -fsS --max-time 10 "$URL_FRONT/version" 2>/dev/null; }
# Si el proxy del front no está, nginx cae al index.html con 200: exigimos JSON, no solo 200.
proxy_returns_json() {
  curl -fsS --max-time 10 "$URL_FRONT/api/products" 2>/dev/null \
    | "$PY" -c "import sys,json; json.load(sys.stdin)" 2>/dev/null
}
# Compara los primeros 7 caracteres: no depende de si el proveedor entrega el sha corto o completo.
runs_expected() { [ -n "$1" ] && [ "${1:0:7}" = "${EXPECTED_SHA:0:7}" ]; }

echo "Esperando a que $NAME corra el commit ${EXPECTED_SHA:0:7}..."
for i in $(seq 1 "$RETRIES"); do
  api="$(api_commit)"
  front="$(front_commit)"
  # Prueba: la api corre el commit, el front corre el commit, la BD responde (/products la toca)
  # y el proxy del front llega a SU api.
  if runs_expected "$api" && runs_expected "$front" \
     && curl -fsS --max-time 10 "$URL_API/products" > /dev/null \
     && proxy_returns_json; then
    echo "✅ $NAME corre ${EXPECTED_SHA:0:7} (API + BD + front + proxy)"; exit 0
  fi
  api_visto="${api:-sin respuesta}"; front_visto="${front:-sin respuesta}"
  echo "intento $i/$RETRIES: api=${api_visto:0:12} front=${front_visto:0:12} (esperado ${EXPECTED_SHA:0:7})"
  sleep "$WAIT"
done
echo "❌ $NAME no corrió el commit esperado a tiempo"; exit 1
