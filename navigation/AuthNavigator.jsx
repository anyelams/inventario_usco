/**
 * navigation/AuthNavigator.jsx
 * Stack de navegación para el flujo de autenticación.
 * Pantallas: Login → ForgotPassword → EmailVerification.
 */
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EmailVerificationScreen from "../app/(auth)/emailVerification";
import ForgotPasswordScreen from "../app/(auth)/forgotPassword";
import LoginScreen from "../app/(auth)/index";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { marginHorizontal: 0, paddingHorizontal: 0 },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
    </Stack.Navigator>
  );
}
