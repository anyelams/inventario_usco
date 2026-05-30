/**
 * app/inventory/inventario-detalle.jsx
 * Pantalla de ejecución de inventario. Muestra la lista de ítems de la
 * subsección, permite marcar cada uno como encontrado (checkbox o escaneo
 * de código), registrar su estado (OK/Incompleto/Dañado) y agregar
 * observaciones. Incluye barra de progreso, búsqueda en tiempo real y
 * finalización del inventario. Precarga resultados anteriores para
 * inventarios en estado Finalizado mediante RESULTADOS_MAP.
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import Constants from "expo-constants";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import Header from "../../components/Header";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationsContext";
import { useSession } from "../../context/SessionContext";
import { clearScanResult, getScanResult } from "./scanResult";

const API_URL = Constants.expoConfig?.extra?.API_URL ?? "";
const API_URL_SUBSECCION_ITEMS =
  Constants.expoConfig?.extra?.API_URL_SUBSECCION_ITEMS ?? "/subsecciones";
const API_URL_INVENTARIO_PROGRESO =
  Constants.expoConfig?.extra?.API_URL_INVENTARIO_PROGRESO ?? "/inventarios";

const ESTADO_ITEM = [
  { value: "ok", labelKey: "inventory.stateOk", color: colors.success, icon: "checkmark-circle" },
  { value: "incompleto", labelKey: "inventory.stateIncomplete", color: colors.warning, icon: "warning" },
  { value: "dañado", labelKey: "inventory.stateDamaged", color: colors.error, icon: "close-circle" },
];

/**
 * Construye la lista de ítems inicial fusionando los datos del mock con los
 * resultados previos del inventario, si existen.
 * @param {Object[]} rawItems - Ítems crudos de la subsección (producto, producto_identificador, cantidad).
 * @param {Object[]|null} resultado - Resultados previos guardados, o null si el inventario es nuevo.
 * @returns {Object[]} Ítems con los campos encontrado, estado y observacion añadidos.
 */
function buildInitialItems(rawItems, resultado = null) {
  return rawItems.map((item) => {
    const res = resultado?.find(
      (r) => r.producto_identificador === item.producto_identificador,
    );
    return {
      ...item,
      encontrado: res?.encontrado ?? false,
      estado: res?.estado ?? "ok",
      observacion: res?.observacion ?? "",
    };
  });
}

/**
 * Fila expandible que representa un ítem del inventario.
 * En estado colapsado muestra checkbox, nombre e identificador del producto.
 * Expandida muestra el selector de estado y el campo de observación.
 * @param {Object} props
 * @param {Object} props.item - Ítem del inventario con encontrado, estado, observacion, producto, producto_identificador y cantidad.
 * @param {function} props.onToggleEncontrado - Callback al marcar/desmarcar el checkbox; recibe producto_identificador.
 * @param {function} props.onEstadoChange - Callback al cambiar el estado; recibe (producto_identificador, estado).
 * @param {function} props.onObservacionChange - Callback al editar la observación; recibe (producto_identificador, texto).
 */
function ItemRow({ item, onToggleEncontrado, onEstadoChange, onObservacionChange, readOnly }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.itemCard, item.encontrado && styles.itemCardFound]}>
      <TouchableOpacity
        style={styles.itemHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <TouchableOpacity
          style={[styles.checkbox, item.encontrado && styles.checkboxChecked, readOnly && styles.checkboxReadOnly]}
          onPress={() => !readOnly && onToggleEncontrado(item.producto_identificador)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={readOnly}
        >
          {item.encontrado && (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          )}
        </TouchableOpacity>

        <View style={styles.itemInfo}>
          <Text style={styles.itemNombre} numberOfLines={2}>{item.producto}</Text>
          <Text style={styles.itemId}>{item.producto_identificador}</Text>
        </View>

        <View style={styles.itemRight}>
          <View style={styles.cantidadBadge}>
            <Text style={styles.cantidadText}>×{item.cantidad}</Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textSec}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.itemExpanded}>
          <Text style={styles.expandedLabel}>{t("inventory.itemState")}</Text>
          <View style={styles.estadoRow}>
            {ESTADO_ITEM.map((e) => (
              <TouchableOpacity
                key={e.value}
                style={[
                  styles.estadoChip,
                  item.estado === e.value && {
                    backgroundColor: e.color + "20",
                    borderColor: e.color,
                  },
                  readOnly && styles.estadoChipReadOnly,
                ]}
                onPress={() => onEstadoChange(item.producto_identificador, e.value)}
                disabled={readOnly}
              >
                <Ionicons
                  name={e.icon}
                  size={14}
                  color={item.estado === e.value ? e.color : colors.textSec}
                />
                <Text
                  style={[
                    styles.estadoChipText,
                    item.estado === e.value && { color: e.color },
                  ]}
                >
                  {t(e.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.expandedLabel}>{t("inventory.observationLabel")}</Text>
          <TextInput
            style={[styles.observacionInput, readOnly && styles.observacionInputReadOnly]}
            placeholder={t("inventory.observationPlaceholder")}
            placeholderTextColor={colors.textSec}
            value={item.observacion}
            onChangeText={(text) =>
              onObservacionChange(item.producto_identificador, text)
            }
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            editable={!readOnly}
          />
        </View>
      )}
    </View>
  );
}

