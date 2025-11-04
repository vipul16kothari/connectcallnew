# Connectcall Production Integration Guide

This guide documents the transformation from mock data to production-ready systems using Appwrite, GetStream.io, and Razorpay.

## ✅ Completed

### 1. Dependencies Installed
- ✅ Appwrite SDK
- ✅ GetStream.io Video SDK + peer dependencies
- ✅ Razorpay SDK
- ✅ React Native NetInfo (for connection monitoring)

### 2. Service Layer Created
- ✅ `/services/appwrite.ts` - Complete Appwrite integration
- ✅ `/services/stream.ts` - GetStream.io video/audio calling
- ✅ `/services/payment.ts` - Razorpay payment integration

### 3. Context Updated
- ✅ `/contexts/UserContext.tsx` - Now uses Appwrite for auth and data

### 4. Screens Updated
- ✅ `/app/login.tsx` - Live authentication with Appwrite

## 🔧 Configuration Required

### 1. Create `.env` file
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 2. Setup Appwrite Backend

#### Create Project
1. Go to https://cloud.appwrite.io
2. Create a new project
3. Copy the Project ID to `.env`

#### Create Database & Collections

**Database:** `connectcall_db`

**Collections:**

**a) users collection:**
```json
{
  "userId": "string" (required, indexed),
  "name": "string" (required),
  "phone": "string" (required, indexed),
  "gender": "string" (required),
  "language": "string" (required),
  "walletBalance": "integer" (required, default: 50),
  "isHost": "boolean" (required, default: false),
  "hostStatus": "string" (required, default: "none"),
  "createdAt": "datetime" (required),
  "updatedAt": "datetime" (required)
}
```

**b) hosts collection:**
```json
{
  "userId": "string" (required, indexed),
  "name": "string" (required),
  "profilePictureUrl": "string" (required),
  "languages": "string[]" (required),
  "specialties": "string[]" (required),
  "bio": "string" (required),
  "rating": "float" (required, default: 0),
  "totalCalls": "integer" (required, default: 0),
  "audioCostPerMin": "integer" (required, default: 10),
  "videoCostPerMin": "integer" (required, default: 15),
  "isOnline": "boolean" (required, default: false, indexed),
  "lastOnlineAt": "datetime" (required),
  "createdAt": "datetime" (required),
  "updatedAt": "datetime" (required)
}
```

**c) calls collection:**
```json
{
  "callId": "string" (required, indexed),
  "userId": "string" (required, indexed),
  "hostId": "string" (required, indexed),
  "callType": "string" (required),
  "startTime": "datetime" (required),
  "endTime": "datetime",
  "duration": "integer" (required, default: 0),
  "coinsSpent": "integer" (required, default: 0),
  "status": "string" (required, indexed),
  "createdAt": "datetime" (required)
}
```

**d) transactions collection:**
```json
{
  "userId": "string" (required, indexed),
  "type": "string" (required, indexed),
  "amount": "integer" (required),
  "description": "string" (required),
  "reference": "string",
  "paymentGateway": "string",
  "status": "string" (required, default: "completed"),
  "createdAt": "datetime" (required, indexed)
}
```

### 3. Setup GetStream.io
1. Go to https://getstream.io
2. Create a new Video & Audio project
3. Copy the API Key to `.env`
4. Setup backend token generation (see Backend Requirements)

### 4. Setup Razorpay
1. Go to https://razorpay.com
2. Create account and get API keys
3. Add Key ID to `.env`
4. Setup backend order creation (see Backend Requirements)

## 🚀 Implementation Status

### Phase 1: Backend Foundation ✅
- [x] Appwrite service layer
- [x] User authentication
- [x] Database operations
- [ ] Update remaining screens to use Appwrite

### Phase 2: Live Calling 🔄
- [x] GetStream service layer
- [ ] Update calling screen with GetStream
- [ ] Add wallet-powered countdown timer
- [ ] Add connection monitoring

### Phase 3: Payments 🔄
- [x] Razorpay service layer
- [ ] Update wallet screen
- [ ] Add in-call recharge
- [ ] Transaction recording

## 📱 Screen Updates Needed

### High Priority

#### 1. Profile Creation Screen (`/app/profile-creation.tsx`)
```typescript
// Update to use: user.createUserProfile(data)
// After profile creation, check if female → show SuperHost sheet
```

#### 2. Home Screen (`/app/(tabs)/index.tsx`)
```typescript
// Replace MOCK_HOSTS with:
const [hosts, setHosts] = useState<AppwriteHost[]>([]);

useEffect(() => {
  loadHosts();

  // Subscribe to host updates
  const unsubscribe = hostService.subscribeToHostUpdates((event) => {
    // Update hosts in real-time
  });

  return unsubscribe;
}, []);

const loadHosts = async () => {
  const onlineHosts = await hostService.getOnlineHosts();
  setHosts(onlineHosts);
};

// Update wallet balance display:
const walletBalance = user?.userProfile?.walletBalance || 0;
```

