import { useEffect, useState, useRef } from "react";
import { api } from "../../../convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-expo";
import { Id } from "../../../convex/_generated/dataModel";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.7;

export default function WorkerDashboard() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [workerId, setWorkerId] = useState<Id<"users"> | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const userInfo = useQuery(api.users.getUserByClerkId, {
    clerkId: user?.id || "",
  });

  useEffect(() => {
    if (userInfo?._id) {
      setWorkerId(userInfo._id);
    }
  }, [userInfo]);

  const activeJobs = useQuery(
    api.jobs.getActiveJobsByWorker,
    workerId ? { workerId } : "skip"
  );
  
  const completedJobs = useQuery(
    api.jobs.getCompletedJobsByWorker,
    workerId ? { workerId } : "skip"
  );
  const openJobs = useQuery(api.jobs.getAllOpenJobs, {});

  const acceptJob = useMutation(api.jobs.acceptJob);

  const handleAccept = async (jobId: Id<"jobs">) => {
    if (!workerId || !userInfo?.name) return;
    try {
      await acceptJob({
        jobId,
        userId: workerId,
        workerName: userInfo.name,
      });
      Alert.alert("Success", "Job accepted successfully!");
    } catch (err) {
      Alert.alert("Error", "Error accepting job");
    }
  };

  const toggleDrawer = () => {
    
    const toValue = drawerOpen ? -DRAWER_WIDTH : 0;
    const overlayValue = drawerOpen ? 0 : 0.5;
    
    setDrawerOpen(!drawerOpen);
    
    
    Animated.parallel([
      Animated.timing(drawerAnim, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: overlayValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const forceCloseDrawer = () => {
    setDrawerOpen(false);
    
    drawerAnim.setValue(-DRAWER_WIDTH);
    overlayOpacity.setValue(0);
  };

  const renderJobCard = (job: any, actionButton?: React.ReactNode) => (
    <View key={job._id} style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        {job.wage && (
          <Text style={styles.jobWage}>₹{job.wage}</Text>
        )}
      </View>
      <Text style={styles.jobDescription}>{job.description}</Text>
      <View style={styles.jobMeta}>
        {job.location && (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.metaText}>{job.location}</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={14} color="#6b7280" />
          <Text style={styles.metaText}>{job.hirerName}</Text>
        </View>
      </View>
      {actionButton}
    </View>
  );

  if (!workerId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      {drawerOpen && (
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={forceCloseDrawer}
        >
          <Animated.View 
            style={[
              StyleSheet.absoluteFill, 
              styles.overlay,
              { opacity: overlayOpacity, zIndex: 1 }
            ]} 
          />
        </TouchableOpacity>
      )}

      {/* Drawer */}
      <Animated.View 
        style={[
          styles.drawer,
          {
            transform: [{ translateX: drawerAnim }],
            zIndex: 2,
          },
        ]}
      >
        {/* Add back button at the top of drawer */}
        <TouchableOpacity 
          style={styles.drawerBackButton} 
          onPress={forceCloseDrawer}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        
        <View style={styles.drawerHeader}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ 
                uri: user?.imageUrl || 
                     "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y" 
              }} 
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.profileName}>{user?.fullName || "User"}</Text>
          <Text style={styles.profileEmail}>{user?.primaryEmailAddress?.emailAddress || ""}</Text>
        </View>
        
        <View style={styles.drawerContent}>
          <TouchableOpacity style={styles.drawerItem}>
            <Feather name="user" size={20} color="#4b5563" />
            <Text style={styles.drawerItemText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.drawerItem}>
            <Feather name="settings" size={20} color="#4b5563" />
            <Text style={styles.drawerItemText}>Settings</Text>
          </TouchableOpacity>
          
          <View style={styles.drawerDivider} />
          
          <TouchableOpacity 
            style={styles.drawerItem}
            onPress={async () => {
              try {
                await signOut();
              } catch (error) {
                console.log("Sign out error:", error);
              }
            }}
          >
            <Feather name="log-out" size={20} color="#ef4444" />
            <Text style={[styles.drawerItemText, { color: "#ef4444" }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main Content */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
          <Ionicons name="menu-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase-outline" size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Active Jobs</Text>
          </View>
          <View style={styles.sectionContent}>
            {activeJobs?.length ? (
              activeJobs.map((job) => renderJobCard(job))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No active jobs at the moment</Text>
              </View>
            )}
          </View>
        </View>

        {/* Available Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="work-outline" size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Available Jobs</Text>
          </View>
          <View style={styles.sectionContent}>
            {openJobs?.length ? (
              openJobs.map((job) => renderJobCard(job, (
                <TouchableOpacity
                  onPress={() => handleAccept(job._id)}
                  style={styles.acceptButton}
                >
                  <Text style={styles.acceptButtonText}>Accept Job</Text>
                </TouchableOpacity>
              )))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No open jobs available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Completed Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Completed Jobs</Text>
          </View>
          <View style={styles.sectionContent}>
            {completedJobs?.length ? (
              completedJobs.map((job) => renderJobCard(job))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No completed jobs yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4b5563",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  menuButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 8,
  },
  sectionContent: {
    gap: 12,
  },
  jobCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
  },
  jobWage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
  },
  jobDescription: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
    lineHeight: 20,
  },
  jobMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#6b7280",
  },
  acceptButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-end",
    marginTop: 12,
  },
  acceptButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  emptyStateText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: "#fff",
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  drawerBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  drawerHeader: {
    padding: 24,
    paddingTop: 48, 
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#6b7280",
  },
  drawerContent: {
    padding: 16,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  drawerItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: "#4b5563",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  overlay: {
    backgroundColor: "#000",
  },
});