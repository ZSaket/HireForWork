import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { api } from "../convex/_generated/api";
import { useQuery } from "convex/react";

export default function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const segments = useSegments();
  const router = useRouter();

  const userData = useQuery(
    api.users.getUserByClerkId,
    isSignedIn && user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded) return;

    // ⭐ FIX: wait until expo-router has loaded segments
    const inAuthGroup = segments[0] === "(auth)";


    const isAuthScreen = segments[0] === "(auth)";

    // Not signed in → send to login
    if (!isSignedIn && !isAuthScreen) {
      router.replace("/(auth)/login");
      return;
    }

    // Signed in but on auth screen → redirect based on role
    if (isSignedIn && isAuthScreen && userData) {
      if (userData.role === "pending") {
        router.replace("/(auth)/RoleSelection");
      } else if (userData.role === "hirer") {
        router.replace("/hirer/HirerDashboard");
      } else if (userData.role === "worker") {
        router.replace("/worker/WorkerDashboard");
      }
    }
  }, [isLoaded, isSignedIn, segments, userData]);

  // Avoid flashing UI before data loads
  if (!isLoaded || (isSignedIn && !userData)) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
