import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
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
    await acceptJob({ jobId, userId });
  };

  if (!allJobs) return <Text>Loading jobs...</Text>;

  return (
    <FlatList
      data={allJobs}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text>{item.description}</Text>
          <Text>Location: {item.location}</Text>
          <Text>Wage: ₹{item.wage}</Text>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item._id)}>
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    elevation: 2
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  acceptBtn: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8
  },
  btnText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600'
  }
});
