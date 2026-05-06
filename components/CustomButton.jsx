// components/CustomButton.jsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

/**
 * Botón personalizable con múltiples variantes, iconos y opciones de navegación
 * @param {Object} props
 * @param {string} props.text - Texto a mostrar en el botón
 * @param {Function} [props.onPress] - Función a ejecutar al presionar (tiene prioridad sobre route)
 * @param {string} [props.route] - Ruta de navegación si no se proporciona onPress
 * @param {string} [props.variant='primary'] - Variante visual ('primary', 'secondary', 'outline')
 * @param {string} [props.icon] - Nombre del icono de Ionicons a mostrar
 * @param {string} [props.iconPosition='right'] - Posición del icono ('left', 'right')
 * @param {boolean} [props.disabled=false] - Si el botón está deshabilitado
 * @param {string|number} [props.width='90%'] - Ancho del botón (porcentaje o número)
 * @param {boolean} [props.fullWidth=false] - Si debe ocupar el 100% del ancho
 * @param {Object} [props.style] - Estilos adicionales para el contenedor
 * @param {Object} [props.textStyle] - Estilos adicionales para el texto
 */
const CustomButton = ({
  text,
  onPress,
  route,
  variant = "primary",
  icon,
  iconPosition = "right",
  disabled = false,
  width = "90%",
  fullWidth = false,
  style,
  textStyle,
}) => {
  const navigation = useNavigation();

  /**
   * Maneja el evento de presionar el botón
   * Prioriza onPress sobre navegación por route
   */
  const handlePress = () => {
    if (disabled) return;

    if (onPress) {
      onPress();
    } else if (route) {
      navigation.navigate(route);
    }
  };

  /**
   * Obtiene los estilos del botón según la variante y configuración
   * @returns {Array} - Array de estilos combinados
   */
  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      {
        width: fullWidth ? "100%" : width,
      },
    ];

    switch (variant) {
      case "primary":
        return [...baseStyle, styles.primaryButton];
      case "secondary":
        return [...baseStyle, styles.secondaryButton];
      case "outline":
        return [...baseStyle, styles.outlineButton];
      default:
        return [...baseStyle, styles.primaryButton];
    }
  };

  /**
   * Obtiene los estilos del texto según la variante
   * @returns {Array} - Array de estilos de texto
   */
  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];

    switch (variant) {
      case "primary":
        return [...baseStyle, styles.primaryText];
      case "secondary":
        return [...baseStyle, styles.secondaryText];
      case "outline":
        return [...baseStyle, styles.outlineText];
      default:
        return [...baseStyle, styles.primaryText];
    }
  };

  /**
   * Determina el color del icono según la variante del botón
   * @returns {string} - Color del icono
   */
  const getIconColor = () => {
    switch (variant) {
      case "primary":
        return colors.white;
      case "secondary":
      case "outline":
        return colors.text;
      default:
        return colors.white;
    }
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), disabled && styles.disabled, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {/* Icono izquierdo */}
      {icon && iconPosition === "left" && (
        <Ionicons
          name={icon}
          size={18}
          color={getIconColor()}
          style={styles.iconLeft}
        />
      )}

      {/* Texto del botón */}
      <Text style={[...getTextStyle(), textStyle]}>{text}</Text>

      {/* Icono derecho */}
      {icon && iconPosition === "right" && (
        <Ionicons
          name={icon}
          size={18}
          color={getIconColor()}
          style={styles.iconRight}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Estilo base del botón
  button: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  // Variantes de botón
  primaryButton: {
    backgroundColor: colors.secondary,
  },
  secondaryButton: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.secondary,
  },

  // Estilos de texto según variante
  buttonText: {
    ...typography.semibold.medium,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineText: {
    color: colors.secondary,
  },

  // Estado deshabilitado
  disabled: {
    opacity: 0.5,
  },

  // Posicionamiento de iconos
  iconLeft: {
    marginRight: -5,
  },
  iconRight: {
    marginLeft: -5,
  },
});

export default CustomButton;
