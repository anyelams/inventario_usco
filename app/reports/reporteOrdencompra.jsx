/**
 * @file reporteOrdencompra.jsx
 * @module app/reports/reporteOrdencompra
 * @description Pantalla de reporte de órdenes de compra. Permite filtrar por pedido,
 * estado, rango de fechas y ubicación, consultar resultados y generar un PDF
 * que se comparte desde el dispositivo.
 */
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { useNavigation } from "@react-navigation/native";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionButtons from "../../components/ActionButtons";
import ReportHeader from "../../components/ReportHeader";
import {
  GenericSearchResults,
  useSearchResultsConfig,
} from "../../components/SearchResults";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";
import { useLanguage } from "../../context/LanguageContext";

import CustomPicker from "../../components/CustomPicker";
import DateTimeInput from "../../components/DateTimeInput";
import LocationFilters from "../../components/LocationFilters";
import useLocationFilters from "../../hooks/useLocationFilters";

/** Base URL de la API obtenida desde la configuración de Expo. @type {string} */
const API_URL = Constants.expoConfig?.extra?.API_URL ?? "";

/** Endpoint para listar pedidos. @type {string} */
const API_URL_PEDIDO =
  Constants.expoConfig?.extra?.API_URL_PEDIDO ?? "/api/v1/pedido";
/** Endpoint para listar órdenes de compra. @type {string} */
const API_URL_ORDEN_COMPRA =
  Constants.expoConfig?.extra?.API_URL_ORDEN_COMPRA ?? "/api/v1/orden_compra";
/** Endpoint para obtener los estados posibles de una orden de compra. @type {string} */
const API_URL_ORDEN_COMPRA_ESTADO =
  Constants.expoConfig?.extra?.API_URL_ORDEN_COMPRA_ESTADO ??
  "/api/v1/items/orden_compra_estado/0";
/** Endpoint para generar el PDF del reporte de órdenes de compra. @type {string} */
const API_URL_REPORT_ORDEN_COMPRA =
  Constants.expoConfig?.extra?.API_URL_REPORT_ORDEN_COMPRA ??
  "/api/v2/report/nuevo/orden_compra";

/**
 * Pantalla principal del reporte de órdenes de compra.
 *
 * Carga los datos de pedidos y estados al montar, expone filtros de pedido,
 * estado y rango de fechas, y permite tanto consultar los resultados en pantalla
 * como generar y compartir un PDF.
 *
 * @component
 * @returns {React.JSX.Element} Vista con filtros, listado de órdenes y botones de acción.
 */
