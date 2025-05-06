// First, define the UserProfile type
// components/types.ts
import { Id } from "@/convex/_generated/dataModel";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export interface UserProfile {
  id: Id<"users">;
  creationTime: number;
  skills?: string[];
  bio?: string;
  location?: string;
  rating?: number;
  profileImageUrl?: string;
  name: string;
  role: 'hirer' | 'worker' | 'pending';
  clerkId: string;
  // Add other fields as needed
}

// For the dashboard components
export interface DashboardProps {
  userProfile: UserProfile | null | undefined;
}

export type RootStackParamList = {
  // Your existing screens...
  
  // Add this new screen
  PaymentScreen: {
    jobId: string;
    amount: string;
    jobTitle: string;
  };
};

// Add this new type for the PaymentScreen props
export type PaymentScreenProps = NativeStackScreenProps<RootStackParamList, "PaymentScreen">;