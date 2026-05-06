// components/StatusCard.jsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

/**
 * Tarjeta que muestra el estado de conexión MQTT
 * Incluye indicador visual, estado textual y botón de reconexión cuando es necesario
 *
 * @param {Object} props
 * @param {boolean} props.connected - Estado de conexión al broker MQTT
 * @param {boolean} props.isConnecting - Indica si está intentando conectar
 * @param {Function} props.onReconnect - Callback para intentar reconexión manual
 */
const StatusCard = ({ connected, isConnecting, onReconnect }) => {
  const getStatusText = () => {
    if (isConnecting) return "Conectando...";
    return connected ? "Conectado" : "Desconectado";
  };

  const getStatusColor = () => {
    if (isConnecting) return colors.accent;
    return connected ? colors.success : colors.error;
  };

  const getIconBackgroundColor = () => {
    if (isConnecting) return `${colors.accent}20`;
    return connected ? `${colors.success}20` : `${colors.error}20`;
  };

  const getIconBorderColor = () => {
    if (isConnecting) return colors.accent;
    return connected ? colors.success : colors.error;
  };

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        {/* Icono en recuadro */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: getIconBackgroundColor(),
                borderColor: getIconBorderColor(),
              },
            ]}
          >
            <Ionicons name="power-outline" size={20} color={getStatusColor()} />
          </View>
        </View>

        {/* Información */}
        <View style={styles.info}>
          <Text style={styles.label}>Estado</Text>
          <Text style={[styles.value, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

        {/* Loader o botón */}
        {isConnecting && (
          <ActivityIndicator size="small" color={colors.accent} />
        )}
        {!connected && !isConnecting && (
          <TouchableOpacity
            onPress={onReconnect}
            style={styles.reconnectButton}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color={colors.white} />
            <Text style={styles.reconnectText}>Reconectar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    flex: 1,
  },
  label: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  value: {
    ...typography.semibold.regular,
    fontSize: 15,
    letterSpacing: -0.1,
  },
  reconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reconnectText: {
    ...typography.medium.small,
    color: colors.white,
    fontSize: 13,
    marginLeft: 6,
  },
});

export default StatusCard;
