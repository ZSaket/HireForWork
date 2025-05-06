import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Id } from '@/convex/_generated/dataModel';

export default function HirerDashboard() {
  const { user } = useUser();
  const { signOut } = useAuth();
  
  const userData = useQuery(api.users.getUserByClerkId, {
    clerkId: user?.id ?? "",
  });
  
  const createJob = useMutation(api.jobs.createJob);
  // Modified to use the new query that excludes completed jobs
  const jobHistory = useQuery(
    api.jobs.getJobsByHirer,
    userData?._id ? { hirerId: userData._id } : "skip"
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [wage, setWage] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleCreateJob = async () => {
    if (!title || !description || !location || !wage || !userData?._id) {
      Alert.alert("Missing Information", "Please fill in all job details");
      return;
    }
  
    try {
      await createJob({
        title,
        description,
        location,
        wage,
        clerkId: user?.id || '',
        postedBy: userData._id,
        createdAt: Date.now(),
      });
      
      // Show success message
      Alert.alert("Success", "Job created successfully!");
      
      // Reset form fields
      setTitle('');
      setDescription('');
      setLocation('');
      setWage('');
      setIsFormVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to create job. Please try again.");
    }
  };

  const handleMarkJobDone = (jobId: Id<"jobs">, jobWage: string, jobTitle: string) => {
    // Using Expo Router for navigation to payment screen
    router.push({
      pathname: "/(screens)/PaymentScreen",
      params: { 
        jobId: jobId,
        amount: jobWage,
        jobTitle: jobTitle
      }
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Function to determine if a job can be marked as done (if status is 'in-progress')
  const canMarkJobDone = (status: string) => {
    return status === 'in-progress';
  };
  
  return (
    <View className="flex-1 bg-gray-50" >
      
      <View className="bg-white px-5 py-4 shadow-sm" >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-800">Dashboard</Text>
            <Text className="text-gray-500">Hello, {user?.firstName || 'Hirer'}</Text>
          </View>
          <View className="flex-row space-x-4 items-center">
            <TouchableOpacity 
              onPress={() => setIsFormVisible(!isFormVisible)}
              className="bg-yellow-500 px-3 py-2 rounded-full flex-row items-center"
            >
              <Ionicons name={isFormVisible ? "close" : "add"} size={18} color="white" />
              <Text className="text-white font-bold ml-1">{isFormVisible ? "Cancel" : "New Job"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => signOut()} className="p-2">
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          
          {isFormVisible && (
            <View className="bg-white mx-4 my-4 p-5 rounded-xl shadow-sm">
              <Text className="text-lg font-bold text-gray-800 mb-4">Post a New Job</Text>
              
              <View className="mb-4">
                <Text className="text-gray-700 mb-1">Job Title</Text>
                <TextInput
                  placeholder="Enter job title"
                  value={title}
                  onChangeText={setTitle}
                  className="border border-gray-200 p-3 rounded-lg bg-gray-50"
                />
              </View>
              
              <View className="mb-4">
                <Text className="text-gray-700 mb-1">Description</Text>
                <TextInput
                  placeholder="Describe the job requirements"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  className="border border-gray-200 p-3 rounded-lg bg-gray-50"
                  textAlignVertical="top"
                />
              </View>
              
              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-700 mb-1">Location</Text>
                  <View className="flex-row border border-gray-200 p-3 rounded-lg bg-gray-50 items-center">
                    <Ionicons name="location-outline" size={18} color="#6B7280" />
                    <TextInput
                      placeholder="Where"
                      value={location}
                      onChangeText={setLocation}
                      className="flex-1 ml-2"
                    />
                  </View>
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-700 mb-1">Wage (₹)</Text>
                  <View className="flex-row border border-gray-200 p-3 rounded-lg bg-gray-50 items-center">
                    <FontAwesome5 name="rupee-sign" size={18} color="#6B7280" />
                    <TextInput
                      placeholder="Amount"
                      value={wage}
                      onChangeText={setWage}
                      keyboardType="numeric"
                      className="flex-1 ml-2"
                    />
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={handleCreateJob}
                className="bg-yellow-500 p-4 rounded-lg items-center"
              >
                <Text className="text-white font-bold">Post Job</Text>
              </TouchableOpacity>
            </View>
          )}

          
          <View className="mx-4 my-4">
            <Text className="text-xl font-bold text-gray-800 mb-3">Your Job Posts</Text>
            
            {jobHistory?.length === 0 && (
              <View className="items-center justify-center bg-white p-8 rounded-xl">
                <Ionicons name="document-text-outline" size={60} color="#D1D5DB" />
                <Text className="text-gray-400 mt-2 text-center">No job posts yet</Text>
                {!isFormVisible && (
                  <TouchableOpacity 
                    onPress={() => setIsFormVisible(true)}
                    className="mt-4 bg-gray-100 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-gray-600">Create your first job</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {jobHistory?.map((job) => (
              <View
                key={job._id}
                className="bg-white p-4 mb-3 rounded-xl shadow-sm"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-bold text-lg text-gray-800">{job.title}</Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="location-outline" size={16} color="#6B7280" />
                      <Text className="text-gray-600 ml-1">{job.location}</Text>
                    </View>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${
                    job.status === 'open' ? 'bg-yellow-100' : 
                    job.status === 'in-progress' ? 'bg-green-100' : 
                    job.status === 'pending' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Text className={`font-medium text-xs ${
                      job.status === 'open' ? 'text-yellow-800' : 
                      job.status === 'in-progress' ? 'text-green-800' : 
                      job.status === 'pending' ? 'text-blue-800' : 'text-gray-800'
                    }`}>{job.status}</Text>
                  </View>
                </View>
                
                <Text className="text-gray-600 my-3">{job.description}</Text>
                
                <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <FontAwesome5 name="rupee-sign" size={14} color="#6B7280" />
                    <Text className="text-gray-700 font-semibold ml-1">{job.wage}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <MaterialIcons name="date-range" size={14} color="#6B7280" />
                    <Text className="text-gray-500 text-xs ml-1">
                      Posted {formatDate(job.createdAt)}
                    </Text>
                  </View>
                </View>
                
                {canMarkJobDone(job.status) && (
                  <TouchableOpacity
                    onPress={() => handleMarkJobDone(job._id, job.wage, job.title)}
                    className="bg-green-500 p-3 rounded-lg items-center mt-3 flex-row justify-center"
                  >
                    <Text className="text-white font-bold mr-2">Mark as Done</Text>
                    <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}