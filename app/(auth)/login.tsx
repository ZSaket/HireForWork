import { ImageBackground, View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useFonts } from 'expo-font';
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

    const [fontsLoaded] = useFonts({
      PoppinsRegular: require('../../assets/fonts/Poppins-Regular.ttf'),
      PoppinsSemiBold: require('../../assets/fonts/Poppins-SemiBold.ttf'),
    });
    if (!fontsLoaded) return null;
    const handleGoogleSignIn = async () => {
      try {
        const { createdSessionId, setActive } = await startSSOFlow({ strategy: "oauth_google" });
        
        if (setActive && createdSessionId) {
          await setActive({ session: createdSessionId });
    
          
          if (user && user.id) {
            try {
              const userProfile = await convex.query(api.users.getUserByClerkId, { 
                clerkId: user.id 
              });
              
              if (userProfile && userProfile.role && userProfile.role !== 'pending') {
                
                router.replace("/")
              } else {
                
                router.replace("/(auth)/RoleSelection");
              }
            } catch (error) {
              console.error("Error checking user profile:", error);
              router.replace("/(auth)/RoleSelection");
            }
          } else {
            
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
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 justify-between px-4">
        <View className="mt-11 items-center">
          <Text style={{ fontFamily: 'PoppinsSemiBold' }} className="text-[55px] md:text-[52px] lg:text-[60px] text-[#F59E0B] text-center leading-snug">
            HireForWork
          </Text>
          <Text className="text-[#9CA3AF] text-base mt-1 text-center">
            GET IT DONE BY ANYONE
          </Text>
        </View>
    
        <View className="flex items-center justify-center">
          <Image
            source={require("../../assets/images/Messenger-pana.png")}
            style={styles.illustration}
          />
        </View>
    
        <View style={styles.loginSection}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.9}
          >
            <View style={styles.googleIconContainer}>
              <Ionicons name="logo-google" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
    
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms and Privacy Policy
          </Text>
        </View>
        </View>
    </ImageBackground>
    
    )
}