/**
 * navigation/AppNavigator.jsx
 * Navegador raíz de la aplicación. Envuelve la app con LanguageProvider
 * y SessionProvider, carga las fuentes Roboto y decide si mostrar
 * el flujo de autenticación (AuthNavigator) o el área principal (MainNavigator)
 * según el estado del token de sesión.
 */
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { LogBox } from "react-native";
import { LanguageProvider } from "../context/LanguageContext";
import { SessionProvider, useSession } from "../context/SessionContext";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

/**
 * Navegador interno que decide entre AuthNavigator y MainNavigator
 * según si el token existe y es válido. También carga las fuentes
 * y oculta el SplashScreen cuando están listas.
 */
function RootNavigator() {
  const { token, tokenEsValido } = useSession();
  const isAuthenticated = !!token && tokenEsValido();

  const [fontsLoaded] = useFonts({
    RobotoBold: require("../assets/fonts/Roboto-Bold.ttf"),
    RobotoSemiBold: require("../assets/fonts/Roboto-SemiBold.ttf"),
    RobotoMedium: require("../assets/fonts/Roboto-Medium.ttf"),
    RobotoRegular: require("../assets/fonts/Roboto-Regular.ttf"),
    RobotoLight: require("../assets/fonts/Roboto-Light.ttf"),
    ...AntDesign.font,
    ...Ionicons.font,
    ...Feather.font,
    ...MaterialIcons.font,
  });

  useEffect(() => {
    LogBox.ignoreLogs([
      "Support for defaultProps will be removed from function components in a future major release",
      "Expected newLocale to be a string",
    ]);
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
      <StatusBar style="dark" translucent={true} />
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return (
    <LanguageProvider>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </LanguageProvider>
  );
}
