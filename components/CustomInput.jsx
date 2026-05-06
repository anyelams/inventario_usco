// components/CustomInput.jsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

/**
 * Input personalizado con validación, iconos y funcionalidad de contraseña
 * @param {Object} props
 * @param {string} [props.label] - Etiqueta del campo
 * @param {string} [props.placeholder] - Texto placeholder
 * @param {string} props.value - Valor actual del input
 * @param {Function} props.onChangeText - Función llamada cuando cambia el texto
 * @param {string} [props.icon] - Nombre del icono de Ionicons a mostrar
 * @param {string} [props.keyboardType='default'] - Tipo de teclado ('default', 'email-address', 'numeric', etc.)
 * @param {string} [props.autoCapitalize='none'] - Configuración de auto-capitalización
 * @param {boolean} [props.autoCorrect=false] - Si debe activar autocorrección
 * @param {boolean} [props.secureTextEntry=false] - Si es un campo de contraseña
 * @param {boolean} [props.editable=true] - Si el campo es editable
 * @param {string} [props.error] - Mensaje de error a mostrar
 * @param {boolean} [props.showPasswordToggle=false] - Si mostrar botón para toggle de contraseña
 * @param {Object} [props.style] - Estilos adicionales para el contenedor
 * @param {Object} [props.inputStyle] - Estilos adicionales para el TextInput
 */
const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
  secureTextEntry = false,
  editable = true,
  error,
  showPasswordToggle = false,
  style,
  inputStyle,
}) => {
  // Estado para controlar la visibilidad de la contraseña
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  /**
   * Alterna la visibilidad de la contraseña
   */
  const handleTogglePassword = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  /**
   * Determina si el texto debe estar oculto
   * Solo oculta si secureTextEntry es true Y la contraseña no es visible
   */
  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.container, style]}>
      {/* Etiqueta del campo */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Contenedor del input con estados visuales */}
      <View
        style={[
          styles.inputContainer,
          error && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        {/* Icono izquierdo */}
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? colors.error : colors.textSec}
          />
        )}

        {/* Campo de texto principal */}
        <TextInput
          placeholder={placeholder}
          style={[styles.input, inputStyle]}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          secureTextEntry={isSecure}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          placeholderTextColor={colors.textSec}
        />

        {/* Botón toggle para contraseñas */}
        {showPasswordToggle && secureTextEntry && (
          <TouchableOpacity onPress={handleTogglePassword} disabled={!editable}>
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.textSec}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Mensaje de error */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  // Contenedor principal del componente
  container: {
    marginBottom: 12,
  },

  // Estilo de la etiqueta
  label: {
    ...typography.semibold.regular,
    color: colors.textSec,
    marginBottom: 6,
  },

  // Contenedor del input con bordes y padding
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },

  // Estado de error - borde rojo y fondo claro
  inputContainerError: {
    borderColor: colors.error,
    backgroundColor: "#fef2f2",
  },

  // Estado deshabilitado - apariencia reducida
  inputContainerDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },

  // Estilo del TextInput principal
  input: {
    flex: 1,
    ...typography.regular.medium,
    color: colors.text,
  },

  // Mensaje de error debajo del input
  errorText: {
    ...typography.regular.small,
    color: colors.error,
    marginTop: 4,
  },
});

export default CustomInput;
