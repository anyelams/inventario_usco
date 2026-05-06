/**
 * index.js
 * Punto de entrada de la aplicación Expo.
 * Registra AppNavigator como componente raíz.
 */
import { registerRootComponent } from "expo";
import AppNavigator from "./navigation/AppNavigator";

registerRootComponent(AppNavigator);
