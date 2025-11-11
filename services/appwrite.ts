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

export interface AppwriteHostEarnings {
  audioSeconds: number;
  videoSeconds: number;
  audioAmount: number;
  videoAmount: number;
  totalAmount: number;
  currency: 'INR';
  recordedAt: string;
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
  audioCostPerMin?: number;
  videoCostPerMin?: number;
  billingSegments?: Array<{
    type: 'audio' | 'video';
    durationSeconds: number;
    coinsExact: number;
    coinsRounded: number;
    durationExactSeconds?: number;
  }>;
  hostEarnings?: AppwriteHostEarnings;
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

export interface AppwriteCallPricingConfig extends Models.Document {
  audioCostPerMin: number;
  videoCostPerMin: number;
  minimumDuration?: number;
  warningThreshold?: number;
  reconnectionTimeout?: number;
}

export interface AppwriteCoinPackageConfig extends Models.Document {
  stage?: 'first' | 'repeat';
  coins: number;
  price: number;
  priceDisplay?: string;
  tag?: string;
  tagEmoji?: string;
  discount?: number;
  popular?: boolean;
  isLimitedOffer?: boolean;
  order?: number;
  description?: string;
}

export interface AppwriteQuickTopupPackage extends Models.Document {
  coins: number;
  price: number;
  priceDisplay?: string;
  popular?: boolean;
  order?: number;
}

export interface ConfiguredCallPricing {
  audioCostPerMin: number;
  videoCostPerMin: number;
  minimumDuration: number;
  warningThreshold: number;
  reconnectionTimeout: number;
}

export interface ConfiguredCoinPackage {
  id: string;
  coins: number;
  priceDisplay: string;
  priceValue: number;
  tag?: string;
  tagEmoji?: string;
  discount?: number;
  popular?: boolean;
  isLimitedOffer?: boolean;
  description?: string;
  sortOrder: number;
}

export interface ConfiguredQuickTopupPackage {
  id: string;
  coins: number;
  priceDisplay: string;
  priceValue: number;
  popular?: boolean;
  sortOrder: number;
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
    audioCostPerMin?: number;
    videoCostPerMin?: number;
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
          audioCostPerMin: data.audioCostPerMin,
          videoCostPerMin: data.videoCostPerMin,
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
    coinsSpent: number,
    billingSegments?: AppwriteCall['billingSegments'],
    hostEarnings?: AppwriteHostEarnings
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
          billingSegments,
          hostEarnings,
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

  async updateCallType(
    callDocumentId: string,
    callType: 'audio' | 'video'
  ): Promise<AppwriteCall | null> {
    try {
      const updatedCall = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.calls,
        callDocumentId,
        {
          callType,
        }
      );
      return updatedCall as unknown as AppwriteCall;
    } catch (error) {
      console.error('Error updating call type:', error);
      return null;
    }
  }

  async updateCallProgress(
    callDocumentId: string,
    data: {
      duration?: number;
      coinsSpent?: number;
      billingSegments?: AppwriteCall['billingSegments'];
    }
  ): Promise<AppwriteCall | null> {
    try {
      const payload: Partial<AppwriteCall> = {
        ...(typeof data.duration === 'number' ? { duration: data.duration } : {}),
        ...(typeof data.coinsSpent === 'number' ? { coinsSpent: data.coinsSpent } : {}),
        ...(data.billingSegments ? { billingSegments: data.billingSegments } : {}),
      };

      if (Object.keys(payload).length === 0) {
        return null;
      }

      const updatedCall = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.calls,
        callDocumentId,
        payload
      );
      return updatedCall as unknown as AppwriteCall;
    } catch (error) {
      console.error('Error updating call progress:', error);
      return null;
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

  async hasCompletedPurchase(userId: string): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.transactions,
        [
          Query.equal('userId', userId),
          Query.equal('type', 'purchase'),
          Query.equal('status', 'completed'),
          Query.limit(1),
        ]
      );
      return response.total > 0;
    } catch (error) {
      console.error('Error checking purchase history:', error);
      return false;
    }
  }
}

function isPlaceholderId(value: string | undefined) {
  return !value || value.startsWith('YOUR_');
}

export class ConfigService {
  private pricingCache: { data: ConfiguredCallPricing; fetchedAt: number } | null = null;
  private coinPackageCache = new Map<string, { data: ConfiguredCoinPackage[]; fetchedAt: number }>();
  private quickTopupCache: { data: ConfiguredQuickTopupPackage[]; fetchedAt: number } | null = null;
  private readonly cacheTtlMs = 5 * 60 * 1000;

