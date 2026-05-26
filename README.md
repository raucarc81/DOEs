# DOEs – Dispositivos Operativos Especiales

Aplicación PWA para la gestión y documentación de dispositivos operativos policiales.

## Instalación

1. Sube todos los archivos a un repositorio de GitHub
2. Activa GitHub Pages: **Settings → Pages → Deploy from branch → main → / (root)**
3. Accede a la URL generada (`https://TU_USUARIO.github.io/DOEs/`)
4. En el móvil Chrome: menú ⋮ → **"Añadir a pantalla de inicio"**

## Archivos del proyecto

```
DOEs/
├── index.html          ← App completa
├── sw.js               ← Service Worker (offline)
├── manifest.json       ← Configuración PWA
├── README.md
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Funcionalidades

- ✅ Crear y gestionar DOEs con fecha, lugar, indicativos
- ✅ Configuración de vehículos (furgón, van, todo terreno) con nomenclatura
- ✅ Registro de agentes, mandos y rangos
- ✅ Señalización (conos, balizas, badenes, vallas, New Jersey…)
- ✅ Medios especiales (arma larga, DEC, barrera pinchos)
- ✅ Adjuntar captura de mapa
- ✅ Estadísticas con gráficas por periodo (hoy/semana/mes/año)
- ✅ Exportar PDF de estadísticas
- ✅ Backup/restore de datos
- ✅ Ajustes: logo propio, nombre de unidad, color de app, modo claro/oscuro
- ✅ Instalable como app nativa (PWA)

## Actualizar la app

Cuando subas cambios, **sube siempre `sw.js` con el número de caché incrementado**:
```
const CACHE = 'does-v2';  // incrementa el número
```

## Versión

v2.0 – Todas las fases implementadas, mejoras visuales y funcionales
