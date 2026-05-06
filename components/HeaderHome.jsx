// components/HeaderHome.jsx

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Logo from "../components/Logo";
import { colors } from "../config/theme";
import { typography } from "../config/typography";
import { useSession } from "../context/SessionContext";

/**
 * Header principal de la pantalla home con logo y avatar del usuario
 * Muestra el logo de la empresa y un avatar circular con las iniciales del usuario
 * El avatar permite navegar al perfil (funcionalidad pendiente)
 */
export default function HeaderHome() {
  const { getUserInitials } = useSession();

  /**
   * Maneja el evento de presionar el avatar del usuario
   * Actualmente solo muestra log, navegación al perfil pendiente de implementar
   */
  const handleProfilePress = () => {
    console.log("Avatar presionado - navegar a perfil");
    // router.push("/profile"); // Cuando tengas la pantalla de perfil
  };

  return (
    <View style={styles.header}>
      {/* Logo de la empresa */}
      <View style={styles.logoContainer}>
        <Logo width={125} height={140} variant="light" />
      </View>

      {/* Área derecha con avatar del usuario */}
      <View style={styles.headerRight}>
        <TouchableOpacity
          onPress={handleProfilePress}
          style={styles.avatar}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarText}>{getUserInitials()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal del header
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingTop: 20,
    height: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Contenedor del logo centrado
  logoContainer: {
    alignItems: "center",
  },

  // Área derecha para elementos adicionales
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Avatar circular del usuario
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2, // Sombra en Android
    shadowColor: colors.text, // Sombra en iOS
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // Texto de las iniciales dentro del avatar
  avatarText: {
    ...typography.medium.regular,
    color: colors.white,
  },
});
