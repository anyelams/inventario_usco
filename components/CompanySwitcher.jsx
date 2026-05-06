// components/CompanySwitcher.jsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo from "../components/Logo";
import { colors } from "../config/theme";
import { typography } from "../config/typography";
import { useSession } from "../context/SessionContext";
import DropdownEmpresas from "./DropdownEmpresas";
/**
 * Formatea nombres de roles removiendo prefijos y aplicando capitalización
 * @param {string} roleName - Nombre del rol a formatear
 * @returns {string} - Nombre del rol formateado
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
 * Agrupa los roles por empresa para facilitar la visualización
 * @param {Array} rolesByCompany - Array de roles y empresas
 * @returns {Array} - Array agrupado por empresa con sus roles
 */
const agruparRolesByCompany = (rolesByCompany) => {
  if (!rolesByCompany || rolesByCompany.length === 0) return [];

  return rolesByCompany.reduce((acc, item) => {
    const existente = acc.find((e) => e.empresaId === item.empresaId);
    const rol = { rolId: item.rolId, rolNombre: item.rolNombre };

    if (existente) {
      existente.roles.push(rol);
    } else {
      acc.push({
        empresaId: item.empresaId,
        empresaNombre: item.empresaNombre,
        roles: [rol],
      });
    }
    return acc;
  }, []);
};

/**
 * Componente para cambiar entre empresas y roles del usuario
 * Puede funcionar como modal o pantalla completa. Permite al usuario
 * seleccionar una empresa y rol diferente para cambiar su contexto actual.
 * @param {Object} props
 * @param {boolean} [props.visible=true] - Si el componente está visible
 * @param {Function} [props.onClose=null] - Función llamada al cerrar (indica modo modal)
 * @param {Function} [props.onSwitch=null] - Función llamada después de cambiar exitosamente
 * @param {boolean} [props.asModal=false] - Fuerza el modo modal
 */
