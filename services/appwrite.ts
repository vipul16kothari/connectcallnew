import { Client, Account, Databases, Storage, Query, ID, RealtimeResponseEvent } from 'appwrite';
import { Models } from 'appwrite';
import { APPWRITE_CONFIG } from '@/config/api.config';

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

// Initialize Services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Types for Appwrite documents
export interface AppwriteUser extends Models.Document {
  userId: string;
  name: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  language: string;
  walletBalance: number;
  isHost: boolean;
  hostStatus: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface AppwriteHost extends Models.Document {
  userId: string;
  name: string;
  profilePictureUrl: string;
  languages: string[];
  specialties: string[];
  bio: string;
  rating: number;
  totalCalls: number;
  audioCostPerMin: number;
  videoCostPerMin: number;
  isOnline: boolean;
  lastOnlineAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppwriteCall extends Models.Document {
  callId: string;
  userId: string;
  hostId: string;
  callType: 'audio' | 'video';
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  coinsSpent: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface AppwriteTransaction extends Models.Document {
  userId: string;
  type: 'purchase' | 'call' | 'refund';
  amount: number;
  description: string;
  reference?: string;
  paymentGateway?: 'razorpay' | 'cashfree';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

// Authentication Service
export class AuthService {
  /**
   * Create a new session using phone number (OTP-less authentication)
   */
  async createPhoneSession(phoneNumber: string): Promise<Models.Session> {
    try {
      // In production, implement phone OTP flow
      // For now, using email/password as placeholder
      const session = await account.createEmailPasswordSession(
        `${phoneNumber}@connectcall.app`,
        phoneNumber
      );
      return session;
    } catch (error) {
      console.error('Error creating phone session:', error);
      throw error;
    }
  }

  /**
   * Create a new account
   */
  async createAccount(phoneNumber: string, name: string): Promise<Models.User<Models.Preferences>> {
    try {
      const user = await account.create(
        ID.unique(),
        `${phoneNumber}@connectcall.app`,
        phoneNumber,
        name
      );
      return user;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }
}

// User Service
export class UserService {
  /**
   * Create a new user profile in the database
   */
  async createUserProfile(
    userId: string,
    data: {
      name: string;
      phone: string;
      gender: 'Male' | 'Female' | 'Other';
      language: string;
    }
  ): Promise<AppwriteUser> {
    try {
      const userDoc = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        ID.unique(),
        {
          userId,
          name: data.name,
          phone: data.phone,
          gender: data.gender,
          language: data.language,
          walletBalance: 50, // Initial bonus
          isHost: false,
          hostStatus: 'none',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      return userDoc as unknown as AppwriteUser;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<AppwriteUser | null> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        [Query.equal('userId', userId)]
      );
      return response.documents.length > 0 ? (response.documents[0] as unknown as AppwriteUser) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(documentId: string, data: Partial<AppwriteUser>): Promise<AppwriteUser> {
    try {
      const updatedDoc = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        documentId,
        {
          ...data,
          updatedAt: new Date().toISOString(),
        }
      );
      return updatedDoc as unknown as AppwriteUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Update wallet balance
   */
  async updateWalletBalance(documentId: string, amount: number): Promise<AppwriteUser> {
    try {
      const userProfile = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        documentId
      ) as AppwriteUser;

      const newBalance = (userProfile.walletBalance || 0) + amount;

      const updatedDoc = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        documentId,
        {
          walletBalance: newBalance,
          updatedAt: new Date().toISOString(),
        }
      );
      return updatedDoc as unknown as AppwriteUser;
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  }

  /**
   * Apply to become a host
   */
  async applyForHost(
    userId: string,
    documentId: string,
    hostData: {
      languages: string[];
      specialties: string[];
      bio: string;
      profilePictureUrl: string;
    }
  ): Promise<void> {
    try {
      // Update user status to pending
      await this.updateUserProfile(documentId, {
        hostStatus: 'pending',
      });

      // Create host profile (pending approval)
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.hosts,
        ID.unique(),
        {
          userId,
          name: '', // Will be set on approval
          profilePictureUrl: hostData.profilePictureUrl,
          languages: hostData.languages,
          specialties: hostData.specialties,
          bio: hostData.bio,
          rating: 0,
          totalCalls: 0,
          audioCostPerMin: 10,
          videoCostPerMin: 15,
          isOnline: false,
          lastOnlineAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error('Error applying for host:', error);
      throw error;
    }
  }
}

// Host Service
export class HostService {
  /**
   * Get all online hosts
   */
  async getOnlineHosts(): Promise<AppwriteHost[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.hosts,
        [Query.equal('isOnline', true), Query.orderDesc('rating'), Query.limit(50)]
      );
      return response.documents as unknown as AppwriteHost[];
    } catch (error) {
      console.error('Error getting online hosts:', error);
      return [];
    }
  }

  /**
   * Get host by ID
   */
  async getHostById(hostId: string): Promise<AppwriteHost | null> {
    try {
      const host = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.hosts,
        hostId
      );
      return host as unknown as AppwriteHost;
    } catch (error) {
      console.error('Error getting host:', error);
      return null;
    }
  }

  /**
   * Get host by user ID
   */
  async getHostByUserId(userId: string): Promise<AppwriteHost | null> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.hosts,
        [Query.equal('userId', userId)]
      );
      return response.documents.length > 0 ? (response.documents[0] as unknown as AppwriteHost) : null;
    } catch (error) {
      console.error('Error getting host by user ID:', error);
      return null;
    }
  }

  /**
   * Update host online status
   */
  async updateOnlineStatus(hostDocumentId: string, isOnline: boolean): Promise<AppwriteHost> {
    try {
      const updatedHost = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.hosts,
        hostDocumentId,
        {
          isOnline,
          lastOnlineAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      return updatedHost as unknown as AppwriteHost;
    } catch (error) {
      console.error('Error updating online status:', error);
      throw error;
    }
  }

  /**
   * Subscribe to host online status changes
   */
  subscribeToHostUpdates(callback: (payload: RealtimeResponseEvent<AppwriteHost>) => void) {
    return client.subscribe(
      `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.hosts}.documents`,
      callback
    );
  }
}

// Call Service
export class CallService {
  /**
   * Create a new call record
   */
  async createCall(data: {
    callId: string;
    userId: string;
    hostId: string;
    callType: 'audio' | 'video';
  }): Promise<AppwriteCall> {
    try {
      const callDoc = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.calls,
        ID.unique(),
        {
          callId: data.callId,
          userId: data.userId,
          hostId: data.hostId,
          callType: data.callType,
          startTime: new Date().toISOString(),
          duration: 0,
          coinsSpent: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
        }
      );
      return callDoc as unknown as AppwriteCall;
    } catch (error) {
      console.error('Error creating call:', error);
      throw error;
    }
  }

  /**
   * End a call and update duration
   */
  async endCall(
    callDocumentId: string,
    duration: number,
    coinsSpent: number
  ): Promise<AppwriteCall> {
    try {
      const updatedCall = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.calls,
        callDocumentId,
        {
          endTime: new Date().toISOString(),
          duration,
          coinsSpent,
          status: 'completed',
        }
      );
      return updatedCall as unknown as AppwriteCall;
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  /**
   * Get user's call history
   */
  async getCallHistory(userId: string, limit: number = 20): Promise<AppwriteCall[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.calls,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'completed'),
          Query.orderDesc('startTime'),
          Query.limit(limit),
        ]
      );
      return response.documents as unknown as AppwriteCall[];
    } catch (error) {
      console.error('Error getting call history:', error);
      return [];
    }
  }
}

// Transaction Service
export class TransactionService {
  /**
   * Create a new transaction
   */
  async createTransaction(data: {
    userId: string;
    type: 'purchase' | 'call' | 'refund';
    amount: number;
    description: string;
    reference?: string;
    paymentGateway?: 'razorpay' | 'cashfree';
  }): Promise<AppwriteTransaction> {
    try {
      const transactionDoc = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.transactions,
        ID.unique(),
        {
          userId: data.userId,
          type: data.type,
          amount: data.amount,
          description: data.description,
          reference: data.reference || '',
          paymentGateway: data.paymentGateway || '',
          status: 'completed',
          createdAt: new Date().toISOString(),
        }
      );
      return transactionDoc as unknown as AppwriteTransaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<AppwriteTransaction[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.transactions,
        [Query.equal('userId', userId), Query.orderDesc('createdAt'), Query.limit(limit)]
      );
      return response.documents as unknown as AppwriteTransaction[];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }
}

// Export service instances
export const authService = new AuthService();
export const userService = new UserService();
export const hostService = new HostService();
export const callService = new CallService();
export const transactionService = new TransactionService();
