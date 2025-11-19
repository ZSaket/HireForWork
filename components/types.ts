
import { Id } from "./../convex/_generated/dataModel";
import { NativeStackScreenProps } from "./../node_modules/@react-navigation/native-stack/lib/typescript/src/types";

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