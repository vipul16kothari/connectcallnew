/**
 * ========================================
 * CONNECTCALL API CONFIGURATION
 * ========================================
 *
 * IMPORTANT: Add your production API keys here
 * All external service configurations in one place
 *
 * FOR PRODUCTION DEPLOYMENT:
 * 1. Replace all placeholder values with your actual API keys
 * 2. Never commit real API keys to version control
 * 3. Use environment variables in production (.env file)
 *
 * SECURITY NOTE: Keep this file secure and never expose
 * sensitive keys in client-side code in production
 */

// ========================================
// APPWRITE BACKEND CONFIGURATION
// ========================================
export const APPWRITE_CONFIG = {
  // Your Appwrite project endpoint
  // Default: https://cloud.appwrite.io/v1
  // Self-hosted example: https://appwrite.yourdomain.com/v1
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',

  // Your Appwrite Project ID
  // Find this in: Appwrite Console > Your Project > Settings > Project ID
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || 'YOUR_APPWRITE_PROJECT_ID',

  // Your Appwrite Database ID
  // Find this in: Appwrite Console > Databases > Your Database > Settings
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'YOUR_DATABASE_ID',

  // Collection IDs
  collections: {
    // Users collection (stores user profiles)
    users: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'YOUR_USERS_COLLECTION_ID',

    // Hosts collection (stores host profiles)
    hosts: process.env.EXPO_PUBLIC_APPWRITE_HOSTS_COLLECTION_ID || 'YOUR_HOSTS_COLLECTION_ID',

    // Calls collection (stores call history)
    calls: process.env.EXPO_PUBLIC_APPWRITE_CALLS_COLLECTION_ID || 'YOUR_CALLS_COLLECTION_ID',

    // Transactions collection (stores payment transactions)
    transactions:
      process.env.EXPO_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID ||
      'YOUR_TRANSACTIONS_COLLECTION_ID',
  },

  // Storage Bucket ID (for profile pictures, etc.)
  bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID || 'YOUR_BUCKET_ID',
};

// ========================================
// GETSTREAM.IO VIDEO CALLING
// ========================================
export const STREAM_CONFIG = {
  // Your GetStream API Key
  // Get this from: GetStream Dashboard > Your App > API Key
  // Sign up at: https://getstream.io/
  apiKey: process.env.EXPO_PUBLIC_STREAM_API_KEY || 'YOUR_STREAM_API_KEY',

  // GetStream App Secret (NEVER expose in production client code)
  // This should ONLY be used on your backend server
  // For client apps, generate tokens on your backend
  secret: process.env.EXPO_PUBLIC_STREAM_SECRET || 'YOUR_STREAM_SECRET',

  // Token generation (IMPORTANT: Move to backend in production)
  // For development: can generate client-side
  // For production: MUST generate on backend for security
  tokenProvider: 'backend', // 'backend' | 'client'
  tokenEndpoint: process.env.EXPO_PUBLIC_STREAM_TOKEN_ENDPOINT || '/api/stream/token',
};

// ========================================
// RAZORPAY PAYMENT GATEWAY
// ========================================
export const RAZORPAY_CONFIG = {
  // Your Razorpay Key ID
  // Get this from: Razorpay Dashboard > Settings > API Keys
  // Sign up at: https://razorpay.com/
  keyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY_ID',

  // Your Razorpay Key Secret (NEVER expose in client code)
  // This should ONLY be used on your backend server
  keySecret: process.env.EXPO_PUBLIC_RAZORPAY_KEY_SECRET || 'YOUR_RAZORPAY_KEY_SECRET',

  // Payment webhook endpoint (backend)
  webhookEndpoint: process.env.EXPO_PUBLIC_RAZORPAY_WEBHOOK || '/api/payment/razorpay/webhook',

  // Order creation endpoint (backend)
  orderEndpoint: process.env.EXPO_PUBLIC_RAZORPAY_ORDER_ENDPOINT || '/api/payment/razorpay/order',

  // Currency
  currency: 'INR',

  // Enable/disable Razorpay
  enabled: true,
};

// ========================================
// CASHFREE PAYMENT GATEWAY
// ========================================
export const CASHFREE_CONFIG = {
  // Your Cashfree App ID
  // Get this from: Cashfree Dashboard > Developers > API Keys
  // Sign up at: https://cashfree.com/
  appId: process.env.EXPO_PUBLIC_CASHFREE_APP_ID || 'YOUR_CASHFREE_APP_ID',

  // Your Cashfree Secret Key (NEVER expose in client code)
  // This should ONLY be used on your backend server
  secretKey: process.env.EXPO_PUBLIC_CASHFREE_SECRET_KEY || 'YOUR_CASHFREE_SECRET_KEY',

  // Environment: 'TEST' for sandbox, 'PROD' for production
  environment: (process.env.EXPO_PUBLIC_CASHFREE_ENV as 'TEST' | 'PROD') || 'TEST',

  // Payment webhook endpoint (backend)
  webhookEndpoint: process.env.EXPO_PUBLIC_CASHFREE_WEBHOOK || '/api/payment/cashfree/webhook',

  // Order creation endpoint (backend)
  orderEndpoint: process.env.EXPO_PUBLIC_CASHFREE_ORDER_ENDPOINT || '/api/payment/cashfree/order',

  // Enable/disable Cashfree
  enabled: true,
};

