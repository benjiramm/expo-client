import * as WebBrowser from "expo-web-browser";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
    return (
        <ThemedView
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
            <ThemedText>Completing login...</ThemedText>
        </ThemedView>
    );
}
