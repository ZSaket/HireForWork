import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Id } from '@/convex/_generated/dataModel';

export default function ReviewScreen() {
  const params = useLocalSearchParams();
  console.log("Raw params received:", params);
  
  const jobId = params.jobId as string;
  const workerId = params.workerId as string;
  const jobTitle = params.jobTitle as string || "Job";
  const workerName = params.workerName as string || "Worker";

  console.log("Parsed Review Screen Params:", {
    jobId,
    workerId,
    jobTitle,
    workerName
  });
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch job details as a backup to get workerId
  const job = useQuery(api.jobs.getJobById, { 
    jobId: jobId ? (jobId as Id<"jobs">) : undefined
  });
  
  // Set fallback workerId from job if not provided in params
  const effectiveWorkerId = workerId || (job?.acceptedBy as string);
  
  // Connect to your Convex backend
  const submitReview = useMutation(api.reviews.createReview);


  useEffect(() => {
    console.log("Effective worker ID:", effectiveWorkerId);
  }, [effectiveWorkerId]);
  
  // Validate required parameters
  useEffect(() => {
    if (!jobId) {
      Alert.alert(
        "Missing Information",
        "Job information is missing. Please go back and try again.",
        [{ text: "Go Back", onPress: () => router.back() }]
      );
    }
  }, [jobId]);

  
  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please provide a rating before submitting");
      return;
    }
    
    if (!effectiveWorkerId) {
      Alert.alert("Error", "Worker information is missing. Please go back and try again.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      console.log("Submitting review with workerId:", effectiveWorkerId);
      
      const reviewData = {
        revieweeId: effectiveWorkerId as Id<"users">, 
        jobId: jobId as Id<"jobs">,
        rating: rating,
        comment: comment.trim() || undefined,
        createdAt: Date.now(),
      };
      
      console.log("Review data being submitted:", JSON.stringify(reviewData));
      
      // Submit review to the database
      // The mutation automatically uses the authenticated user's ID as the reviewer
      await submitReview(reviewData);
      
      // Show success message and redirect to hirer dashboard
      Alert.alert(
        "Review Submitted", 
        `Your review for "${jobTitle}" has been submitted successfully.`,
        [{ text: "OK", onPress: () => router.replace('/(tabs)/hirer/HirerDashboard') }]
      );
    } catch (error) {
      console.error("Review submission error:", error);
      Alert.alert(
        "Submission Failed", 
        `Error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} className="mx-1">
          <FontAwesome 
            name={i <= rating ? "star" : "star-o"} 
            size={36} 
            color={i <= rating ? "#F59E0B" : "#D1D5DB"}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };
  
  // If job data is still loading, show a loading indicator
  if (job === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text className="mt-4 text-gray-600">Loading job details...</Text>
      </SafeAreaView>
    );
  }

  // Prevent reviewing if job isn't completed and paid
  if (job && job.paymentStatus !== 'completed') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center p-4">
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text className="mt-4 text-lg font-bold text-center">Cannot Review Yet</Text>
        <Text className="mt-2 text-gray-600 text-center">
          You can only submit a review after the job is completed and payment has been processed.
        </Text>
        <TouchableOpacity 
          className="mt-6 bg-yellow-500 px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-white px-5 py-4 shadow-sm flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Rate & Review</Text>
        </View>
        
        <ScrollView className="flex-1 px-4">
          {/* Job Details Section */}
          <View className="bg-white rounded-xl p-5 mt-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-3">Job Details</Text>
            
            <View className="border-b border-gray-100 pb-3 mb-3">
              <Text className="text-gray-600 font-medium">Job Title</Text>
              <Text className="text-gray-800 font-semibold mt-1">{jobTitle}</Text>
            </View>
            
            <View>
              <Text className="text-gray-600 font-medium">Worker</Text>
              <Text className="text-gray-800 font-semibold mt-1">{workerName}</Text>
            </View>
          </View>
          
          {/* Debug info - You can keep for development or remove for production */}
          {__DEV__ && (
            <View className="bg-yellow-50 p-3 mt-2 rounded-lg border border-yellow-200">
              <Text className="text-xs">Worker ID: {effectiveWorkerId || "Missing"}</Text>
              <Text className="text-xs">Job ID: {jobId || "Missing"}</Text>
              <Text className="text-xs">Payment Status: {job?.paymentStatus || "Unknown"}</Text>
            </View>
          )}
          
          {/* Rating Section */}
          <View className="bg-white rounded-xl p-5 mt-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-3">Rate Your Experience</Text>
            <Text className="text-gray-600 mb-3">How would you rate your experience with the worker?</Text>
            
            <View className="flex-row justify-center my-4">
              {renderStars()}
            </View>
            
            <View className="mt-2 items-center">
              <Text className="text-gray-700 font-medium">
                {rating === 0 && "Tap to rate"}
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </Text>
            </View>
          </View>
          
          {/* Comment Section */}
          <View className="bg-white rounded-xl p-5 mt-4 shadow-sm mb-4">
            <Text className="text-lg font-bold text-gray-800 mb-3">Leave a Comment</Text>
            <Text className="text-gray-600 mb-3">Share your experience to help other hirers (Optional)</Text>
            
            <View className="border border-gray-200 rounded-lg p-2 bg-gray-50">
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Share your experience working with this person..."
                multiline
                numberOfLines={5}
                className="text-gray-800 min-h-32 p-2"
                textAlignVertical="top"
              />
            </View>
            
            <Text className="text-xs text-gray-500 mt-2">Your feedback helps maintain quality in our community</Text>
          </View>
        </ScrollView>
        
        {/* Submit button */}
        <View className="p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            onPress={handleSubmitReview}
            disabled={isSubmitting || !effectiveWorkerId}
            className={`p-4 rounded-xl items-center justify-center ${
              isSubmitting || !effectiveWorkerId ? 'bg-gray-400' : 'bg-yellow-500'
            }`}
          >
            {isSubmitting ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">Submitting...</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Text className="text-white font-bold mr-2">Submit Review</Text>
                <MaterialIcons name="rate-review" size={18} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}