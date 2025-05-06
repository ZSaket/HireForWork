import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { useAuth } from "@clerk/clerk-expo";
export default function WorkerDashboard() {
  const {signOut} = useAuth()
  return (
    <View>
      <Text>WorkerDashboard</Text>
      <TouchableOpacity onPress={()=>signOut()}>
              <Text className="color:white">Signout</Text>
      </TouchableOpacity>
    </View>
  )
}