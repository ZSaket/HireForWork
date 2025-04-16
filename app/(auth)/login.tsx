import { ImageBackground, View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { styles } from '../../styles/auth.styles'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'
import { useSSO } from '@clerk/clerk-expo'
import { useUser } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { useConvex } from 'convex/react'
import { api } from '../../convex/_generated/api';


export default function login() {

    const {startSSOFlow} = useSSO()
    const router = useRouter()
    const convex = useConvex();
    const { user } = useUser();

    const handleGoogleSignIn = async () => {
      try {
        const { createdSessionId, setActive } = await startSSOFlow({ strategy: "oauth_google" });
        
        if (setActive && createdSessionId) {
          // First, activate the session
          await setActive({ session: createdSessionId });
    
          
          if (user && user.id) {
            try {
              // Use convex.query to directly call your query function
              const userProfile = await convex.query(api.users.getUserByClerkId, { 
                clerkId: user.id 
              });
              
              if (userProfile && userProfile.role && userProfile.role !== 'pending') {
                // User exists and has a role, direct to tabs
                router.replace("/(tabs)")
              } else {
                // User doesn't exist or has no role, direct to role selection
                router.replace("/(auth)/RoleSelection");
              }
            } catch (error) {
              console.error("Error checking user profile:", error);
              router.replace("/(auth)/RoleSelection");
            }
          } else {
            // Fallback to role selection if can't get user for some reason
            router.replace("/(auth)/login");
          }
        }
      } catch (error) {
        console.log("OAuth error", error);
      }
    };

    return (
        <ImageBackground
            source={require('../../assets/images/Feed-rafiki.png')}
            className="flex-1 justify-center items-center"
            resizeMode="cover"
        >
            <View className='flex-1 justify-center items-center'>
                <Text className='font-bold text-7xl font-poppins text-[#F59E0B] mt-10'>HireForWork</Text>
                <Text className='font-semibold text-[#9CA3AF]'>GET IT DONE BY ANYONE</Text>
                <View style={styles.illustrationContainer}>
                    <Image
                        source={require("../../assets/images/Messenger-pana.png")}
                        style={styles.illustration} />
                </View>
            </View>

            <View style={styles.loginSection}>
                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleSignIn}
                    activeOpacity={0.9}
                >
                   <View style={styles.googleIconContainer}>
                        <Ionicons name='logo-google' size={20} color={COLORS.secondary}/>
                    </View>
                    <Text style={styles.googleButtonText}>Continue with Google</Text> 
                </TouchableOpacity>
                <Text style={styles.termsText}>
                    By continuing, you agree to our Terms and Privacy Policy
                </Text>
            </View>
        </ImageBackground>
    )
}