// components/SearchResults.jsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

/**
 * Sistema de visualización de resultados de búsqueda genérico y reutilizable
 *
 * Incluye:
 * - GenericSearchResults: Componente base para listas de resultados
 * - PedidoInfo: Visualización específica para información de pedido
 * - searchResultsConfigs: Configuraciones predefinidas por tipo
 * - useSearchResultsConfig: Hook para usar configuraciones fácilmente
 *
 * @module SearchResults
 */

/**
 * Componente genérico para mostrar resultados de búsqueda
 * Renderiza una lista con título, ícono y items personalizables
 *
 * @param {Object} props
 * @param {Array} props.data - Array de datos a mostrar
 * @param {Object} props.config - Configuración del renderizado
 * @param {string} [props.config.title] - Título personalizado
 * @param {string} [props.config.icon] - Nombre del ícono Ionicons
 * @param {Function} props.config.renderItem - Función para renderizar cada item
 * @param {Function} [props.config.getItemKey] - Función para obtener key única
 * @param {string} [props.config.singularLabel] - Etiqueta singular
 * @param {string} [props.config.pluralLabel] - Etiqueta plural
 * @param {number} [props.maxVisible=8] - Máximo de items visibles
 */
export const GenericSearchResults = ({ data, config, maxVisible = 8 }) => {
  if (!data || data.length === 0) return null;

  const {
    title,
    icon = "search-outline",
    renderItem,
    getItemKey,
    singularLabel = "resultado",
    pluralLabel = "resultados",
  } = config;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={icon} size={20} color={colors.secondary} />
        <Text style={styles.title}>
          {title ||
            `${data.length} ${
              data.length === 1 ? singularLabel : pluralLabel
            } encontrados`}
        </Text>
      </View>

      <View style={styles.list}>
        {data.slice(0, maxVisible).map((item, index) => (
          <View
            key={getItemKey ? getItemKey(item, index) : item.id || index}
            style={[
              styles.listItem,
              index === Math.min(data.length, maxVisible) - 1 &&
                styles.lastItem,
            ]}
          >
            {renderItem(item, index)}
          </View>
        ))}
      </View>

      {data.length > maxVisible && (
        <Text style={styles.moreText}>
          y {data.length - maxVisible} {pluralLabel} más
        </Text>
      )}
    </View>
  );
};

/**
 * Componente específico para mostrar información detallada de un pedido
 *
 * @param {Object} props
 * @param {Object} props.pedidoData - Datos del pedido
 * @param {Array} props.articulos - Array de artículos del pedido
 * @param {Function} props.formatFecha - Función para formatear fechas
 */
export const PedidoInfo = ({ pedidoData, articulos, formatFecha }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Ionicons
        name="document-text-outline"
        size={20}
        color={colors.secondary}
      />
      <Text style={styles.title}>Información del Pedido</Text>
    </View>

    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.label}>ID</Text>
          <Text style={styles.value}>{pedidoData.id}</Text>
        </View>

        {pedidoData.fecha && (
          <View style={styles.item}>
            <Text style={styles.label}>Fecha</Text>
            <Text style={styles.value}>{formatFecha(pedidoData.fecha)}</Text>
          </View>
        )}

        <View style={styles.item}>
          <Text style={styles.label}>Artículos</Text>
          <Text style={styles.badge}>{articulos.length}</Text>
        </View>
      </View>
    </View>
  </View>
);

/**
 * Configuraciones predefinidas para diferentes tipos de reportes
 * Incluye: pedidos, kardex, productos
 *
 * Cada configuración define:
 * - icon: Ícono Ionicons a usar
 * - singularLabel/pluralLabel: Etiquetas de conteo
 * - getItemKey: Cómo obtener key única
 * - renderItem: Cómo renderizar cada item
 */
