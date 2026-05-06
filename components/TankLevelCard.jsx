// components/TankLevelCard.jsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Circle, Svg } from "react-native-svg";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

/**
 * Visualización del nivel de tanque con progreso circular
 * Muestra porcentaje de llenado y distancia del sensor ultrasónico
 * El color del indicador cambia según el nivel (rojo < 25%, naranja < 50%, azul < 75%, verde ≥ 75%)
 *
 * @param {Object} props
 * @param {number} props.nivel - Nivel del tanque en porcentaje (0-100)
 * @param {number} props.distanciaUltrasonico - Distancia medida por sensor en cm
 * @param {Object} [props.style] - Estilos adicionales para el contenedor
 */
const TankLevelCard = ({ nivel, distanciaUltrasonico, style }) => {
  // Configuración del círculo
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (circumference * nivel) / 100;

  /**
   * Determina el color del indicador según el nivel del tanque
   * @returns {string} Color hex según nivel
   */
  const getTankColor = () => {
    if (nivel >= 75) return colors.success;
    if (nivel >= 50) return colors.secondary;
    if (nivel >= 25) return colors.warning;
    return colors.error;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.tankCard}>
        <View style={styles.tankHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="water-outline" size={22} color={colors.textSec} />
          </View>
          <Text style={styles.tankTitle}>Nivel del tanque</Text>
        </View>

        <View style={styles.circularProgressContainer}>
          <Svg width={size} height={size} style={styles.circularProgress}>
            {/* Círculo de fondo */}
            <Circle
              stroke={colors.lightGray}
              fill="none"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
            />
            {/* Círculo de progreso */}
            <Circle
              stroke={getTankColor()}
              fill="none"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>

          <View style={styles.percentageContainer}>
            <Text style={[styles.percentageText, { color: getTankColor() }]}>
              {nivel.toFixed(0)}%
            </Text>
          </View>
        </View>

        {distanciaUltrasonico > 0 && (
          <View style={styles.distanceInfo}>
            <Text style={styles.distanceLabel}>Distancia</Text>
            <Text style={styles.distanceValue}>
              {distanciaUltrasonico.toFixed(1)} cm
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  tankCard: {
    backgroundColor: colors.border + "20",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tankHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  tankTitle: {
    ...typography.medium.large,
    color: colors.text,
  },
  circularProgressContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  circularProgress: {
    transform: [{ rotate: "0deg" }],
  },
  percentageContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  percentageText: {
    ...typography.bold.big,
    fontSize: 24,
  },
  distanceInfo: {
    marginTop: 16,
    alignItems: "center",
  },
  distanceLabel: {
    ...typography.regular.small,
    color: colors.textSec,
    marginBottom: 4,
  },
  distanceValue: {
    ...typography.semibold.medium,
    color: colors.text,
  },
});

export default TankLevelCard;
