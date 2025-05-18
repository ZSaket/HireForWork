
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ChatListScreen } from '../../../components/common/ChatComponents';
import { StatusBar } from 'expo-status-bar';

export default function WorkerChatsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ChatListScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});