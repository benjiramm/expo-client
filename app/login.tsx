import * as AuthSession from "expo-auth-session";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/auth";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const { login } = useAuth();
    const [instanceUrl, setInstanceUrl] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scanned, setScanned] = useState(false);

    const [cameraPermission, requestCameraPermission] = useCameraPermissions();

    const redirectUri = AuthSession.makeRedirectUri({
        scheme: "expoclient",
        path: "auth-callback",
    });
    const clientId = "https://benjiramm.github.io/expo-client/";

    async function handleConnect(urlOverride?: string) {
        const url = (urlOverride ?? instanceUrl).trim().replace(/\/$/, "");
        if (!url) {
            setError("Please enter your Home Assistant URL");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const authUrl =
                `${url}/auth/authorize` +
                `?response_type=code` +
                `&client_id=${encodeURIComponent(clientId)}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}`;

            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                redirectUri,
            );

            console.log("redirectUri", redirectUri);
            if (result.type === "success") {
                const parsed = Linking.parse(result.url);
                const code = parsed.queryParams?.code as string | undefined;
                if (code) {
                    await login(url, code, redirectUri, clientId);
                } else {
                    setError("Authentication failed. Please try again.");
                }
            } else if (result.type === "cancel" || result.type === "dismiss") {
                // user closed the browser, do nothing
            }
        } catch (e) {
            console.error(e);
            setError(
                "Could not connect to Home Assistant. Check the URL and try again.",
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleScanPress() {
        if (!cameraPermission?.granted) {
            const result = await requestCameraPermission();
            if (!result.granted) return;
        }
        setScanned(false);
        setScannerOpen(true);
    }

    function handleBarcodeScan({ data }: { data: string }) {
        if (scanned) return;
        setScanned(true);
        setScannerOpen(false);

        // Accept raw URLs or homeassistant:// deep links
        let url = data;
        if (url.startsWith("homeassistant://")) {
            url = url.replace("homeassistant://", "http://");
        }

        setInstanceUrl(url);
        handleConnect(url);
    }

    return (
        <>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ThemedView style={styles.inner}>
                    <ThemedText type="title" style={styles.title}>
                        Lights
                    </ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Connect to your Home Assistant instance
                    </ThemedText>

                    <TextInput
                        style={styles.input}
                        placeholder="http://homeassistant.local:8123"
                        placeholderTextColor="#888"
                        value={instanceUrl}
                        onChangeText={setInstanceUrl}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        returnKeyType="go"
                        onSubmitEditing={() => handleConnect()}
                        editable={!loading}
                    />

                    {error ? (
                        <ThemedText style={styles.error}>{error}</ThemedText>
                    ) : null}

                    <TouchableOpacity
                        style={[
                            styles.button,
                            loading && styles.buttonDisabled,
                        ]}
                        onPress={() => handleConnect()}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <ThemedText style={styles.buttonText}>
                                Connect
                            </ThemedText>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <ThemedText style={styles.dividerLabel}>or</ThemedText>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.buttonOutline,
                            loading && styles.buttonDisabled,
                        ]}
                        onPress={handleScanPress}
                        disabled={loading}
                    >
                        <ThemedText style={styles.buttonOutlineText}>
                            Scan QR Code
                        </ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </KeyboardAvoidingView>

            <Modal
                visible={scannerOpen}
                animationType="slide"
                onRequestClose={() => setScannerOpen(false)}
            >
                <View style={styles.scannerContainer}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        facing="back"
                        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                        onBarcodeScanned={handleBarcodeScan}
                    />

                    <View style={styles.scannerOverlay}>
                        <View style={styles.scannerFrame} />
                    </View>

                    <Pressable
                        style={styles.closeButton}
                        onPress={() => setScannerOpen(false)}
                    >
                        <ThemedText style={styles.closeButtonText}>
                            Cancel
                        </ThemedText>
                    </Pressable>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 32,
        gap: 16,
    },
    title: {
        textAlign: "center",
        marginBottom: 4,
    },
    subtitle: {
        textAlign: "center",
        opacity: 0.6,
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: "#000",
    },
    error: {
        color: "#e53e3e",
        textAlign: "center",
    },
    button: {
        backgroundColor: "#0ea5e9",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#ccc",
    },
    dividerLabel: {
        opacity: 0.5,
        fontSize: 13,
    },
    buttonOutline: {
        borderWidth: 1.5,
        borderColor: "#0ea5e9",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    buttonOutlineText: {
        color: "#0ea5e9",
        fontWeight: "600",
        fontSize: 16,
    },
    scannerContainer: {
        flex: 1,
        backgroundColor: "#000",
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
    },
    scannerFrame: {
        width: 240,
        height: 240,
        borderWidth: 2,
        borderColor: "#fff",
        borderRadius: 16,
        backgroundColor: "transparent",
    },
    closeButton: {
        position: "absolute",
        bottom: 48,
        alignSelf: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    closeButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