#### 3. Host Dashboard (`/app/host-dashboard.tsx`)
```typescript
// Add toggle online status:
const handleToggleOnline = async () => {
  if (!user?.hostProfile) return;

  const newStatus = !isOnline;
  await hostService.updateOnlineStatus(
    user.hostProfile.$id,
    newStatus
  );
  setIsOnline(newStatus);
};
```

#### 4. Calling Screen (`/app/calling.tsx`)
**Complete Rewrite Needed** - This is the most critical update.

```typescript
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import * as StreamService from '@/services/stream';
import { callService, transactionService } from '@/services/appwrite';
import NetInfo from '@react-native-community/netinfo';
import { calculateCallDuration, calculateCoinsRequired } from '@/services/payment';

export default function CallingScreen() {
  const router = useRouter();
  const { hostId, hostName, isVideo, costPerMin } = useLocalSearchParams();
  const { user, updateWallet } = useUser();

  const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [remainingTime, setRemainingTime] = useState(0); // seconds
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectTimer, setReconnectTimer] = useState(45);

  // Calculate max duration based on wallet
  useEffect(() => {
    if (!user?.userProfile) return;

    const maxDuration = calculateCallDuration(
      user.userProfile.walletBalance,
      parseInt(costPerMin as string)
    );
    setRemainingTime(maxDuration);
  }, [user]);

  // Initialize call
  useEffect(() => {
    initializeCall();

    // Monitor connection
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected && callState === 'connected') {
        setIsReconnecting(true);
        startReconnectTimer();
      } else if (state.isConnected && isReconnecting) {
        setIsReconnecting(false);
        setReconnectTimer(45);
      }
    });

    return () => {
      unsubscribe();
      endCall();
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (callState !== 'connected' || remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          handleCallEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [callState, remainingTime]);

  const initializeCall = async () => {
    try {
      // Generate token (in production, call backend)
      const token = await StreamService.generateStreamToken(user!.authUser!.$id);

      // Initialize Stream client
      await StreamService.initializeStreamClient(
        user!.authUser!.$id,
        user!.userProfile!.name,
        token
      );

      // Create call
      const call = await StreamService.createCall({
        callId: `call_${Date.now()}`,
        userId: user!.authUser!.$id,
        userName: user!.userProfile!.name,
        hostId: hostId as string,
        hostName: hostName as string,
        isVideo: isVideo === '1',
      });

      // Record call in database
      await callService.createCall({
        callId: call.id,
        userId: user!.authUser!.$id,
        hostId: hostId as string,
        callType: isVideo === '1' ? 'video' : 'audio',
      });

      setCallState('connected');
    } catch (error) {
      console.error('Call initialization error:', error);
      Alert.alert('Call Failed', 'Unable to connect. Please try again.');
      router.back();
    }
  };

  const handleCallEnd = async () => {
    // Calculate coins spent
    const duration = calculateCallDuration(
      user!.userProfile!.walletBalance,
      parseInt(costPerMin as string)
    ) - remainingTime;

    const coinsSpent = calculateCoinsRequired(
      duration,
      parseInt(costPerMin as string)
    );

    // Deduct coins
    await updateWallet(-coinsSpent);

    // Record transaction
    await transactionService.createTransaction({
      userId: user!.authUser!.$id,
      type: 'call',
      amount: -coinsSpent,
      description: `${isVideo === '1' ? 'Video' : 'Audio'} call with ${hostName}`,
    });

    // End call
    await StreamService.endCall();

    setCallState('ended');
    router.replace('/(tabs)');
  };

  // Rest of component...
  // Add countdown timer display
  // Add reconnection overlay
  // Add in-call recharge button
}
```

#### 5. Wallet Screen (`/app/wallet.tsx`)
```typescript
import { purchaseCoins, COIN_PACKAGES } from '@/services/payment';
import { transactionService } from '@/services/appwrite';

const handlePurchase = async (pkg: CoinPackage) => {
  try {
    const result = await purchaseCoins(pkg, {
      name: user!.userProfile!.name,
      email: `${user!.userProfile!.phone}@connectcall.app`,
      phone: user!.userProfile!.phone,
    });

    if (result.success) {
      // Add coins to wallet
      await updateWallet(pkg.coins);

      // Record transaction
      await transactionService.createTransaction({
        userId: user!.authUser!.$id,
        type: 'purchase',
        amount: pkg.coins,
        description: `Purchase ${pkg.coins} coins`,
        reference: result.paymentId,
        paymentGateway: 'razorpay',
      });

      Alert.alert('Success', `${pkg.coins} coins added to your wallet!`);
    } else {
      Alert.alert('Payment Failed', result.error || 'Please try again');
    }
  } catch (error) {
    Alert.alert('Error', 'Payment processing failed');
  }
};
```

