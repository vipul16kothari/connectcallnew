import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/contexts/ToastContext';
import { callService, hostService, AppwriteCall, AppwriteHost } from '@/services/appwrite';
import { parseError } from '@/utils/errorHandler';
import { isDummyMode, getDummyCallHistory, getDummyHostById } from '@/data/dummyData';

interface CallWithHost extends AppwriteCall {
  host?: AppwriteHost;
}

export default function RecentsScreen() {
  const { user } = useUser();
  const { showError } = useToast();
  const [calls, setCalls] = useState<CallWithHost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadCallHistory();
  }, [user]);

  const loadCallHistory = async () => {
    if (!user?.authUser) return;

    try {
      setIsLoading(true);

      // Check if user is in dummy mode
      if (isDummyMode(user.authUser.$id)) {
        // Use dummy data
        const dummyCallHistory = getDummyCallHistory();
        const callsWithHosts = dummyCallHistory.map((call) => {
          const host = getDummyHostById(call.hostId);
          return { ...call, host: host || undefined };
        });
        setCalls(callsWithHosts);
        return;
      }

      // Try to load from Appwrite
      try {
        const callHistory = await callService.getCallHistory(user.authUser.$id);

        // Fetch host details for each call
        const callsWithHosts = await Promise.all(
          callHistory.map(async (call) => {
            try {
              const host = await hostService.getHostById(call.hostId);
              return { ...call, host: host || undefined };
            } catch (error) {
              console.error('Error fetching host:', error);
              return call;
            }
          })
        );

        setCalls(callsWithHosts);
      } catch (backendError) {
        // If backend fails, fallback to dummy data
        console.warn('Backend unavailable, using dummy call history:', backendError);
        const dummyCallHistory = getDummyCallHistory();
        const callsWithHosts = dummyCallHistory.map((call) => {
          const host = getDummyHostById(call.hostId);
          return { ...call, host: host || undefined };
        });
        setCalls(callsWithHosts);
      }
    } catch (error: any) {
      console.error('Error loading call history:', error);
      const appError = parseError(error);
      showError(appError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCallHistory();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recent Calls</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Calls</Text>
      </View>

      {/* Call History List */}
      <FlatList
        data={calls}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => <CallHistoryItem call={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="call-outline" size={64} color={Colors.text.light} />
            <Text style={styles.emptyText}>No recent calls</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function CallHistoryItem({ call }: { call: CallWithHost }) {
  const router = useRouter();

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min${mins !== 1 ? 's' : ''}`;
  };

  const handleAudioCall = () => {
    if (call.host?.isOnline) {
      router.push({
        pathname: '/calling',
        params: {
          hostId: call.host.$id,
          hostName: call.host.name,
          hostPicture: call.host.profilePictureUrl,
          isVideo: '0',
          costPerMin: call.host.audioCostPerMin.toString(),
        },
      });
    }
  };

  const handleVideoCall = () => {
    if (call.host?.isOnline) {
      router.push({
        pathname: '/calling',
        params: {
          hostId: call.host.$id,
          hostName: call.host.name,
          hostPicture: call.host.profilePictureUrl,
          isVideo: '1',
          costPerMin: call.host.videoCostPerMin.toString(),
        },
      });
    }
  };

  const callTypeText = call.callType === 'video' ? 'Video' : 'Audio';
  const hostName = call.host?.name || 'Unknown Host';
  const hostPicture = call.host?.profilePictureUrl || 'https://via.placeholder.com/150';
  const isHostOnline = call.host?.isOnline || false;

  return (
    <View style={styles.callItem}>
      <Image source={{ uri: hostPicture }} style={styles.profilePicture} />
      <View style={styles.callInfo}>
        <Text style={styles.hostName}>{hostName}</Text>
        <Text style={styles.callDetails}>
          Outgoing {callTypeText} • {formatDuration(call.duration)}
        </Text>
        <Text style={styles.timestamp}>{formatTimestamp(call.startTime)}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.callButton,
            !isHostOnline && styles.callButtonDisabled,
          ]}
          onPress={handleAudioCall}
          disabled={!isHostOnline}
          activeOpacity={0.7}
        >
          <Ionicons
            name="call"
            size={20}
            color={isHostOnline ? Colors.accent : Colors.text.light}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.callButton,
            !isHostOnline && styles.callButtonDisabled,
          ]}
          onPress={handleVideoCall}
          disabled={!isHostOnline}
          activeOpacity={0.7}
        >
          <Ionicons
            name="videocam"
            size={22}
            color={isHostOnline ? Colors.accent : Colors.text.light}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    color: Colors.text.light,
    marginTop: 16,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profilePicture: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.border,
  },
  callInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hostName: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  callDetails: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: FontSizes.xs,
    color: Colors.text.light,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  callButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.border,
    opacity: 0.5,
  },
});
