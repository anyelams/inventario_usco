/**
 * app/(auth)/forgotPassword.jsx
 * Pantalla para solicitar el restablecimiento de contraseña.
 * Valida el email ingresado y llama al API para enviar el enlace de recuperación.
 * Redirige a EmailVerification al enviarse correctamente.
 */
import axios from "axios";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import backgroundImage from "../../assets/images/background.png";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import Logo from "../../components/Logo";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useLanguage } from "../../context/LanguageContext";

const { API_URL, API_URL_FORGOT_PASSWORD } = Constants.expoConfig.extra;

/**
 * Pantalla de recuperación de contraseña.
 * Muestra un formulario con el campo de email y un botón para enviar
 * el enlace de restablecimiento.
 */
export default function ForgotPassword() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Valida el formato del email con expresión regular.
   * @param {string} email - Email a validar
   * @returns {boolean} - true si el formato es válido
   */
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /**
   * Actualiza el estado del email y limpia errores al escribir.
   * @param {string} value - Nuevo valor del campo email
   */
  const handleEmailChange = (value) => {
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  /**
   * Valida el email y llama al API para enviar el enlace de restablecimiento.
   * Navega a EmailVerification si la petición es exitosa.
   */
  const handleSendResetEmail = async () => {
    if (isLoading) return;

    setErrors({});
    setIsLoading(true);

    if (!email.trim()) {
      setErrors({ email: t("validation.emailRequired") });
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: t("validation.emailInvalid") });
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}${API_URL_FORGOT_PASSWORD}`, {
        email: email.trim(),
      });

      setEmail("");
      navigation.navigate("EmailVerification");
    } catch (error) {
      console.error("Error en forgot password:", error);

      let errorMessage;
      if (error.response?.status === 404) {
        errorMessage = t("errors.accountNotFound");
      } else if (error.response?.status === 400) {
        errorMessage = t("errors.invalidData");
      } else if (
        error.message?.includes("Network Error") ||
        error.code === "NETWORK_ERROR"
      ) {
        errorMessage = t("errors.networkError");
      } else if (error.message?.includes("timeout")) {
        errorMessage = t("errors.connectionTimeout");
      } else {
        errorMessage = t("errors.serverError");
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={[styles.headerContainer, { marginTop: insets.top + 10 }]}>
          <View style={styles.logoLeft}>
            <Logo width={130} height={110} variant="dark" />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{t("forgotPassword.title")}</Text>
          <Text style={styles.subtitle}>{t("forgotPassword.subtitle")}</Text>
        </View>

        <View style={[styles.modalCard, { paddingBottom: insets.bottom + 20 }]}>
          {errors.general && (
            <Text style={styles.generalError}>{errors.general}</Text>
          )}

          <CustomInput
            label={t("auth.email")}
            placeholder={t("auth.enterEmail")}
            value={email}
            onChangeText={handleEmailChange}
            icon="mail-outline"
            keyboardType="email-address"
            editable={!isLoading}
            error={errors.email}
          />

          <CustomButton
            text={
              isLoading
                ? t("forgotPassword.sending")
                : t("forgotPassword.sendLink")
            }
            onPress={handleSendResetEmail}
            variant="primary"
            disabled={isLoading}
            fullWidth
            style={styles.sendButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t("forgotPassword.rememberPassword")}{" "}
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.reset({ index: 0, routes: [{ name: "Login" }] })
              }
              disabled={isLoading}
            >
              <Text style={styles.linkText}>{t("auth.signIn")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  logoLeft: {
    alignItems: "flex-start",
  },
  textContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    ...typography.bold.large,
    fontSize: 32,
    marginBottom: 8,
    color: colors.white,
    textAlign: "left",
  },
  subtitle: {
    ...typography.regular.large,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "left",
    lineHeight: 22,
  },
  modalCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  generalError: {
    color: colors.error,
    marginBottom: 16,
    textAlign: "center",
    ...typography.regular.small,
    backgroundColor: colors.errorLight || "#ffebee",
    padding: 12,
    borderRadius: 8,
  },
  sendButton: {
    marginTop: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    color: colors.textSec,
    ...typography.regular.medium,
  },
  linkText: {
    color: colors.primary,
    ...typography.semibold.medium,
  },
});
