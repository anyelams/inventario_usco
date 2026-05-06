// components/DropdownEmpresas.jsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

/**
 * Formatea nombres de roles removiendo prefijos y aplicando capitalización
 */
const formatRoleName = (roleName) => {
  if (!roleName) return "Rol sin nombre";
  return roleName
    .replace(/^ROLE_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Dropdown expansible para seleccionar empresas y roles
 */
export default function DropdownEmpresas({
  data = [],
  seleccion,
  onSelectEmpresa,
  onSelectRol,
}) {
  const [empresaExpandida, setEmpresaExpandida] = useState(null);
  const [animatedValues, setAnimatedValues] = useState({});

  useEffect(() => {
    const values = {};
    data.forEach((item) => {
      values[item.empresaId] = new Animated.Value(0);
    });
    setAnimatedValues(values);

    // Auto-expandir si solo hay una empresa
    if (data && data.length === 1 && !empresaExpandida) {
      setEmpresaExpandida(data[0].empresaId);
      setTimeout(() => {
        Animated.timing(values[data[0].empresaId], {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }, 100);
    }
  }, [data]);

  const handleEmpresaPress = (empresaId, roles) => {
    const isCurrentlyExpanded = empresaExpandida === empresaId;
    const newExpanded = isCurrentlyExpanded ? null : empresaId;

    setEmpresaExpandida(newExpanded);

    if (animatedValues[empresaId]) {
      Animated.timing(animatedValues[empresaId], {
        toValue: isCurrentlyExpanded ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    if (onSelectEmpresa) onSelectEmpresa(empresaId, roles);
  };

  const handleRolPress = (empresaId, rolId) => {
    if (onSelectRol) onSelectRol(empresaId, rolId);
  };

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay empresas disponibles</Text>
        <Text style={styles.emptySubtext}>Contacta al administrador</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        {data.map((item) => {
          const isExpandida = item.empresaId === empresaExpandida;
          const seleccionActual = seleccion?.empresaId === item.empresaId;
          const animatedValue =
            animatedValues[item.empresaId] || new Animated.Value(0);

          const rolesHeight = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, (item.roles?.length || 0) * 60],
          });

          const rotateChevron = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "180deg"],
          });

          return (
            <View
              key={item.empresaId}
              style={[styles.card, seleccionActual && styles.cardActiva]}
            >
              {/* Header expansible */}
              <TouchableOpacity
                style={styles.empresaHeader}
                onPress={() => handleEmpresaPress(item.empresaId, item.roles)}
                activeOpacity={0.7}
              >
                <View style={styles.empresaContent}>
                  <View style={styles.empresaInfo}>
                    <Text
                      style={[
                        styles.empresaNombre,
                        seleccionActual && styles.empresaNombreActiva,
                      ]}
                      numberOfLines={1}
                    >
                      {item.empresaNombre || "Empresa sin nombre"}
                    </Text>
                    <Text style={styles.rolesCount}>
                      {item.roles?.length || 0} rol
                      {(item.roles?.length || 0) !== 1 ? "es" : ""}
                    </Text>
                  </View>
                </View>

                <Animated.View
                  style={[
                    styles.chevronContainer,
                    { transform: [{ rotate: rotateChevron }] },
                  ]}
                >
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textSec}
                  />
                </Animated.View>
              </TouchableOpacity>

              {/* Roles */}
              <Animated.View
                style={[
                  styles.rolesAnimatedContainer,
                  { height: isExpandida ? rolesHeight : 0 },
                ]}
              >
                <View style={styles.rolesContainer}>
                  {item.roles && item.roles.length > 0 ? (
                    item.roles.map((rol, rolIndex) => {
                      const isSelected =
                        seleccion?.empresaId === item.empresaId &&
                        seleccion?.rolId === rol.rolId;

                      return (
                        <TouchableOpacity
                          key={rol.rolId || rolIndex}
                          style={[
                            styles.rolItem,
                            isSelected && styles.rolSeleccionado,
                          ]}
                          onPress={() =>
                            handleRolPress(item.empresaId, rol.rolId)
                          }
                          activeOpacity={0.7}
                        >
                          {isSelected && (
                            <View style={styles.selectedIndicator} />
                          )}

                          <Text
                            style={[
                              styles.rolNombre,
                              isSelected && styles.rolNombreSeleccionado,
                            ]}
                            numberOfLines={1}
                          >
                            {formatRoleName(rol.rolNombre)}
                          </Text>

                          {isSelected && (
                            <View style={styles.checkContainer}>
                              <Ionicons
                                name="checkmark-circle"
                                size={18}
                                color={colors.secondary}
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.noRolesContainer}>
                      <Text style={styles.noRolesText}>
                        No hay roles disponibles
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  content: { paddingHorizontal: 0 },

  // Tarjetas
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActiva: {
    borderColor: colors.secondary + "30",
    shadowOpacity: 0.1,
  },

  // Header empresa
  empresaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    backgroundColor: colors.base,
    minHeight: 70,
  },
  empresaContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  empresaInfo: { flex: 1 },
  empresaNombre: {
    ...typography.semibold.regular,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  empresaNombreActiva: { color: colors.secondary },
  rolesCount: {
    ...typography.regular.small,
    fontSize: 13,
    color: colors.textSec,
  },
  chevronContainer: { padding: 4 },

  // Roles
  rolesAnimatedContainer: { overflow: "hidden" },
  rolesContainer: { backgroundColor: colors.base },
  rolItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    paddingLeft: 24,
    backgroundColor: colors.base,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    minHeight: 60,
  },
  rolSeleccionado: { backgroundColor: "#F2F2F4", paddingLeft: 24 },
  selectedIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.secondary,
  },
  rolNombre: {
    ...typography.regular.regular,
    fontSize: 15,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  rolNombreSeleccionado: {
    ...typography.semibold.regular,
    color: colors.secondary,
  },
  checkContainer: { marginLeft: 12 },

  // Vacíos
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    ...typography.semibold.regular,
    fontSize: 16,
    color: colors.textSec,
    textAlign: "center",
    marginBottom: 6,
  },
  emptySubtext: {
    ...typography.regular.small,
    fontSize: 14,
    color: colors.textSec,
    textAlign: "center",
    opacity: 0.7,
  },
  noRolesContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: colors.base,
  },
  noRolesText: {
    ...typography.regular.regular,
    fontSize: 14,
    color: colors.textSec,
    textAlign: "center",
    fontStyle: "italic",
  },
});
