import { View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';

export default function Tablayout() {
  const { user } = useUser();
  const [userRole, setUserRole] = useState<'hirer' | 'worker' | 'pending'>('hirer');
  const [loading, setLoading] = useState(true);

  const userProfile = useQuery(
    api.users.getUserProfile,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  useEffect(() => {
    if (userProfile) {
      setUserRole(userProfile.role);
      setLoading(false);
    }
  }, [userProfile]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.grey,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          position: 'absolute',
          elevation: 0,
          height: 45,
          paddingBottom: 8,
        },
      }}
    >
     <Tabs.Screen
        name="Dashboard"
        options={{
            tabBarIcon: ({ size }) => (
            <Ionicons name="home" size={size} color={COLORS.secondary} />
            ),
        }}
        initialParams={{ userRole }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ size }) => (
            <Ionicons name="person" size={size} color={COLORS.secondary} />
          ),
        }}
      />
      <Tabs.Screen
        name="Jobs"
        options={{
          tabBarIcon: ({ size }) => (
            <Ionicons name="briefcase" size={size} color={COLORS.secondary} />
          ),
        }}
      />
      <Tabs.Screen
        name="Chats"
        options={{
          tabBarIcon: ({ size }) => (
            <Ionicons name="chatbubble" size={size} color={COLORS.secondary} />
          ),
        }}
      />
    </Tabs>
  );
}