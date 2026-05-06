// app/profile/changePassword.jsx
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import Header from "../../components/Header";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";

const { API_URL } = Constants.expoConfig.extra;

/**
 * Evalúa la fortaleza de la contraseña y retorna feedback
 */
const getPasswordStrength = (password) => {
  let score = 0;
  let feedback = [];

  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  Object.entries(requirements).forEach(([key, passed]) => {
    if (passed) {
      score += 1;
    } else {
      const labels = {
        length: "8+ caracteres",
        uppercase: "mayúscula",
        number: "número",
        special: "carácter especial",
      };
      feedback.push(labels[key]);
    }
  });

  const isValid = score === 4;
  const message = isValid
    ? "¡Contraseña segura!"
    : `Falta: ${feedback.join(", ")}`;

  return { score, message, isValid, requirements };
};

/**
 * Pantalla para cambiar la contraseña del usuario
 */
export default function ChangePassword() {
  const navigation = useNavigation();
  const { token } = useSession();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }

    if (field === "newPassword") {
      const strength = getPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.oldPassword.trim()) {
      newErrors.oldPassword = "Ingresa tu contraseña actual";
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "Ingresa una nueva contraseña";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Mínimo 8 caracteres";
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = "Debe incluir una mayúscula";
    } else if (!/[0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = "Debe incluir un número";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)) {
      newErrors.newPassword = "Debe incluir un carácter especial";
    }

    if (
      formData.oldPassword &&
      formData.newPassword &&
      formData.oldPassword === formData.newPassword
    ) {
      newErrors.newPassword = "La nueva contraseña debe ser diferente";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (loading) return;

    if (!validateForm()) return;

    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/auth/change-password`,
        {
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Alert.alert(
        "¡Contraseña actualizada!",
        "Tu contraseña ha sido cambiada exitosamente.",
        [
          {
            text: "Entendido",
            onPress: () => {
              setTimeout(() => {
                navigation.goBack();
              }, 100);
            },
          },
        ],
      );

      setFormData({ oldPassword: "", newPassword: "" });
      setPasswordStrength(null);
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);

      let errorMessage = "No se pudo cambiar la contraseña";

      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = error.response.data?.message || "Datos inválidos";
            break;
          case 401:
            errorMessage = "La contraseña actual es incorrecta";
            break;
          case 500:
            errorMessage = "Error del servidor. Intenta más tarde";
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = "Error de conexión. Verifica tu internet";
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Cambiar contraseña"
        description="Actualiza tu contraseña de forma segura"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Error general */}
          {errors.general && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Contraseña actual */}
            <CustomInput
              label="Contraseña actual"
              placeholder="Ingresa tu contraseña actual"
              value={formData.oldPassword}
              onChangeText={(value) => handleInputChange("oldPassword", value)}
              icon="lock-closed-outline"
              secureTextEntry={true}
              showPasswordToggle={true}
              editable={!loading}
              error={errors.oldPassword}
              style={styles.inputSpacing}
            />

            {/* Nueva contraseña */}
            <CustomInput
              label="Nueva contraseña"
              placeholder="Ingresa tu nueva contraseña"
              value={formData.newPassword}
              onChangeText={(value) => handleInputChange("newPassword", value)}
              icon="lock-closed-outline"
              secureTextEntry={true}
              showPasswordToggle={true}
              editable={!loading}
              error={errors.newPassword}
              style={styles.inputSpacing}
            />

            {/* Indicador de fortaleza de contraseña */}
            {formData.newPassword !== "" && passwordStrength && (
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

            {/* Botón de actualizar */}
            <CustomButton
              text={loading ? "Actualizando..." : "Actualizar contraseña"}
              onPress={handleChangePassword}
              variant="primary"
              icon={!loading ? "checkmark-circle" : null}
              disabled={loading}
              fullWidth
              style={styles.updateButton}
            />
          </View>

          {/* Consejos de seguridad */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Consejos de seguridad</Text>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />
              <Text style={styles.tipText}>
                Usa una combinación de letras, números y símbolos
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorLight || "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  errorText: {
    ...typography.regular.regular,
    color: colors.error,
    flex: 1,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputSpacing: {
    marginBottom: 24,
  },
  passwordStrengthContainer: {
    marginTop: -12,
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
  updateButton: {
    marginTop: 20,
  },
  tipsContainer: {
    backgroundColor: colors.base,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsTitle: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  tipText: {
    ...typography.regular.regular,
    color: colors.textSec,
    flex: 1,
    lineHeight: 20,
  },
});
