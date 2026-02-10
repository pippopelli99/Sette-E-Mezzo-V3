
import React from 'react';
import { Card, Suit } from '../types';

interface CardUIProps {
  card: Card;
  hidden?: boolean;
}

const CardUI: React.FC<CardUIProps> = ({ card, hidden = false }) => {
  // Mappatura dei semi per corrispondere ai nomi dei tuoi file JPG
  const getSuitName = (suit: Suit) => {
    switch (suit) {
      case Suit.COINS: return 'denari';
      case Suit.CUPS: return 'coppe';
      case Suit.SWORDS: return 'spade';
      case Suit.CLUBS: return 'bastoni';
      default: return '';
    }
  };

  // Costruisce il nome del file: es. "1_denari.jpg"
  // Assicurati che i file siano in una cartella chiamata 'cards'
  const imagePath = `/cards/${card.rank}_${getSuitName(card.suit)}.jpg`;
  
  // Immagine per il dorso della carta (da aggiungere nella cartella cards)
  const backImagePath = '/cards/back.jpg';

  // Dimensioni ottimizzate per il formato napoletano (più strette e lunghe)
  // Utilizziamo aspect-ratio per mantenere la proporzione corretta
  const containerClasses = "relative w-14 md:w-20 aspect-[1/1.6] rounded-sm overflow-hidden shadow-md md:shadow-xl transition-all duration-300 ring-1 ring-black/10";

  if (hidden) {
    return (
      <div className={`${containerClasses} bg-emerald-900`}>
        <img 
          src={backImagePath} 
          alt="Dorso"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback se l'immagine del dorso manca
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Fallback visuale se l'immagine manca */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
           <span className="text-xl font-black text-white">7½</span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <img 
        src={imagePath} 
        alt={`${card.name} di ${getSuitName(card.suit)}`}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          // Fallback se l'immagine della carta manca (mostra un placeholder bianco)
          (e.target as HTMLImageElement).src = 'https://placehold.co/100x160/ffffff/000000?text=' + card.rank;
        }}
      />
      
      {/* Overlay sottile per dare profondità */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/5 via-transparent to-white/10" />
      
      {/* Evidenziazione per la Matta */}
      {card.isMatta && (
        <div className="absolute inset-0 ring-2 ring-yellow-400 ring-inset animate-pulse pointer-events-none" />
      )}
    </div>
  );
};

export default CardUI;