export const searchResultsConfigs = {
  pedidos: {
    icon: "list-outline",
    singularLabel: "Pedido",
    pluralLabel: "Pedidos",
    getItemKey: (item) => item.id,
    renderItem: (pedido, index, { getFecha, formatFecha }) => (
      <>
        <View style={styles.listHeader}>
          <Text style={styles.listId}>#{pedido.id}</Text>
          <Text style={styles.listDate}>
            Vence: {formatFecha(getFecha(pedido))}
          </Text>
        </View>
        {pedido.estado && (
          <Text style={styles.listStatus}>{pedido.estado}</Text>
        )}
      </>
    ),
  },
  kardex: {
    icon: "cube-outline",
    singularLabel: "Artículo",
    pluralLabel: "Artículos",
    getItemKey: (item, index) => item.id || index,
    renderItem: (articulo) => (
      <>
        <View style={styles.listHeader}>
          <Text style={styles.listId}>#{articulo.id || 0}</Text>
          <Text style={styles.listDate}>
            Cantidad: {articulo.cantidad || 0}
          </Text>
        </View>
      </>
    ),
  },

  productos: {
    icon: "cube-outline",
    singularLabel: "Producto",
    pluralLabel: "Productos",
    getItemKey: (item) => item.id,
    renderItem: (producto) => {
      // Función helper para obtener el nombre del producto
      // Intenta múltiples propiedades comunes en diferentes estructuras de respuesta
      const getNombre = (p) => {
        return (
          p.nombre ??
          p.name ??
          p.proNombre ??
          p.pro_nombre ??
          `Producto ${p.id}`
        );
      };

      // Función helper para obtener la descripción
      const getDescripcion = (p) => {
        return (
          p.descripcion ??
          p.description ??
          p.proDescripcion ??
          p.pro_descripcion ??
          null
        );
      };

      // Función helper para obtener el ID de categoría
      const getCategoriaId = (p) => {
        return (
          p.productoCategoriaId ??
          p.categoriaId ??
          p.producto_categoria_id ??
          p.proCategoriaId ??
          p.pro_categoria_id ??
          "N/A"
        );
      };

      const nombre = getNombre(producto);
      const descripcion = getDescripcion(producto);
      const categoriaId = getCategoriaId(producto);

      return (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listId}>#{producto.id}</Text>
            <Text style={styles.listName}>{nombre}</Text>
          </View>
          {descripcion && <Text style={styles.listStatus}>{descripcion}</Text>}
          <Text style={styles.listStatus}>Categoría: {categoriaId}</Text>
        </>
      );
    },
  },
};

/**
 * Hook para obtener configuración de resultados de búsqueda
 *
 * @param {string} type - Tipo de reporte ('pedidos'|'kardex'|'productos')
 * @param {Object} [extraProps={}] - Props extra para pasar a renderItem
 * @returns {Object|null} Configuración del tipo solicitado
 */
export const useSearchResultsConfig = (type, extraProps = {}) => {
  const baseConfig = searchResultsConfigs[type];

  if (!baseConfig) {
    console.warn(`Configuración no encontrada para tipo: ${type}`);
    return null;
  }

  return {
    ...baseConfig,
    renderItem: (item, index) => baseConfig.renderItem(item, index, extraProps),
  };
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginHorizontal: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  title: {
    ...typography.semibold.medium,
    color: colors.text,
  },

  // Card para info detallada
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  item: {
    flex: 1,
    minWidth: 80,
  },
  label: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginBottom: 4,
  },
  value: {
    ...typography.semibold.medium,
    color: colors.text,
  },
  badge: {
    ...typography.semibold.medium,
    color: colors.secondary,
    backgroundColor: colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    overflow: "hidden",
  },

  // Lista para múltiples resultados
  list: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    overflow: "hidden",
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  listId: {
    ...typography.semibold.medium,
    color: colors.secondary,
    backgroundColor: colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  listName: {
    ...typography.semibold.medium,
    color: colors.text,
    flex: 1,
  },
  listDate: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  listStatus: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginTop: 2,
  },
  listQuantity: {
    ...typography.regular.medium,
    color: colors.secondary,
    backgroundColor: colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  listDetail: {
    ...typography.regular.medium,
    color: colors.textSec,
    marginTop: 2,
  },

  // Más resultados
  moreText: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
});
