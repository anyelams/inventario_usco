/**
 * navigation/MainNavigator.jsx
 * Stack de navegación principal para usuarios autenticados.
 * Contiene el TabsNavigator como pantalla raíz y todas las pantallas
 * de módulos: Inventario, IoT, Reportes, Seguridad y Perfil.
 */
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CameraScreen from "../app/inventory/camera";
import IotScreen from "../app/iot/index";
import IotTemperatureScreen from "../app/iot/temperature";
import ChangePasswordScreen from "../app/profile/changePassword";
import ReportsScreen from "../app/reports/index";
import ReporteFacturaScreen from "../app/reports/reporteFactura";
import ReporteKardexScreen from "../app/reports/reporteKardex";
import ReporteOrdencompraScreen from "../app/reports/reporteOrdencompra";
import ReportePedidoScreen from "../app/reports/reportePedido";
import ReporteProductosVencidosScreen from "../app/reports/reporteProductosVencidos";
import SecurityScreen from "../app/security/index";
import TabsNavigator from "./TabsNavigator";

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Iot" component={IotScreen} />
      <Stack.Screen name="IotTemperature" component={IotTemperatureScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="ReporteFactura" component={ReporteFacturaScreen} />
      <Stack.Screen name="ReporteKardex" component={ReporteKardexScreen} />
      <Stack.Screen name="ReporteOrdencompra" component={ReporteOrdencompraScreen} />
      <Stack.Screen name="ReportePedido" component={ReportePedidoScreen} />
      <Stack.Screen name="ReporteProductosVencidos" component={ReporteProductosVencidosScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
    </Stack.Navigator>
  );
}
