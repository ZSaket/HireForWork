import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import InitialLayout from "@/components/InitialLayout";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider"
import { tokenCache } from '@clerk/clerk-expo/token-cache'


export default function RootLayout() {
  return (
    <ClerkAndConvexProvider>
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-#fff">
          <InitialLayout/> 
        </SafeAreaView>
      </SafeAreaProvider>
    </ClerkAndConvexProvider>
  )
}
