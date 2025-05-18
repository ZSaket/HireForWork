import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Ionicons, FontAwesome5, MaterialIcons, AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  skills?: string[];
  bio?: string;
  location?: string;
  rating?: number;
  profileImageUrl?: string;
  jobsCompleted?: number;
  clerkId: string;
}

export default function EditProfileScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  
  const user = useQuery(api.users.getUserByClerkId, { clerkId: userId ?? "" });
  const updateUserProfile = useMutation(api.users.updateUserProfile);
  
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setLocation(user.location || '');
      setSkills(user.skills || []);
    }
  }, [user]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await updateUserProfile({
        clerkId: userId ?? "",
        role: "worker",
        bio,
        skills,
        location,
      });
      
      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to your photos to upload a profile picture.");
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets[0]) {
      Alert.alert("Profile image updating feature will be implemented soon!");
    }
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="ml-4 text-xl font-bold text-gray-800">Edit Profile</Text>
      </View>
      
      <ScrollView className="flex-1 p-4">
        <View className="items-center mb-6">
          <TouchableOpacity 
            className="relative"
            onPress={pickImage}
          >
            <View className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden">
              {user?.profileImageUrl ? (
                <Image 
                  source={{ uri: user.profileImageUrl }} 
                  className="w-full h-full" 
                  resizeMode="cover" 
                />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <FontAwesome5 name="user-alt" size={50} color="#9ca3af" />
                </View>
              )}
            </View>
            <View className="absolute right-0 bottom-0 bg-blue-500 p-2 rounded-full">
              <Ionicons name="camera" size={18} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="text-lg font-semibold mt-2">{user.name}</Text>
          <Text className="text-gray-500">{user.email}</Text>
        </View>
        
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">Bio</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 min-h-[100px] text-gray-800"
            multiline
            placeholder="Tell potential hirers about yourself, your experience, and what you're good at..."
            value={bio}
            onChangeText={setBio}
            textAlignVertical="top"
          />
        </View>
        
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">Location</Text>
          <View className="flex-row items-center border border-gray-300 rounded-lg p-3">
            <Ionicons name="location-outline" size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-gray-800"
              placeholder="Your location (city, state)"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>
        
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">Skills</Text>
          <View className="flex-row flex-wrap mb-2">
            {skills.map((skill, index) => (
              <View 
                key={index}
                className="bg-blue-100 flex-row items-center rounded-full px-3 py-1 mr-2 mb-2"
              >
                <Text className="text-blue-800">{skill}</Text>
                <TouchableOpacity 
                  className="ml-1"
                  onPress={() => handleRemoveSkill(skill)}
                >
                  <AntDesign name="close" size={16} color="#1e40af" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg p-3 text-gray-800"
              placeholder="Add a skill"
              value={newSkill}
              onChangeText={setNewSkill}
            />
            <TouchableOpacity 
              className="ml-2 bg-blue-500 p-3 rounded-lg"
              onPress={handleAddSkill}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          className="bg-blue-500 py-3 rounded-lg items-center mt-4"
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}