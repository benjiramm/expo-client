import { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { subscribeEntities, type HassEntities } from 'home-assistant-js-websocket';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useHAConnection } from '@/hooks/use-ha-connection';

export default function HomeScreen() {
  const { connection, error } = useHAConnection();
  const [entities, setEntities] = useState<HassEntities>({});

  useEffect(() => {
    if (!connection) return;
    const unsub = subscribeEntities(connection, (ents) => setEntities(ents));
    return () => { unsub(); };
  }, [connection]);

  const entityList = Object.values(entities);

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.error}>{error}</ThemedText>
      </ThemedView>
    );
  }

  if (!connection) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Connecting to Home Assistant...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={entityList}
      keyExtractor={(item) => item.entity_id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <ThemedView style={styles.entityRow}>
          <ThemedText style={styles.entityId}>{item.entity_id}</ThemedText>
          <ThemedText style={styles.entityState}>{item.state}</ThemedText>
        </ThemedView>
      )}
      ListHeaderComponent={
        <ThemedText type="title" style={styles.header}>
          Entities ({entityList.length})
        </ThemedText>
      }
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
  entityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  entityId: {
    fontSize: 13,
    flex: 1,
  },
  entityState: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});
