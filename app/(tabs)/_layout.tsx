import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon sf="house.fill" md="home" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="explore">
          <Label>Explore</Label>
          <Icon sf="paperplane.fill" md="send" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="settings">
          <Label>Settings</Label>
          <Icon sf="gearshape.fill" md="gear" />
          </NativeTabs.Trigger>
      </NativeTabs>
  );
}
