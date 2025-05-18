import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Animated,
  Image,
  Dimensions
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Id } from '../../convex/_generated/dataModel';
import { LinearGradient } from 'expo-linear-gradient'; 
import { StatusBar } from 'expo-status-bar';

// Type definitions
type Message = {
  _id: Id<"messages">;
  jobId: Id<"jobs">;
  senderId: Id<"users">;
  receiverId: Id<"users">;
  content: string;
  createdAt: number;
  read: boolean;
  senderName?: string;
  receiverName?: string;
};

type Chat = {
  jobId: Id<"jobs">;
  jobTitle: string;
  hirerName?: string;
  workerName?: string;
  isHirer: boolean;
  otherPartyName?: string;
  otherPartyId?: Id<"users">;
  latestMessage: string | null;
  latestMessageTime: number;
  unreadCount: number;
};

const { width } = Dimensions.get('window');
const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  secondary: '#F9FAFB',
  background: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  textVeryLight: '#9CA3AF',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981'
};

// Message item component with animation
export const MessageItem = ({ message, isSender, index }: { message: Message, isSender: boolean, index: number }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const messageOpacity = animatedValue;
  const messageTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View style={[
      styles.messageContainer, 
      isSender ? styles.senderContainer : styles.receiverContainer,
      {
        opacity: messageOpacity,
        transform: [{ translateY: messageTranslateY }]
      }
    ]}>
      <View style={[
        styles.messageBubble,
        isSender ? styles.senderBubble : styles.receiverBubble
      ]}>
        <Text style={[styles.messageText, isSender ? styles.senderText : styles.receiverText]}>
          {message.content}
        </Text>
        <Text style={[styles.timeText, isSender ? styles.senderTimeText : styles.receiverTimeText]}>
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </Text>
      </View>
    </Animated.View>
  );
};

// Enhanced Avatar component with initials
const Avatar = ({ name, size = 50, backgroundColor = COLORS.primary }: { name?: string, size?: number, backgroundColor?: string }) => {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
};

