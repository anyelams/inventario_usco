/**
 * navigation/TabsNavigator.jsx
 * Navegador de tabs inferior con tres pestañas:
 * Inicio (Home), Notificaciones y Perfil.
 * Los íconos cambian entre sólido y outline según el tab activo.
 */
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import "react-native-gesture-handler";
import NotificationsScreen from "../app/(tabs)/notifications";
import ProfileScreen from "../app/(tabs)/profile";
import HomeScreen from "../app/(tabs)/home";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textSec,
        tabBarLabelStyle: {
          ...typography.medium.small,
        },
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: colors.white,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          ...Platform.select({
            ios: { position: "absolute" },
            default: {},
          }),
        },
      }}
      initialRouteName="Home"
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "Notificaciones",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
