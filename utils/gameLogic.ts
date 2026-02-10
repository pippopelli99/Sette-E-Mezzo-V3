
import { Suit, Card, CardRank } from '../types';

const SUITS = [Suit.COINS, Suit.CUPS, Suit.SWORDS, Suit.CLUBS];
const RANKS: CardRank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 8, 9, 10 are face cards in 40-card deck logic

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      let value: number = rank;
      if (rank > 7) value = 0.5;
      
      const isMatta = suit === Suit.COINS && rank === 10; // King of Coins (Re di Denari)
      
      let name = rank.toString();
      if (rank === 1) name = 'Asso';
      if (rank === 8) name = 'Fante';
      if (rank === 9) name = 'Cavallo';
      if (rank === 10) name = 'Re';

      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value,
        name,
        isMatta
      });
    });
  });
  return shuffle(deck);
};

const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const calculateScore = (hand: Card[]): number => {
  let score = 0;
  let hasMatta = false;

  for (const card of hand) {
    if (card.isMatta) {
      hasMatta = true;
    } else {
      score += card.value;
    }
  }

  if (hasMatta) {
    // Current score is the sum of non-matta cards.
    // Matta cannot be 0.5 as requested, so it must be an integer between 1 and 7.
    // We look for the integer 'n' in [1..7] that maximizes (score + n) without exceeding 7.5.
    
    if (score >= 7.5) {
       // If player is already at 7.5 or higher, the matta is forced to be 1 (minimum whole value)
       return score + 1;
    }

    const maxAllowed = 7.5 - score;
    // We take the floor of maxAllowed to get the highest possible whole number.
    // If floor is 0 (e.g. score is 7.0), and it can't be 0.5, the matta must be at least 1, which busts.
    let bestWholeValue = Math.floor(maxAllowed);
    
    if (bestWholeValue < 1) bestWholeValue = 1; // Minimum value is 1
    if (bestWholeValue > 7) bestWholeValue = 7; // Maximum value is 7
    
    return score + bestWholeValue;
  }

  return score;
};
