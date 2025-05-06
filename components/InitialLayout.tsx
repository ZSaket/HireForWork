import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { api } from "../convex/_generated/api";
import { useQuery } from "convex/react";


export default function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const segments = useSegments();
  const router = useRouter();

  // ✅ Only fetch user data when signed in and user ID exists
  const userData = useQuery(
    api.users.getUserByClerkId,
    isSignedIn && user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded) return;
  
    const isAuthScreen = segments[0] === "(auth)";
  
    if (!isSignedIn && !isAuthScreen) {
      // ✅ User is signed out → redirect to login
      router.replace("/(auth)/login");
      return;
    }
  
    if (isSignedIn && isAuthScreen && userData) {
      // ✅ Redirect based on role
      if (userData.role === "pending") {
        router.replace("/(auth)/RoleSelection");
      } else {
        if (userData.role === "hirer") {
          router.replace("/hirer/HirerDashboard");
        } else if (userData.role === "worker") {
          router.replace("/worker/WorkerDashboard");
        }
      }
    }
  }, [isLoaded, isSignedIn, segments, userData]);
  

  // ⏳ Wait until auth is loaded or userData is ready
  if (!isLoaded || (isSignedIn && !userData)) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
