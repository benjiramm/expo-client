import {
    Auth,
    createConnection,
    type AuthData,
    type Connection,
} from "home-assistant-js-websocket";
import { useEffect, useRef, useState } from "react";

import { HA_CLIENT_ID, useAuth } from "@/context/auth";
import * as SecureStore from "expo-secure-store";

/**
 * Creates a Home Assistant WebSocket connection using the existing OAuth tokens.
 *
 * The HA WS SDK's Auth class expects an AuthData object with token info
 * and a way to refresh tokens. We bridge our SecureStore-backed tokens
 * into that interface.
 */
export function useHAConnection() {
    const { auth } = useAuth();
    const [connection, setConnection] = useState<Connection | null>(null);
    const [error, setError] = useState<string | null>(null);
    const connectionRef = useRef<Connection | null>(null);

    useEffect(() => {
        if (auth.status !== "authenticated") {
            connectionRef.current?.close();
            connectionRef.current = null;
            setConnection(null);
            return;
        }

        let cancelled = false;

        async function connect() {
            if (auth.status !== "authenticated") return;

            try {
                const refreshToken =
                    await SecureStore.getItemAsync("ha_refresh_token");
                const expiresAt =
                    await SecureStore.getItemAsync("ha_expires_at");

                if (!refreshToken) {
                    setError("No refresh token available");
                    return;
                }

                // expires: millisecond timestamp (SDK compares Date.now() > expires)
                // expires_in: duration in seconds
                const expiresAtMs = expiresAt
                    ? parseInt(expiresAt, 10)
                    : Date.now() + 1800 * 1000;
                const expiresInSec = Math.max(
                    0,
                    Math.floor((expiresAtMs - Date.now()) / 1000),
                );

                // Build the AuthData object the HA SDK expects
                const authData: AuthData = {
                    hassUrl: auth.instanceUrl,
                    clientId: HA_CLIENT_ID,
                    expires: expiresAtMs,
                    refresh_token: refreshToken,
                    access_token: auth.accessToken,
                    expires_in: expiresInSec,
                };

                // Save tokens back to SecureStore when the SDK refreshes them
                const saveTokens = async (data: AuthData | null) => {
                    if (!data) return;
                    await Promise.all([
                        SecureStore.setItemAsync(
                            "ha_access_token",
                            data.access_token,
                        ),
                        SecureStore.setItemAsync(
                            "ha_expires_at",
                            String(Date.now() + data.expires_in * 1000),
                        ),
                    ]);
                };

                const haAuth = new Auth(authData, saveTokens);

                const conn = await createConnection({ auth: haAuth });

                if (cancelled) {
                    conn.close();
                    return;
                }

                connectionRef.current = conn;
                setConnection(conn);
                setError(null);
            } catch (e) {
                console.log(e);
                if (!cancelled) {
                    console.error("HA connection error:", e);
                    setError("Failed to connect to Home Assistant");
                }
            }
        }

        connect();

        return () => {
            cancelled = true;
            connectionRef.current?.close();
            connectionRef.current = null;
        };
    }, [
        auth.status,
        auth.status === "authenticated" ? auth.instanceUrl : null,
    ]);

    return { connection, error };
}
