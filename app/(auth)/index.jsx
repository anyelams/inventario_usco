/**
 * app/(auth)/index.jsx
 * Pantalla principal de autenticación con tabs de Login y Registro.
 * Maneja inicio de sesión, registro de nuevos usuarios, persistencia
 * del último email y configuración de notificaciones push tras login.
 */
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import backgroundImage from "../../assets/images/background.png";
import googleIcon from "../../assets/images/google.png";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import LanguageSheet from "../../components/LanguageSheet";
import Logo from "../../components/Logo";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useLanguage } from "../../context/LanguageContext";
import { useSession } from "../../context/SessionContext";
import {
  getPasswordStrength,
  validateRegisterForm,
} from "../../utils/validation";

const {
  API_URL,
  API_URL_LOGIN,
  API_URL_REGISTER,
  API_URL_NOTIFICATIONS_TOKEN,
  eas,
} = Constants.expoConfig.extra;
const projectId = eas?.projectId;
const LAST_EMAIL_KEY = "@last_login_email";

/**
 * Pantalla de autenticación principal con tabs Login / Registro.
 * Carga automáticamente el último email guardado y configura
 * notificaciones push al iniciar sesión correctamente.
 */
export default function AuthIndexScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t, currentLanguage, changeLanguage, availableLanguages } =
    useLanguage();

  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [errors, setErrors] = useState({});

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);

  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
  });
  const [passwordStrength, setPasswordStrength] = useState(null);

  const { setUsername, guardarSesionCompleta } = useSession();

  useEffect(() => {
    loadSavedEmail();
  }, []);

  /** Recupera el último email guardado en AsyncStorage al montar la pantalla. */
  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(LAST_EMAIL_KEY);
      if (savedEmail) {
        setCorreo(savedEmail);
        setRememberEmail(true);
      } else {
        setRememberEmail(true);
      }
    } catch (error) {
      console.log("Error cargando email guardado:", error);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  /**
   * Persiste el email en AsyncStorage para autocompletar en el próximo inicio.
   * @param {string} email - Email a guardar
   */
  const saveEmail = async (email) => {
    try {
      await AsyncStorage.setItem(LAST_EMAIL_KEY, email);
    } catch (error) {
      console.log("Error guardando email:", error);
    }
  };

  /**
   * Valida el formato del email con expresión regular.
   * @param {string} email - Email a validar
   * @returns {boolean} - true si el formato es válido
   */
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /**
   * Actualiza el estado del email de login y limpia errores relacionados.
   * @param {string} value - Nuevo valor del campo email
   */
  const handleEmailChange = (value) => {
    setCorreo(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  /**
   * Actualiza el estado de la contraseña de login y limpia errores relacionados.
   * @param {string} value - Nuevo valor del campo contraseña
   */
  const handlePasswordChange = (value) => {
    setContrasena(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  /**
   * Actualiza un campo del formulario de registro y calcula la fortaleza
   * de la contraseña si el campo modificado es "password".
   * @param {string} field - Nombre del campo ('email' | 'password')
   * @param {string} value - Nuevo valor del campo
   */
  const handleRegisterInputChange = (field, value) => {
    const newData = { ...registerData, [field]: value };
    setRegisterData(newData);

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }

    if (field === "password") {
      const strength = getPasswordStrength(value, t);
      setPasswordStrength(strength);
    }
  };

  /**
   * Cambia el idioma de la aplicación y cierra el modal de selección.
   * @param {string} language - Código del idioma seleccionado (ej. 'es', 'en')
   */
  const handleLanguageChange = async (language) => {
    await changeLanguage(language);
    setShowLanguageModal(false);
  };

  /**
   * Ejecuta el flujo de inicio de sesión:
   * valida campos, llama al API, guarda la sesión completa y
   * configura notificaciones push. El AppNavigator detecta el token
   * y redirige automáticamente al área principal.
   */
  const handleLogin = async () => {
    if (isLoading) return;

    setErrors({});
    setIsLoading(true);

    if (!correo.trim()) {
      setErrors({ email: t("validation.emailRequired") });
      setIsLoading(false);
      return;
    }

    if (!contrasena.trim()) {
      setErrors({ password: t("validation.passwordRequired") });
      setIsLoading(false);
      return;
    }

    if (!validateEmail(correo)) {
      setErrors({ email: t("validation.emailInvalid") });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}${API_URL_LOGIN}`, {
        username: correo.trim(),
        password: contrasena,
      });

      const { token, empresaId, rolId, rolesByCompany, usuarioEstado } =
        response.data;

      if (!token) {
        setErrors({ general: "Error: No se recibió token del servidor" });
        setIsLoading(false);
        return;
      }

      if (rememberEmail) {
        await saveEmail(correo.trim());
      } else {
        await AsyncStorage.removeItem(LAST_EMAIL_KEY);
      }

      if (usuarioEstado === 2 || usuarioEstado === 3) {
        console.warn(
          "Registro de persona/empresa no implementado en esta versión",
        );
        setIsLoading(false);
        return;
      }

      if (!rolesByCompany || rolesByCompany.length === 0) {
        setErrors({ general: t("errors.noAssociatedCompanies") });
        setIsLoading(false);
        return;
      }

      await setUsername(correo.trim());

      const empresaActual = rolesByCompany.find(
        (empresa) => empresa.empresaId === empresaId && empresa.rolId === rolId,
      );

      if (!empresaActual) {
        console.warn(
          "No se encontró empresa actual, usando primera disponible",
        );
        const primeraEmpresa = rolesByCompany[0];
        await guardarSesionCompleta({
          token,
          empresaId: primeraEmpresa.empresaId,
          rolId: primeraEmpresa.rolId,
          empresaNombre: primeraEmpresa.empresaNombre,
          rolNombre: primeraEmpresa.rolNombre,
          rolesByCompany,
        });
      } else {
        await guardarSesionCompleta({
          token,
          empresaId,
          rolId,
          empresaNombre: empresaActual.empresaNombre,
          rolNombre: empresaActual.rolNombre,
          rolesByCompany,
        });
      }

      await configurarNotificacionesPush(correo.trim());

      // El AppNavigator detecta el token y navega automáticamente a Main
    } catch (err) {
      console.error("Error en login:", err);

      let errorMessage;
      if (err.response?.status === 401) {
        errorMessage = t("errors.loginFailed");
      } else if (err.response?.status === 404) {
        errorMessage = t("errors.accountNotFound");
      } else if (err.response?.status === 400) {
        errorMessage = t("errors.invalidData");
      } else if (
        err.message?.includes("Network Error") ||
        err.code === "NETWORK_ERROR"
      ) {
        errorMessage = t("errors.networkError");
      } else if (err.message?.includes("timeout")) {
        errorMessage = t("errors.connectionTimeout");
      } else {
        errorMessage = t("errors.unknownError");
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Ejecuta el flujo de registro: valida el formulario, llama al API
   * y muestra alerta de éxito redirigiendo al tab de Login.
   */
  const handleRegister = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrors({});

    const validation = validateRegisterForm(registerData, t);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsLoading(false);
      return;
    }

    try {
      const registerUrl = `${API_URL}${API_URL_REGISTER}`;
      const payload = {
        username: registerData.email.trim(),
        password: registerData.password,
      };

      const response = await axios.post(registerUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 30000,
      });

      const data = response.data;

      if (data.success) {
        Alert.alert(
          t("success.registrationComplete"),
          t("success.confirmationEmailSent"),
          [
            {
              text: t("success.understood"),
              onPress: () => {
                setActiveTab("login");
                setRegisterData({ email: "", password: "" });
                setPasswordStrength(null);
              },
            },
          ],
        );
      } else {
        setErrors({
          general: data.message || t("errors.registerFailed"),
        });
      }
    } catch (err) {
      let errorMessage;

      if (err.response) {
        switch (err.response.status) {
          case 400:
            errorMessage =
              err.response.data?.message ||
              err.response.data?.error ||
              t("errors.invalidData");
            break;
          case 409:
            errorMessage = t("errors.emailAlreadyRegistered");
            break;
          case 500:
            errorMessage = t("errors.serverError");
            break;
          default:
            errorMessage =
              err.response.data?.message ||
              err.response.data?.error ||
              t("errors.unknownError");
        }
      } else if (err.code === "ECONNABORTED") {
        errorMessage = t("errors.connectionTimeout");
      } else if (
        err.code === "ERR_NETWORK" ||
        err.message?.includes("Network Error")
      ) {
        errorMessage = t("errors.networkError");
      } else if (err.request) {
        errorMessage = t("errors.noResponse");
      } else {
        errorMessage = t("errors.unknownError");
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Solicita permisos de notificaciones push, obtiene el Expo Push Token
   * y lo registra en el servidor asociado al email del usuario.
   * Solo se ejecuta en dispositivos físicos (no en emuladores).
   * @param {string} userEmail - Email del usuario para asociar el token
   */
  const configurarNotificacionesPush = async (userEmail) => {
    try {
      if (!Device.isDevice) {
        console.log(
          "No es un dispositivo físico, saltando notificaciones push",
        );
        return;
      }

      const Notifications = await import("expo-notifications");

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (finalStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === "granted") {
        const pushToken = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId || "local/FrontendMovil",
          })
        ).data;

        console.log("Token de notificaciones obtenido:", pushToken);

        const notificationEndpoint = `${API_URL}${API_URL_NOTIFICATIONS_TOKEN}`;
        await fetch(notificationEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userEmail,
            token: pushToken,
          }),
        });

        const subscription = Notifications.addNotificationReceivedListener(
          (notification) => {
            console.log("Notificación recibida:", notification);
          },
        );
      } else {
        console.log("Permisos de notificaciones denegados");
      }
    } catch (error) {
      console.error("Error configurando notificaciones push:", error);
    }
  };

  if (isLoadingEmail) {
    return (
      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <View style={[styles.logoContainer, { marginTop: insets.top + 0 }]}>
            <Logo width={150} height={140} variant="dark" />
          </View>
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <View
            style={[styles.headerContainer, { marginTop: insets.top + 10 }]}
          >
            <View style={styles.logoLeft}>
              <Logo width={130} height={110} variant="dark" />
            </View>

            <TouchableOpacity
              style={styles.languageSelector}
              onPress={() => setShowLanguageModal(true)}
              disabled={isLoading}
            >
              <Ionicons
                name="language-outline"
                size={18}
                color={colors.white}
              />
              <Ionicons name="chevron-down" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {t("welcome.title", { appName: "Inventario Usco" })}
            </Text>
            <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>
          </View>

          <View
            style={[styles.modalCard, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "login" && styles.activeTab]}
                onPress={() => {
                  setActiveTab("login");
                  setErrors({});
                }}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "login" && styles.activeTabText,
                  ]}
                >
                  {t("auth.login")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "signup" && styles.activeTab]}
                onPress={() => {
                  setActiveTab("signup");
                  setErrors({});
                }}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "signup" && styles.activeTabText,
                  ]}
                >
                  {t("auth.signUp")}
                </Text>
              </TouchableOpacity>
            </View>

            {errors.general && (
              <Text style={styles.generalError}>{errors.general}</Text>
            )}

            {activeTab === "login" ? (
              <>
                <CustomInput
                  label={t("auth.email")}
                  placeholder={t("auth.enterEmail")}
                  value={correo}
                  onChangeText={handleEmailChange}
                  icon="mail-outline"
                  keyboardType="email-address"
                  editable={!isLoading}
                  error={errors.email}
                />

                <CustomInput
                  label={t("auth.password")}
                  placeholder={t("auth.enterPassword")}
                  value={contrasena}
                  onChangeText={handlePasswordChange}
                  icon="lock-closed-outline"
                  secureTextEntry={true}
                  showPasswordToggle={true}
                  editable={!isLoading}
                  error={errors.password}
                />

                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setRememberEmail(!rememberEmail)}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={rememberEmail ? "checkbox" : "square-outline"}
                      size={18}
                      color={rememberEmail ? colors.primary : colors.textSec}
                    />
                    <Text style={styles.rememberText}>
                      {t("auth.rememberMe")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => navigation.navigate("ForgotPassword")}
                    disabled={isLoading}
                  >
                    <Text style={styles.forgotPasswordText}>
                      {t("auth.forgotPassword")}
                    </Text>
                  </TouchableOpacity>
                </View>

                <CustomButton
                  text={isLoading ? t("auth.loggingIn") : t("auth.login")}
                  onPress={handleLogin}
                  variant="primary"
                  disabled={isLoading}
                  fullWidth
                  style={{ marginTop: 16 }}
                />
              </>
            ) : (
              <>
                <CustomInput
                  label={t("auth.email")}
                  placeholder={t("auth.enterEmail")}
                  value={registerData.email}
                  onChangeText={(value) =>
                    handleRegisterInputChange("email", value)
                  }
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  error={errors.email}
                />

                <CustomInput
                  label={t("auth.password")}
                  placeholder={t("auth.enterPassword")}
                  value={registerData.password}
                  onChangeText={(value) =>
                    handleRegisterInputChange("password", value)
                  }
                  icon="lock-closed-outline"
                  secureTextEntry={true}
                  showPasswordToggle={true}
                  editable={!isLoading}
                  error={errors.password}
                />

                {registerData.password !== "" && passwordStrength && (
                  <View style={styles.passwordStrengthContainer}>
                    <Text
                      style={[
                        styles.passwordStrength,
                        {
                          color: passwordStrength.isValid
                            ? colors.success
                            : colors.secondary,
                        },
                      ]}
                    >
                      {passwordStrength.message}
                    </Text>
                    <View style={styles.strengthBar}>
                      {[1, 2, 3, 4].map((level) => (
                        <View
                          key={level}
                          style={[
                            styles.strengthSegment,
                            {
                              backgroundColor:
                                level <= passwordStrength.score
                                  ? passwordStrength.score >= 3
                                    ? colors.success
                                    : colors.warning
                                  : colors.lightGray,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                )}

                <CustomButton
                  text={isLoading ? t("auth.registering") : t("auth.register")}
                  onPress={handleRegister}
                  variant="primary"
                  disabled={isLoading}
                  fullWidth
                  style={{ marginTop: 16 }}
                />
              </>
            )}

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t("auth.orContinueWith")}</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.googleButton} disabled={isLoading}>
              <Image
                source={googleIcon}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.googleButtonText}>
                {t("auth.continueWithGoogle")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <LanguageSheet
          visible={showLanguageModal}
          onClose={() => setShowLanguageModal(false)}
          languages={availableLanguages}
          currentLanguage={currentLanguage}
          onSelect={handleLanguageChange}
          t={t}
        />
      </ImageBackground>
    </TouchableWithoutFeedback>
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
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
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
  },
  modalCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    backgroundColor: colors.lightGray,
    borderRadius: 14,
    padding: 4,
    height: 50,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: colors.white,
  },
  tabText: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  activeTabText: {
    color: colors.primary,
    ...typography.semibold.medium,
  },
  loadingText: {
    textAlign: "center",
    color: colors.white,
    marginTop: 20,
    ...typography.regular.regular,
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
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rememberText: {
    marginLeft: 6,
    color: colors.text,
    ...typography.regular.medium,
  },
  forgotPasswordText: {
    textAlign: "right",
    ...typography.medium.medium,
    color: colors.primary,
  },
  passwordStrengthContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  passwordStrength: {
    marginBottom: 8,
    ...typography.medium.small,
  },
  strengthBar: {
    flexDirection: "row",
    gap: 4,
    height: 4,
  },
  strengthSegment: {
    flex: 1,
    borderRadius: 2,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: colors.textSec,
    ...typography.regular.small,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    height: 50,
  },
  googleButtonText: {
    ...typography.medium.medium,
    color: colors.text,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
});
