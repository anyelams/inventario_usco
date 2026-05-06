/**
 * app/iot/temperature.jsx
 * Pantalla de monitoreo de temperatura y humedad en tiempo real.
 * Recibe datos vía MQTT (hook useMQTT) y los acumula en un gráfico
 * de línea que muestra los últimos 10 puntos de lectura.
 */
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useMQTT } from "../../hooks/useMQTT";

const screenWidth = Dimensions.get("window").width;
const maxPoints = 10;

/**
 * Pantalla de temperatura y humedad con gráfico de línea en tiempo real.
 * Acumula hasta 10 lecturas (maxPoints) y descarta las más antiguas con shift().
 */
export default function Temperature() {
  const { temperature, humidity, lastUpdateTime } = useMQTT();
  const navigation = useNavigation();

  const [temperatures, setTemperatures] = useState([]);
  const [labels, setLabels] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("Diario");

  /**
   * Agrega cada nueva lectura de temperatura al historial y su etiqueta de hora.
   * Mantiene el array en máximo maxPoints entradas usando shift() al superar el límite.
   */
  useEffect(() => {
    if (temperature === null || isNaN(temperature)) return;

    const now = new Date();
    const timeLabel = now
      .toLocaleTimeString("es-CO", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace("a. m.", "am")
      .replace("p. m.", "pm");

    setTemperatures((prev) => {
      const updated = [...prev, parseFloat(temperature)];
      if (updated.length > maxPoints) updated.shift();
      return updated;
    });

    setLabels((prev) => {
      const updated = [...prev, timeLabel];
      if (updated.length > maxPoints) updated.shift();
      return updated;
    });

    setCurrentTime(timeLabel);
  }, [temperature]);

  // El gráfico requiere al menos 2 puntos finitos para renderizarse correctamente
  const isValidData =
    temperatures.length >= 2 && temperatures.every((n) => isFinite(n));

  // Solo muestra etiquetas en el primer, medio y último punto para evitar solapamiento
  const spacedLabels = labels.map((label, index) => {
    const lastIndex = labels.length - 1;
    if (
      index === 0 ||
      index === Math.floor(lastIndex / 2) ||
      index === lastIndex
    ) {
      return label;
    }
    return "";
  });

  const periods = ["Diario", "Semanal", "Mensual"];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header
        title="Temperatura"
        description="Datos de temperatura en tiempo real"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Selector de intervalo de tiempo */}
        <View style={styles.periodContainer}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === period && styles.periodTextActive,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gráfica */}
        <View style={styles.chartContainer}>
          {isValidData ? (
            <LineChart
              data={{
                labels: spacedLabels,
                datasets: [
                  {
                    data: temperatures,
                    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                    strokeWidth: 3,
                  },
                ],
              }}
              width={screenWidth - 48}
              height={280}
              yAxisSuffix="°C"
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              chartConfig={{
                backgroundColor: "transparent",
                backgroundGradientFrom: "#f8f9fa",
                backgroundGradientTo: "#f8f9fa",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(128, 128, 128, ${opacity})`,
                style: {
                  borderRadius: 0,
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#4a90e2",
                  fill: "#4a90e2",
                },
                propsForBackgroundLines: {
                  strokeDasharray: "",
                  stroke: "#e0e0e0",
                  strokeWidth: 1,
                },
                fillShadowGradient: "#4a90e2",
                fillShadowGradientOpacity: 0.1,
              }}
              bezier
              style={styles.chart}
              withShadow={false}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Esperando datos...</Text>
            </View>
          )}
        </View>

        {/* Cards de temperatura y humedad */}
        <View style={styles.dataContainer}>
          <View style={styles.dataCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🌡️</Text>
            </View>
            <Text style={styles.dataValue}>
              {temperature !== null ? `${temperature}°C` : "--"}
            </Text>
            <Text style={styles.dataLabel}>Temperatura</Text>
          </View>

          <View style={styles.dataCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>💧</Text>
            </View>
            <Text style={styles.dataValue}>
              {humidity !== null ? `${humidity}%` : "--"}
            </Text>
            <Text style={styles.dataLabel}>Humedad</Text>
          </View>
        </View>

        {lastUpdateTime && (
          <Text style={styles.lastUpdate}>
            Última actualización: {lastUpdateTime.toLocaleTimeString()}
          </Text>
        )}
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
  periodContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#4a90e2",
  },
  periodButtonActive: {
    backgroundColor: "#4a90e2",
  },
  periodText: {
    ...typography.medium.regular,
    color: "#4a90e2",
  },
  periodTextActive: {
    color: colors.white,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  loadingContainer: {
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    width: screenWidth - 48,
  },
  loadingText: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  dataContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dataCard: {
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.border + "20",
    borderColor: colors.border,
    borderWidth: 1,
    width: "48%",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: 12,
  },
  icon: {
    fontSize: 30,
  },
  dataValue: {
    ...typography.semibold.big,
    color: colors.text,
    marginBottom: 4,
  },
  dataLabel: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  lastUpdate: {
    textAlign: "center",
    marginTop: 20,
    ...typography.regular.regular,
    color: colors.textSec,
  },
});
