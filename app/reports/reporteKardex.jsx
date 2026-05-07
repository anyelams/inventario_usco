/**
 * app/reports/reporteKardex.jsx
 * Pantalla de reporte Kardex. Permite filtrar movimientos de inventario
 * por producto, categoría, producción, presentación, fechas y ubicación.
 * Soporta búsqueda paginada y generación de PDF mediante el API de reportes.
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

const API_URL = Constants.expoConfig?.extra?.API_URL ?? "";

const API_URL_PRODUCTO =
  Constants.expoConfig?.extra?.API_URL_PRODUCTO ?? "/api/v1/producto";
const API_URL_PRODUCTO_CATEGORIA =
  Constants.expoConfig?.extra?.API_URL_PRODUCTO_CATEGORIA ??
  "/api/v1/producto_categoria";
const API_URL_PRODUCCION =
  Constants.expoConfig?.extra?.API_URL_PRODUCCION ?? "/api/v1/produccion";
const API_URL_PRODUCTO_PRESENTACION =
  Constants.expoConfig?.extra?.API_URL_PRODUCTO_PRESENTACION ??
  "/api/v1/producto_presentacion";

const API_URL_ARTICULO_KARDEX =
  Constants.expoConfig?.extra?.API_URL_ARTICULO_KARDEX ?? "/api/v1/kardex";

const API_URL_REPORT_KARDEX =
  Constants.expoConfig?.extra?.API_URL_REPORT_KARDEX ??
  "/api/v2/report/nuevo/kardex";

/**
 * Pantalla principal del reporte de Kardex.
 * Carga productos, categorías, producciones y presentaciones al montar.
 * La búsqueda pagina automáticamente hasta 15 páginas de 200 registros.
 * El reporte PDF selecciona el endpoint según los filtros activos
 * (kardex_produccion, kardex_producto_presentacion o el genérico).
 */
