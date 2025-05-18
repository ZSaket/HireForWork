
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
}


export interface DashboardProps {
  userProfile: UserProfile | null | undefined;
}

export type RootStackParamList = {
  
  PaymentScreen: {
    jobId: string;
    amount: string;
    jobTitle: string;
  };
};


export type PaymentScreenProps = NativeStackScreenProps<RootStackParamList, "PaymentScreen">;