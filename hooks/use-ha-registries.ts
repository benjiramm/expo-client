import { useEffect, useState } from "react";
import type { Connection } from "home-assistant-js-websocket";

// These types reflect what HA's WebSocket API returns.
// They may not be exhaustive — HA can add fields across versions.
// Check your actual response if something seems missing.

export type HAArea = {
    area_id: string;
    name: string;
    icon: string | null;
    floor_id: string | null;
    labels: string[];
};

export type HAEntityRegistryEntry = {
    entity_id: string;
    name: string | null;
    area_id: string | null;
    device_id: string | null;
    platform: string;
    disabled_by: string | null;
    hidden_by: string | null;
    labels: string[];
};

/**
 * Fetches the area registry and entity registry from Home Assistant
 * using raw WebSocket commands.
 *
 * These are "undocumented" commands that the HA frontend uses internally.
 * You can discover more by watching WebSocket traffic in your browser's
 * DevTools while using the HA dashboard.
 */
export function useHARegistries(connection: Connection | null) {
    const [areas, setAreas] = useState<HAArea[]>([]);
    const [entityRegistry, setEntityRegistry] = useState<HAEntityRegistryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!connection) {
            setLoading(true);
            return;
        }

        let cancelled = false;

        async function fetchRegistries() {
            try {
                // Fetch both registries in parallel
                const [areasResult, entitiesResult] = await Promise.all([
                    connection!.sendMessagePromise<HAArea[]>({
                        type: "config/area_registry/list",
                    }),
                    connection!.sendMessagePromise<HAEntityRegistryEntry[]>({
                        type: "config/entity_registry/list",
                    }),
                ]);

                if (!cancelled) {
                    setAreas(areasResult);
                    setEntityRegistry(entitiesResult);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to fetch HA registries:", err);
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchRegistries();

        return () => {
            cancelled = true;
        };
    }, [connection]);

    return { areas, entityRegistry, loading };
}
