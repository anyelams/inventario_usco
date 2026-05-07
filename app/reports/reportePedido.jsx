// app/reports/reportePedido.jsx
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
  PedidoInfo,
  useSearchResultsConfig,
} from "../../components/SearchResults";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";
import { useLanguage } from "../../context/LanguageContext";

// Componentes reutilizables
import CustomPicker from "../../components/CustomPicker";
import DateTimeInput from "../../components/DateTimeInput";
import LocationFilters from "../../components/LocationFilters";

// Hook custom
import useLocationFilters from "../../hooks/useLocationFilters";

// Configuración de URLs de API desde variables de entorno
const API_URL = Constants.expoConfig?.extra?.API_URL ?? "";
const API_URL_PEDIDO =
  Constants.expoConfig?.extra?.API_URL_PEDIDO ?? "/api/v1/pedido";
const API_URL_PEDIDO_ARTICULOS =
  Constants.expoConfig?.extra?.API_URL_PEDIDO_ARTICULOS ??
  "/api/v1/pedido/{id}/articulos";
const API_URL_ESTADO_CATEGORIA =
  Constants.expoConfig?.extra?.API_URL_ESTADO_CATEGORIA ??
  "/api/v1/items/estado_categoria/0";
const API_URL_REPORT_PEDIDO =
  Constants.expoConfig?.extra?.API_URL_REPORT_PEDIDO ?? "/api/v2/report/pedido";
const API_URL_REPORT_PEDIDO_V2 =
  Constants.expoConfig?.extra?.API_URL_REPORT_PEDIDO_V2 ??
  "/api/v2/report/nuevo/pedidov2";

/**
 * Componente principal para el reporte de pedidos.
 * Permite consultar pedidos con múltiples filtros y generar reportes PDF
 * incluyendo fechas, categorías de estado y ubicaciones geográficas.
 *
 * @component
 * @returns {React.ReactElement} Pantalla de reporte de pedidos
 */
