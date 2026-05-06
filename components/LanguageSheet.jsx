// components/LanguageSheet.jsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

/**
 * Modal bottom sheet para selección de idioma
 * Presenta una lista de idiomas disponibles con banderas y permite al usuario
 * seleccionar uno. Se muestra desde abajo con animación slide.
 * @param {Object} props
 * @param {boolean} props.visible - Si el modal está visible
 * @param {Function} props.onClose - Función llamada al cerrar el modal
 * @param {Array} props.languages - Array de objetos de idiomas [{code, name, flag}]
 * @param {string} props.currentLanguage - Código del idioma actualmente seleccionado
 * @param {Function} props.onSelect - Función llamada al seleccionar un idioma
 * @param {Function} props.t - Función de traducción para textos del modal
 */
export default function LanguageSheet({
  visible,
  onClose,
  languages,
  currentLanguage,
  onSelect,
  t,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop que cierra el modal al presionar */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet principal del modal */}
        <View style={styles.sheet}>
          {/* Indicador visual de arrastre */}
          <View style={styles.dragIndicator} />

          {/* Título del modal */}
          <Text style={styles.title}>{t("welcome.selectLanguage")}</Text>

          {/* Lista de idiomas disponibles */}
          <View style={styles.languagesContainer}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLanguage === lang.code && styles.languageOptionActive,
                ]}
                onPress={() => onSelect(lang.code)}
                activeOpacity={0.7}
              >
                {/* Bandera del país */}
                <Text style={styles.flag}>{lang.flag}</Text>

                {/* Nombre del idioma */}
                <Text
                  style={[
                    styles.languageText,
                    currentLanguage === lang.code && styles.languageTextActive,
                  ]}
                >
                  {lang.name}
                </Text>

                {/* Checkmark para idioma seleccionado */}
                {currentLanguage === lang.code && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.secondary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Botón de cancelar */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{t("common.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Overlay oscuro que cubre toda la pantalla
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  // Área transparente que permite cerrar el modal
  backdrop: {
    flex: 1,
  },

  // Contenedor principal del sheet
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 34,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10, // Sombra en Android
  },

  // Indicador visual de que se puede arrastrar
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },

  // Título principal del modal
  title: {
    ...typography.semibold.large,
    textAlign: "center",
    marginBottom: 20,
    color: colors.text,
  },

  // Contenedor scrollable de idiomas
  languagesContainer: {
    maxHeight: 300,
  },

  // Opción individual de idioma
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: colors.base,
    borderWidth: 2,
    borderColor: "transparent",
  },

  // Estado activo de la opción seleccionada
  languageOptionActive: {
    backgroundColor: "transparent",
    borderColor: colors.secondary,
  },

  // Bandera del país (emoji)
  flag: {
    fontSize: 22,
    marginRight: 14,
  },

  // Texto del nombre del idioma
  languageText: {
    flex: 1,
    ...typography.medium.medium,
    color: colors.text,
  },

  // Estilo del texto cuando está seleccionado
  languageTextActive: {
    ...typography.semibold.medium,
    color: colors.secondary,
  },

  // Botón de cerrar/cancelar
  closeBtn: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    alignItems: "center",
  },

  // Texto del botón de cerrar
  closeText: {
    ...typography.semibold.medium,
    color: colors.white,
  },
});
