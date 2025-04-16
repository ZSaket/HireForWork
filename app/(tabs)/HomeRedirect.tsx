import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';

export default function HomeRedirect() {
  const { user } = useUser();
  const router = useRouter();

  const userProfile = useQuery(
    api.users.getUserProfile,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  useEffect(() => {
    if (userProfile?.role === 'hirer') {
      router.replace('/hirer/HirerDashboard');
    } else if (userProfile?.role === 'worker') {
      router.replace('/worker/WorkerDashboard');
    }
  }, [userProfile]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
