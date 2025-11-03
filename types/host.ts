export interface Host {
  id: string;
  name: string;
  profilePicture: string;
  languages: string[];
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
