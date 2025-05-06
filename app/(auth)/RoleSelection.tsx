import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter } from 'expo-router';

export default function RoleSelectionScreen() {
  const { user } = useUser();
//   const navigation = useNavigation();
  // Explicitly type the state variables
  const [role, setRole] = useState<'hirer' | 'worker' | ''>('');
  const [bio, setBio] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [skills, setSkills] = useState<string[]>([]); // Explicitly type as string array
  const [newSkill, setNewSkill] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  
  const updateUser = useMutation(api.users.updateUserProfile);

  // type RootStackParamList = {
  //   HirerDashboard: undefined;
  //   WorkerDashboard: undefined;
  //   // Add other screens here
  // };

  // const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const handleSkillAdd = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };
  
  const handleSkillRemove = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async () => {
    if (!role) {
      Alert.alert("Required Field", "Please select your role to continue");
      return;
    }
    
    if (!user) {
      Alert.alert("Authentication Error", "You must be signed in to continue");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create location object if city is provided
      let location = null;
      
      
      await updateUser({
        clerkId: user.id,
        role,
        bio: bio || undefined,
        skills: skills.length > 0 ? skills : undefined,
        location: location || undefined
      });
      
      // Navigate based on role
      //navigation.navigate(role === 'hirer' ? 'HirerDashboard' : 'WorkerDashboard');
      if (role === "hirer") {
        router.replace("/hirer/HirerDashboard");
      } else if (role === "worker") {
        router.replace("/worker/WorkerDashboard");
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        "Update Failed",
        "Failed to update your profile. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Complete Your Profile</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Your Role *</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity 
              style={[
                styles.roleCard, 
                role === 'hirer' && styles.roleCardSelected
              ]}
              onPress={() => setRole('hirer')}
            >
              <Text style={styles.roleTitle}>Hirer</Text>
              <Text style={styles.roleDescription}>I want to hire people for work</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.roleCard, 
                role === 'worker' && styles.roleCardSelected
              ]}
              onPress={() => setRole('worker')}
            >
              <Text style={styles.roleTitle}>Worker</Text>
              <Text style={styles.roleDescription}>I want to find work opportunities</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.textArea}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us a bit about yourself"
            multiline
            numberOfLines={4}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Your city"
          />
        </View>
        
        {role === 'worker' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Skills</Text>
            <View style={styles.skillInputContainer}>
              <TextInput
                style={styles.skillInput}
                value={newSkill}
                onChangeText={setNewSkill}
                placeholder="Add a skill"
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleSkillAdd}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                  <TouchableOpacity
                    onPress={() => handleSkillRemove(skill)}
                    style={styles.removeSkillButton}
                  >
                    <Text style={styles.removeSkillText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!role || isLoading) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!role || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  roleCardSelected: {
    borderColor: '#4a90e2',
    backgroundColor: '#f0f7ff',
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  skillInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  skillInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skillText: {
    fontSize: 14,
  },
  removeSkillButton: {
    marginLeft: 6,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeSkillText: {
    fontSize: 18,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});