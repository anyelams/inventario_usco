/**
 * app/reports/reporteOrdencompra.jsx
 * Pantalla del reporte de orden de compra. Actualmente en construcción.
 */
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import UnderConstruction from "../../components/UnderConstruction";
import { colors } from "../../config/theme";

export default function OrdenCompraReporte() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <Header title="Reporte de Orden de Compra" />
      <UnderConstruction />
    </SafeAreaView>
  );
}