// ========================================
// NEWELL AI CONFIGURATION
// ========================================
export const NEWELL_CONFIG = {
  // Newell AI API URL
  apiUrl: process.env.EXPO_PUBLIC_NEWELL_API_URL || 'https://newell.fastshot.ai',

  // Your Project UUID
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'd3cb88a0-b3ce-4ec5-9876-a85bbcca736f',
};

// ========================================
// CALL PRICING CONFIGURATION
// ========================================
export const CALL_PRICING = {
  // Cost per minute for audio calls (in coins)
  audioPerMinute: 10,

  // Cost per minute for video calls (in coins)
  videoPerMinute: 60,

  // Minimum call duration in seconds
  minimumDuration: 60,

  // Warning threshold (show warning when this many seconds remain)
  warningThreshold: 60,

  // Reconnection timeout (seconds to wait before ending call)
  reconnectionTimeout: 45,
};

// ========================================
// COIN PACKAGES CONFIGURATION
// ========================================
export const COIN_PACKAGES = [
  {
    id: 'package_100',
    coins: 100,
    price: 99, // in INR
    priceDisplay: '₹99',
    popular: false,
  },
  {
    id: 'package_300',
    coins: 300,
    price: 249,
    priceDisplay: '₹249',
    popular: true,
    discount: '17% OFF',
  },
  {
    id: 'package_600',
    coins: 600,
    price: 449,
    priceDisplay: '₹449',
    popular: false,
    discount: '25% OFF',
  },
  {
    id: 'package_1200',
    coins: 1200,
    price: 799,
    priceDisplay: '₹799',
    popular: false,
    discount: '33% OFF',
  },
];

// Quick top-up packages for in-call purchases
export const QUICK_TOPUP_PACKAGES = [
  {
    id: 'quick_100',
    coins: 100,
    price: 99,
    priceDisplay: '₹99',
    duration: '10 min audio / 1.5 min video',
  },
  {
    id: 'quick_300',
    coins: 300,
    price: 249,
    priceDisplay: '₹249',
    duration: '30 min audio / 5 min video',
    popular: true,
  },
  {
    id: 'quick_600',
    coins: 600,
    price: 449,
    priceDisplay: '₹449',
    duration: '60 min audio / 10 min video',
  },
];

// ========================================
// APP CONFIGURATION
// ========================================
export const APP_CONFIG = {
  // App name
  name: 'Connectcall',

  // App version
  version: '1.0.0',

  // Support email
  supportEmail: 'support@connectcall.app',

  // Terms & Privacy URLs
  termsUrl: 'https://connectcall.app/terms',
  privacyUrl: 'https://connectcall.app/privacy',

  // Initial bonus coins for new users
  initialBonusCoins: 50,
};

// ========================================
// VALIDATION & HELPERS
// ========================================

/**
 * Validate if all required configurations are set
 */
export function validateConfig(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check Appwrite
  if (!APPWRITE_CONFIG.projectId || APPWRITE_CONFIG.projectId === 'YOUR_APPWRITE_PROJECT_ID') {
    missing.push('Appwrite Project ID');
  }
  if (!APPWRITE_CONFIG.databaseId || APPWRITE_CONFIG.databaseId === 'YOUR_DATABASE_ID') {
    missing.push('Appwrite Database ID');
  }

  // Check GetStream
  if (!STREAM_CONFIG.apiKey || STREAM_CONFIG.apiKey === 'YOUR_STREAM_API_KEY') {
    missing.push('GetStream API Key');
  }

  // Check Payment Gateways (at least one should be configured)
  const hasRazorpay =
    RAZORPAY_CONFIG.keyId && RAZORPAY_CONFIG.keyId !== 'YOUR_RAZORPAY_KEY_ID';
  const hasCashfree = CASHFREE_CONFIG.appId && CASHFREE_CONFIG.appId !== 'YOUR_CASHFREE_APP_ID';

  if (!hasRazorpay && !hasCashfree) {
    warnings.push('No payment gateway configured (Razorpay or Cashfree)');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Get payment gateway preference
 */
export function getPreferredPaymentGateway(): 'razorpay' | 'cashfree' | null {
  if (RAZORPAY_CONFIG.enabled && RAZORPAY_CONFIG.keyId !== 'YOUR_RAZORPAY_KEY_ID') {
    return 'razorpay';
  }
  if (CASHFREE_CONFIG.enabled && CASHFREE_CONFIG.appId !== 'YOUR_CASHFREE_APP_ID') {
    return 'cashfree';
  }
  return null;
}

// Log configuration status on app start (development only)
if (__DEV__) {
  const validation = validateConfig();
  if (!validation.valid) {
    console.warn('⚠️ Configuration Issues:');
    console.warn('Missing:', validation.missing);
  }
  if (validation.warnings.length > 0) {
    console.warn('Warnings:', validation.warnings);
  }
}
