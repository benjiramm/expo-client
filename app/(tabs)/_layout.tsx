import MIcons from "@expo/vector-icons/MaterialIcons";
import {
    Icon,
    Label,
    NativeTabs,
    VectorIcon,
} from "expo-router/unstable-native-tabs";

export default function TabLayout() {
    return (
        <NativeTabs>
            <NativeTabs.Trigger name="index">
                <Label>Home</Label>
                <Icon
                    sf="house.fill"
                    androidSrc={<VectorIcon family={MIcons} name="home" />}
                />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="explore">
                <Label>Explore</Label>
                <Icon
                    sf="paperplane.fill"
                    androidSrc={<VectorIcon family={MIcons} name="send" />}
                />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="settings">
                <Label>Settings</Label>
                <Icon
                    sf="gearshape.fill"
                    androidSrc={
                        <VectorIcon family={MIcons} name="settings" />
                    }
                />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
