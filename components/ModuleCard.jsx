// components/ModuleCard.jsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

/**
 * Tarjeta de módulo reutilizable para la pantalla principal
 * Muestra un icono y título con colores temáticos específicos para cada módulo.
 * Diseñada para usarse en un grid 2x2 en la pantalla de home.
 * @param {Object} props
 * @param {string} props.title - Título del módulo a mostrar
 * @param {string} props.icon - Nombre del icono de MaterialCommunityIcons
 * @param {Object} props.moduleColors - Objeto con colores específicos del módulo
 * @param {string} props.moduleColors.background - Color de fondo de la tarjeta
 * @param {string} props.moduleColors.icon - Color del icono principal
 * @param {string} props.moduleColors.accent - Color de acento para bordes y contenedor del icono
 * @param {Function} props.onPress - Función llamada al presionar la tarjeta
 * @param {Object} [props.style={}] - Estilos adicionales para el contenedor
 */
const ModuleCard = ({ title, icon, moduleColors, onPress, style = {} }) => {
  return (
    <TouchableOpacity
      style={[styles.cardContainer, style]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: moduleColors.background,
            borderColor: moduleColors.icon + "33", // Transparencia del 20%
          },
        ]}
      >
        <View style={styles.content}>
          {/* Contenedor del icono con colores temáticos */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: moduleColors.accent + "15", // Fondo con transparencia
                borderColor: moduleColors.accent + "33", // Borde semitransparente
              },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={24}
              color={moduleColors.icon}
            />
          </View>

          {/* Título del módulo */}
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Contenedor principal ocupando 48% del ancho para grid 2x2
  cardContainer: {
    width: "48%",
    marginBottom: 20,
  },

  // Tarjeta principal con bordes redondeados
  card: {
    height: 130,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },

  // Contenido interno de la tarjeta
  content: {
    flex: 1,
    padding: 18,
    justifyContent: "flex-start",
  },

  // Contenedor circular del icono con fondo temático
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
  },

  // Título del módulo con tipografía específica
  title: {
    ...typography.semibold.regular,
    color: colors.text,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
});

export default ModuleCard;
