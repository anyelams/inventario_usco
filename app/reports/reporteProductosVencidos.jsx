/**
 * app/reports/reporteProductosVencidos.jsx
 * Pantalla de reporte de productos vencidos. Filtra por producto, categoría,
 * rango de fechas y ubicación. Intenta primero el endpoint V2 (nuevo) y hace
 * fallback al endpoint legacy si el primero no está disponible.
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

// Para pickers (carga inicial)
const API_URL_PRODUCTO =
  Constants.expoConfig?.extra?.API_URL_PRODUCTO ?? "/api/v1/producto";
const API_URL_PRODUCTO_CATEGORIA =
  Constants.expoConfig?.extra?.API_URL_PRODUCTO_CATEGORIA ??
  "/api/v1/producto_categoria";

// Para búsqueda (mismo que web)
const API_URL_ITEMS_PRODUCTO = "/api/v1/items/producto/0";

// Para reportes
const API_URL_REPORT_PRODUCTO_VENCIMIENTO =
  Constants.expoConfig?.extra?.API_URL_REPORT_PRODUCTO_VENCIMIENTO ??
  "/api/v2/report/producto_vencimiento";
const API_URL_REPORT_PRODUCTO_VENCIMIENTO_NUEVO =
  Constants.expoConfig?.extra?.API_URL_REPORT_PRODUCTO_VENCIMIENTO_NUEVO ??
  "/api/v2/report/nuevo/producto_vencimiento";

/**
 * Pantalla del reporte de productos vencidos.
 * La búsqueda usa el endpoint de items (/api/v1/items/producto/0) y filtra
 * en cliente. La generación del PDF intenta primero el endpoint V2 y hace
 * fallback al endpoint legacy si falla.
 */
