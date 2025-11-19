import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from './../../convex/_generated/api';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Id } from '../../convex/_generated/dataModel';

export default function PaymentScreen() {
  const params = useLocalSearchParams();
  const jobId = params.jobId as string;
  const amount = params.amount as string;
  const jobTitle = params.jobTitle as string;
  const workerId = params.workerId as string; 
  const workerName = params.workerName as string; 
  
  const jobAmount = parseFloat(amount);
  const serviceFee = jobAmount * 0.05;
  const totalAmount = jobAmount + serviceFee;
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  
  const completeJob = useMutation(api.jobs.completeJob);
  
  
const handlePayment = async () => {
  if (!selectedPaymentMethod) {
    Alert.alert("Payment Method Required", "Please select a payment method to continue");
    return;
  }
  
  if (selectedPaymentMethod === 'upi' && !upiId) {
    Alert.alert("UPI ID Required", "Please enter your UPI ID to proceed with payment");
    return;
  }
  
  try {
    setIsProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    
    await completeJob({
      jobId: jobId as Id<"jobs">,
      paymentStatus: 'completed',
      paymentMethod: selectedPaymentMethod,
      paymentAmount: totalAmount.toFixed(2),
      workerName: workerName, 
    });
    
    Alert.alert(
      "Payment Successful", 
      `Your payment of ₹${totalAmount.toFixed(2)} for "${jobTitle}" job has been processed successfully.`,
      [{ 
        text: "Leave a Review", 
        onPress: () => router.push({
          pathname: '/ReviewScreen',
          params: {
            jobId,
            workerId,
            jobTitle,
            workerName
          }
        })
      }]
    );
  } catch (error) {
    Alert.alert("Payment Failed", "There was an error processing your payment. Please try again.");
    console.error("Payment error:", error);
  } finally {
    setIsProcessing(false);
  }
};
  
  const renderPaymentOption = (
    method: string, 
    icon: any, 
    component: 'Ionicons' | 'FontAwesome5' | 'MaterialIcons' | 'MaterialCommunityIcons', 
    title: string, 
    description: string
  ) => {
    const isSelected = selectedPaymentMethod === method;
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedPaymentMethod(method)}
        className={`border rounded-xl p-4 mb-3 flex-row items-center ${
          isSelected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
        }`}
      >
        <View className={`w-12 h-12 rounded-full items-center justify-center ${
          isSelected ? 'bg-yellow-100' : 'bg-gray-100'
        }`}>
          {component === 'Ionicons' && (
            <Ionicons name={icon as any} size={24} color={isSelected ? "#F59E0B" : "#6B7280"} />
          )}
          {component === 'FontAwesome5' && (
            <FontAwesome5 name={icon as any} size={24} color={isSelected ? "#F59E0B" : "#6B7280"} />
          )}
          {component === 'MaterialIcons' && (
            <MaterialIcons name={icon as any} size={24} color={isSelected ? "#F59E0B" : "#6B7280"} />
          )}
          {component === 'MaterialCommunityIcons' && (
            <MaterialCommunityIcons name={icon as any} size={24} color={isSelected ? "#F59E0B" : "#6B7280"} />
          )}
        </View>
        <View className="ml-3 flex-1">
          <Text className={`font-bold ${isSelected ? 'text-yellow-700' : 'text-gray-800'}`}>{title}</Text>
          <Text className="text-gray-500 text-sm">{description}</Text>
        </View>
        <View className="w-6 h-6 border-2 rounded-full items-center justify-center mr-1 overflow-hidden">
          {isSelected && (
            <View className="bg-yellow-500 w-4 h-4 rounded-full" />
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
        <View className="bg-white px-5 py-4 shadow-sm flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Payment</Text>
        </View>
        
        <ScrollView className="flex-1 px-4">
          <View className="bg-white rounded-xl p-5 mt-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-3">Order Summary</Text>
            
            <View className="border-b border-gray-100 pb-3 mb-3">
              <Text className="text-gray-600 font-medium">Job Title</Text>
              <Text className="text-gray-800 font-semibold mt-1">{jobTitle}</Text>
            </View>
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Job Amount</Text>
              <View className="flex-row items-center">
                <FontAwesome5 name="rupee-sign" size={12} color="#4B5563" />
                <Text className="text-gray-800 ml-1">{jobAmount.toFixed(2)}</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-100">
              <Text className="text-gray-600">Service Fee (5%)</Text>
              <View className="flex-row items-center">
                <FontAwesome5 name="rupee-sign" size={12} color="#4B5563" />
                <Text className="text-gray-800 ml-1">{serviceFee.toFixed(2)}</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-800 font-bold">Total Amount</Text>
              <View className="flex-row items-center">
                <FontAwesome5 name="rupee-sign" size={14} color="#000" />
                <Text className="text-gray-900 font-bold text-lg ml-1">{totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
          
          <View className="mt-4">
            <Text className="text-lg font-bold text-gray-800 mb-3">Select Payment Method</Text>
            
            {renderPaymentOption(
              'cash',
              'cash',
              'MaterialCommunityIcons',
              'Cash Payment',
              'Pay with cash on completion'
            )}
            
            {renderPaymentOption(
              'upi',
              'qrcode',
              'FontAwesome5',
              'UPI Payment',
              'Pay using UPI apps like GPay, PhonePe, etc.'
            )}
            
            {renderPaymentOption(
              'wallet',
              'wallet',
              'Ionicons',
              'Wallet',
              'Pay using your wallet balance'
            )}
            
            
            {selectedPaymentMethod === 'upi' && (
              <View className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4">
                <Text className="text-gray-700 mb-2">Enter UPI ID</Text>
                <View className="flex-row border border-gray-300 bg-white rounded-lg p-3 items-center">
                  <MaterialIcons name="account-balance" size={20} color="#6B7280" />
                  <TextInput
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="username@upi"
                    className="flex-1 ml-2"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-2">Example: yourname@okaxis, 9876543210@paytm</Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        
        <View className="p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            onPress={handlePayment}
            disabled={isProcessing}
            className={`p-4 rounded-xl items-center justify-center ${
              isProcessing ? 'bg-gray-400' : 'bg-yellow-500'
            }`}
          >
            {isProcessing ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">Processing...</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Text className="text-white font-bold mr-2">Pay ₹{totalAmount.toFixed(2)}</Text>
                <Ionicons name="shield-checkmark" size={18} color="white" />
              </View>
            )}
          </TouchableOpacity>
          
          <View className="flex-row items-center justify-center mt-3">
            <Ionicons name="lock-closed" size={14} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-1">Secure Payment</Text>
          </View>
        </View>
      
    </>
  );
}