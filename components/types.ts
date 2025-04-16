// First, define the UserProfile type
// components/types.ts
import { Id } from "@/convex/_generated/dataModel";

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