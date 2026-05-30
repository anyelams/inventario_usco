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
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationsContext";

const { API_URL } = Constants.expoConfig.extra;

/**
 * Pantalla para cambiar la contraseña del usuario
 */
export default function ChangePassword() {
  const navigation = useNavigation();
  const { token } = useSession();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.oldPassword.trim()) {
      newErrors.oldPassword = t("changePassword.errorCurrentRequired");
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = t("changePassword.errorNewRequired");
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t("changePassword.errorMinLength");
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = t("changePassword.errorNeedsUppercase");
    } else if (!/[0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = t("changePassword.errorNeedsNumber");
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)) {
      newErrors.newPassword = t("changePassword.errorNeedsSpecial");
    }

    if (
      formData.oldPassword &&
      formData.newPassword &&
      formData.oldPassword === formData.newPassword
    ) {
      newErrors.newPassword = t("changePassword.errorMustBeDifferent");
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

      addNotification(
        t("notifications.passwordChangedTitle"),
        t("notifications.passwordChangedMessage"),
      );

      Alert.alert(
        t("changePassword.successTitle"),
        t("changePassword.successMessage"),
        [
          {
            text: t("success.understood"),
            onPress: () => {
              setTimeout(() => {
                navigation.goBack();
              }, 100);
            },
          },
        ],
      );

      setFormData({ oldPassword: "", newPassword: "" });
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);

      let errorMessage = t("changePassword.errorGeneric");

      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = error.response.data?.message || t("errors.invalidData");
            break;
          case 401:
            errorMessage = t("changePassword.errorWrongCurrent");
            break;
          case 500:
            errorMessage = t("changePassword.errorServer");
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = t("changePassword.errorNetwork");
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t("changePassword.title")}
        description={t("changePassword.description")}
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
              label={t("changePassword.currentPassword")}
              placeholder={t("changePassword.currentPasswordPlaceholder")}
              value={formData.oldPassword}
              onChangeText={(value) => handleInputChange("oldPassword", value)}
              icon="lock-closed-outline"
              secureTextEntry={true}
              showPasswordToggle={true}
              editable={!loading}
              error={errors.oldPassword}
              style={styles.inputSpacingLg}
            />

            {/* Nueva contraseña */}
            <CustomInput
              label={t("changePassword.newPassword")}
              placeholder={t("changePassword.newPasswordPlaceholder")}
              value={formData.newPassword}
              onChangeText={(value) => handleInputChange("newPassword", value)}
              icon="lock-closed-outline"
              secureTextEntry={true}
              showPasswordToggle={true}
              editable={!loading}
              error={errors.newPassword}
              style={styles.inputSpacing}
            />
            <Text style={styles.hint}>{t("changePassword.tipText")}</Text>

            {/* Botón de actualizar */}
            <CustomButton
              text={loading ? t("changePassword.updating") : t("changePassword.updateButton")}
              onPress={handleChangePassword}
              variant="primary"
              icon={!loading ? "checkmark-circle" : null}
              disabled={loading}
              fullWidth
              style={styles.updateButton}
            />
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
    marginBottom: 12,
  },
  inputSpacingLg: {
    marginBottom: 24,
  },
  hint: {
    ...typography.regular.small,
    color: colors.textSec,
    marginBottom: 24,
    lineHeight: 18,
  },
  updateButton: {
    marginTop: 14,
  },
});
