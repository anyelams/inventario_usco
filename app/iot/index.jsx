// app/iot/index.jsx
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DeviceCard from "../../components/DeviceCard";
import Header from "../../components/Header";
import InfoCard from "../../components/InfoCard";
import StatusCard from "../../components/StatusCard";
import TankLevelCard from "../../components/TankLevelCard";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";
import { useMQTT } from "../../hooks/useMQTT";

const API_IOT_NOTIFICATIONS = Constants.expoConfig.extra;

/**
 * Panel principal del módulo IoT
 *
 * Funcionalidades:
 * - Monitoreo en tiempo real de temperatura y humedad
 * - Control remoto de dispositivos (bombillo, ventilador)
 * - Monitoreo de nivel de tanque mediante sensor ultrasónico
 * - Conexión MQTT para comunicación bidireccional
 * - Registro de tokens para notificaciones push
 *
 * @component
 */
export default function IotScreen() {
  const navigation = useNavigation();
  const { username } = useSession();

  const {
    connected,
    temperature,
    humidity,
    toggleDevice,
    connect,
    isConnecting,
    lastMessage,
  } = useMQTT();

  const [lightState, setLightState] = useState(false);
  const [fanState, setFanState] = useState(false);
  const [nivel, setNivel] = useState(0);
  const [distanciaUltrasonico, setDistanciaUltrasonico] = useState(0);

  /**
   * Altura total del tanque en centímetros
   * Usado para calcular el porcentaje de nivel de agua
   */
  const ALTURA_TANQUE_CM = 100;

  // Configuración de dispositivos dinámicos
  const devices = [
    { type: "bombillo", name: "Bombillo", icon: "bulb-outline" },
    { type: "ventilador", name: "Ventilador", icon: "fan" },
  ];

  const deviceStates = {
    bombillo: lightState,
    ventilador: fanState,
  };

  /**
   * Procesa mensajes del sensor ultrasónico y calcula el nivel del tanque
   * El nivel se calcula como porcentaje basado en la distancia medida
   *
   * @listens sensor/agua/ultrasonico - Topic MQTT del sensor ultrasónico
   */
  useEffect(() => {
    if (lastMessage?.topic === "sensor/agua/ultrasonico") {
      console.log("Sensor Ultrasónico - Mensaje recibido:", {
        topic: lastMessage.topic,
        message: lastMessage.message,
        timestamp: new Date().toLocaleTimeString(),
      });

      const distancia = parseFloat(lastMessage.message);
      if (!isNaN(distancia)) {
        console.log("Distancia detectada:", distancia, "cm");
        setDistanciaUltrasonico(distancia);

        // Calcular nivel como porcentaje (0-100%)
        const nivelCalculado = Math.max(
          0,
          Math.min(100, (distancia / ALTURA_TANQUE_CM) * 100),
        );

        setNivel(nivelCalculado);
      }
    }
  }, [lastMessage]);

  /**
   * Registra el token de notificaciones push del dispositivo
   * Se ejecuta cuando el usuario está autenticado y en un dispositivo físico
   *
   * @requires Device.isDevice - Solo ejecuta en dispositivos físicos
   * @requires username - Usuario debe estar autenticado
   */
  useEffect(() => {
    const registerPushToken = async () => {
      if (!Device.isDevice || !username) {
        console.warn("Dispositivo no válido o username no disponible");
        return;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (finalStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") return;

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Expo Push Token:", token);

      try {
        await fetch(`${API_IOT_NOTIFICATIONS}/api/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: username,
            token,
          }),
        });
      } catch (error) {
        console.error("Error enviando token al backend:", error);
      }
    };

    registerPushToken();
  }, [username]);

  /**
   * Alterna el estado de un dispositivo IoT
   * Actualiza el estado local y envía comando MQTT al dispositivo
   *
   * @param {string} type - Tipo de dispositivo ('bombillo' | 'ventilador')
   */
  const handleToggleDevice = async (type) => {
    if (type === "bombillo") {
      const newState = !lightState;
      setLightState(newState);
      await toggleDevice("sensor/bombillo", newState ? "on" : "off");
    } else if (type === "ventilador") {
      const newState = !fanState;
      setFanState(newState);
      await toggleDevice("sensor/ventilador", newState ? "on" : "off");
    }
  };

  const handleReconnect = async () => {
    if (!connected && !isConnecting) {
      await connect();
    }
  };

  const handleInfoPress = () => {
    navigation.navigate("IotTemperature");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Panel IoT"
        onBackPress={() => navigation.navigate("Tabs")}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StatusCard
          connected={connected}
          isConnecting={isConnecting}
          onReconnect={handleReconnect}
        />
        <Text style={styles.sectionTitle}>Información</Text>
        <InfoCard
          temperature={temperature}
          humidity={humidity}
          onPress={handleInfoPress}
        />
        <Text style={styles.sectionTitle}>Dispositivos</Text>
        <DeviceCard
          devices={devices}
          deviceStates={deviceStates}
          onToggleDevice={handleToggleDevice}
          connected={connected}
        />

        <TankLevelCard
          nivel={nivel}
          distanciaUltrasonico={distanciaUltrasonico}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 12,
  },
});
