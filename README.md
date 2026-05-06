# Inventario App

Aplicación móvil de gestión de inventario desarrollada con React Native y Expo. Permite a las empresas controlar su inventario, monitorear sensores IoT en tiempo real, consultar reportes y gestionar notificaciones, todo desde un dispositivo móvil.

---

## Tecnologías principales

| Tecnología       | Versión  |
| ---------------- | -------- |
| React Native     | 0.81.5   |
| Expo             | ~54.0.25 |
| React            | 19.1.0   |
| React Navigation | 7.x      |
| Axios            | 1.12.0   |
| MQTT.js          | 5.14.1   |
| i18n-js          | 4.5.1    |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- [Expo Go](https://expo.dev/client) en el dispositivo físico (para pruebas rápidas)
- Android Studio o Xcode (para builds nativos)

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd inventario_app

# 2. Instalar dependencias
npm install
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con las variables necesarias. Estas se inyectan en `app.config.js` mediante `expo-constants` y quedan disponibles en la app a través de `Constants.expoConfig.extra`.

---

## Ejecución en desarrollo

```bash
# Iniciar el servidor de desarrollo (muestra QR para Expo Go)
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios

# Ejecutar en navegador web
npm run web
```

---

## Estructura del proyecto

```
inventario_app/
├── app/
│   ├── (auth)/          # Pantallas de autenticación
│   │   ├── index.jsx        # Login y Registro
│   │   ├── forgotPassword.jsx
│   │   └── emailVerification.jsx
│   ├── (tabs)/          # Tabs principales
│   │   ├── home.jsx         # Pantalla de inicio con módulos
│   │   ├── notifications.jsx
│   │   └── profile.jsx
│   ├── inventory/       # Módulo de inventario
│   │   └── camera.jsx       # Escáner QR / código de barras
│   ├── iot/             # Módulo IoT
│   │   ├── index.jsx        # Panel de dispositivos
│   │   └── temperature.jsx  # Gráfico de temperatura en tiempo real
│   ├── profile/
│   │   └── changePassword.jsx
│   ├── reports/         # Módulo de reportes
│   │   ├── index.jsx
│   │   ├── reporteKardex.jsx
│   │   ├── reportePedido.jsx
│   │   ├── reporteProductosVencidos.jsx
│   │   ├── reporteFactura.jsx
│   │   └── reporteOrdencompra.jsx
│   └── security/
│       └── index.jsx
├── components/          # Componentes reutilizables
├── config/              # Tema y tipografía
├── context/             # SessionContext, LanguageContext
├── hooks/               # useLocationFilters, useMQTT
├── navigation/          # AppNavigator, AuthNavigator, MainNavigator, TabsNavigator
├── services/            # Capa de acceso a datos (auth, storage)
├── utils/               # Validaciones
├── assets/              # Imágenes, fuentes
├── app.config.js        # Configuración de Expo (lee variables del .env)
├── index.js             # Punto de entrada
└── .env                 # Variables de entorno (NO subir al repositorio)
```

---

## Módulos de la aplicación

### Autenticación

- Login con email y contraseña, recordar email entre sesiones.
- Registro de nuevos usuarios con validación de fortaleza de contraseña.
- Recuperación de contraseña por email.
- Soporte multi-empresa: el usuario puede tener roles en varias empresas y cambiar de contexto desde la pantalla Home.

### Inventario

- Escaneo de códigos QR y de barras mediante la cámara del dispositivo.
- Integración con el API de detección de imágenes.

### IoT

- Conexión en tiempo real al broker MQTT configurado en `.env`.
- Visualización de temperatura y humedad en gráfico de línea (últimas 10 lecturas).
- Control de dispositivos (bombillos, ventiladores) desde la app.

### Reportes

Generación y descarga de reportes en PDF con filtros por ubicación, fechas y producto:

- Reporte de Kardex
- Reporte de Pedido
- Reporte de Productos Vencidos
- Reporte de Factura _(en construcción)_
- Orden de Compra _(en construcción)_

### Notificaciones

- Configuración automática de notificaciones push con Expo al iniciar sesión.
- Visualización de notificaciones en la pestaña dedicada.

---

## Internacionalización (i18n)

El idioma de la aplicación se puede cambiar desde la pantalla de login. Los textos se gestionan con `i18n-js` y `expo-localization`. Los archivos de traducción se encuentran en `assets/locales/`.

---

## Build de producción

```bash
# Instalar EAS CLI (si no lo tienes)
npm install -g eas-cli

# Configurar el proyecto en EAS (primera vez)
eas build:configure

# Build para Android
eas build --platform android

# Build para iOS
eas build --platform ios
```

> Asegúrate de configurar el `projectId` en `app.config.js` y tener una cuenta en [expo.dev](https://expo.dev) antes de compilar.

---

## Notas de configuración

- El archivo `.env` **no debe subirse al repositorio**. Está incluido en `.gitignore`.
- Para desarrollo local apuntando a un backend en red local, cambiar `API_URL` a la IP de la máquina (ej. `http://192.168.x.x:8081`).
- El broker MQTT debe exponer WebSockets en el puerto configurado en `MQTT_BROKER_URL` (por defecto `ws://...:9001`).
- Las notificaciones push solo funcionan en dispositivos físicos, no en emuladores.
