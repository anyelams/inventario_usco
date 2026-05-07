// components/DateTimeInput.jsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";
import { useLanguage } from "../context/LanguageContext";

/**
 * Input de fecha y hora para Android
 *
 * Características:
 * - Muestra selectores nativos secuenciales (fecha → hora)
 * - Formato de visualización: DD/MM/YYYY HH:MM
 * - Formato de almacenamiento: ISO 8601 (YYYY-MM-DDTHH:MM:SS)
 * - Botón de limpieza opcional
 * - Validación y manejo de fechas inválidas
 *
 * @param {Object} props
 * @param {string} props.label - Etiqueta del campo
 * @param {string} props.value - Fecha en formato ISO string
 * @param {Function} props.onChangeText - Callback con fecha ISO al cambiar
 * @param {string} [props.placeholder] - Texto placeholder
 * @param {boolean} [props.enabled=true] - Si el campo está habilitado
 * @param {string} [props.error] - Mensaje de error a mostrar
 * @param {boolean} [props.showClearButton=false] - Mostrar botón de limpiar
 */
const DateTimeInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  enabled = true,
  error = null,
  showClearButton = false,
}) => {
  const { t } = useLanguage();
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [mode, setMode] = useState("date");
  const [currentStep, setCurrentStep] = useState("date");

  /**
   * Formatea fecha ISO para mostrar al usuario
   */
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  /**
   * Convierte Date a formato ISO para almacenamiento
   */
  const formatISODate = (date) => {
    try {
      return date.toISOString().slice(0, 19);
    } catch {
      return "";
    }
  };

  /**
   * Maneja selección de fecha en Android (flujo secuencial)
   * Primero fecha, luego hora
   */
  const handleDateChange = (event, date) => {
    setShowPicker(false);

    if (event.type === "set" && date) {
      if (currentStep === "date") {
        // Después de seleccionar fecha, mostrar selector de hora
        setTempDate(date);
        setMode("time");
        setCurrentStep("time");
        setShowPicker(true);
      } else {
        // Ya seleccionó hora, guardar resultado final
        const isoString = formatISODate(date);
        onChangeText(isoString);
        setCurrentStep("date");
        setMode("date");
      }
    } else {
      // Canceló
      setCurrentStep("date");
      setMode("date");
    }
  };

  const handleClear = () => {
    onChangeText("");
  };

  const openPicker = () => {
    if (!enabled) return;

    let initialDate = new Date();
    if (value) {
      const currentDate = new Date(value);
      if (!isNaN(currentDate.getTime())) {
        initialDate = currentDate;
      }
    }
    setTempDate(initialDate);
    setMode("date");
    setCurrentStep("date");
    setShowPicker(true);
  };

  const displayValue = value ? formatDisplayDate(value) : "";

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, !enabled && styles.labelDisabled]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.pickerWrapper,
          !enabled && styles.pickerDisabled,
          error && styles.pickerError,
        ]}
        onPress={openPicker}
        activeOpacity={enabled ? 0.7 : 1}
        disabled={!enabled}
      >
        <Text
          style={[styles.pickerText, !displayValue && styles.placeholderText]}
        >
          {displayValue || placeholder || `${t("common.select")}${label ? " " + label : ""}`}
        </Text>

        <Ionicons
          name="calendar-outline"
          size={18}
          color={colors.textSec}
          style={styles.calendarIcon}
        />

        {value && enabled && showClearButton && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textSec} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode={mode}
          display="default"
          onChange={handleDateChange}
          is24Hour={true}
        />
      )}
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
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  pickerDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  pickerError: {
    borderColor: colors.error,
    backgroundColor: "#fef2f2",
  },
  pickerText: {
    ...typography.regular.medium,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.textSec,
  },
  errorText: {
    ...typography.regular.small,
    color: colors.error,
    marginTop: 4,
  },
  calendarIcon: {
    marginLeft: 8,
    opacity: 0.7,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
});

export default DateTimeInput;
