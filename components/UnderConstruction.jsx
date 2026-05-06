// components/UnderConstruction.jsx
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";
import CustomButton from "./CustomButton";

/**
 * Componente para mostrar pantallas en desarrollo
 * @param {Object} props
 * @param {string} [props.customTitle="En Construcción"] - Título personalizable
 */
const UnderConstruction = ({ customTitle = "En Construcción" }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require("../assets/images/notfound.png")}
          style={styles.constructionImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{customTitle}</Text>
        <Text style={styles.subtitle}>
          Muy pronto podrás acceder a todas las funciones de este módulo.
        </Text>
      </View>

      <CustomButton
        text="Volver al Inicio"
        icon="home"
        iconPosition="left"
        onPress={() => navigation.navigate("Tabs")}
        variant="primary"
        style={styles.backHomeButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: colors.white,
  },
  imageContainer: {
    marginBottom: 40,
  },
  constructionImage: {
    width: 280,
    height: 200,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    ...typography.bold.big,
    fontSize: 28,
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    ...typography.regular.large,
    color: colors.textSec,
    textAlign: "center",
  },
  backHomeButton: {
    marginTop: 10,
  },
});

export default UnderConstruction;
