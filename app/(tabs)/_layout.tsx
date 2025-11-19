import { Slot, router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from './../../convex/_generated/api';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from './../../constants/theme';

export default function RootLayout() {
  const [hasRedirected, setHasRedirected] = useState(false);
  const { user, isLoaded } = useUser();
  const userData = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );


  useEffect(() => {
    if (!isLoaded || !user || !userData) return;

    setHasRedirected(true); 

    if (userData.role === 'pending') {
      router.replace("/(auth)/RoleSelection");
    } else if (userData.role === 'worker') {
      router.replace("/worker/WorkerDashboard");
    } else if (userData.role === 'hirer') {
      router.replace("/hirer/HirerDashboard");
    }
  }, [isLoaded, user, userData, hasRedirected]);


  if (!isLoaded || (user && !userData)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <Slot />;
}