#### 6. Recent Calls Screen (`/app/(tabs)/recents.tsx`)
```typescript
const [callHistory, setCallHistory] = useState<AppwriteCall[]>([]);

useEffect(() => {
  loadCallHistory();
}, []);

const loadCallHistory = async () => {
  if (!user?.authUser) return;

  const calls = await callService.getCallHistory(user.authUser.$id);
  setCallHistory(calls);
};
```

#### 7. Transactions Screen (`/app/transactions.tsx`)
```typescript
const [transactions, setTransactions] = useState<AppwriteTransaction[]>([]);

useEffect(() => {
  loadTransactions();
}, []);

const loadTransactions = async () => {
  if (!user?.authUser) return;

  const txns = await transactionService.getTransactionHistory(user.authUser.$id);
  setTransactions(txns);
};
```

## 🔐 Backend Requirements (Production)

### 1. Stream Token Generation API
Create a backend endpoint to generate secure Stream tokens:

```typescript
// POST /api/stream/token
// Body: { userId: string }
// Response: { token: string }

import { StreamChat } from 'stream-chat';

const serverClient = StreamChat.getInstance(API_KEY, API_SECRET);
const token = serverClient.createToken(userId);
```

### 2. Razorpay Order Creation API
```typescript
// POST /api/payment/create-order
// Body: { amount: number, currency: string }
// Response: { orderId: string, amount: number, currency: string }

const instance = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

const order = await instance.orders.create({
  amount: amount,
  currency: currency,
  receipt: `receipt_${Date.now()}`,
});
```

### 3. Payment Verification API
```typescript
// POST /api/payment/verify
// Body: { orderId: string, paymentId: string, signature: string }
// Response: { verified: boolean }

const crypto = require('crypto');
const body = orderId + '|' + paymentId;
const expectedSignature = crypto
  .createHmac('sha256', KEY_SECRET)
  .update(body)
  .digest('hex');

const isVerified = expectedSignature === signature;
```

## 🎨 New Components Needed

### 1. In-Call Recharge Bottom Sheet
Create `/components/InCallRechargeSheet.tsx`:

```typescript
import { purchaseCoins, QUICK_RECHARGE_PACKAGES } from '@/services/payment';

export default function InCallRechargeSheet({ visible, onClose, onSuccess }) {
  // Display QUICK_RECHARGE_PACKAGES
  // Handle purchase
  // On success, update wallet and call onSuccess
}
```

### 2. Connection Monitoring Overlay
Create `/components/ConnectionOverlay.tsx`:

```typescript
export default function ConnectionOverlay({
  isReconnecting,
  remainingTime
}) {
  if (!isReconnecting) return null;

  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.text}>
        Reconnecting... {remainingTime}s
      </Text>
    </View>
  );
}
```

### 3. Countdown Timer
Create `/components/CallCountdownTimer.tsx`:

```typescript
export default function CallCountdownTimer({
  remainingTime,
  isLowTime
}) {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <View style={[
      styles.container,
      isLowTime && styles.lowTime
    ]}>
      <Ionicons name="time" size={20} color="#fff" />
      <Text style={styles.time}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </Text>
    </View>
  );
}
```

## 🧪 Testing Checklist

### Authentication
- [ ] New user signup
- [ ] Existing user login
- [ ] Profile creation
- [ ] Logout

### Host Features
- [ ] Host application
- [ ] Verification pending status
- [ ] Approved host dashboard
- [ ] Online/offline toggle
- [ ] Real-time status updates

### Calling
- [ ] Audio call initiation
- [ ] Video call initiation
- [ ] Countdown timer accuracy
- [ ] Auto-end on zero balance
- [ ] Connection monitoring
- [ ] Reconnection logic
- [ ] In-call recharge

### Payments
- [ ] Razorpay integration
- [ ] Successful payment
- [ ] Failed payment handling
- [ ] Wallet balance update
- [ ] Transaction recording

### Real-time Features
- [ ] Host online status updates
- [ ] Wallet balance sync
- [ ] Call history updates

## 📦 Next Steps

1. **Create `.env` file** with all credentials
2. **Setup Appwrite** database and collections
3. **Update remaining screens** to use services
4. **Implement backend APIs** for tokens and payments
5. **Test thoroughly** on real devices
6. **Deploy backend** (recommended: Vercel/Railway/Render)

## 🎯 Critical Notes

- **Security:** Never store API secrets in the app. Use backend APIs.
- **Tokens:** GetStream and payment tokens MUST be generated server-side.
- **Real-time:** Appwrite Realtime subscriptions should be cleaned up on unmount.
- **Error Handling:** Always show user-friendly messages.
- **Network:** Handle offline scenarios gracefully.
- **Testing:** Test payment flow with Razorpay test mode before production.

## 📞 Support

For issues or questions:
- Appwrite Docs: https://appwrite.io/docs
- GetStream Docs: https://getstream.io/video/docs/
- Razorpay Docs: https://razorpay.com/docs/

---

**Status:** Foundation complete. Phase 2 & 3 implementation in progress.
**Last Updated:** $(date)
