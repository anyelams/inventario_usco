/**
 * components/ReportHeader.jsx
 * Header reutilizable para pantallas de reportes. Extiende el Header base
 * con un botón de filtro opcional que se activa visualmente cuando hay
 * filtros aplicados.
 */
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

/**
 * Header para pantallas de reportes con botón de filtro integrado.
 * @param {Object} props
 * @param {string} props.title - Título principal del header
 * @param {string} [props.description] - Descripción opcional debajo del título
 * @param {boolean} [props.showBackButton=true] - Si mostrar el botón de retroceso
 * @param {Function} [props.onBackPress] - Función personalizada para el botón back
 * @param {boolean} [props.showFilterButton=true] - Si mostrar el botón de filtro
 * @param {Function} [props.onFilterPress] - Callback al presionar el botón de filtro
 * @param {boolean} [props.filterActive=false] - Si los filtros están activos (cambia color del botón)
 */
const ReportHeader = ({
  title,
  description,
  showBackButton = true,
  onBackPress,
  showFilterButton = true,
  onFilterPress,
  filterActive = false,
}) => {
  const navigation = useNavigation();

  /**
   * Ejecuta la función de retroceso personalizada o navega hacia atrás por defecto.
   */
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  /** Botón de filtro con feedback visual cuando filterActive es true. */
  const FilterButton = () => (
    <TouchableOpacity
      onPress={onFilterPress}
      style={[styles.filterButton, filterActive && styles.filterButtonActive]}
    >
      <MaterialCommunityIcons
        name="filter-outline"
        size={20}
        color={filterActive ? colors.secondary : colors.text}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Primera fila: botón back y filtros */}
      <View style={styles.topRow}>
        {showBackButton ? (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={21}
              color={colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.rightContainer}>
          {showFilterButton && <FilterButton />}
        </View>
      </View>

      {/* Segunda fila: título y descripción */}
      <View style={styles.contentRow}>
        <Text style={styles.headerTitle}>{title}</Text>
        {description && (
          <Text style={styles.headerDescription}>{description}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    padding: 7,
    borderRadius: 19,
    backgroundColor: colors.base,
  },
  rightContainer: {
    alignItems: "flex-end",
  },
  placeholder: {
    width: 40,
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.base,
  },
  filterButtonActive: {
    backgroundColor: colors.secondary + "20",
  },
  contentRow: {
    alignItems: "flex-start",
    paddingLeft: 4,
  },
  headerTitle: {
    ...typography.semibold.big,
    color: colors.text,
    marginBottom: 4,
  },
  headerDescription: {
    ...typography.regular.large,
    color: colors.textSec,
    letterSpacing: 0.1,
  },
});

export default ReportHeader;
