import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Id } from "@/convex/_generated/dataModel";

export default function Jobs() {
  const { user } = useUser();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  const allJobs = useQuery(api.jobs.getAllOpenJobs);
  const getUserData = useQuery(api.users.getUserByClerkId, { clerkId: user?.id || '' });

  const acceptJob = useMutation(api.jobs.acceptJob);

  useEffect(() => {
    if (getUserData && getUserData._id) {
      setUserId(getUserData._id);
    }
  }, [getUserData]);

  const handleAccept = async (jobId: Id<"jobs">) => {
    if (!userId) return;
    await acceptJob({ jobId, userId, workerName: user?.fullName || 'Unnamed' });
  };

  if (!allJobs) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  if (allJobs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="briefcase-outline" size={80} color="#CCCCCC" />
        <Text style={styles.emptyText}>No jobs available at the moment</Text>
        <Text style={styles.emptySubText}>Check back later for new opportunities</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Jobs</Text>
      <FlatList
        data={allJobs}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.jobTypeTag}>
                <Text style={styles.jobTypeText}>Immediate</Text>
              </View>
              <Text style={styles.wage}>₹{item.wage}</Text>
            </View>
            
            <Text style={styles.title}>{item.title}</Text>
            
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
            
            <Text style={styles.description}>{item.description}</Text>
            
            <View style={styles.footer}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item._id)}>
                <Ionicons name="checkmark-circle-outline" size={18} color="white" style={styles.btnIcon} />
                <Text style={styles.btnText}>Accept Job</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
    color: '#333',
  },
  listContainer: {
    paddingBottom: 24,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobTypeTag: {
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  jobTypeText: {
    color: '#0288D1',
    fontSize: 12,
    fontWeight: '600',
  },
  wage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  acceptBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 6,
  },
  btnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});