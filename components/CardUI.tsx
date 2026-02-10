
import React, { useState } from 'react';
import { Card, Suit } from '../types';

interface CardUIProps {
  card: Card;
  hidden?: boolean;
}

const CardUI: React.FC<CardUIProps> = ({ card, hidden = false }) => {
  const [imgError, setImgError] = useState(false);

  const getSuitName = (suit: Suit) => {
    switch (suit) {
      case Suit.COINS: return 'denari';
      case Suit.CUPS: return 'coppe';
      case Suit.SWORDS: return 'spade';
      case Suit.CLUBS: return 'bastoni';
      default: return '';
    }
  };

  // Percorso relativo alla cartella 'cards' nella root
  // Esempio: ./cards/1_denari.jpg
  const imagePath = `./cards/${card.rank}_${getSuitName(card.suit)}.jpg`;
  const backImagePath = `./cards/back.jpg`;

  const containerClasses = "relative w-14 md:w-20 aspect-[1/1.6] rounded-sm overflow-hidden shadow-lg transition-all duration-300 ring-1 ring-black/20 bg-white";

  if (hidden) {
    return (
      <div className={`${containerClasses} bg-emerald-900 ring-emerald-700`}>
        <img 
          src={backImagePath} 
          alt="Dorso"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.opacity = '0';
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
           <span className="text-xl font-black text-emerald-300">7½</span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {!imgError ? (
        <img 
          src={imagePath} 
          alt={`${card.name} di ${getSuitName(card.suit)}`}
          className="w-full h-full object-cover"
          onError={() => {
            console.warn(`Immagine mancante: ${imagePath}. Controlla il nome del file nella cartella /cards/`);
            setImgError(true);
          }}
        />
      ) : (
        // Fallback se l'immagine non esiste: mostra testo per aiutare il debug
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-900 p-1 border-2 border-red-200">
          <span className="text-[10px] font-bold leading-none">{card.rank}</span>
          <span className="text-[8px] uppercase font-black opacity-30 mt-1">{getSuitName(card.suit)}</span>
          <span className="text-[6px] text-red-500 mt-2 font-bold">MISSING JPG</span>
        </div>
      )}
      
      {/* Effetto luce superficiale */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/10 via-transparent to-white/20" />
      
      {/* Evidenziatore per il Re di Denari (La Matta) */}
      {card.isMatta && (
        <div className="absolute inset-0 ring-2 ring-yellow-400 ring-inset animate-pulse pointer-events-none shadow-[inset_0_0_15px_rgba(250,204,21,0.5)]" />
      )}
    </div>
  );
};

export default CardUI;