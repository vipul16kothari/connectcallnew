import RazorpayCheckout from 'react-native-razorpay';
import { Platform } from 'react-native';

// Payment configuration
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';

export interface CoinPackage {
  id: string;
  coins: number;
  price: string;
  priceInPaise: number; // Price in smallest currency unit
  popular?: boolean;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

/**
 * Available coin packages
 */
export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: '1',
    coins: 100,
    price: '$9.99',
    priceInPaise: 999, // $9.99 = 999 cents = 82500 INR paise (approx)
  },
  {
    id: '2',
    coins: 500,
    price: '$44.99',
    priceInPaise: 4499,
    popular: true,
  },
  {
    id: '3',
    coins: 1000,
    price: '$79.99',
    priceInPaise: 7999,
  },
  {
    id: '4',
    coins: 2500,
    price: '$179.99',
    priceInPaise: 17999,
  },
];

/**
 * Quick recharge packages for in-call top-up
 */
export const QUICK_RECHARGE_PACKAGES: CoinPackage[] = [
  {
    id: 'quick-1',
    coins: 100,
    price: '$9.99',
    priceInPaise: 999,
  },
  {
    id: 'quick-2',
    coins: 500,
    price: '$44.99',
    priceInPaise: 4499,
    popular: true,
  },
  {
    id: 'quick-3',
    coins: 1000,
    price: '$79.99',
    priceInPaise: 7999,
  },
];

/**
 * Create a Razorpay order (Backend API call)
 * In production, this should be a call to your backend server
 */
async function createRazorpayOrder(
  amount: number,
  currency: string = 'INR'
): Promise<{ orderId: string; amount: number; currency: string }> {
  try {
    // TODO: Replace with actual backend API call
    // const response = await fetch('YOUR_BACKEND_URL/api/payment/create-order', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ amount, currency }),
    // });
    // const data = await response.json();
    // return data;

    // Placeholder for development
    console.warn('Using mock order creation. Implement backend order creation for production.');
    return {
      orderId: `order_${Date.now()}`,
      amount,
      currency,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

/**
 * Verify payment signature (Backend API call)
 * In production, this MUST be done on the backend for security
 */
async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  try {
    // TODO: Replace with actual backend API call
    // const response = await fetch('YOUR_BACKEND_URL/api/payment/verify', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ orderId, paymentId, signature }),
    // });
    // const data = await response.json();
    // return data.verified;

    // Placeholder for development
    console.warn('Using mock payment verification. Implement backend verification for production.');
    return true;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
}

/**
 * Process a coin purchase using Razorpay
 */
export async function purchaseCoins(
  coinPackage: CoinPackage,
  userDetails: {
    name: string;
    email: string;
    phone: string;
  }
): Promise<PaymentResult> {
  try {
    // Create order on backend
    const order = await createRazorpayOrder(coinPackage.priceInPaise);

    // Configure Razorpay options
    const options = {
      description: `Purchase ${coinPackage.coins} coins`,
      image: 'https://your-app-logo-url.com/logo.png', // Replace with your app logo
      currency: order.currency,
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      name: 'Connectcall',
      order_id: order.orderId,
      prefill: {
        email: userDetails.email,
        contact: userDetails.phone,
        name: userDetails.name,
      },
      theme: { color: '#A77DFF' }, // Your app's primary color
    };

    // Open Razorpay checkout
    const paymentData = await RazorpayCheckout.open(options);

    // Verify payment on backend
    const isVerified = await verifyPaymentSignature(
      order.orderId,
      paymentData.razorpay_payment_id,
      paymentData.razorpay_signature || ''
    );

    if (!isVerified) {
      throw new Error('Payment verification failed');
    }

    return {
      success: true,
      paymentId: paymentData.razorpay_payment_id,
      orderId: paymentData.razorpay_order_id,
      signature: paymentData.razorpay_signature,
    };
  } catch (error: any) {
    console.error('Payment error:', error);
    return {
      success: false,
      error: error.description || error.message || 'Payment failed',
    };
  }
}

/**
 * Calculate call duration based on coins and cost per minute
 */
export function calculateCallDuration(coins: number, costPerMin: number): number {
  // Returns duration in seconds
  const minutes = Math.floor(coins / costPerMin);
  return minutes * 60;
}

/**
 * Calculate coins required for a given duration
 */
export function calculateCoinsRequired(durationInSeconds: number, costPerMin: number): number {
  const minutes = Math.ceil(durationInSeconds / 60);
  return minutes * costPerMin;
}

/**
 * Format price for display
 */
export function formatPrice(priceInPaise: number, currency?: string): string {
  const curr = currency || 'INR';
  const amount = priceInPaise / 100;
  if (curr === 'INR') {
    return `₹${amount.toFixed(2)}`;
  }
  return `$${amount.toFixed(2)}`;
}