export default function CompanySwitcher({
  visible = true,
  onClose = null,
  onSwitch = null,
  asModal = false,
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    rolesByCompany,
    empresaSeleccionada,
    cambiarContexto,
    tieneMultiplesOpciones,
  } = useSession();

  // Estados locales del componente
  const [seleccion, setSeleccion] = useState({
    empresaId: empresaSeleccionada?.empresaId,
    rolId: empresaSeleccionada?.rolId,
  });
  const [cambiando, setCambiando] = useState(false);
  const [modalVisible, setModalVisible] = useState(visible);

  // Determinar si debe funcionar como modal
  const isModal = asModal || onClose !== null;

  // Optimización: memoizar el agrupamiento de datos
  const agrupado = useMemo(() => {
    return agruparRolesByCompany(rolesByCompany);
  }, [rolesByCompany]);

  /**
   * Sincronizar estado local con prop visible solo en modo modal
   */
  useEffect(() => {
    if (isModal) {
      setModalVisible(visible);
    }
  }, [visible, isModal]);

  /**
   * Resetear selección cuando se abre el componente
   */
  useEffect(() => {
    if (visible && empresaSeleccionada) {
      setSeleccion({
        empresaId: empresaSeleccionada.empresaId,
        rolId: empresaSeleccionada.rolId,
      });
    }
  }, [visible, empresaSeleccionada]);

  /**
   * Maneja la selección de empresa
   * @param {number} empresaId - ID de la empresa seleccionada
   * @param {Array} roles - Roles disponibles para la empresa
   */
  const handleSelectEmpresa = useCallback((empresaId, roles) => {
    setSeleccion({ empresaId, rolId: null });
  }, []);

  /**
   * Maneja la selección de rol
   * @param {number} empresaId - ID de la empresa
   * @param {number} rolId - ID del rol seleccionado
   */
  const handleSelectRol = useCallback((empresaId, rolId) => {
    setSeleccion({ empresaId, rolId });
  }, []);

  /**
   * Maneja el cierre del componente
   * En modo modal cierra el modal, sino navega hacia atrás
   */
  const handleClose = useCallback(() => {
    if (isModal) {
      setModalVisible(false);
      if (onClose) {
        onClose();
      }
    } else {
      navigation.goBack();
    }
  }, [isModal, onClose, navigation]);

  /**
   * Confirma y ejecuta el cambio de contexto
   * Valida la selección, llama al API y maneja el resultado
   */
  const handleConfirmar = useCallback(async () => {
    if (!seleccion?.empresaId || !seleccion?.rolId) {
      Alert.alert("Error", "Debes seleccionar una empresa y un rol");
      return;
    }

    // No hacer nada si la selección es la misma que la actual
    if (
      seleccion.empresaId === empresaSeleccionada?.empresaId &&
      seleccion.rolId === empresaSeleccionada?.rolId
    ) {
      handleClose();
      return;
    }

    setCambiando(true);

    try {
      await cambiarContexto(seleccion.empresaId, seleccion.rolId, true);

      handleClose();

      if (onSwitch) {
        onSwitch();
      }

      navigation.navigate("Home");
      Alert.alert(
        "Éxito",
        "Empresa y rol cambiados correctamente. Redirigiendo al inicio...",
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "No se pudo cambiar el contexto. Intenta nuevamente.",
      );
    } finally {
      setCambiando(false);
    }
  }, [seleccion, empresaSeleccionada, cambiarContexto, handleClose, onSwitch]);

  // No renderizar si no hay múltiples opciones
  if (!tieneMultiplesOpciones?.()) {
    return null;
  }

  // No renderizar modal si no está visible
  if (isModal && !modalVisible) {
    return null;
  }

  const isConfirmDisabled = !seleccion?.rolId || cambiando;

  /**
   * Renderiza el contenido principal del componente
   */
  const renderContent = () => (
    <SafeAreaView style={styles.container}>
      {/* Logo de la empresa */}
      <View
        style={[styles.logoContainer, { marginTop: isModal ? insets.top : 0 }]}
      >
        <Logo width={150} height={120} variant="light" />
      </View>

      {/* Botón de cerrar */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        disabled={cambiando}
        accessibilityLabel="Cerrar selector de empresa"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={24} color={colors.textSec} />
      </TouchableOpacity>

      {/* Título y subtítulo */}
      <Text style={styles.titulo}>Cambiar empresa</Text>
      <Text style={styles.subtitulo}>
        Selecciona la empresa y rol que deseas usar.
      </Text>

      {/* Dropdown de empresas y roles */}
      <View style={styles.dropdownContainer}>
        {agrupado && agrupado.length > 0 ? (
          <DropdownEmpresas
            data={agrupado}
            seleccion={seleccion}
            onSelectEmpresa={handleSelectEmpresa}
            onSelectRol={handleSelectRol}
          />
        ) : (
          // Estado vacío cuando no hay datos
          <View style={styles.noDataContainer}>
            <View style={styles.noDataIcon}>
              <Ionicons
                name="business-outline"
                size={48}
                color={colors.textSec}
              />
            </View>
            <Text style={styles.noDataText}>
              No se pudieron cargar las empresas
            </Text>
            <Text style={styles.noDataSubtext}>
              Verifica tu conexión e intenta nuevamente
            </Text>
          </View>
        )}
      </View>

      {/* Información del contexto actual */}
      <View style={styles.currentInfo}>
        <Text style={styles.currentLabel}>Empresa actual:</Text>
        <Text style={styles.currentValue}>
          {empresaSeleccionada?.empresaNombre || "No seleccionada"}
        </Text>
        <Text style={styles.currentLabel}>Rol actual:</Text>
        <Text style={styles.currentValue}>
          {formatRoleName(empresaSeleccionada?.rolNombre) || "No seleccionado"}
        </Text>
      </View>

      {/* Botón de confirmación */}
      <TouchableOpacity
        style={[
          styles.botonContinuar,
          isConfirmDisabled && styles.botonDeshabilitado,
          {
            position: "absolute",
            bottom: insets.bottom + 20,
            left: 20,
            right: 20,
          },
        ]}
        disabled={isConfirmDisabled}
        onPress={handleConfirmar}
        accessibilityLabel="Confirmar cambio de empresa y rol"
        accessibilityRole="button"
      >
        {cambiando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.white} />
            <Text style={styles.textoContinuar}>Cambiando...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.textoContinuar}>Confirmar cambio</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );

  // Renderizar como modal o contenido directo
  if (isModal) {
    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        {renderContent()}
      </Modal>
    );
  }

  return renderContent();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 0,
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.base,
  },
  titulo: {
    ...typography.semibold.large,
    fontSize: 20,
    color: colors.text,
    marginBottom: 5,
    textAlign: "center",
  },
  subtitulo: {
    ...typography.regular.regular,
    fontSize: 14,
    color: colors.textSec,
    marginBottom: 20,
    textAlign: "center",
  },
  dropdownContainer: {
    flex: 1,
    paddingTop: 10,
  },
  // Estado vacío cuando no hay empresas
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  noDataIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: colors.base,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  noDataText: {
    ...typography.semibold.regular,
    fontSize: 16,
    color: colors.textSec,
    textAlign: "center",
    marginBottom: 8,
  },
  noDataSubtext: {
    ...typography.regular.small,
    fontSize: 12,
    color: colors.textSec,
    textAlign: "center",
    opacity: 0.7,
  },
  // Información del contexto actual
  currentInfo: {
    backgroundColor: colors.base,
    padding: 16,
    borderRadius: 12,
    marginBottom: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentLabel: {
    ...typography.semibold.small,
    fontSize: 12,
    color: colors.textSec,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currentValue: {
    ...typography.regular.regular,
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  // Botón principal de confirmación
  botonContinuar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    padding: 14,
    borderRadius: 12,
    shadowColor: colors.secondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  botonDeshabilitado: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  textoContinuar: {
    ...typography.semibold.regular,
    color: colors.white,
    marginRight: 6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
