// app/(tabs)/profile.jsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import LanguageSheet from "../../components/LanguageSheet";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Pantalla de perfil del usuario
 * Permite gestionar configuraciones personales como notificaciones,
 * cambio de contraseña, idioma y cerrar sesión. Muestra información
 * del usuario actual y empresa seleccionada.
 */
const Profile = () => {
  const navigation = useNavigation();
  const { cerrarSesion, userEmail, empresaSeleccionada, getUserInitials } =
    useSession();
  const { t, currentLanguage, changeLanguage, availableLanguages } = useLanguage();

  // Estados locales para configuraciones
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);

  /**
   * Verifica el estado actual de los permisos de notificaciones
   * al cargar la pantalla
   */
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const settings = await Notifications.getPermissionsAsync();
        setNotificationsEnabled(settings.granted);
      } catch (e) {
        console.log("Error consultando permisos de notificaciones:", e);
      }
    };
    checkPermissions();
  }, []);

  /**
   * Maneja el cierre de sesión del usuario
   * Limpia la sesión y permite que AppInitializer maneje la navegación
   */
  const handleLogout = async () => {
    await cerrarSesion();
    // El AppNavigator detecta token=null y muestra Auth automáticamente
  };

  /**
   * Abre la configuración del sistema para gestionar notificaciones
   * Permite al usuario modificar permisos desde la configuración nativa
   */
  const handleOpenNotificationSettings = async () => {
    try {
      await Linking.openSettings(); // Abre configuración de la app
    } catch (e) {
      console.log("Error abriendo configuración de notificaciones:", e);
    }
  };

  /**
   * Maneja la selección de idioma desde el modal
   * @param {string} code - Código del idioma seleccionado
   */
  const handleLanguageSelect = (code) => {
    changeLanguage(code);
    setLanguageSheetVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header de la pantalla */}
      <Header
        title={t("profile.title")}
        onBackPress={() => navigation.navigate("Home")}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tarjeta de información del usuario */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getUserInitials()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {empresaSeleccionada?.empresaNombre || t("profile.defaultCompany")}
            </Text>
            <Text style={styles.userEmail}>
              {userEmail || t("profile.defaultEmail")}
            </Text>
          </View>
        </View>

        {/* Sección General */}
        <Text style={styles.sectionLabel}>{t("profile.sectionGeneral")}</Text>

        {/* Configuración de notificaciones */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={handleOpenNotificationSettings}
        >
          <Text style={styles.optionText}>{t("profile.optionNotifications")}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleOpenNotificationSettings}
            trackColor={{ false: colors.lightGray, true: colors.primary }}
            thumbColor={notificationsEnabled ? colors.white : "#f4f3f4"}
          />
        </TouchableOpacity>

        {/* Opción para cambiar contraseña */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => navigation.navigate("ChangePassword")}
        >
          <Text style={styles.optionText}>{t("profile.optionChangePassword")}</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textSec}
          />
        </TouchableOpacity>

        {/* Sección Preferencias */}
        <Text style={styles.sectionLabel}>{t("profile.sectionPreferences")}</Text>

        {/* Selector de idioma */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => setLanguageSheetVisible(true)}
        >
          <Text style={styles.optionText}>{t("profile.optionLanguage")}</Text>
          <View style={styles.optionRight}>
            <Text style={styles.optionValue}>
              {availableLanguages.find((l) => l.code === currentLanguage)?.name}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textSec}
            />
          </View>
        </TouchableOpacity>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t("profile.logout")}</Text>
          <MaterialCommunityIcons name="logout" size={20} color={colors.red} />
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de selección de idioma */}
      <LanguageSheet
        visible={languageSheetVisible}
        onClose={() => setLanguageSheetVisible(false)}
        languages={availableLanguages}
        currentLanguage={currentLanguage}
        onSelect={handleLanguageSelect}
        t={t}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Contenedor principal con safe area
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Configuración del scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  // Tarjeta de información del usuario
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    ...typography.medium.large,
    color: colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.semibold.medium,
    color: colors.text,
  },
  userEmail: {
    ...typography.regular.large,
    color: colors.textSec,
    marginTop: 2,
  },

  // Etiquetas de sección
  sectionLabel: {
    ...typography.regular.large,
    color: colors.textSec,
    marginTop: 26,
    marginBottom: 6,
  },

  // Filas de opciones de configuración
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  optionText: {
    ...typography.medium.large,
    color: colors.text,
  },
  optionRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionValue: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginRight: 6,
  },

  // Fila de cerrar sesión con estilo distintivo
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginTop: 24,
  },
  logoutText: {
    ...typography.medium.large,
    color: colors.red,
  },
});

export default Profile;
