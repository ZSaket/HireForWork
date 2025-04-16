import { useAuth } from "@clerk/clerk-expo";


import { Text, TouchableOpacity, View } from "react-native";


export default function Index() {
  const {signOut} = useAuth()
  return (
    <View className="flex-1 justify-center items-center">
      <TouchableOpacity onPress={()=>signOut()}>
        <Text className="color:white">Signout</Text>
      </TouchableOpacity>
    </View>
  );
}
