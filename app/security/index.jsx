/**
 * app/security/index.jsx
 * Pantalla del módulo de seguridad. Actualmente en construcción.
 */
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import UnderConstruction from "../../components/UnderConstruction";
import { colors } from "../../config/theme";

export default function SecurityScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <Header title="Módulo Seguridad" />
      <UnderConstruction />
    </SafeAreaView>
  );
}