  private mapPricingConfig(doc: AppwriteCallPricingConfig): ConfiguredCallPricing {
    return {
      audioCostPerMin: Number(doc.audioCostPerMin ?? 10),
      videoCostPerMin: Number(doc.videoCostPerMin ?? 60),
      minimumDuration: Number(doc.minimumDuration ?? 60),
      warningThreshold: Number(doc.warningThreshold ?? 60),
      reconnectionTimeout: Number(doc.reconnectionTimeout ?? 45),
    };
  }

  private mapCoinPackage(doc: AppwriteCoinPackageConfig): ConfiguredCoinPackage {
    const priceValue = Number(doc.price ?? 0);
    const priceDisplay = doc.priceDisplay || (priceValue ? `₹${priceValue}` : '');

    return {
      id: doc.$id,
      coins: Number(doc.coins ?? 0),
      priceDisplay,
      priceValue,
      tag: doc.tag || undefined,
      tagEmoji: doc.tagEmoji || undefined,
      discount: typeof doc.discount === 'number' ? doc.discount : undefined,
      popular: !!doc.popular,
      isLimitedOffer: !!doc.isLimitedOffer,
      description: doc.description || undefined,
      sortOrder: typeof doc.order === 'number' ? doc.order : Number.MAX_SAFE_INTEGER,
    };
  }

  private mapQuickTopup(doc: AppwriteQuickTopupPackage): ConfiguredQuickTopupPackage {
    const priceValue = Number(doc.price ?? 0);
    const priceDisplay = doc.priceDisplay || (priceValue ? `₹${priceValue}` : '');

    return {
      id: doc.$id,
      coins: Number(doc.coins ?? 0),
      priceDisplay,
      priceValue,
      popular: !!doc.popular,
      sortOrder: typeof doc.order === 'number' ? doc.order : Number.MAX_SAFE_INTEGER,
    };
  }

  async getCallPricingConfig(forceRefresh: boolean = false): Promise<ConfiguredCallPricing | null> {
    if (this.pricingCache && !forceRefresh) {
      const isValid = Date.now() - this.pricingCache.fetchedAt < this.cacheTtlMs;
      if (isValid) {
        return this.pricingCache.data;
      }
    }

    if (isPlaceholderId(APPWRITE_CONFIG.collections.callPricing)) {
      return null;
    }

    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.callPricing,
        [Query.limit(1)]
      );

      if (!response.documents.length) {
        return null;
      }

      const pricing = this.mapPricingConfig(
        response.documents[0] as unknown as AppwriteCallPricingConfig
      );
      this.pricingCache = { data: pricing, fetchedAt: Date.now() };
      return pricing;
    } catch (error) {
      console.error('Error fetching call pricing config:', error);
      return null;
    }
  }

  async getCoinPackages(stage: 'first' | 'repeat'): Promise<ConfiguredCoinPackage[]> {
    const cacheKey = `coin-${stage}`;
    const cached = this.coinPackageCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < this.cacheTtlMs) {
      return cached.data;
    }

    if (isPlaceholderId(APPWRITE_CONFIG.collections.coinPackages)) {
      return [];
    }

    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.coinPackages,
        [Query.equal('stage', stage), Query.orderAsc('order')]
      );

      const packages = (response.documents as unknown as AppwriteCoinPackageConfig[])
        .map((doc) => this.mapCoinPackage(doc))
        .sort((a, b) => a.sortOrder - b.sortOrder);

      this.coinPackageCache.set(cacheKey, { data: packages, fetchedAt: Date.now() });
      return packages;
    } catch (error) {
      console.error('Error fetching coin packages:', error);
      return [];
    }
  }

  async getQuickTopupPackages(): Promise<ConfiguredQuickTopupPackage[]> {
    if (this.quickTopupCache && Date.now() - this.quickTopupCache.fetchedAt < this.cacheTtlMs) {
      return this.quickTopupCache.data;
    }

    if (isPlaceholderId(APPWRITE_CONFIG.collections.quickTopups)) {
      return [];
    }

    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.quickTopups,
        [Query.orderAsc('order')]
      );

      const packages = (response.documents as unknown as AppwriteQuickTopupPackage[])
        .map((doc) => this.mapQuickTopup(doc))
        .sort((a, b) => a.sortOrder - b.sortOrder);

      this.quickTopupCache = { data: packages, fetchedAt: Date.now() };
      return packages;
    } catch (error) {
      console.error('Error fetching quick top-up packages:', error);
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
export const configService = new ConfigService();