export default function KardexReporte() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { token, empresaSeleccionada } = useSession();

  const locationFilters = useLocationFilters(token, API_URL);

  const [filtro, setFiltro] = useState({
    productoId: null,
    productoCategoriaId: null,
    produccionId: null,
    productoPresentacionId: null,
    fechaInicio: "",
    fechaFin: "",
  });

  const [mainData, setMainData] = useState({
    productos: [],
    categorias: [],
    producciones: [],
    presentaciones: [],
  });

  const [articulos, setArticulos] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingKardex, setLoadingKardex] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const DEF_INI = "1900-01-01 00:00";
  const DEF_FIN = "2099-12-31 23:59";

  /** Normaliza respuestas paginadas o arrays directos del API. */
  const asArray = (x) => (Array.isArray(x) ? x : (x?.content ?? []));

  /**
   * Convierte una fecha ISO a formato "YYYY-MM-DD HH:MM" requerido por el API.
   * @param {string} val - Fecha en formato ISO
   * @param {boolean} [end=false] - Si es fecha fin, usa 23:59 por defecto
   * @returns {string|null}
   */
  const toDateStr = (val, end = false) => {
    if (!val) return null;
    const [d, t] = String(val).split("T");
    if (!d) return null;
    const hhmm = t ? t.slice(0, 5) : end ? "23:59" : "00:00";
    return `${d} ${hhmm}`;
  };

  const getProdCatId = (p) =>
    p?.productoCategoriaId ??
    p?.categoriaProductoId ??
    p?.categoriaId ??
    p?.categoria?.id ??
    p?.productoCategoria?.id ??
    null;

  /** Indica si hay algún filtro de ubicación activo para activar el ícono de filtro. */
  const hasActiveFilters = () =>
    locationFilters.selected.paisId ||
    locationFilters.selected.departamentoId ||
    locationFilters.selected.municipioId ||
    locationFilters.selected.sedeId ||
    locationFilters.selected.bloqueId ||
    locationFilters.selected.espacioId ||
    locationFilters.selected.almacenId;

  /** Valida que la fecha inicio no sea mayor que la fecha fin. */
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
   * Construye el objeto de condiciones SQL para el endpoint de reporte PDF.
   * Cada clave numérica corresponde a un fragmento de cláusula WHERE.
   * @returns {Object} - Mapa { "0": "...", "1": "AND ...", ... }
   */
  const buildCondicion = () => {
    const userIni = toDateStr(filtro.fechaInicio, false);
    const userFin = toDateStr(filtro.fechaFin, true);

    const c = {};
    c["0"] = `e.emp_id = ${empresaSeleccionada?.empresaId}`;
    c["1"] = locationFilters.selected.municipioId
      ? `AND m.mun_id = ${Number(locationFilters.selected.municipioId)}`
      : "";
    c["2"] = locationFilters.selected.sedeId
      ? `AND s.sed_id = ${Number(locationFilters.selected.sedeId)}`
      : "";
    c["3"] = locationFilters.selected.bloqueId
      ? `AND blo.blo_id = ${Number(locationFilters.selected.bloqueId)}`
      : "";
    c["4"] = locationFilters.selected.espacioId
      ? `AND esp.esp_id = ${Number(locationFilters.selected.espacioId)}`
      : "";
    c["5"] = locationFilters.selected.almacenId
      ? `AND al.alm_id = ${Number(locationFilters.selected.almacenId)}`
      : "";
    c["6"] = filtro.productoId
      ? `AND p.pro_id = ${Number(filtro.productoId)}`
      : "";
    c["7"] = filtro.productoCategoriaId
      ? `AND p.pro_producto_categoria_id = ${Number(filtro.productoCategoriaId)}`
      : "";
    c["8"] =
      `AND k.kar_fecha_hora BETWEEN '${userIni ?? DEF_INI}' AND '${userFin ?? DEF_FIN}'`;
    c["9"] = filtro.produccionId
      ? `AND pr.pro_id = ${Number(filtro.produccionId)}`
      : "";
    c["10"] = filtro.productoPresentacionId
      ? `AND pp.prp_id = ${Number(filtro.productoPresentacionId)}`
      : "";

    return c;
  };

  // Igual que el web: elige endpoint según filtros activos
  const getReportPath = () => {
    if (filtro.produccionId) return "/api/v2/report/nuevo/kardex_produccion";
    if (filtro.productoPresentacionId)
      return "/api/v2/report/nuevo/kardex_producto_presentacion";
    return API_URL_REPORT_KARDEX;
  };

  const handleProductoChange = (value) => {
    setFiltro((prev) => ({ ...prev, productoId: value }));
  };

  const handleCategoriaChange = (value) => {
    setFiltro((prev) => ({
      ...prev,
      productoCategoriaId: value,
      productoId: null,
    }));
  };

  const handleProduccionChange = (value) => {
    setFiltro((prev) => ({ ...prev, produccionId: value }));
  };

  const handlePresentacionChange = (value) => {
    setFiltro((prev) => ({ ...prev, productoPresentacionId: value }));
  };

  const handleFechaInicioChange = (value) => {
    setFiltro((prev) => ({ ...prev, fechaInicio: value }));
  };

  const handleFechaFinChange = (value) => {
    setFiltro((prev) => ({ ...prev, fechaFin: value }));
  };

  const productosFiltrados = React.useMemo(() => {
    if (!filtro.productoCategoriaId) return mainData.productos;
    return mainData.productos.filter(
      (p) => Number(getProdCatId(p)) === Number(filtro.productoCategoriaId),
    );
  }, [mainData.productos, filtro.productoCategoriaId]);

  useEffect(() => {
    if (productosFiltrados.length === 1 && !filtro.productoId) {
      setFiltro((prev) => ({
        ...prev,
        productoId: productosFiltrados[0].id,
      }));
    }
    if (filtro.productoId && productosFiltrados.length > 0) {
      const existe = productosFiltrados.some((p) => p.id === filtro.productoId);
      if (!existe) {
        setFiltro((prev) => ({ ...prev, productoId: null }));
      }
    }
  }, [productosFiltrados, filtro.productoId]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) return;

      setLoadingData(true);
      try {
        const [
          productosRes,
          categoriasRes,
          produccionesRes,
          presentacionesRes,
        ] = await Promise.all([
          fetch(`${API_URL}${API_URL_PRODUCTO}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}${API_URL_PRODUCTO_CATEGORIA}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}${API_URL_PRODUCCION}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ json: async () => [] })),
          fetch(`${API_URL}${API_URL_PRODUCTO_PRESENTACION}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ json: async () => [] })),
        ]);

        const [
          productosData,
          categoriasData,
          produccionesData,
          presentacionesData,
        ] = await Promise.all([
          productosRes.json(),
          categoriasRes.json(),
          produccionesRes.json(),
          presentacionesRes.json(),
        ]);

        setMainData({
          productos: asArray(productosData),
          categorias: asArray(categoriasData),
          producciones: asArray(produccionesData),
          presentaciones: asArray(presentacionesData),
        });

        await locationFilters.loadInitialData();
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        Alert.alert("Error", "Error cargando productos y categorías");
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [token]);

  /**
   * Consulta el API de kardex con los filtros aplicados.
   * Si la respuesta está paginada, acumula hasta 15 páginas de 200 registros.
   */
  const buscarKardex = async () => {
    if (!validarRango()) return;

    setArticulos([]);
    setLoadingKardex(true);

    try {
      const baseParams = new URLSearchParams();
      baseParams.append("empresa_id", empresaSeleccionada?.empresaId);
      if (filtro.productoId)
        baseParams.append("producto_id", filtro.productoId);
      if (filtro.productoCategoriaId)
        baseParams.append("producto_categoria_id", filtro.productoCategoriaId);
      if (filtro.produccionId)
        baseParams.append("produccion_id", filtro.produccionId);
      if (filtro.productoPresentacionId)
        baseParams.append(
          "producto_presentacion_id",
          filtro.productoPresentacionId,
        );
      if (filtro.fechaInicio)
        baseParams.append("fecha_inicio", toDateStr(filtro.fechaInicio));
      if (filtro.fechaFin)
        baseParams.append("fecha_fin", toDateStr(filtro.fechaFin, true));
      if (locationFilters.selected.municipioId)
        baseParams.append("municipio_id", locationFilters.selected.municipioId);
      if (locationFilters.selected.sedeId)
        baseParams.append("sede_id", locationFilters.selected.sedeId);
      if (locationFilters.selected.almacenId)
        baseParams.append("almacen_id", locationFilters.selected.almacenId);

      // Intentar sin paginación primero
      const r0 = await fetch(
        `${API_URL}${API_URL_ARTICULO_KARDEX}?${baseParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!r0.ok) throw new Error("Error al obtener datos del kardex");

      const d0 = await r0.json();
      const list0 = asArray(d0);

      // Si el servidor ya devolvió todo (sin estructura de página), usar directo
      const totalElements = d0?.totalElements ?? d0?.total ?? null;
      const isPagedResponse =
        d0?.content !== undefined || d0?.data !== undefined;

      let lista = list0;

      if (isPagedResponse && totalElements > list0.length) {
        // Paginar acumulando hasta 15 páginas
        let page = 1;
        let acc = [...list0];
        for (let i = 0; i < 14; i++) {
          const params = new URLSearchParams(baseParams);
          params.set("page", String(page));
          params.set("size", "200");
          const r = await fetch(
            `${API_URL}${API_URL_ARTICULO_KARDEX}?${params.toString()}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!r.ok) break;
          const d = await r.json();
          const chunk = asArray(d);
          if (!chunk.length) break;
          acc = acc.concat(chunk);
          if (acc.length >= totalElements) break;
          page += 1;
        }
        lista = acc;
      }

      setArticulos(lista);
      Alert.alert(
        "Resultados",
        `Mostrando ${lista.length} registro(s) de kardex.`,
      );
    } catch (error) {
      console.error("Error al buscar kardex:", error);
      setArticulos([]);
      Alert.alert("Error", "No se pudo obtener el Kardex.");
    } finally {
      setLoadingKardex(false);
    }
  };

  /**
   * Genera el PDF del reporte Kardex y lo abre con la app de compartir del SO.
   * Selecciona automáticamente el endpoint especializado según los filtros activos,
   * con fallback al endpoint genérico si el especializado devuelve 404.
   */
  const generarReporte = async () => {
    if (!validarRango()) return;

    if (!token || !empresaSeleccionada?.empresaId) {
      Alert.alert("Error", "No hay sesión activa o empresa seleccionada.");
      return;
    }

    setGeneratingReport(true);

    const condicion = buildCondicion();
    const payload = { condicion, EMPRESA_ID: empresaSeleccionada?.empresaId };

    const tryFetch = async (url) =>
      fetch(`${API_URL}${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf, application/json, */*",
        },
        body: JSON.stringify(payload),
      });

    try {
      const reportPath = getReportPath();
      let response = await tryFetch(reportPath);

      // Fallback al endpoint genérico si el especializado no existe
      if (response.status === 404 && reportPath !== API_URL_REPORT_KARDEX) {
        console.log(
          "[generarReporte] endpoint especializado no encontrado, usando genérico",
        );
        response = await tryFetch(API_URL_REPORT_KARDEX);
      }

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

      const filename = `reporte_kardex_${Date.now()}.pdf`;
      const uri = FileSystem.cacheDirectory + filename;

      await FileSystem.writeAsStringAsync(uri, base64, { encoding: "base64" });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartir Reporte de Kardex",
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
        title={t("reporteKardex.title")}
        description={t("reporteKardex.description")}
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
              label={t("reporteKardex.filterCategoriaProducto")}
              items={mainData.categorias}
              selectedValue={filtro.productoCategoriaId}
              onValueChange={handleCategoriaChange}
            />

            <CustomPicker
              label={t("reporteKardex.filterProducto")}
              items={productosFiltrados}
              selectedValue={filtro.productoId}
              onValueChange={handleProductoChange}
              enabled={productosFiltrados.length > 0}
            />

            <CustomPicker
              label={t("reporteKardex.filterProduccion")}
              items={mainData.producciones}
              selectedValue={filtro.produccionId}
              onValueChange={handleProduccionChange}
            />

            <CustomPicker
              label={t("reporteKardex.filterPresentacion")}
              items={mainData.presentaciones}
              selectedValue={filtro.productoPresentacionId}
              onValueChange={handlePresentacionChange}
            />

            <DateTimeInput
              label={t("filters.fechaInicio")}
              value={filtro.fechaInicio}
              onChangeText={handleFechaInicioChange}
              placeholder="DD/MM/AAAA HH:MM"
            />

            <DateTimeInput
              label={t("filters.fechaFin")}
              value={filtro.fechaFin}
              onChangeText={handleFechaFinChange}
              placeholder="DD/MM/AAAA HH:MM"
            />
          </View>

          <ActionButtons
            onSearch={buscarKardex}
            onGenerateReport={generarReporte}
            loadingPedido={loadingKardex}
            generatingReport={generatingReport}
          />

          {articulos.length > 0 && (
            <GenericSearchResults
              data={articulos}
              config={useSearchResultsConfig("kardex")}
              maxVisible={articulos.length}
            />
          )}

          {(loadingKardex || generatingReport) && (
            <View style={styles.loadingReport}>
              <ActivityIndicator size="small" color={colors.secondary} />
              <Text style={styles.loadingReportText}>
                {loadingKardex ? t("filters.loadingData") : t("filters.generatingReport")}
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
