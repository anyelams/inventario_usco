/**
 * components/Logo.jsx
 * Componente de logo con dos variantes de imagen:
 * - "dark": logo oscuro para fondos claros
 * - "light": logo claro para fondos oscuros o de imagen
 */
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import logoDark from "../assets/images/logo.png";
import logoLight from "../assets/images/logo_light.png";

/**
 * Logo de la aplicación con soporte para variante oscura y clara.
 * @param {Object} props
 * @param {number} [props.width=140] - Ancho de la imagen en píxeles
 * @param {number} [props.height=140] - Alto de la imagen en píxeles
 * @param {'dark'|'light'} [props.variant='dark'] - Variante de color del logo
 * @param {Object} [props.style] - Estilos adicionales para el contenedor
 */
export default function Logo({
  width = 140,
  height = 140,
  variant = "dark",
  style,
}) {
  const logoSource = variant === "light" ? logoLight : logoDark;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={logoSource}
        style={[styles.image, { width, height }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  image: {},
});
