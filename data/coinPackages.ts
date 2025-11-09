import { CoinPackage } from '@/types/host';

export interface EnhancedCoinPackage extends CoinPackage {
  tag?: string;
  tagEmoji?: string;
  originalPrice?: string;
  discount?: number;
  isLimitedOffer?: boolean;
}

export const ENHANCED_COIN_PACKAGES: EnhancedCoinPackage[] = [
  {
    id: '1',
    coins: 100,
    price: '$4.99',
    originalPrice: '$9.99',
    discount: 50,
    tag: 'Starter',
    tagEmoji: '🌟',
  },
  {
    id: '2',
    coins: 250,
    price: '$9.99',
    originalPrice: '$19.99',
    discount: 50,
    tag: 'Hot Deal',
    tagEmoji: '🔥',
  },
  {
    id: '3',
    coins: 500,
    price: '$19.99',
    originalPrice: '$39.99',
    discount: 50,
    tag: 'Most Popular',
    tagEmoji: '💎',
    popular: true,
  },
  {
    id: '4',
    coins: 750,
    price: '$27.99',
    originalPrice: '$54.99',
    discount: 49,
    tag: 'Great Value',
    tagEmoji: '⭐',
  },
  {
    id: '5',
    coins: 1000,
    price: '$34.99',
    originalPrice: '$69.99',
    discount: 50,
    tag: 'Premium',
    tagEmoji: '👑',
  },
  {
    id: '6',
    coins: 1500,
    price: '$49.99',
    originalPrice: '$99.99',
    discount: 50,
    tag: 'Super Saver',
    tagEmoji: '💰',
  },
  {
    id: '7',
    coins: 2000,
    price: '$64.99',
    originalPrice: '$129.99',
    discount: 50,
    tag: 'Mega Pack',
    tagEmoji: '🚀',
  },
  {
    id: '8',
    coins: 2500,
    price: '$79.99',
    originalPrice: '$159.99',
    discount: 50,
    tag: 'Ultimate',
    tagEmoji: '⚡',
  },
  {
    id: '9',
    coins: 3000,
    price: '$89.99',
    originalPrice: '$179.99',
    discount: 50,
    tag: 'Pro',
    tagEmoji: '🎯',
  },
  {
    id: '10',
    coins: 5000,
    price: '$139.99',
    originalPrice: '$279.99',
    discount: 50,
    tag: 'Elite',
    tagEmoji: '💫',
  },
  {
    id: '11',
    coins: 7500,
    price: '$199.99',
    originalPrice: '$399.99',
    discount: 50,
    tag: 'Champion',
    tagEmoji: '🏆',
  },
  {
    id: '12',
    coins: 10000,
    price: '$249.99',
    originalPrice: '$499.99',
    discount: 50,
    tag: 'Legend',
    tagEmoji: '👑',
  },
];

// Special limited-time offer package for low balance users
export const LIMITED_OFFER_PACKAGE: EnhancedCoinPackage = {
  id: 'limited-1',
  coins: 500,
  price: '$9.99',
  originalPrice: '$39.99',
  discount: 75,
  tag: 'Limited Offer',
  tagEmoji: '⏰',
  isLimitedOffer: true,
  popular: true,
};
