import "dotenv/config";

export default ({ config }) => ({
  ...config,
  expo: {
    name: "Inventario",
    slug: "Inventario",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "inmero",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
    },
    android: {
      package: "com.luami180.inventario",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon.png",
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-font",
      "expo-localization",
      "expo-web-browser",
      "@react-native-google-signin/google-signin",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-full.png",
          resizeMode: "cover",
          backgroundColor: "#ffffff",
        },
      ],
    ],
    experiments: {
      reactCompiler: true,
    },
    extra: {
      API_URL: process.env.API_URL,
      API_KEY: process.env.API_KEY,

      // Autenticación y usuarios
      API_URL_LOGIN: process.env.API_URL_LOGIN,
      API_URL_REGISTER: process.env.API_URL_REGISTER,
      API_URL_FORGOT_PASSWORD: process.env.API_URL_FORGOT_PASSWORD,
      API_URL_SELECTION: process.env.API_URL_SELECTION,
      API_URL_SWITCH_CONTEXT: process.env.API_URL_SWITCH_CONTEXT,

      // Servicio de cámara qr y barcode
      API_CAMARA_URL: process.env.API_CAMARA_URL,
      API_CODE_PATH: process.env.API_CODE_PATH,

      // Notificaciones push
      API_URL_NOTIFICATIONS_TOKEN: process.env.API_URL_NOTIFICATIONS_TOKEN,
      API_IOT_NOTIFICATIONS: process.env.API_IOT_NOTIFICATIONS,

      // servicio de MQTT
      MQTT_BROKER_URL: process.env.MQTT_BROKER_URL,
      MQTT_CLIENT_ID: process.env.MQTT_CLIENT,
      MQTT_USERNAME: process.env.MQTT_USERNAME,
      MQTT_PASSWORD: process.env.MQTT_PASSWORD,
      MQTT_TOPIC: process.env.MQTT_TOPIC,
      MQTT_RECONNECT_PERIOD: process.env.MQTT_RECONNECT_PERIOD,
      MQTT_CONNECT_TIMEOUT: process.env.MQTT_CONNECT_TIMEOUT,
      MQTT_CLEAN: process.env.MQTT_CLEAN,

      // Ubicación
      API_URL_PAIS: process.env.API_URL_PAIS,
      API_URL_DEPARTAMENTO: process.env.API_URL_DEPARTAMENTO,
      API_URL_MUNICIPIO: process.env.API_URL_MUNICIPIO,
      API_URL_SEDE: process.env.API_URL_SEDE,
      API_URL_BLOQUE: process.env.API_URL_BLOQUE,
      API_URL_ESPACIO: process.env.API_URL_ESPACIO,
      API_URL_ALMACEN: process.env.API_URL_ALMACEN,
      // Productos y Categorías
      API_URL_PRODUCTO: process.env.API_URL_PRODUCTO,
      API_URL_PRODUCTO_CATEGORIA: process.env.API_URL_PRODUCTO_CATEGORIA,

      // Pedidos
      API_URL_PEDIDO: process.env.API_URL_PEDIDO,
      API_URL_PEDIDO_ARTICULOS: process.env.API_URL_PEDIDO_ARTICULOS,
      API_URL_ESTADO_CATEGORIA: process.env.API_URL_ESTADO_CATEGORIA,

      // Kardex
      API_URL_ARTICULO_KARDEX: process.env.API_URL_ARTICULO_KARDEX,

      // Reportes
      API_URL_REPORT_KARDEX: process.env.API_URL_REPORT_KARDEX,
      API_URL_REPORT_PEDIDO: process.env.API_URL_REPORT_PEDIDO,
      API_URL_REPORT_PEDIDO_V2: process.env.API_URL_REPORT_PEDIDO_V2,
      API_URL_REPORT_PRODUCTO_VENCIMIENTO:
        process.env.API_URL_REPORT_PRODUCTO_VENCIMIENTO,
      API_URL_REPORT_PRODUCTO_VENCIMIENTO_NUEVO:
        process.env.API_URL_REPORT_PRODUCTO_VENCIMIENTO_NUEVO,
      eas: {
        projectId: "  ",
      },
    },
  },
});