export default function OrdenCompraReporte() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { token, empresaSeleccionada } = useSession();

  const locationFilters = useLocationFilters(token, API_URL);

  const [filtro, setFiltro] = useState({
    pedidoId: null,
    categoriaEstadoId: null,
    fechaInicio: "",
    fechaFin: "",
  });

  const [mainData, setMainData] = useState({
    pedidos: [],
    estadosOC: [],
  });

  const [ordenes, setOrdenes] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const DEF_INI = "1900-01-01 00:00";
  const DEF_FIN = "2099-12-31 23:59";

  /**
   * Normaliza la respuesta de la API a un arreglo, soportando distintas estructuras
   * (`content`, `data` o el valor directamente).
   * @param {Array|Object|*} x - Valor a normalizar (arreglo, objeto con `content`/`data`, o cualquier otro).
   * @returns {Array} Arreglo resultante (vacío si no se reconoce la estructura).
   */
  const asArray = (x) => (Array.isArray(x) ? x : (x?.content ?? x?.data ?? []));

  /**
   * Convierte un valor de fecha/hora a la cadena `"YYYY-MM-DD HH:MM"` requerida por la API.
   * @param {string|null} val - Valor de fecha (ISO o similar).
   * @param {boolean} [end=false] - Si es `true` y no hay hora, usa `"23:59"`; si no, `"00:00"`.
   * @returns {string|null} Cadena formateada o `null` si el valor es falsy.
   */
  const toDateStr = (val, end = false) => {
    if (!val) return null;
    const [d, t] = String(val).split("T");
    if (!d) return null;
    const hhmm = t ? t.slice(0, 5) : end ? "23:59" : "00:00";
    return `${d} ${hhmm}`;
  };

  /**
   * Extrae la fecha de una orden de compra probando distintos nombres de campo
   * según la versión del backend.
   * @param {Object} o - Objeto de orden de compra.
   * @returns {string|null} Valor de fecha encontrado o `null`.
   */
  const getFechaOC = (o) =>
    o?.orcFechaHora ?? o?.fechaHora ?? o?.fecha ?? o?.createdAt ?? null;

  /**
   * Indica si hay al menos un filtro de ubicación activo (país, departamento,
   * municipio, sede, bloque, espacio o almacén).
   * @returns {boolean} `true` si algún filtro de ubicación tiene valor.
   */
  const hasActiveFilters = () =>
    locationFilters.selected.paisId ||
    locationFilters.selected.departamentoId ||
    locationFilters.selected.municipioId ||
    locationFilters.selected.sedeId ||
    locationFilters.selected.bloqueId ||
    locationFilters.selected.espacioId ||
    locationFilters.selected.almacenId;

  /**
   * Valida que la fecha de inicio no sea posterior a la fecha fin.
   * Muestra una alerta si el rango es inválido.
   * @returns {boolean} `true` si el rango es válido o no se especificaron ambas fechas.
   */
  const validarRango = () => {
    if (filtro.fechaInicio && filtro.fechaFin) {
      const ini = new Date(filtro.fechaInicio);
      const fin = new Date(filtro.fechaFin);
      if (ini > fin) {
        Alert.alert(
          "Error de fechas",
          "La fecha de inicio no puede ser mayor que la fecha fin.",
        );
        return false;
      }
    }
    return true;
  };

  /**
   * Construye el objeto `condicion` que se envía en el cuerpo del POST para
   * generar el PDF. Cada clave es un índice numérico en cadena y el valor es
   * un fragmento SQL de filtrado.
   * @returns {Object.<string, string>} Mapa índice → cláusula SQL.
   */
  const buildCondicion = () => {
    const userIni = toDateStr(filtro.fechaInicio, false);
    const userFin = toDateStr(filtro.fechaFin, true);

    const c = {};
    let idx = 0;

    c[String(idx++)] = `oc.orc_empresa_id = ${empresaSeleccionada?.empresaId}`;

    if (filtro.pedidoId) {
      c[String(idx++)] = `AND oc.orc_pedido_id = ${Number(filtro.pedidoId)}`;
    }

    if (filtro.categoriaEstadoId) {
      c[String(idx++)] =
        `AND oc.orc_orden_compra_estado_id = ${Number(filtro.categoriaEstadoId)}`;
    }

    if (userIni && userFin) {
      c[String(idx++)] =
        `AND oc.orc_fecha_hora BETWEEN '${userIni ?? DEF_INI}' AND '${userFin ?? DEF_FIN}'`;
    }

    return c;
  };

  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) return;
      setLoadingData(true);
      try {
        const [pedidosRes, estadosRes] = await Promise.all([
          fetch(`${API_URL}${API_URL_PEDIDO}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ json: async () => [] })),
          fetch(`${API_URL}${API_URL_ORDEN_COMPRA_ESTADO}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ json: async () => [] })),
        ]);

        const [pedidosData, estadosData] = await Promise.all([
          pedidosRes.json(),
          estadosRes.json(),
        ]);

        setMainData({
          pedidos: asArray(pedidosData),
          estadosOC: asArray(estadosData),
        });

        await locationFilters.loadInitialData();
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        Alert.alert("Error", "Error cargando los datos iniciales");
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [token]);

  /**
   * Obtiene todas las órdenes de compra desde el backend, intentando varios
   * paths de endpoint y paginando cuando es necesario para acumular el total.
   * @async
   * @returns {Promise<Object[]>} Listado completo de órdenes de compra.
   * @throws {Error} Con `code === "NO_OC_ENDPOINT"` si ningún path responde con datos.
   */
  const fetchAllOrdenes = async () => {
    const CANDIDATES = [
      API_URL_ORDEN_COMPRA,
      "/api/v1/orden-compra",
      "/api/v1/ordenCompra",
    ];

    for (const basePath of CANDIDATES) {
      try {
        const r0 = await fetch(`${API_URL}${basePath}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r0.ok) continue;

        const d0 = await r0.json();
        const list0 = asArray(d0);
        if (list0.length) return list0;

        // Paginar si vino vacío sin estructura de página
        let page = 0;
        let acc = [];
        for (let i = 0; i < 15; i++) {
          const r = await fetch(`${API_URL}${basePath}?page=${page}&size=200`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!r.ok) break;
          const d = await r.json();
          const chunk = asArray(d);
          if (!chunk.length) break;
          acc = acc.concat(chunk);
          page += 1;
        }
        if (acc.length) return acc;
      } catch (err) {
        console.debug("[fetchAllOrdenes] fallo", basePath, err?.message);
      }
    }

    const e = new Error(
      "No se encontró endpoint para listar órdenes de compra.",
    );
    e.code = "NO_OC_ENDPOINT";
    throw e;
  };

  /**
   * Obtiene todas las órdenes y aplica los filtros activos (pedido, estado y
   * rango de fechas) en el cliente, actualizando el estado `ordenes`.
   * @async
   * @returns {Promise<void>}
   */
  const buscarOrdenes = async () => {
    if (!validarRango()) return;

    setOrdenes([]);
    setLoadingOrdenes(true);

    try {
      const all = await fetchAllOrdenes();

      const ini = filtro.fechaInicio ? new Date(filtro.fechaInicio) : null;
      const fin = filtro.fechaFin ? new Date(filtro.fechaFin) : null;

      const lista = all.filter((oc) => {
        // Filtro por pedido
        if (filtro.pedidoId && String(oc.pedidoId) !== String(filtro.pedidoId))
          return false;

        // Filtro por estado
        if (
          filtro.categoriaEstadoId &&
          String(oc.ordenCompraEstadoId ?? oc.estadoId) !==
            String(filtro.categoriaEstadoId)
        )
          return false;

        // Filtro por fechas
        const f = getFechaOC(oc);
        if (f && (ini || fin)) {
          const d = new Date(f);
          if (!isNaN(d.getTime())) {
            if (ini && d < ini) return false;
            if (fin && d > fin) return false;
          }
        }

        return true;
      });

      setOrdenes(lista);
      Alert.alert(
        "Resultados",
        `Mostrando ${lista.length} orden(es) de compra.`,
      );
    } catch (error) {
      console.error("Error al buscar órdenes:", error);
      setOrdenes([]);
      const msg =
        error?.code === "NO_OC_ENDPOINT"
          ? "No se encontró el endpoint de órdenes de compra."
          : "No se pudo obtener las órdenes de compra.";
      Alert.alert("Error", msg);
    } finally {
      setLoadingOrdenes(false);
    }
  };

  /**
   * Genera el reporte PDF en el servidor, lo descarga como base64, lo escribe
   * en la caché del dispositivo y lo comparte usando el sistema nativo.
   * @async
   * @returns {Promise<void>}
   */
  const generarReporte = async () => {
    if (!validarRango()) return;

    if (!token || !empresaSeleccionada?.empresaId) {
      Alert.alert("Error", "No hay sesión activa o empresa seleccionada.");
      return;
    }

    setGeneratingReport(true);

    try {
      const condicion = buildCondicion();
      const payload = { condicion, EMPRESA_ID: empresaSeleccionada?.empresaId };

      const response = await fetch(`${API_URL}${API_URL_REPORT_ORDEN_COMPRA}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf, application/json, */*",
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");

      if (!response.ok || !contentType?.includes("pdf")) {
        const text = await response.text();
        throw new Error(text || `Error ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      if (arrayBuffer.byteLength === 0) {
        throw new Error("El archivo recibido está vacío");
      }

      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );

      const filename = `reporte_orden_compra_${Date.now()}.pdf`;
      const uri = FileSystem.cacheDirectory + filename;

      await FileSystem.writeAsStringAsync(uri, base64, { encoding: "base64" });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartir Reporte de Orden de Compra",
        });
      } else {
        Alert.alert("Éxito", "Reporte generado correctamente");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", `No se pudo generar el reporte: ${error.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const ordenesConfig = {
    icon: "cart-outline",
    singularLabel: "Orden",
    pluralLabel: "Órdenes",
    getItemKey: (item, index) => item.id ?? index,
    renderItem: (oc) => (
      <View style={styles.itemRow}>
        <Text style={styles.itemId}>#{oc.id ?? "—"}</Text>
        <Text style={styles.itemDate}>
          {getFechaOC(oc)
            ? new Date(getFechaOC(oc)).toLocaleString()
            : t("reporteOrdenCompra.noDate")}
        </Text>
      </View>
    ),
  };

  if (loadingData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>{t("filters.loadingData")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ReportHeader
        title={t("reporteOrdenCompra.title")}
        description={t("reporteOrdenCompra.description")}
        onBackPress={() => navigation.navigate("Reports")}
        onFilterPress={() => setShowFiltersModal(true)}
        filterActive={hasActiveFilters()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageContent}>
          <View style={styles.mainFiltersContainer}>
            <CustomPicker
              label={t("reporteOrdenCompra.filterPedido")}
              items={mainData.pedidos.map((p) => ({
                ...p,
                nombre: `${t("reporteOrdenCompra.orderPrefix")} ${p.id}`,
              }))}
              selectedValue={filtro.pedidoId}
              onValueChange={(value) =>
                setFiltro((prev) => ({ ...prev, pedidoId: value }))
              }
            />

            <CustomPicker
              label={t("reporteOrdenCompra.filterEstado")}
              items={mainData.estadosOC.map((e) => ({
                ...e,
                nombre: e.name ?? e.nombre ?? `Estado ${e.id}`,
              }))}
              selectedValue={filtro.categoriaEstadoId}
              onValueChange={(value) =>
                setFiltro((prev) => ({ ...prev, categoriaEstadoId: value }))
              }
            />

            <DateTimeInput
              label={t("filters.fechaInicio")}
              value={filtro.fechaInicio}
              onChangeText={(value) =>
                setFiltro((prev) => ({ ...prev, fechaInicio: value }))
              }
              placeholder="DD/MM/AAAA HH:MM"
            />

            <DateTimeInput
              label={t("filters.fechaFin")}
              value={filtro.fechaFin}
              onChangeText={(value) =>
                setFiltro((prev) => ({ ...prev, fechaFin: value }))
              }
              placeholder="DD/MM/AAAA HH:MM"
            />
          </View>

          <ActionButtons
            onSearch={buscarOrdenes}
            onGenerateReport={generarReporte}
            loadingPedido={loadingOrdenes}
            generatingReport={generatingReport}
          />

          {ordenes.length > 0 && (
            <GenericSearchResults
              data={ordenes}
              config={ordenesConfig}
              maxVisible={ordenes.length}
            />
          )}

          {(loadingOrdenes || generatingReport) && (
            <View style={styles.loadingReport}>
              <ActivityIndicator size="small" color={colors.secondary} />
              <Text style={styles.loadingReportText}>
                {loadingOrdenes ? t("filters.loadingData") : t("filters.generatingReport")}
              </Text>
            </View>
          )}
        </View>

        <Modal
          visible={showFiltersModal}
          animationType="slide"
          onRequestClose={() => setShowFiltersModal(false)}
          statusBarTranslucent
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("filters.locationTitle")}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFiltersModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <LocationFilters
                selected={locationFilters.selected}
                locationData={locationFilters.locationData}
                handlers={locationFilters.handlers}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFiltersModal(false)}
              >
                <Text style={styles.applyButtonText}>{t("filters.apply")}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  pageContent: { paddingHorizontal: 16 },
  mainFiltersContainer: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.base,
  },
  loadingText: {
    ...typography.regular.medium,
    marginTop: 10,
    color: colors.textSec,
  },
  loadingReport: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  loadingReportText: {
    ...typography.regular.medium,
    marginLeft: 10,
    color: colors.textSec,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemId: {
    ...typography.semibold.medium,
    color: colors.secondary,
  },
  itemDate: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  modalContainer: { flex: 1, backgroundColor: colors.white },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  modalTitle: { ...typography.bold.large, color: colors.text },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    ...typography.bold.large,
    color: colors.textSec,
    lineHeight: 24,
  },
  modalContent: { flex: 1, backgroundColor: colors.white },
  modalContentContainer: { padding: 20, paddingBottom: 100 },
  modalFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: { ...typography.semibold.medium, color: colors.white },
});
