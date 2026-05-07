// components/InfoCard.jsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";
import { useLanguage } from "../context/LanguageContext";

/**
 * Tarjeta informativa de temperatura y humedad
 * Muestra datos de sensores en tiempo real con navegación a detalles
 *
 * @param {Object} props
 * @param {number|null} props.temperature - Temperatura actual en °C (null si no disponible)
 * @param {number|null} props.humidity - Humedad relativa en % (null si no disponible)
 * @param {Function} props.onPress - Callback al presionar la tarjeta (navega a detalles)
 */
const InfoCard = ({ temperature, humidity, onPress }) => {
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.infoRow}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.infoItem}>
          <Ionicons
            name="thermometer-outline"
            size={26}
            color={colors.secondary}
            style={styles.icon}
          />
          <View style={styles.infoText}>
            <Text style={styles.valueText}>
              {temperature !== null ? `${temperature}°C` : "--"}
            </Text>
            <Text style={styles.labelText}>{t("temperature.temperatureLabel")}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.infoItem}>
          <Ionicons
            name="water-outline"
            size={26}
            color={colors.secondary}
            style={styles.icon}
          />
          <View style={styles.infoText}>
            <Text style={styles.valueText}>
              {humidity !== null ? `${humidity}%` : "--"}
            </Text>
            <Text style={styles.labelText}>{t("temperature.humidityLabel")}</Text>
          </View>
        </View>

        {/* Contenedor redondo para la flecha */}
        <View style={styles.arrowContainer}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={colors.textSec}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.border + "20",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  valueText: {
    ...typography.semibold.large,
    color: colors.text,
    marginBottom: 2,
  },
  labelText: {
    ...typography.regular.regular,
    color: colors.textSec,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  arrowContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default InfoCard;
