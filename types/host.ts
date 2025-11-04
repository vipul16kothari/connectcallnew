export interface Host {
  id: string;
  name: string;
  profilePicture: string;
  languages: string[];
  specialties?: string[];
  bio: string;
  rating: number;
  audioCostPerMin: number;
  videoCostPerMin: number;
  isOnline: boolean;
}

export interface CoinPackage {
  id: string;
  coins: number;
  price: string;
  popular?: boolean;
}

export interface WalletState {
  balance: number;
}

export interface CallHistory {
  id: string;
  hostId: string;
  hostName: string;
  hostProfilePicture: string;
  callType: 'audio' | 'video';
  direction: 'outgoing' | 'incoming';
  timestamp: string;
  duration: number; // in seconds
  isHostOnline: boolean;
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'call';
  amount: number; // positive for purchase, negative for call
  description: string;
  timestamp: string;
}