// Enhanced chat list item with animation
export const ChatListItem = ({ 
  chat, 
  onPress,
  index
}: { 
  chat: Chat, 
  onPress: () => void,
  index: number
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const itemOpacity = animatedValue;
  const itemTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  // Generate a consistent color for the avatar based on the user's name
  const getAvatarColor = (name?: string) => {
    if (!name) return COLORS.primary;
    const colors = [
      '#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', 
      '#3B82F6', '#8B5CF6', '#DC2626', '#059669', '#2563EB'
    ];
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  const avatarColor = getAvatarColor(chat.otherPartyName);

  return (
    <Animated.View style={{
      opacity: itemOpacity,
      transform: [{ translateX: itemTranslateX }]
    }}>
      <TouchableOpacity 
        style={[styles.chatItem, chat.unreadCount > 0 ? styles.unreadChat : null]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Avatar name={chat.otherPartyName} backgroundColor={avatarColor} />
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {chat.otherPartyName || 'User'}
            </Text>
            <View style={styles.chatTimeWrapper}>
              {chat.unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{chat.unreadCount}</Text>
                </View>
              )}
              <Text style={styles.chatTime}>
                {formatDistanceToNow(new Date(chat.latestMessageTime), { addSuffix: true })}
              </Text>
            </View>
          </View>
          
          <View style={styles.chatInfoWrapper}>
            <Text numberOfLines={1} style={[
              styles.chatPreview,
              chat.unreadCount > 0 ? styles.unreadPreview : null
            ]}>
              {chat.latestMessage || `Start chatting about: ${chat.jobTitle}`}
            </Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.textLight} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Loading animation component
const LoadingIndicator = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

// Enhanced chat screen component
export const ChatScreen = ({ jobId, otherUserId }: { jobId: Id<"jobs">, otherUserId: Id<"users"> }) => {
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  
  const userId = useQuery(api.users.getUserIdByClerkId, {
    clerkId: user?.id || '',
  }) as Id<"users"> | undefined;
  
  const job = useQuery(api.jobs.getJobById, { jobId });
  const messages = useQuery(api.messages.getMessagesByJobId, {
    jobId,
    userId: userId || '' as Id<"users">,
  });
  
  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);
  
  useEffect(() => {
    if (userId) {
      markAsRead({ jobId, userId });
    }
  }, [jobId, userId, messages]);
  
  useEffect(() => {
    if (flatListRef.current && messages?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  const handleSend = async () => {
    if (!message.trim() || !userId || !job) return;
    
    try {
      Animated.sequence([
        Animated.timing(sendButtonScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(sendButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
      
      await sendMessage({
        jobId,
        senderId: userId,
        receiverId: otherUserId,
        content: message.trim(),
        senderName: user?.fullName || '',
        receiverName: job.postedBy === userId ? job.workerName || 'Worker' : job.hirerName || 'Hirer',
      });
      setMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  if (!userId || !job) {
    return <LoadingIndicator />;
  }
  
  const otherUserName = job.postedBy === userId ? job.workerName || 'Worker' : job.hirerName || 'Hirer';
  
  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerUserInfo}>
            <Avatar name={otherUserName} size={40} backgroundColor="#fff" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {otherUserName}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>{job.title}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatBackground}>
          {messages?.length === 0 ? (
            <View style={styles.emptyChat}>
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primary]}
                style={styles.emptyStateIcon}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={40} color="#fff" />
              </LinearGradient>
              <Text style={styles.emptyChatText}>No messages yet</Text>
              <Text style={styles.emptyChatSubtitle}>Send a message to start the conversation</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={({ item, index }) => (
                <MessageItem
                  message={item}
                  isSender={item.senderId === userId}
                  index={index}
                />
              )}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { maxHeight: 100 }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textLight}
              multiline
            />
            <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
              <TouchableOpacity 
                style={[
                  styles.sendButton, 
                  !message.trim() ? styles.disabledSend : null
                ]} 
                onPress={handleSend}
                disabled={!message.trim()}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="send" 
                  size={18} 
                  color={!message.trim() ? COLORS.textVeryLight : "#ffffff"} 
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export const ChatListScreen = () => {
  const { user } = useUser();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const userId = useQuery(api.users.getUserIdByClerkId, {
    clerkId: user?.id || '',
  }) as Id<"users"> | undefined;
  
  const chats = useQuery(api.messages.getUserChats, {
    userId: userId as Id<"users">,
  });
  
  if (!userId) {
    return <LoadingIndicator />;
  }
  
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });
  
  const titleScale = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });
  
  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />
      <Animated.View style={[
        styles.listHeaderContainer,
        {
          transform: [{ translateY: headerTranslate }],
          opacity: headerOpacity,
        }
      ]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.listHeader}
        >
          <Animated.Text style={[
            styles.listHeaderTitle,
            { transform: [{ scale: titleScale }] }
          ]}>
            Messages
          </Animated.Text>
        </LinearGradient>
      </Animated.View>
      
      {!chats || chats.length === 0 ? (
        <View style={styles.emptyList}>
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primary]}
            style={styles.emptyStateIcon}
          >
            <Ionicons name="mail-outline" size={40} color="#fff" />
          </LinearGradient>
          <Text style={styles.emptyListText}>No active chats</Text>
          <Text style={styles.emptyListSubtitle}>
            Messages will appear when you start communicating about jobs
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          data={chats}
          renderItem={({ item, index }) => (
            <ChatListItem
              chat={item}
              index={index}
              onPress={() => router.push({
                pathname: '/chat/[jobId]',
                params: { jobId: item.jobId, otherUserId: item.otherPartyId }
              })}
            />
          )}
          keyExtractor={(item) => item.jobId}
          contentContainerStyle={styles.chatListContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textLight,
    fontSize: 14,
  },
  
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  chatBackground: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },

  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    marginBottom: 16,
  },
  senderContainer: {
    alignItems: 'flex-end',
  },
  receiverContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  senderBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  receiverBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  senderText: {
    color: '#fff',
  },
  receiverText: {
    color: COLORS.text,
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  senderTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receiverTimeText: {
    color: COLORS.textLight,
  },

  inputContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    marginRight: 8,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  disabledSend: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Empty states
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyChatText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyChatSubtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },

  listHeaderContainer: {
    zIndex: 10,
  },
  listHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  listHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatListContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  unreadChat: {
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  chatContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  chatTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  chatInfoWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatPreview: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textLight,
    marginRight: 8,
  },
  unreadPreview: {
    color: COLORS.text,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyListText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyListSubtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
});