export default function ProductosVencidosReporte() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { token, empresaSeleccionada } = useSession();

  const locationFilters = useLocationFilters(token, API_URL);

  const [filtro, setFiltro] = useState({
    productoId: null,
    productoCategoriaId: null,
    fechaInicio: "",
    fechaFin: "",
  });

  const [mainData, setMainData] = useState({
    productos: [],
    categorias: [],
  });

  const [resultados, setResultados] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const ALIAS_EMP = "em.emp_id";
  const ALIAS_VENC = "k.kai_fecha_vencimiento";
  const DEF_INI = "1900-01-01 00:00";
  const DEF_FIN = "2099-12-31 23:59";

  /** Normaliza respuestas paginadas o arrays directos del API. */
  const asArray = (x) => (Array.isArray(x) ? x : (x?.content ?? []));

  /**
   * Convierte fecha ISO a "YYYY-MM-DD HH:MM" para el payload del reporte.
   * @param {string} val - Fecha en formato ISO
   * @param {boolean} [end=false] - Si es fecha fin, usa 23:59 por defecto
   * @returns {string|null}
   */
  const toReportDTmm = (val, end = false) => {
    if (!val) return null;
    const [d, t] = String(val).split("T");
    const hhmm = (t || (end ? "23:59" : "00:00")).slice(0, 5);
    return `${d} ${hhmm}`;
  };

  const getProdCatId = (p) =>
    p?.productoCategoriaId ??
    p?.categoriaProductoId ??
    p?.categoriaId ??
    p?.categoria?.id ??
    p?.productoCategoria?.id ??
    null;

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

  const hasActiveFilters = () => {
    return (
      locationFilters.selected.paisId ||
      locationFilters.selected.departamentoId ||
      locationFilters.selected.municipioId ||
      locationFilters.selected.sedeId ||
      locationFilters.selected.bloqueId ||
      locationFilters.selected.espacioId ||
      locationFilters.selected.almacenId
    );
  };

  const buildCondicion = () => {
    const ini = toReportDTmm(filtro.fechaInicio, false);
    const fin = toReportDTmm(filtro.fechaFin, true);

    const condiciones = {};
    let index = 0;

    condiciones[index++] = `${ALIAS_EMP} = ${empresaSeleccionada?.empresaId}`;

    if (filtro.productoId) {
      condiciones[index++] = `AND p.pro_id = ${Number(filtro.productoId)}`;
    }

    if (filtro.productoCategoriaId) {
      condiciones[index++] = `AND p.pro_producto_categoria_id = ${Number(
        filtro.productoCategoriaId,
      )}`;
    }

    if (ini && fin) {
      condiciones[index++] = `AND ${ALIAS_VENC} BETWEEN "${ini}" AND "${fin}"`;
    } else {
      condiciones[index++] =
        `AND ${ALIAS_VENC} BETWEEN "${DEF_INI}" AND "${DEF_FIN}"`;
    }

    const { selected } = locationFilters;
    if (selected.paisId)
      condiciones[index++] = `AND pais.id = ${selected.paisId}`;
    if (selected.departamentoId)
      condiciones[index++] = `AND departamento.id = ${selected.departamentoId}`;
    if (selected.municipioId)
      condiciones[index++] = `AND municipio.id = ${selected.municipioId}`;
    if (selected.sedeId)
      condiciones[index++] = `AND sede.id = ${selected.sedeId}`;
    if (selected.bloqueId)
      condiciones[index++] = `AND bloque.id = ${selected.bloqueId}`;
    if (selected.espacioId)
      condiciones[index++] = `AND espacio.id = ${selected.espacioId}`;
    if (selected.almacenId)
      condiciones[index++] = `AND almacen.id = ${selected.almacenId}`;

    return { condicion: condiciones };
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

  const handleFechaInicioChange = (value) => {
    setFiltro((prev) => ({ ...prev, fechaInicio: value }));
  };

  const handleFechaFinChange = (value) => {
    setFiltro((prev) => ({ ...prev, fechaFin: value }));
  };

  const productosFiltrados = React.useMemo(() => {
    if (!filtro.productoCategoriaId) return mainData.productos;
    return mainData.productos.filter((p) => {
      const catId = getProdCatId(p);
      return Number(catId) === Number(filtro.productoCategoriaId);
    });
  }, [mainData.productos, filtro.productoCategoriaId]);

  useEffect(() => {
    if (productosFiltrados.length === 1 && !filtro.productoId) {
      setFiltro((prev) => ({
        ...prev,
        productoId: productosFiltrados[0].id,
      }));
    }
    if (filtro.productoId && productosFiltrados.length > 0) {
      const productoExiste = productosFiltrados.some(
        (p) => p.id === filtro.productoId,
      );
      if (!productoExiste) {
        setFiltro((prev) => ({ ...prev, productoId: null }));
      }
    }
  }, [productosFiltrados, filtro.productoId]);

  // Carga inicial: usa endpoints de pickers (/api/v1/producto y /api/v1/producto_categoria)
  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) return;

      setLoadingData(true);
      try {
        const [productosRes, categoriasRes] = await Promise.all([
          fetch(`${API_URL}${API_URL_PRODUCTO}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}${API_URL_PRODUCTO_CATEGORIA}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const productosData = await productosRes.json();
        const categoriasData = await categoriasRes.json();

        setMainData({
          productos: asArray(productosData),
          categorias: asArray(categoriasData),
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

  // Búsqueda: usa endpoint de items (/api/v1/items/producto/0), igual que el web
  const buscarProductos = async () => {
    if (!validarRango()) return;

    setResultados([]);
    setLoadingProductos(true);

    try {
      const response = await fetch(`${API_URL}${API_URL_ITEMS_PRODUCTO}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener productos");
      }

      const data = await response.json();
      let lista = asArray(data);

      if (filtro.productoCategoriaId) {
        lista = lista.filter((p) => {
          const catId = getProdCatId(p);
          return String(catId) === String(filtro.productoCategoriaId);
        });
      }

      if (filtro.productoId) {
        lista = lista.filter((p) => String(p.id) === String(filtro.productoId));
      }

      setResultados(lista);
      Alert.alert("Resultados", `Mostrando ${lista.length} producto(s).`);
    } catch (error) {
      console.error("Error al buscar productos:", error);
      setResultados([]);
      Alert.alert("Error", "No se pudieron cargar productos.");
    } finally {
      setLoadingProductos(false);
    }
  };

  /**
   * Intenta generar el reporte llamando a un endpoint específico.
   * Lanza un error si la respuesta no es PDF o si el servidor devuelve error.
   * @param {string} url - URL completa del endpoint de reporte
   * @param {Object} payload - Cuerpo de la petición POST
   * @returns {ArrayBuffer} - Bytes del PDF generado
   */
  const tryGenerateWithEndpoint = async (url, payload) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "FrontendMovil/1.0.0 (React Native)",
        Accept: "application/pdf, application/json, */*",
        "Cache-Control": "no-cache",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("pdf")) {
      const text = await response.text();
      throw new Error(text || `Error ${response.status} en ${url}`);
    }

    return await response.arrayBuffer();
  };

  const generarReporte = async () => {
    if (!validarRango()) return;

    if (!token || !empresaSeleccionada?.empresaId) {
      Alert.alert("Error", "No hay sesión activa o empresa seleccionada.");
      return;
    }

    setGeneratingReport(true);

    try {
      let arrayBuffer;
      let endpointUsado = "";

      try {
        const payloadV2 = buildCondicion();
        arrayBuffer = await tryGenerateWithEndpoint(
          `${API_URL}${API_URL_REPORT_PRODUCTO_VENCIMIENTO_NUEVO}`,
          payloadV2,
        );
        endpointUsado = "V2 (nuevo)";
      } catch (errorV2) {
        console.warn("Endpoint V2 falló, intentando legacy:", errorV2.message);

        const payloadLegacy = {
          producto_id: filtro.productoId ? Number(filtro.productoId) : "",
          producto_categoria_id: filtro.productoCategoriaId
            ? Number(filtro.productoCategoriaId)
            : "",
          fecha_inicio: toReportDTmm(filtro.fechaInicio) || DEF_INI,
          fecha_fin: toReportDTmm(filtro.fechaFin, true) || DEF_FIN,
        };

        arrayBuffer = await tryGenerateWithEndpoint(
          `${API_URL}${API_URL_REPORT_PRODUCTO_VENCIMIENTO}`,
          payloadLegacy,
        );
        endpointUsado = "Legacy";
      }

      console.log(
        `Archivo recibido (${endpointUsado}):`,
        arrayBuffer.byteLength,
        "bytes",
      );

      if (arrayBuffer.byteLength === 0) {
        throw new Error("El archivo recibido está vacío");
      }

      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );

      const filename = `reporte_productos_vencidos_${Date.now()}.pdf`;
      const uri = FileSystem.cacheDirectory + filename;

      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: "base64",
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: "Reporte de Productos Vencidos",
        });
      } else {
        Alert.alert("Éxito", "Reporte generado correctamente");
      }
    } catch (error) {
      console.error("Error completo:", error);
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
        title={t("reporteVencidos.title")}
        description={t("reporteVencidos.description")}
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
              placeholder={t("filters.allCategories")}
            />

            <CustomPicker
              label={t("reporteKardex.filterProducto")}
              items={productosFiltrados}
              selectedValue={filtro.productoId}
              onValueChange={handleProductoChange}
              placeholder={t("filters.allProducts")}
              enabled={mainData.productos.length > 0}
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
            onSearch={buscarProductos}
            onGenerateReport={generarReporte}
            loadingPedido={loadingProductos}
            generatingReport={generatingReport}
          />

          {resultados.length > 0 && (
            <GenericSearchResults
              data={resultados}
              config={useSearchResultsConfig("productos")}
              maxVisible={resultados.length}
            />
          )}

          {(loadingProductos || generatingReport) && (
            <View style={styles.loadingReport}>
              <ActivityIndicator size="small" color={colors.secondary} />
              <Text style={styles.loadingReportText}>
                {loadingProductos ? t("filters.loadingData") : t("filters.generatingReport")}
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
