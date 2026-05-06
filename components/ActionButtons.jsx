/**
 * components/ActionButtons.jsx
 * Barra de dos botones de acción para pantallas de reportes:
 * "Buscar" (primario) y "Generar Reporte" (secundario).
 * Muestra spinner y deshabilita los botones durante operaciones en curso.
 */
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

/**
 * Barra de acciones con botón de búsqueda y generación de reporte.
 * @param {Object} props
 * @param {Function} props.onSearch - Callback para ejecutar la búsqueda
 * @param {Function} props.onGenerateReport - Callback para generar el PDF
 * @param {boolean} props.loadingPedido - Si la búsqueda está en curso
 * @param {boolean} props.generatingReport - Si la generación de reporte está en curso
 */
const ActionButtons = ({
  onSearch,
  onGenerateReport,
  loadingPedido,
  generatingReport,
}) => {
  return (
    <View style={styles.container}>
      {/* === BOTÓN PRIMARY: Buscar === */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.searchButton,
          loadingPedido && styles.buttonDisabled,
        ]}
        onPress={onSearch}
        disabled={loadingPedido}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          {loadingPedido ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="search-outline" size={16} color="white" />
          )}
          <Text style={styles.primaryText}>
            {loadingPedido ? "Buscando..." : "Buscar"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* === BOTÓN SECONDARY: Reporte === */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.reportButton,
          generatingReport && styles.buttonDisabled,
        ]}
        onPress={onGenerateReport}
        disabled={generatingReport}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          {generatingReport ? (
            <ActivityIndicator size="small" color={colors.textSec} />
          ) : (
            <Ionicons
              name="document-text-outline"
              size={16}
              color={colors.textSec}
            />
          )}
          <Text style={styles.reportText}>
            {generatingReport ? "Generando..." : "Generar Reporte"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    marginHorizontal: 16,
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButton: {
    backgroundColor: colors.secondary,
  },
  reportButton: {
    backgroundColor: colors.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryText: {
    ...typography.semibold.regular,
    color: "white",
  },
  reportText: {
    ...typography.semibold.regular,
    color: colors.textSec,
  },
});

export default ActionButtons;
