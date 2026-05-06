/**
 * app/reports/reporteFactura.jsx
 * Pantalla del reporte de factura. Actualmente en construcción.
 */
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import UnderConstruction from "../../components/UnderConstruction";
import { colors } from "../../config/theme";

export default function FacturaReporte() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <Header title="Reporte de Factura" />
      <UnderConstruction />
    </SafeAreaView>
  );
}
