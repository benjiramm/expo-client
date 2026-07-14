import { StyleSheet, TouchableOpacity } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { useAuth } from "@/context/auth";

export default function TabTwoScreen() {
    const { auth, logout } = useAuth();

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
            headerImage={
                <IconSymbol
                    size={310}
                    color="#808080"
                    name="chevron.left.forwardslash.chevron.right"
                    style={styles.headerImage}
                />
            }
        >
            <ThemedView style={styles.titleContainer}>
                <ThemedText
                    type="title"
                    style={{
                        fontFamily: Fonts.rounded,
                    }}
                >
                    Settings
                </ThemedText>
            </ThemedView>

            {auth.status === "authenticated" && (
                <ThemedView style={styles.section}>
                    <ThemedText type="subtitle">Connected to</ThemedText>
                    <ThemedText selectable>{auth.instanceUrl}</ThemedText>

                    <ThemedText type="subtitle" style={{ marginTop: 16 }}>
                        Access Token
                    </ThemedText>
                    <ThemedText selectable style={styles.token}>
                        {auth.accessToken}
                    </ThemedText>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={logout}
                    >
                        <ThemedText style={styles.logoutText}>
                            Disconnect
                        </ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            )}
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    headerImage: {
        color: "#808080",
        bottom: -90,
        left: -35,
        position: "absolute",
    },
    titleContainer: {
        flexDirection: "row",
        gap: 8,
    },
    section: {
        gap: 4,
    },
    token: {
        fontFamily: "monospace",
        fontSize: 12,
        opacity: 0.6,
    },
    logoutButton: {
        marginTop: 24,
        backgroundColor: "#e53e3e",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    logoutText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
