// app/(auth)/EmailVerificationSent.jsx
import { useNavigation } from "@react-navigation/native";
import { Image, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Pantalla de confirmación de envío de email de verificación
 */
export default function EmailVerificationSent() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo posicionado en la parte superior */}
      <View style={[styles.logoContainer, { marginTop: insets.top + 10 }]}>
        <Image
          source={require("../../assets/images/logo_light.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Imagen ilustrativa de email enviado */}
      <Image
        source={require("../../assets/images/emailsent.png")}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Título principal */}
      <Text style={styles.title}>{t("emailVerification.title")}</Text>

      {/* Descripción explicativa */}
      <Text style={styles.description}>
        {t("emailVerification.description")}
      </Text>

      {/* Footer con botón de acción */}
      <View style={styles.footer}>
        <CustomButton
          text={t("emailVerification.backToLogin")}
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: "Login" }] })
          }
          variant="primary"
          width="95%"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  logoContainer: {
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  logo: {
    width: 140,
    height: 140,
  },

  image: {
    width: 260,
    height: 260,
    marginTop: 80,
    marginBottom: 60,
  },

  title: {
    ...typography.bold.big,
    fontSize: 22,
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },

  description: {
    ...typography.regular.regular,
    fontSize: 15,
    color: colors.textSec,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 12,
    lineHeight: 22,
  },

  footer: {
    marginTop: 32,
    width: "100%",
    alignItems: "center",
  },
});
