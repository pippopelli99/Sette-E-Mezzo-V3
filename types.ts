
export enum Suit {
  COINS = 'COINS', // Denari
  CUPS = 'CUPS',   // Coppe
  SWORDS = 'SWORDS', // Spade
  CLUBS = 'CLUBS'   // Bastoni
}

export type CardRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Card {
  id: string;
  suit: Suit;
  rank: CardRank;
  value: number;
  name: string;
  isMatta: boolean;
}

export type PlayerId = 'CPU1' | 'PLAYER' | 'CPU2' | 'DEALER';

export type GameMode = 'SINGLE' | 'MULTI';

export type GameStatus = 'MODE_SELECTION' | 'BETTING' | 'TURN_CPU1' | 'TURN_PLAYER' | 'TURN_CPU2' | 'DEALER_TURN' | 'RESULT';

export interface PlayerState {
  id: PlayerId;
  name: string;
  hand: Card[];
  score: number;
  isBusted: boolean;
  isStanding: boolean;
  isActive: boolean; // Used to filter players based on mode
}

export interface GameState {
  deck: Card[];
  players: Record<PlayerId, PlayerState>;
  status: GameStatus;
  mode: GameMode;
  balance: number;
  currentBet: number;
  message: string;
  history: { result: 'WIN' | 'LOSS' | 'DRAW'; amount: number }[];
}
