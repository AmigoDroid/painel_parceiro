#!/bin/sh
# Execute na raiz do projeto Vite correspondente. Nao sobrescreve arquivos existentes.
set -eu
if [ ! -f package.json ] || [ ! -f vite.config.js ]; then
  echo 'ERRO: execute este script na raiz do projeto Vite (junto de package.json e vite.config.js).' >&2
  exit 1
fi
if [ ! -s src/EmergencyDns.jsx ]; then
  echo 'ERRO: arquivo src/EmergencyDns.jsx nao encontrado. Extraia o ZIP nesta pasta primeiro.' >&2
  exit 1
fi
if [ ! -f src/App.jsx ]; then
  echo 'ERRO: src/App.jsx nao encontrado. Nao alterei este import.' >&2
  exit 1
fi
if [ ! -f src/Commercial.jsx ]; then
  echo 'ERRO: src/Commercial.jsx nao encontrado. Nao alterei este import.' >&2
  exit 1
fi
if grep -q '@deltatv/ui/EmergencyDns' src/App.jsx; then
  sed -i 's|@deltatv/ui/EmergencyDns|./EmergencyDns.jsx|g' src/App.jsx
fi
if ! grep -q './EmergencyDns.jsx' src/App.jsx; then
  echo 'ERRO: import inesperado em src/App.jsx. Revise manualmente.' >&2
  exit 1
fi
if grep -q '@deltatv/ui/EmergencyDns' src/Commercial.jsx; then
  sed -i 's|@deltatv/ui/EmergencyDns|./EmergencyDns.jsx|g' src/Commercial.jsx
fi
if ! grep -q './EmergencyDns.jsx' src/Commercial.jsx; then
  echo 'ERRO: import inesperado em src/Commercial.jsx. Revise manualmente.' >&2
  exit 1
fi
echo 'OK: componente em src/EmergencyDns.jsx e imports locais atualizados.'
