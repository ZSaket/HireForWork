// app/chat/[jobId].tsx
import React, { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { ChatScreen } from '../../../components/common/ChatComponents';
import { Id } from '../../../convex/_generated/dataModel';
import { StatusBar } from 'expo-status-bar';

export default function JobChatScreen() {
  const { jobId, otherUserId } = useLocalSearchParams();
  
  // Ensure proper typing for the parameters
  const typedJobId = jobId as string as Id<"jobs">;
  const typedOtherUserId = otherUserId as string as Id<"users">;
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ChatScreen jobId={typedJobId} otherUserId={typedOtherUserId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});