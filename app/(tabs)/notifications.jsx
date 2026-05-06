// app/(tabs)/notifications.jsx
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";

// Datos de ejemplo para notificaciones mientras se implementa la API real
const mockData = [
  {
    id: 1,
    titulo: "Nuevo mensaje recibido",
    mensaje: "Revisa la bandeja de entrada.",
    fecha: "hace 5 min",
    estado: "no leida",
  },
  {
    id: 2,
    titulo: "Sistema actualizado",
    mensaje: "La versión 1.4 está disponible.",
    fecha: "hace 1 hora",
    estado: "leida",
  },
  {
    id: 3,
    titulo: "Sensor desconectado",
    mensaje: "Sensor 03 perdió conexión.",
    fecha: "ayer",
    estado: "no leida",
  },
];

/**
 * Pantalla de notificaciones de la aplicación
 * Muestra una lista de notificaciones del usuario con estados de leído/no leído,
 * permite marcar notificaciones individuales como leídas y gestiona permisos
 * de notificaciones del sistema
 */
export default function NotificationsScreen() {
  const navigation = useNavigation();

  // Estados de la pantalla
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  /**
   * Inicializa la pantalla cargando datos mock y verificando permisos
   */
  useEffect(() => {
    setNotificaciones(mockData);

    /**
     * Verifica el estado de los permisos de notificaciones
     */
    const checkPermissions = async () => {
      try {
        const settings = await Notifications.getPermissionsAsync();
        setNotificationsEnabled(settings.granted);
      } catch (e) {
        console.log("Error verificando permisos:", e);
      }
    };

    checkPermissions();
  }, []);

  /**
   * Marca una notificación específica como leída
   * @param {number} id - ID de la notificación a marcar como leída
   */
  const marcarComoLeida = (id) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, estado: "leida" } : n)),
    );
  };

  /**
   * Marca todas las notificaciones como leídas
   */
  const marcarTodoComoLeido = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, estado: "leida" })));
  };

  // Contador de notificaciones no leídas para mostrar en el header
  const unreadCount = notificaciones.filter((n) => n.estado !== "leida").length;

  /**
   * Abre la configuración del sistema para gestionar permisos de notificaciones
   */
  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (e) {
      console.log("Error abriendo ajustes:", e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header con contador de notificaciones no leídas */}
      <Header
        title={`Notificaciones${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
        onBackPress={() => navigation.navigate("Home")}
      />

      {/* Lista scrolleable de notificaciones */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {notificaciones.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => marcarComoLeida(item.id)}
            disabled={item.estado === "leida"}
            style={styles.listItem}
          >
            {/* Indicador visual para notificaciones no leídas */}
            {item.estado !== "leida" && <View style={styles.indicator} />}

            {/* Contenido de la notificación */}
            <View style={styles.textContainer}>
              <Text
                style={
                  item.estado === "leida"
                    ? styles.tituloRead
                    : styles.tituloUnread
                }
                numberOfLines={3}
              >
                {item.titulo}
              </Text>
              <Text style={styles.fecha}>{item.fecha}</Text>
              <Text style={styles.mensaje}>{item.mensaje}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Botón flotante para marcar todas como leídas (solo si hay no leídas) */}
      {unreadCount > 0 && (
        <TouchableOpacity onPress={marcarTodoComoLeido} style={styles.fab}>
          <Text style={styles.fabText}>Marcar todo leído</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal con safe area
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Configuración del scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 80, // Espacio para el FAB
  },

  // Barra de advertencia (no utilizada actualmente)
  warningBar: {
    flexDirection: "row",
    backgroundColor: colors.red,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  warningText: {
    ...typography.regular.medium,
    color: colors.white,
    marginLeft: 6,
  },

  // Item individual de notificación
  listItem: {
    backgroundColor: colors.base,
    marginVertical: 6,
    padding: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  // Indicador visual de notificación no leída
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginRight: 10,
    marginTop: 6,
  },

  // Contenedor del texto de la notificación
  textContainer: {
    flex: 1,
  },

  // Estilos de título según estado
  tituloUnread: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 2,
  },
  tituloRead: {
    ...typography.medium.large,
    color: colors.textSec,
    marginBottom: 2,
  },

  // Fecha de la notificación
  fecha: {
    ...typography.regular.regular,
    color: colors.textSec,
    marginBottom: 6,
  },

  // Mensaje de la notificación
  mensaje: {
    ...typography.regular.large,
    color: colors.textSec,
  },

  // Botón flotante para marcar todas como leídas
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 1,
  },
  fabText: {
    ...typography.semibold.medium,
    color: colors.white,
  },
});
