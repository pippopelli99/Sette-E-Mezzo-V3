
import React, { useState } from 'react';
import { Card, Suit } from '../types';

interface CardUIProps {
  card: Card;
  hidden?: boolean;
}

const CardUI: React.FC<CardUIProps> = ({ card, hidden = false }) => {
  const [imgError, setImgError] = useState(false);

  // Se carichi il progetto su GitHub Pages, a volte il percorso base cambia.
  // Lasciando vuoto usa la cartella corrente. Se hai problemi, inserisci qui l'URL completo.
  const BASE_PATH = 'https://github.com/pippopelli99/Sette-E-Mezzo-V3/cards/'; 

  const getSuitName = (suit: Suit) => {
    switch (suit) {
      case Suit.COINS: return 'denari';
      case Suit.CUPS: return 'coppe';
      case Suit.SWORDS: return 'spade';
      case Suit.CLUBS: return 'bastoni';
      default: return '';
    }
  };

  const getRankFileName = (rank: number) => {
    switch (rank) {
      case 8: return 'fante';
      case 9: return 'cavallo';
      case 10: return 're';
      default: return rank.toString();
    }
  };

  const suitColor = (suit: Suit) => {
    switch (suit) {
      case Suit.COINS: return 'text-yellow-600';
      case Suit.CUPS: return 'text-red-600';
      case Suit.SWORDS: return 'text-blue-700';
      case Suit.CLUBS: return 'text-emerald-800';
    }
  };

  const suitSymbol = (suit: Suit) => {
    switch (suit) {
      case Suit.COINS: return '🟡';
      case Suit.CUPS: return '🏆';
      case Suit.SWORDS: return '⚔️';
      case Suit.CLUBS: return '🌿';
    }
  };

  const fileName = `${getRankFileName(card.rank)}_${getSuitName(card.suit)}.jpg`;
  const imagePath = `${BASE_PATH}${fileName}`;
  const backImagePath = `${BASE_PATH}back.jpg`;

  const containerClasses = "relative w-14 md:w-20 aspect-[1/1.6] rounded-md overflow-hidden shadow-2xl transition-all duration-300 ring-1 ring-black/20 bg-white flex-shrink-0";

  // DORSO DELLA CARTA
  if (hidden) {
    return (
      <div className={`${containerClasses} bg-emerald-900 ring-emerald-400/30`}>
        <img 
          src={backImagePath} 
          className="w-full h-full object-cover"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-4/5 h-4/5 border-2 border-emerald-400/20 rounded-sm flex items-center justify-center">
              <span className="text-xl font-black text-emerald-400/20 rotate-45">7½</span>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {!imgError ? (
        <img 
          src={imagePath} 
          alt={fileName}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        // FALLBACK GRAFICO se manca il JPG
        <div className="w-full h-full flex flex-col items-center justify-between p-1.5 bg-slate-50">
          <div className={`w-full text-left font-black text-xs ${suitColor(card.suit)}`}>
            {card.rank > 7 ? card.name[0] : card.rank}
          </div>
          <div className="text-xl md:text-2xl drop-shadow-sm">
            {suitSymbol(card.suit)}
          </div>
          <div className={`w-full text-right font-black text-xs rotate-180 ${suitColor(card.suit)}`}>
            {card.rank > 7 ? card.name[0] : card.rank}
          </div>
          
          {/* Badge informativo per l'utente/developer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none text-[6px] font-bold text-black whitespace-nowrap">
            MISSING JPG
          </div>
        </div>
      )}
      
      {/* Overlay per riflessi realistici */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/5 via-transparent to-white/30" />
      
      {/* Effetto Matta (Re di Denari) */}
      {card.isMatta && (
        <>
          <div className="absolute inset-0 ring-2 ring-yellow-400 ring-inset animate-pulse z-10" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-[8px] z-20 shadow-lg">👑</div>
        </>
      )}
    </div>
  );
};

export default CardUI;
