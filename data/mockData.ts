import { Host, CoinPackage, CallHistory, Transaction } from '@/types/host';

export const MOCK_HOSTS: Host[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    profilePicture: 'https://i.pravatar.cc/300?img=1',
    languages: ['English', 'Chinese'],
    bio: 'Travel enthusiast and language expert with 5 years of experience. Love discussing culture, food, and adventure stories!',
    rating: 4.9,
    audioCostPerMin: 10,
    videoCostPerMin: 15,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Marco Rossi',
    profilePicture: 'https://i.pravatar.cc/300?img=12',
    languages: ['English', 'Italian', 'Spanish'],
    bio: 'Passionate about arts, history, and Italian cuisine. Let\'s chat about life and learn together!',
    rating: 4.8,
    audioCostPerMin: 12,
    videoCostPerMin: 18,
    isOnline: true,
  },
  {
    id: '3',
    name: 'Emma Williams',
    profilePicture: 'https://i.pravatar.cc/300?img=5',
    languages: ['English', 'French'],
    bio: 'Life coach and motivational speaker. Here to inspire and have meaningful conversations with you.',
    rating: 4.95,
    audioCostPerMin: 15,
    videoCostPerMin: 20,
    isOnline: true,
  },
  {
    id: '4',
    name: 'Yuki Tanaka',
    profilePicture: 'https://i.pravatar.cc/300?img=47',
    languages: ['English', 'Japanese'],
    bio: 'Anime and manga lover, tech geek. Let\'s discuss Japanese culture and technology!',
    rating: 4.7,
    audioCostPerMin: 8,
    videoCostPerMin: 12,
    isOnline: true,
  },
  {
    id: '5',
    name: 'Ahmed Hassan',
    profilePicture: 'https://i.pravatar.cc/300?img=33',
    languages: ['English', 'Arabic'],
    bio: 'Philosophy and literature enthusiast. Deep conversations about life, culture, and spirituality.',
    rating: 4.85,
    audioCostPerMin: 10,
    videoCostPerMin: 15,
    isOnline: true,
  },
  {
    id: '6',
    name: 'Sofia Martinez',
    profilePicture: 'https://i.pravatar.cc/300?img=9',
    languages: ['English', 'Spanish', 'Portuguese'],
    bio: 'Salsa dancer and music teacher. Let\'s talk about Latin culture, music, and dance!',
    rating: 4.8,
    audioCostPerMin: 11,
    videoCostPerMin: 16,
    isOnline: true,
  },
];

export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: '1',
    coins: 100,
    price: '$9.99',
  },
  {
    id: '2',
    coins: 500,
    price: '$44.99',
    popular: true,
  },
  {
    id: '3',
    coins: 1000,
    price: '$79.99',
  },
  {
    id: '4',
    coins: 2500,
    price: '$179.99',
  },
];

export const INITIAL_WALLET_BALANCE = 50;

export const MOCK_CALL_HISTORY: CallHistory[] = [
  {
    id: '1',
    hostId: '1',
    hostName: 'Sarah Chen',
    hostProfilePicture: 'https://i.pravatar.cc/300?img=1',
    callType: 'video',
    direction: 'outgoing',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    duration: 1800, // 30 minutes
    isHostOnline: true,
  },
  {
    id: '2',
    hostId: '3',
    hostName: 'Emma Williams',
    hostProfilePicture: 'https://i.pravatar.cc/300?img=5',
    callType: 'audio',
    direction: 'outgoing',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    duration: 900, // 15 minutes
    isHostOnline: false,
  },
  {
    id: '3',
    hostId: '2',
    hostName: 'Marco Rossi',
    hostProfilePicture: 'https://i.pravatar.cc/300?img=12',
    callType: 'video',
    direction: 'outgoing',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    duration: 2400, // 40 minutes
    isHostOnline: true,
  },
  {
    id: '4',
    hostId: '4',
    hostName: 'Yuki Tanaka',
    hostProfilePicture: 'https://i.pravatar.cc/300?img=47',
    callType: 'audio',
    direction: 'outgoing',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    duration: 600, // 10 minutes
    isHostOnline: true,
  },
  {
    id: '5',
    hostId: '5',
    hostName: 'Ahmed Hassan',
    hostProfilePicture: 'https://i.pravatar.cc/300?img=33',
    callType: 'video',
    direction: 'outgoing',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    duration: 1200, // 20 minutes
    isHostOnline: false,
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'purchase',
    amount: 500,
    description: '500 Coins Purchase',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'call',
    amount: -30,
    description: 'Video Call with Sarah Chen',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'call',
    amount: -15,
    description: 'Audio Call with Emma Williams',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'purchase',
    amount: 100,
    description: '100 Coins Purchase',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'call',
    amount: -48,
    description: 'Video Call with Marco Rossi',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    type: 'call',
    amount: -8,
    description: 'Audio Call with Yuki Tanaka',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
