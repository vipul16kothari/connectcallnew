import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FontSizes } from '@/constants/Fonts';
import { MOCK_CALL_HISTORY } from '@/data/mockData';
import { CallHistory } from '@/types/host';
import { Ionicons } from '@expo/vector-icons';

export default function RecentsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Calls</Text>
      </View>

      {/* Call History List */}
      <FlatList
        data={MOCK_CALL_HISTORY}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CallHistoryItem call={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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

function CallHistoryItem({ call }: { call: CallHistory }) {
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
    if (call.isHostOnline) {
      router.push({
        pathname: '/calling',
        params: {
          hostId: call.hostId,
          hostName: call.hostName,
          hostPicture: call.hostProfilePicture,
          isVideo: '0',
          costPerMin: '10',
        },
      });
    }
  };

  const handleVideoCall = () => {
    if (call.isHostOnline) {
      router.push({
        pathname: '/calling',
        params: {
          hostId: call.hostId,
          hostName: call.hostName,
          hostPicture: call.hostProfilePicture,
          isVideo: '1',
          costPerMin: '15',
        },
      });
    }
  };

  const callTypeText = call.callType === 'video' ? 'Video' : 'Audio';

  return (
    <View style={styles.callItem}>
      <Image
        source={{ uri: call.hostProfilePicture }}
        style={styles.profilePicture}
      />
      <View style={styles.callInfo}>
        <Text style={styles.hostName}>{call.hostName}</Text>
        <Text style={styles.callDetails}>
          Outgoing {callTypeText} • {formatDuration(call.duration)}
        </Text>
        <Text style={styles.timestamp}>{formatTimestamp(call.timestamp)}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.callButton,
            !call.isHostOnline && styles.callButtonDisabled,
          ]}
          onPress={handleAudioCall}
          disabled={!call.isHostOnline}
          activeOpacity={0.7}
        >
          <Ionicons
            name="call"
            size={20}
            color={call.isHostOnline ? Colors.accent : Colors.text.light}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.callButton,
            !call.isHostOnline && styles.callButtonDisabled,
          ]}
          onPress={handleVideoCall}
          disabled={!call.isHostOnline}
          activeOpacity={0.7}
        >
          <Ionicons
            name="videocam"
            size={22}
            color={call.isHostOnline ? Colors.accent : Colors.text.light}
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
