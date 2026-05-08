import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useSession } from "../../context/SessionContext";

const INVENTARIOS = require("../../mock/inventarios_asignados.json");

const ESTADO_CONFIG = {
  1: { label: "Asignado", color: colors.warning, icon: "time-outline" },
  2: { label: "En proceso", color: colors.primary, icon: "sync-outline" },
  3: { label: "Finalizado", color: colors.success, icon: "checkmark-circle-outline" },
};

function formatFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EstadoBadge({ estadoId }) {
  const config = ESTADO_CONFIG[estadoId] ?? ESTADO_CONFIG[1];
  return (
    <View style={[styles.badge, { backgroundColor: config.color + "20", borderColor: config.color + "40" }]}>
      <Ionicons name={config.icon} size={13} color={config.color} />
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function InventarioCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardNombre} numberOfLines={1}>{item.nombre}</Text>
          <EstadoBadge estadoId={item.estadoId} />
        </View>
        <Text style={styles.cardDescripcion} numberOfLines={2}>{item.descripcion}</Text>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardFooter}>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={14} color={colors.textSec} />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {item.subSeccionNombre} · {item.seccionNombre}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSec} />
          <Text style={styles.cardMetaText}>{formatFecha(item.fechaHora)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function InventariosScreen() {
  const navigation = useNavigation();
  const { decodificarToken } = useSession();

  const userId = useMemo(() => {
    const claims = decodificarToken();
    return claims?.userId ?? 1;
  }, []);

  const inventarios = useMemo(
    () => INVENTARIOS.filter((inv) => inv.usuarioAsignadoId === userId),
    [userId],
  );

  const handleCardPress = (inventario) => {
    navigation.navigate("InventarioDetalle", { inventario });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Mis Inventarios"
        description="Inventarios asignados a ti"
        onBackPress={() => navigation.navigate("Tabs", { screen: "Home" })}
      />

      <View style={styles.statsRow}>
        {Object.entries(ESTADO_CONFIG).map(([id, cfg]) => {
          const count = inventarios.filter((i) => i.estadoId === Number(id)).length;
          return (
            <View key={id} style={styles.statChip}>
              <Ionicons name={cfg.icon} size={16} color={cfg.color} />
              <Text style={[styles.statCount, { color: cfg.color }]}>{count}</Text>
              <Text style={styles.statLabel}>{cfg.label}</Text>
            </View>
          );
        })}
      </View>

      <FlatList
        data={inventarios}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <InventarioCard item={item} onPress={handleCardPress} />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={56} color={colors.border} />
            <Text style={styles.emptyText}>No tienes inventarios asignados</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  statChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCount: {
    ...typography.semibold.regular,
  },
  statLabel: {
    ...typography.regular.small,
    color: colors.textSec,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  cardNombre: {
    ...typography.semibold.medium,
    color: colors.text,
    flex: 1,
  },
  cardDescripcion: {
    ...typography.regular.regular,
    color: colors.textSec,
    lineHeight: 18,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    ...typography.semibold.small,
    fontSize: 11,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  cardFooter: {
    gap: 4,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardMetaText: {
    ...typography.regular.small,
    color: colors.textSec,
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    ...typography.regular.large,
    color: colors.textSec,
  },
});
