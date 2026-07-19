import { useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet } from 'react-native';
import { subscribeEntities, type HassEntities } from 'home-assistant-js-websocket';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useHAConnection } from '@/hooks/use-ha-connection';
import { useHARegistries, type HAArea } from '@/hooks/use-ha-registries';

type EntityRow = {
  entity_id: string;
  name: string;
  state: string;
};

type AreaSection = {
  area: HAArea | null;
  data: EntityRow[];
};

export default function HomeScreen() {
  const { connection, error } = useHAConnection();
  const { areas, entityRegistry, loading: registriesLoading } = useHARegistries(connection);
  const [entities, setEntities] = useState<HassEntities>({});

  useEffect(() => {
    if (!connection) return;
    const unsub = subscribeEntities(connection, (ents) => setEntities(ents));
    return () => { unsub(); };
  }, [connection]);

  // Build sections: group entity states by area using the registry data
  const sections = useMemo<AreaSection[]>(() => {
    const entityStates = Object.values(entities);
    if (entityStates.length === 0 || entityRegistry.length === 0) return [];

    // Build a lookup: entity_id -> area_id
    const entityToArea = new Map<string, string | null>();
    for (const entry of entityRegistry) {
      entityToArea.set(entry.entity_id, entry.area_id);
    }

    // Group entities by area_id
    const grouped = new Map<string | null, EntityRow[]>();
    for (const entity of entityStates) {
      const areaId = entityToArea.get(entity.entity_id) ?? null;
      if (!grouped.has(areaId)) {
        grouped.set(areaId, []);
      }
      grouped.get(areaId)!.push({
        entity_id: entity.entity_id,
        name: entity.attributes.friendly_name ?? entity.entity_id,
        state: entity.state,
      });
    }

    // Build an area lookup for quick access
    const areaMap = new Map(areas.map((a) => [a.area_id, a]));

    // Create sections: named areas first, then unassigned
    const result: AreaSection[] = [];

    for (const area of areas) {
      const areaEntities = grouped.get(area.area_id);
      if (areaEntities && areaEntities.length > 0) {
        result.push({ area, data: areaEntities });
      }
    }

    // Unassigned entities (area_id is null)
    const unassigned = grouped.get(null);
    if (unassigned && unassigned.length > 0) {
      result.push({ area: null, data: unassigned });
    }

    return result;
  }, [entities, entityRegistry, areas]);

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.error}>{error}</ThemedText>
      </ThemedView>
    );
  }

  if (!connection || registriesLoading) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Connecting to Home Assistant...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.entity_id}
      contentContainerStyle={styles.list}
      renderSectionHeader={({ section }) => (
        <ThemedView style={styles.sectionHeader}>
          <ThemedText type="subtitle">
            {section.area?.name ?? 'Unassigned'}
          </ThemedText>
          <ThemedText style={styles.entityCount}>
            {section.data.length}
          </ThemedText>
        </ThemedView>
      )}
      renderItem={({ item }) => (
        <ThemedView style={styles.entityRow}>
          <ThemedText style={styles.entityName}>{item.name}</ThemedText>
          <ThemedText style={styles.entityState}>{item.state}</ThemedText>
        </ThemedView>
      )}
      ListHeaderComponent={
        <ThemedText type="title" style={styles.header}>
          Dashboard
        </ThemedText>
      }
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  error: {
    color: '#e53e3e',
  },
  list: {
    padding: 16,
    paddingTop: 64,
  },
  header: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  entityCount: {
    fontSize: 13,
    opacity: 0.5,
  },
  entityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  entityName: {
    fontSize: 14,
    flex: 1,
  },
  entityState: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});