/**
 * Pantalla de detalle y ejecución de un inventario.
 * Recibe el objeto inventario por parámetro de navegación. Si el inventario
 * llega en estado Pendiente (estadoId 1) lo promueve automáticamente a
 * En proceso (estadoId 2). Lee el resultado del escaneo mediante
 * scanResult.js en useFocusEffect para marcar ítems al regresar de la cámara.
 */
export default function InventarioDetalleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { token, decodificarToken } = useSession();
  const { addNotification } = useNotifications();

  const { inventario: inventarioParam } = route.params ?? {};

  const [inventario, setInventario] = useState(inventarioParam ?? null);

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const userId = useMemo(() => {
    const claims = decodificarToken();
    return claims?.userId ?? 1;
  }, []);

  useEffect(() => {
    if (!inventario?.subSeccionId || !inventario?.id || !token) return;
    setLoadingItems(true);
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_URL}${API_URL_SUBSECCION_ITEMS}/${inventario.subSeccionId}/items`, { headers })
        .then((res) => { if (!res.ok) throw new Error(res.status); return res.json(); }),
      fetch(`${API_URL}${API_URL_INVENTARIO_PROGRESO}/${inventario.id}/progreso`, { headers })
        .then((res) => { if (!res.ok) throw new Error(res.status); return res.json(); })
        .catch(() => ({ items: [] })),
    ])
      .then(([rawItems, progreso]) => setItems(buildInitialItems(rawItems, progreso.items)))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, [inventario?.subSeccionId, inventario?.id, token]);

  useFocusEffect(
    useCallback(() => {
      const codigo = getScanResult();
      if (!codigo) return;
      clearScanResult();
      const codigoNormalizado = codigo.trim();
      setItems((prev) => {
        const idx = prev.findIndex(
          (i) => i.producto_identificador.trim() === codigoNormalizado,
        );
        if (idx === -1) {
          Alert.alert(
            t("inventory.codeNotFound"),
            t("inventory.codeNotFoundMessage", { code: codigoNormalizado }),
          );
          return prev;
        }
        markDirty();
        const updated = [...prev];
        updated[idx] = { ...updated[idx], encontrado: true };
        return updated;
      });
    }, []),
  );

  const itemsFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.producto.toLowerCase().includes(q) ||
        i.producto_identificador.toLowerCase().includes(q),
    );
  }, [items, busqueda]);

  const resumen = useMemo(() => {
    const total = items.length;
    const encontrados = items.filter((i) => i.encontrado).length;
    return { total, encontrados };
  }, [items]);

  const markDirty = () => {
    if (!isDirty) {
      setIsDirty(true);
      setInventario((prev) =>
        prev?.estadoId === 1 ? { ...prev, estadoId: 2 } : prev,
      );
    }
  };

  const handleToggleEncontrado = (id) => {
    markDirty();
    setItems((prev) =>
      prev.map((i) =>
        i.producto_identificador === id ? { ...i, encontrado: !i.encontrado } : i,
      ),
    );
  };

  const handleEstadoChange = (id, estado) => {
    markDirty();
    setItems((prev) =>
      prev.map((i) =>
        i.producto_identificador === id ? { ...i, estado } : i,
      ),
    );
  };

  const handleObservacionChange = (id, observacion) => {
    markDirty();
    setItems((prev) =>
      prev.map((i) =>
        i.producto_identificador === id ? { ...i, observacion } : i,
      ),
    );
  };

  const [savingAction, setSavingAction] = useState(null);

  const buildPayload = () => ({
    items: items.map((i) => ({
      producto_identificador: i.producto_identificador,
      encontrado: i.encontrado,
      estado: i.estado,
      observacion: i.observacion,
    })),
  });

  const handleEscanear = () => {
    navigation.navigate("Camera", {
      fromInventario: true,
      inventario: inventario,
    });
  };

  const handleGuardarProgreso = async ({ silent = false } = {}) => {
    if (!silent) setSavingAction("progreso");
    try {
      await fetch(
        `${API_URL}${API_URL_INVENTARIO_PROGRESO}/${inventario.id}/progreso`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildPayload()),
        },
      );
      if (!silent) navigation.navigate("Inventarios");
    } catch {
      if (!silent)
        Alert.alert(t("inventory.errorSaveTitle"), t("inventory.errorProgressMessage"));
    } finally {
      if (!silent) setSavingAction(null);
    }
  };

  const handleBack = () => {
    if (!isDirty || estadoFinalizado) {
      navigation.navigate("Inventarios");
      return;
    }
    Alert.alert(
      t("inventory.unsavedTitle"),
      t("inventory.unsavedMessage"),
      [
        {
          text: t("inventory.unsavedDiscard"),
          style: "destructive",
          onPress: () => navigation.navigate("Inventarios"),
        },
        {
          text: t("inventory.unsavedSave"),
          onPress: async () => {
            await handleGuardarProgreso({ silent: true });
            navigation.navigate("Inventarios");
          },
        },
      ],
    );
  };

  const handleFinalizar = async () => {
    setSavingAction("finalizar");
    try {
      const res = await fetch(
        `${API_URL}${API_URL_INVENTARIO_PROGRESO}/${inventario.id}/finalizar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildPayload()),
        },
      );
      if (!res.ok) throw new Error(res.status);
      setInventario((prev) => ({ ...prev, estadoId: 3 }));
      addNotification(
        t("notifications.inventoryFinishedTitle"),
        t("notifications.inventoryFinishedMessage", { name: inventario.nombre }),
      );
      navigation.navigate("Inventarios");
    } catch {
      Alert.alert(t("inventory.errorSaveTitle"), t("inventory.errorSaveMessage"));
    } finally {
      setSavingAction(null);
    }
  };

  if (!inventario) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header title={t("inventory.detailTitle")} onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t("inventory.notFound")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const estadoFinalizado = inventario.estadoId === 3;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Header
          title={inventario.nombre}
          description={`${inventario.subSeccionNombre} · ${inventario.seccionNombre}`}
          onBackPress={handleBack}
        />

        <View style={styles.toolbarContainer}>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      resumen.total > 0
                        ? `${(resumen.encontrados / resumen.total) * 100}%`
                        : "0%",
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {t("inventory.progress", { found: resumen.encontrados, total: resumen.total })}
            </Text>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={16} color={colors.textSec} />
              <TextInput
                style={styles.searchInput}
                placeholder={t("inventory.searchPlaceholder")}
                placeholderTextColor={colors.textSec}
                value={busqueda}
                onChangeText={setBusqueda}
              />
              {busqueda.length > 0 && (
                <TouchableOpacity onPress={() => setBusqueda("")}>
                  <Ionicons name="close-circle" size={16} color={colors.textSec} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleEscanear}
              disabled={estadoFinalizado}
            >
              <Ionicons name="qr-code-outline" size={20} color={colors.white} />
              <Text style={styles.scanButtonText}>{t("inventory.scanButton")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loadingItems ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={itemsFiltrados}
            keyExtractor={(item) => item.producto_identificador}
            renderItem={({ item }) => (
              <ItemRow
                item={item}
                onToggleEncontrado={handleToggleEncontrado}
                onEstadoChange={handleEstadoChange}
                onObservacionChange={handleObservacionChange}
                readOnly={estadoFinalizado}
              />
            )}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={40} color={colors.border} />
                <Text style={styles.emptyText}>{t("inventory.noResults", { query: busqueda })}</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.footer}>
          {estadoFinalizado ? (
            <CustomButton
              text={t("inventory.finishedButton")}
              variant="primary"
              icon="checkmark-circle"
              iconPosition="left"
              fullWidth
              disabled
            />
          ) : (
            <View style={styles.footerButtons}>
              <View style={styles.footerButtonWrap}>
                <CustomButton
                  text={
                    savingAction === "progreso"
                      ? t("inventory.savingButton")
                      : t("inventory.saveProgressButton")
                  }
                  onPress={handleGuardarProgreso}
                  variant="outline"
                  icon="bookmark-outline"
                  iconPosition="left"
                  disabled={savingAction !== null}
                  fullWidth
                />
              </View>
              <View style={styles.footerButtonWrap}>
                <CustomButton
                  text={
                    savingAction === "finalizar"
                      ? t("inventory.savingButton")
                      : t("inventory.finalizeButton")
                  }
                  onPress={handleFinalizar}
                  variant="primary"
                  icon="checkmark-done-outline"
                  iconPosition="left"
                  disabled={savingAction !== null}
                  fullWidth
                />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  toolbarContainer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 10,
  },
  progressRow: {
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  progressText: {
    ...typography.regular.small,
    color: colors.textSec,
    textAlign: "right",
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    ...typography.regular.medium,
    color: colors.text,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
  },
  scanButtonText: {
    ...typography.semibold.regular,
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  itemCardFound: {
    borderColor: colors.success + "60",
    backgroundColor: colors.success + "08",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemNombre: {
    ...typography.medium.medium,
    color: colors.text,
  },
  itemId: {
    ...typography.regular.small,
    color: colors.textSec,
    fontFamily: "RobotoMedium",
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  cantidadBadge: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cantidadText: {
    ...typography.semibold.small,
    color: colors.textSec,
  },
  itemExpanded: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 14,
    gap: 8,
  },
  expandedLabel: {
    ...typography.semibold.small,
    color: colors.textSec,
    marginBottom: 2,
  },
  estadoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  estadoChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lightGray,
  },
  estadoChipText: {
    ...typography.medium.small,
    color: colors.textSec,
  },
  observacionInput: {
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 10,
    ...typography.regular.medium,
    color: colors.text,
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.border,
  },
  observacionInputReadOnly: {
    opacity: 0.6,
  },
  checkboxReadOnly: {
    opacity: 0.5,
  },
  estadoChipReadOnly: {
    opacity: 0.7,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  footerButtonWrap: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    ...typography.regular.large,
    color: colors.textSec,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 40,
    gap: 10,
  },
  emptyText: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
});