export default function PedidoReporte() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { token, empresaSeleccionada } = useSession();

  // Hook para manejo de ubicación
  const locationFilters = useLocationFilters(token, API_URL);

  // Estados principales
  const [pedido, setPedido] = useState({
    pedidoId: null,
    categoriaEstadoId: null,
    fechaInicio: "",
    fechaFin: "",
  });

  const [mainData, setMainData] = useState({
    pedidos: [],
    categoriasEstado: [],
  });

  // Estados para datos del pedido
  const [pedidoData, setPedidoData] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [resultados, setResultados] = useState([]);

  // Estados de loading
  const [loadingData, setLoadingData] = useState(false);
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Estado para modal de filtros
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  /**
   * Convierte un valor en array si no lo es.
   * Útil para normalizar respuestas de API que pueden venir
   * como array o como objeto con propiedad 'content'.
   *
   * @param {any} x - Valor a convertir
   * @returns {Array} Array con los datos
   */
  const asArray = (x) => (Array.isArray(x) ? x : (x?.content ?? []));

  /**
   * Extrae la fecha de un pedido desde diferentes propiedades posibles.
   * Maneja múltiples estructuras de datos del backend.
   *
   * @param {Object} p - Objeto pedido
   * @returns {string|null} Fecha del pedido o null si no existe
   */
  const getFecha = (p) =>
    p?.fechaHora ?? p?.pedFechaHora ?? p?.fecha ?? p?.createdAt ?? null;

  /**
   * Formatea una fecha para su visualización.
   *
   * @param {string|Date} val - Valor de fecha a formatear
   * @returns {string} Fecha formateada en formato locale o cadena original si no es válida
   */
  const formatFecha = (val) => {
    if (!val) return "";
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleString();
  };

  /**
   * Convierte una fecha al formato requerido por los reportes.
   * Reemplaza 'T' por espacio para formato "YYYY-MM-DD HH:MM:SS"
   *
   * @param {string} val - Fecha en formato ISO
   * @returns {string} Fecha en formato "YYYY-MM-DD HH:MM:SS"
   */
  const toReportDateTime = (val) => {
    if (!val) return "";
    return String(val).replace("T", " ");
  };

  /**
   * Detecta si hay filtros de ubicación activos.
   *
   * @returns {boolean} true si hay al menos un filtro de ubicación seleccionado
   */
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

  /**
   * Abre el modal de filtros de ubicación.
   */
  const handleFilterPress = () => {
    setShowFiltersModal(true);
  };

  /**
   * Cierra el modal de filtros de ubicación.
   */
  const handleCloseModal = () => {
    setShowFiltersModal(false);
  };

  /**
   * Valida que el rango de fechas sea correcto.
   * Verifica que la fecha de inicio no sea mayor que la fecha fin.
   *
   * @returns {boolean} true si el rango es válido, false en caso contrario
   */
  const validarRango = () => {
    if (pedido.fechaInicio && pedido.fechaFin) {
      const ini = new Date(pedido.fechaInicio);
      const fin = new Date(pedido.fechaFin);
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
   * Construye las condiciones SQL dinámicas para el reporte general de pedidos.
   * Incluye filtros de empresa, pedido, categoría de estado, rango de fechas y ubicación.
   *
   * @returns {Object} Objeto con propiedad 'condicion' conteniendo las condiciones SQL indexadas
   */
  const buildCondicionEmpresa = () => {
    const condiciones = {};
    let index = 0;

    // Condición obligatoria: empresa
    condiciones[index++] =
      `p.ped_empresa_id = ${empresaSeleccionada?.empresaId}`;

    // Condición de pedido específico
    if (pedido.pedidoId) {
      condiciones[index++] = `AND p.ped_id = ${pedido.pedidoId}`;
    }

    // Condición de categoría estado
    if (pedido.categoriaEstadoId) {
      condiciones[index++] =
        `AND est.est_estado_categoria_id = ${pedido.categoriaEstadoId}`;
    }

    // Condición de rango de fechas
    if (pedido.fechaInicio && pedido.fechaFin) {
      const inicio = toReportDateTime(pedido.fechaInicio).split(" ")[0];
      const fin = toReportDateTime(pedido.fechaFin).split(" ")[0];
      condiciones[index++] =
        `AND p.ped_fecha_hora BETWEEN "${inicio}" AND "${fin}"`;
    }

    // Condiciones de ubicación usando el hook
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

  /**
   * Construye el payload para el endpoint de reporte específico de pedido.
   * Se usa cuando se selecciona un pedido específico y una categoría de estado.
   *
   * @returns {Object} Objeto con los parámetros del reporte específico
   */
  const buildPedidoReporteEspecifico = () => {
    return {
      categoria_estado_id: parseInt(pedido.categoriaEstadoId),
      emp_id: parseInt(empresaSeleccionada?.empresaId),
      ped_id: parseInt(pedido.pedidoId),
      ...(pedido.fechaInicio
        ? { fecha_inicio: toReportDateTime(pedido.fechaInicio) }
        : {}),
      ...(pedido.fechaFin
        ? { fecha_fin: toReportDateTime(pedido.fechaFin) }
        : {}),
    };
  };

  /**
   * Manejador para cambio de pedido seleccionado.
   *
   * @param {number|string} value - ID del pedido seleccionado
   */
  const handlePedidoChange = (value) => {
    setPedido((prev) => ({ ...prev, pedidoId: value }));
  };

  /**
   * Manejador para cambio de categoría de estado seleccionada.
   *
   * @param {number|string} value - ID de la categoría de estado
   */
  const handleCategoriaEstadoChange = (value) => {
    setPedido((prev) => ({ ...prev, categoriaEstadoId: value }));
  };

  /**
   * Manejador para cambio de fecha de inicio.
   *
   * @param {string} value - Fecha de inicio
   */
  const handleFechaInicioChange = (value) => {
    setPedido((prev) => ({ ...prev, fechaInicio: value }));
  };

  /**
   * Manejador para cambio de fecha fin.
   *
   * @param {string} value - Fecha fin
   */
  const handleFechaFinChange = (value) => {
    setPedido((prev) => ({ ...prev, fechaFin: value }));
  };

  /**
   * Carga inicial de datos: pedidos, categorías de estado y ubicaciones.
   * Se ejecuta una vez al montar el componente si existe token.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) return;

      setLoadingData(true);
      try {
        const [pedidosRes, categoriasRes] = await Promise.all([
          fetch(`${API_URL}${API_URL_PEDIDO}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}${API_URL_ESTADO_CATEGORIA}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const pedidosData = await pedidosRes.json();
        const categoriasData = await categoriasRes.json();

        setMainData({
          pedidos: asArray(pedidosData),
          categoriasEstado: asArray(categoriasData),
        });

        // Cargar países para ubicación usando el hook
        await locationFilters.loadInitialData();
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        Alert.alert("Error", "Error cargando datos iniciales");
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [token]);

  /**
   * Busca pedidos según los filtros seleccionados.
   * Si no hay pedido específico, lista todos los pedidos filtrados por fecha.
   * Si hay pedido específico, obtiene los detalles del pedido y sus artículos.
   *
   * @async
   * @function
   */
  const buscarPedido = async () => {
    if (!validarRango()) return;

    setPedidoData(null);
    setArticulos([]);
    setResultados([]);
    setLoadingPedido(true);

    try {
      if (!pedido.pedidoId) {
        // Sin pedido específico -> listar pedidos con filtros
        const response = await fetch(`${API_URL}${API_URL_PEDIDO}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener pedidos");
        }

        const data = await response.json();
        const allPedidos = asArray(data);

        // Filtrar por rango de fechas si se especifica
        let filteredPedidos = allPedidos;
        if (pedido.fechaInicio || pedido.fechaFin) {
          const ini = pedido.fechaInicio ? new Date(pedido.fechaInicio) : null;
          const fin = pedido.fechaFin ? new Date(pedido.fechaFin) : null;

          filteredPedidos = allPedidos.filter((p) => {
            const f = getFecha(p);
            if (!f) return true;
            const d = new Date(f);
            if (isNaN(d.getTime())) return true;
            if (ini && d < ini) return false;
            if (fin && d > fin) return false;
            return true;
          });
        }

        setResultados(filteredPedidos);
        Alert.alert(
          "Resultados",
          `Se encontraron ${filteredPedidos.length} pedido(s).`,
        );
        return;
      }

      // Con pedido específico -> obtener detalle
      // Reemplazar {id} en la URL con el pedidoId real
      const articulosUrl = API_URL_PEDIDO_ARTICULOS.replace(
        "{id}",
        pedido.pedidoId,
      );

      const [pedidoRes, articulosRes] = await Promise.all([
        fetch(`${API_URL}${API_URL_PEDIDO}/${pedido.pedidoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}${articulosUrl}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!pedidoRes.ok || !articulosRes.ok) {
        throw new Error("Error al obtener datos del pedido");
      }

      const pedidoDataRes = await pedidoRes.json();
      const articulosData = await articulosRes.json();

      setPedidoData(pedidoDataRes);
      setArticulos(asArray(articulosData));
      Alert.alert("Éxito", "Datos del pedido cargados correctamente.");
    } catch (error) {
      console.error("Error al buscar pedido:", error);
      Alert.alert("Error", "No se encontró el pedido o error en la búsqueda.");
    } finally {
      setLoadingPedido(false);
    }
  };

  /**
   * Genera un reporte PDF de pedidos según los filtros seleccionados.
   * Utiliza dos endpoints diferentes según los filtros:
   * - API_URL_REPORT_PEDIDO: cuando hay pedido específico y categoría de estado
   * - API_URL_REPORT_PEDIDO_V2: para reportes generales con condiciones dinámicas
   *
   * El PDF generado se guarda en caché y se comparte con el usuario.
   *
   * @async
   * @function
   * @throws {Error} Si no hay sesión activa o si falla la generación del reporte
   */
  const generarReporte = async () => {
    console.log("=== INICIANDO GENERACIÓN DE REPORTE PEDIDO V2 ===");

    if (!validarRango()) return;

    if (!token || !empresaSeleccionada?.empresaId) {
      Alert.alert("Error", "No hay sesión activa o empresa seleccionada.");
      return;
    }

    setGeneratingReport(true);

    try {
      let urlCompleta, payload;

      // Caso específico: pedido + categoría -> endpoint original
      if (pedido.pedidoId && pedido.categoriaEstadoId) {
        urlCompleta = `${API_URL}${API_URL_REPORT_PEDIDO}`;
        payload = buildPedidoReporteEspecifico();
        console.log("Usando endpoint específico:", urlCompleta);
      } else {
        // Caso general: empresa con filtros -> nuevo endpoint
        urlCompleta = `${API_URL}${API_URL_REPORT_PEDIDO_V2}`;
        payload = buildCondicionEmpresa();
        console.log("Usando endpoint condiciones:", urlCompleta);
      }

      console.log("Payload enviado:", JSON.stringify(payload, null, 2));

      const response = await fetch(urlCompleta, {
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

      console.log("Status respuesta:", response.status);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorBody = await response.json();
            errorMessage += ` - ${JSON.stringify(errorBody)}`;
          } else {
            const errorText = await response.text();
            if (errorText) errorMessage += ` - ${errorText}`;
          }
        } catch (e) {
          console.log("No se pudo leer el cuerpo del error:", e.message);
        }
        throw new Error(errorMessage);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log("Archivo recibido:", arrayBuffer.byteLength, "bytes");

      if (arrayBuffer.byteLength === 0) {
        throw new Error("El archivo recibido está vacío");
      }

      // Convertir ArrayBuffer a base64
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );

      // Guardar archivo en caché local
      const filename = `reporte_pedido_${Date.now()}.pdf`;
      const uri = FileSystem.cacheDirectory + filename;

      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: "base64",
      });

      console.log("Archivo guardado en:", uri);

      // Compartir archivo si está disponible la funcionalidad
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartir Reporte de Pedido",
        });
      } else {
        Alert.alert("Éxito", "Reporte generado correctamente");
      }

      console.log("Proceso completado exitosamente");
    } catch (error) {
      console.error("Error completo:", error);
      Alert.alert("Error", `No se pudo generar el reporte: ${error.message}`);
    } finally {
      setGeneratingReport(false);
      console.log("=== FIN GENERACIÓN DE REPORTE PEDIDO V2 ===");
    }
  };

  // Configuración para el componente de resultados
  const resultadosConfig = useSearchResultsConfig("pedidos", {
    getFecha,
    formatFecha,
  });

  // Pantalla de carga inicial
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
        title={t("reportePedido.title")}
        description={t("reportePedido.description")}
        onBackPress={() => navigation.navigate("Reports")}
        onFilterPress={handleFilterPress}
        filterActive={hasActiveFilters()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageContent}>
          {/* === FILTROS PRINCIPALES === */}
          <View style={styles.mainFiltersContainer}>
            <CustomPicker
              label={t("reportePedido.filterPedido")}
              items={mainData.pedidos}
              selectedValue={pedido.pedidoId}
              onValueChange={handlePedidoChange}
            />

            <CustomPicker
              label={t("reportePedido.filterCategoriaEstado")}
              items={mainData.categoriasEstado}
              selectedValue={pedido.categoriaEstadoId}
              onValueChange={handleCategoriaEstadoChange}
            />

            <DateTimeInput
              label={t("filters.fechaInicio")}
              value={pedido.fechaInicio}
              onChangeText={handleFechaInicioChange}
              placeholder="DD/MM/AAAA"
            />

            <DateTimeInput
              label={t("filters.fechaFin")}
              value={pedido.fechaFin}
              onChangeText={handleFechaFinChange}
              placeholder="DD/MM/AAAA"
            />
          </View>

          {/* === BOTONES DE ACCIÓN === */}
          <ActionButtons
            onSearch={buscarPedido}
            onGenerateReport={generarReporte}
            loadingPedido={loadingPedido}
            generatingReport={generatingReport}
          />

          {/* === RESULTADOS === */}
          {pedidoData && (
            <PedidoInfo
              pedidoData={pedidoData}
              articulos={articulos}
              formatFecha={formatFecha}
            />
          )}

          {resultados.length > 0 && (
            <GenericSearchResults
              data={resultados}
              config={useSearchResultsConfig("pedidos", {
                getFecha,
                formatFecha,
              })}
            />
          )}

          {/* Loading indicator */}
          {(loadingPedido || generatingReport) && (
            <View style={styles.loadingReport}>
              <ActivityIndicator size="small" color={colors.secondary} />
              <Text style={styles.loadingReportText}>
                {loadingPedido ? t("filters.loadingData") : t("filters.generatingReport")}
              </Text>
            </View>
          )}
        </View>

        {/* === MODAL DE FILTROS DE UBICACIÓN === */}
        <Modal
          visible={showFiltersModal}
          animationType="slide"
          onRequestClose={handleCloseModal}
          statusBarTranslucent
        >
          <SafeAreaView style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("filters.locationTitle")}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Contenido scrolleable */}
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

            {/* Footer fijo */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleCloseModal}
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
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  pageContent: {
    paddingHorizontal: 16,
  },
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
  // Estilos del modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
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
  modalTitle: {
    ...typography.bold.large,
    color: colors.text,
  },
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
  modalContent: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
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
  applyButtonText: {
    ...typography.semibold.medium,
    color: colors.white,
  },
});
