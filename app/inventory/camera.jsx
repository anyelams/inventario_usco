import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import * as ImageManipulator from "expo-image-manipulator";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { setScanResult } from "./scanResult";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import Header from "../../components/Header";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useLanguage } from "../../context/LanguageContext";

const { API_CAMARA_URL, API_CODE_PATH } = Constants.expoConfig.extra;

/**
 * Pantalla de escáner de códigos QR y códigos de barras con detección en tiempo real
 *
 * Funcionalidades principales:
 * - Escaneo en tiempo real con detecciones visuales
 * - Captura de fotos para análisis detallado
 * - Manejo de permisos de cámara con UI informativa
 * - Conversión de coordenadas para overlay de detecciones
 * - Integración con API externa para procesamiento de imágenes
 */
export default function CameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("back");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [autoFocusPoint, setAutoFocusPoint] = useState({ x: 0.5, y: 0.5 });
  const [liveDetections, setLiveDetections] = useState([]);
  const [photoDetections, setPhotoDetections] = useState([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [imageLayout, setImageLayout] = useState({ width: 640, height: 480 });
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [codigoPendiente, setCodigoPendiente] = useState(null);

  const fromInventario = route.params?.fromInventario === true;

  const cameraRef = useRef(null);
  const liveIntervalRef = useRef(null);

  const flipCamera = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
    setTorchEnabled(false);
    setAutoFocusPoint({ x: 0.5, y: 0.5 });
    setLiveDetections([]);
    setPhotoDetections([]);
  };

  const handleFocus = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    if (cameraLayout.width && cameraLayout.height) {
      setAutoFocusPoint({
        x: locationX / cameraLayout.width,
        y: locationY / cameraLayout.height,
      });
      setPhotoDetections([]);
    }
  };

  /**
   * Convierte coordenadas de bounding box de la imagen a coordenadas de pantalla
   * Versión simplificada y precisa
   */
  const convertBoundingBox = (bbox) => {
    const camAR = cameraLayout.width / cameraLayout.height;
    const imgAR = imageLayout.width / imageLayout.height;

    let scaleX,
      scaleY,
      offX = 0,
      offY = 0;

    if (camAR > imgAR) {
      scaleY = cameraLayout.height / imageLayout.height;
      scaleX = scaleY;
      offX = (cameraLayout.width - imageLayout.width * scaleX) / 2;
    } else {
      scaleX = cameraLayout.width / imageLayout.width;
      scaleY = scaleX;
      offY = (cameraLayout.height - imageLayout.height * scaleY) / 2;
    }

    // Escalar el bounding box (1.0 = tamaño original, 1.2 = 20% más grande)
    const SCALE_FACTOR = 1.15; // Prueba con 1.1, 1.15, 1.2, etc.

    const centerX = (bbox.x1 + bbox.x2) / 2;
    const centerY = (bbox.y1 + bbox.y2) / 2;
    const width = bbox.x2 - bbox.x1;
    const height = bbox.y2 - bbox.y1;

    const scaledWidth = width * SCALE_FACTOR;
    const scaledHeight = height * SCALE_FACTOR;

    return {
      x1: (centerX - scaledWidth / 2) * scaleX + offX,
      y1: (centerY - scaledHeight / 2) * scaleY + offY,
      x2: (centerX + scaledWidth / 2) * scaleX + offX,
      y2: (centerY + scaledHeight / 2) * scaleY + offY,
    };
  };

  /**
   * Procesa frame de la cámara para detección en tiempo real
   * Toma una foto de baja calidad, la redimensiona y envía a la API
   * Se ejecuta cada segundo mientras la cámara está activa
   */
  const processLiveFrame = async () => {
    if (!cameraRef.current || !isCameraReady) return;
    setPhotoDetections([]);
    try {
      const snap = await cameraRef.current.takePictureAsync({
        quality: 0,
        base64: false,
        skipProcessing: true,
        shutterSound: false,
      });

      const resized = await ImageManipulator.manipulateAsync(
        snap.uri,
        [{ resize: { width: 640 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );

      setImageLayout({ width: resized.width, height: resized.height });

      if (resized.base64) {
        const res = await fetch(`${API_CAMARA_URL}${API_CODE_PATH}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({ image_base64: resized.base64 }),
        });

        if (res.ok) {
          const j = await res.json();
          if (j.status === 200 && j.result) {
            setLiveDetections(j.result);
          } else {
            setLiveDetections([]);
          }
        } else {
          setLiveDetections([]);
        }
      }
    } catch (err) {
      console.log("Error live detect:", err);
      setLiveDetections([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isCameraReady) {
        processLiveFrame();
        liveIntervalRef.current = setInterval(processLiveFrame, 1000);
      }
      return () => {
        if (liveIntervalRef.current) {
          clearInterval(liveIntervalRef.current);
          liveIntervalRef.current = null;
        }
        setLiveDetections([]);
        setCodigoPendiente(null);
      };
    }, [isCameraReady]),
  );

  const takePhotoAndScan = async () => {
    if (!cameraRef.current || !isCameraReady || isTakingPhoto) return;
    setIsTakingPhoto(true);
    setPhotoDetections([]);
    try {
      const snap = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        skipProcessing: false,
        shutterSound: false,
      });

      const resized = await ImageManipulator.manipulateAsync(
        snap.uri,
        [{ resize: { width: 640 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );

      setImageLayout({ width: resized.width, height: resized.height });

      if (resized.base64) {
        const res = await fetch(`${API_CAMARA_URL}${API_CODE_PATH}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({ image_base64: resized.base64 }),
        });

        if (res.ok) {
          const j = await res.json();
          if (j.status === 200 && j.result) {
            setPhotoDetections(j.result);
          } else {
            setPhotoDetections([]);
          }
        } else {
          setPhotoDetections([]);
        }
      }
    } catch (err) {
      console.log("Error take photo:", err);
      setPhotoDetections([]);
    } finally {
      setIsTakingPhoto(false);
    }
  };

  useEffect(() => {
    if (!fromInventario) return;
    const todasDetecciones = [...liveDetections, ...photoDetections];
    const primera = todasDetecciones.find((d) => d.data);
    if (primera) {
      setCodigoPendiente(primera.data);
    } else {
      setCodigoPendiente(null);
    }
  }, [liveDetections, photoDetections, fromInventario]);

  const handleConfirmarCodigo = () => {
    if (!codigoPendiente) return;
    setScanResult(codigoPendiente);
    navigation.goBack();
  };

  const renderBoundingBoxes = (detections) =>
    detections.map((det, i) => {
      const b = convertBoundingBox(det.bounding_box);
      return (
        <View
          key={i}
          style={[
            styles.boundingBox,
            {
              left: Math.min(b.x1, b.x2),
              top: Math.min(b.y1, b.y2),
              width: Math.abs(b.x2 - b.x1),
              height: Math.abs(b.y2 - b.y1),
            },
          ]}
        >
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>
              {det.type}: {det.data}
            </Text>
          </View>
        </View>
      );
    });

  const onCameraLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setCameraLayout({ width, height });
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted)
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Header
          title={t("camera.title")}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.permissionContent}>
          <View style={styles.cameraIconContainer}>
            <View style={styles.cameraIconCircle}>
              <Ionicons
                name="camera-outline"
                size={48}
                color={colors.secondary + "80"}
              />
            </View>
          </View>

          <Text style={styles.permissionTitle}>{t("camera.permissionTitle")}</Text>
          <Text style={styles.message}>{t("camera.permissionMessage")}</Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons
                name="qr-code-outline"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>{t("camera.featureQR")}</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="barcode-outline"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>{t("camera.featureBarcode")}</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="flash-outline"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>{t("camera.featureFlash")}</Text>
            </View>
          </View>

          <CustomButton
            text={t("camera.allowButton")}
            onPress={requestPermission}
            variant="primary"
            icon="camera"
            iconPosition="left"
            style={styles.permissionButtonCustom}
          />

          <Text style={styles.privacyText}>{t("camera.privacyText")}</Text>
        </View>
      </SafeAreaView>
    );

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleFocus}>
        <CameraView
          ref={cameraRef}
          facing={facing}
          enableTorch={torchEnabled}
          autoFocus={autoFocusPoint !== null}
          autoFocusPointOfInterest={autoFocusPoint}
          active
          style={styles.camera}
          animateShutter={false}
          onLayout={onCameraLayout}
          onCameraReady={() => setIsCameraReady(true)}
        >
          {/* Botón de regresar en la esquina superior izquierda */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Tabs")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>

          {/* Botón de flash en la esquina superior derecha */}
          <TouchableOpacity
            onPress={() => setTorchEnabled((t) => !t)}
            style={[
              styles.flashButton,
              torchEnabled && { backgroundColor: colors.warning || "#ffe500" },
            ]}
            disabled={!isCameraReady || facing === "front"}
          >
            <Ionicons
              name={torchEnabled ? "flashlight" : "flashlight-outline"}
              size={20}
              color={torchEnabled ? colors.text : colors.white}
            />
          </TouchableOpacity>

          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {!isCameraReady
                ? t("camera.starting")
                : liveDetections.length > 0
                  ? `${t("camera.detectedLive")} ${[
                      ...new Set(liveDetections.map((d) => d.type)),
                    ].join(", ")}`
                  : t("camera.pointToCode")}
            </Text>
          </View>

          <View style={styles.overlay}>
            {renderBoundingBoxes(liveDetections)}
          </View>
          <View style={styles.overlay}>
            {renderBoundingBoxes(photoDetections)}
          </View>

          {fromInventario && codigoPendiente && (
            <TouchableOpacity
              style={styles.confirmarButton}
              onPress={handleConfirmarCodigo}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              <Text style={styles.confirmarButtonText}>
                Usar: {codigoPendiente}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={flipCamera}
              style={styles.iconButton}
              disabled={!isCameraReady}
            >
              <Ionicons name="camera-reverse-outline" size={30} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={takePhotoAndScan}
              style={[
                styles.shutterButton,
                isTakingPhoto && styles.shutterDisabled,
              ]}
              disabled={!isCameraReady || isTakingPhoto}
            >
              {isTakingPhoto ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>
        </CameraView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background || "#fff",
  },
  permissionContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  cameraIconContainer: {
    marginBottom: 32,
  },
  cameraIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary + "20",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.secondary + "80",
    borderStyle: "dashed",
  },
  permissionTitle: {
    ...typography.bold.big,
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    ...typography.regular.large,
    textAlign: "center",
    color: colors.textSec,
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresList: {
    marginBottom: 40,
    alignSelf: "stretch",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  featureText: {
    ...typography.medium.medium,
    marginLeft: 12,
    color: colors.text,
  },
  permissionButtonCustom: {
    marginBottom: 24,
    width: "100%",
  },
  privacyText: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 24,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  flashButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  boundingBox: {
    position: "absolute",
    borderWidth: 3,
    borderColor: colors.success,
    backgroundColor: `${colors.success}15`,
    borderRadius: 8,
  },
  labelContainer: {
    position: "absolute",
    top: -28,
    left: 0,
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  labelText: {
    ...typography.semibold.small,
    color: colors.white,
    fontSize: 12,
  },
  confirmarButton: {
    position: "absolute",
    bottom: 130,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.success,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  confirmarButtonText: {
    ...typography.semibold.regular,
    color: colors.white,
    maxWidth: 220,
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  iconButton: {
    width: 70,
    height: 70,
    backgroundColor: colors.white,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shutterInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
  },
  shutterDisabled: {
    opacity: 0.6,
  },
  statusContainer: {
    position: "absolute",
    top: 110,
    left: 24,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 3,
  },
  statusText: {
    ...typography.semibold.regular,
    color: colors.white,
  },
  placeholder: {
    width: 70,
  },
});
