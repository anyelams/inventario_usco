/**
 * components/CustomPicker.jsx
 * Selector desplegable personalizado basado en @react-native-picker/picker.
 * Muestra un label, opción placeholder vacía, lista de items y mensaje de error.
 * Admite estado deshabilitado con feedback visual.
 */
import { Picker } from "@react-native-picker/picker";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";
import { useLanguage } from "../context/LanguageContext";

/**
 * Selector desplegable con label, placeholder y manejo de errores.
 * @param {Object} props
 * @param {string} [props.label] - Etiqueta visible encima del picker
 * @param {Array} [props.items=[]] - Lista de opciones { id, nombre | name }
 * @param {*} props.selectedValue - Valor actualmente seleccionado
 * @param {Function} props.onValueChange - Callback al cambiar la selección
 * @param {boolean} [props.enabled=true] - Si el picker es interactivo
 * @param {string} [props.placeholder] - Texto de la opción vacía inicial
 * @param {string} [props.error] - Mensaje de error a mostrar debajo
 */
const CustomPicker = ({
  label,
  items = [],
  selectedValue,
  onValueChange,
  enabled = true,
  placeholder = null,
  error = null,
}) => {
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, !enabled && styles.labelDisabled]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.pickerWrapper,
          !enabled && styles.pickerDisabled,
          error && styles.pickerError,
        ]}
      >
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          enabled={enabled}
          style={styles.picker}
        >
          <Picker.Item
            label={placeholder || `${t("common.select")}${label ? " " + label : ""}`}
            value={null}
            color={colors.textSec}
          />
          {items.map((item) => (
            <Picker.Item
              key={item.id}
              label={item.nombre || item.name || `${label} ${item.id}`}
              value={item.id}
              color={colors.text}
            />
          ))}
        </Picker>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 6,
    marginLeft: 4,
  },
  labelDisabled: {
    color: colors.textSec,
    opacity: 0.6,
  },
  pickerWrapper: {
    backgroundColor: colors.lightGray,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  pickerDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  pickerError: {
    borderColor: colors.error,
    backgroundColor: "#fef2f2",
  },
  picker: {
    height: 50,
    color: colors.text,
  },
  errorText: {
    ...typography.regular.small,
    color: colors.error,
    marginTop: 4,
  },
});

export default CustomPicker;
