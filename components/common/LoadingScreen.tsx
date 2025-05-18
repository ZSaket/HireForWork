
import { View, ActivityIndicator } from 'react-native';
import React from 'react';
import { COLORS } from '@/constants/theme';

export default function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}