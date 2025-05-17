// components/UnreadMessageNotification.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';
import { Id } from '../../convex/_generated/dataModel';

export default function UnreadMessageNotification() {
  const { user } = useUser();
  
  const userId = useQuery(api.users.getUserIdByClerkId, {
    clerkId: user?.id || '',
  }) as Id<"users"> | undefined;
  
  const unreadCounts = useQuery(api.messages.getUnreadMessageCounts, {
    userId: userId || '' as Id<"users">,
  });
  
  if (!userId || !unreadCounts || unreadCounts.length === 0) {
    return null;
  }
  
  // Calculate total unread messages
  const totalUnread = unreadCounts.reduce((acc, item) => acc + item.unreadCount, 0);
  
  if (totalUnread === 0) {
    return null;
  }
  
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {totalUnread > 99 ? '99+' : totalUnread}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
});