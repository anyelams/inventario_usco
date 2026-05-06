// components/DeviceCard.jsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";
import DeviceItem from "./DeviceItem";

/**
 * Contenedor de dispositivos IoT controlables
 * Muestra una cuadrícula de dispositivos con sus estados actuales
 *
 * @param {Object} props
 * @param {Array} props.devices - Array de dispositivos [{type, name, icon}]
 * @param {Object} props.deviceStates - Estados actuales de dispositivos {type: boolean}
 * @param {Function} props.onToggleDevice - Callback para alternar estado de dispositivo
 * @param {boolean} props.connected - Estado de conexión MQTT (deshabilita controles si es false)
 */
const DeviceCard = ({ devices, deviceStates, onToggleDevice, connected }) => {
  return (
    <View style={styles.container}>
      <View style={styles.devicesGrid}>
        {devices.map((device) => (
          <DeviceItem
            key={device.type}
            device={device}
            isOn={deviceStates[device.type] || false}
            onToggle={onToggleDevice}
            connected={connected}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    ...typography.semibold.large,
    color: colors.text,
    marginBottom: 16,
  },
  devicesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
});

export default DeviceCard;
