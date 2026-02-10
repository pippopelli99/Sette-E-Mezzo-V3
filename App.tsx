
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, GameState, GameStatus, PlayerId, PlayerState, GameMode } from './types';
import { createDeck, calculateScore } from './utils/gameLogic';
import { getStrategyAdvice } from './services/geminiService';
import CardUI from './components/CardUI';
import { TrendingUp, Coins, Play, RotateCcw, BrainCircuit, User, Cpu, Users, UserCheck, ChevronLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const INITIAL_BALANCE = 500;

const App: React.FC = () => {
  const [game, setGame] = useState<GameState>({
    deck: [],
    players: {
      CPU1: { id: 'CPU1', name: 'CPU 1', hand: [], score: 0, isBusted: false, isStanding: false, isActive: false },
      PLAYER: { id: 'PLAYER', name: 'Io', hand: [], score: 0, isBusted: false, isStanding: false, isActive: true },
      CPU2: { id: 'CPU2', name: 'CPU 2', hand: [], score: 0, isBusted: false, isStanding: false, isActive: false },
      DEALER: { id: 'DEALER', name: 'Banco', hand: [], score: 0, isBusted: false, isStanding: false, isActive: true },
    },
    status: 'MODE_SELECTION',
    mode: 'SINGLE',
    balance: INITIAL_BALANCE,
    currentBet: 10,
    message: "Scegli la tua modalità di gioco",
    history: []
  });

  const [advice, setAdvice] = useState<string>("");
  const [loadingAdvice, setLoadingAdvice] = useState<boolean>(false);
  const gameRef = useRef(game);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    setGame(prev => ({ ...prev, deck: createDeck() }));
  }, []);

  const selectMode = (mode: GameMode) => {
    setGame(prev => ({
      ...prev,
      mode,
      status: 'BETTING',
      message: mode === 'SINGLE' ? "Sfida il banco 1 contro 1." : "Sfida il banco e 2 avversari CPU.",
      players: {
        ...prev.players,
        CPU1: { ...prev.players.CPU1, isActive: mode === 'MULTI' },
        CPU2: { ...prev.players.CPU2, isActive: mode === 'MULTI' },
      }
    }));
  };

  const startNewGame = () => {
    const newDeck = createDeck();
    const updatedPlayers = { ...game.players };

    Object.keys(updatedPlayers).forEach(key => {
      const id = key as PlayerId;
      if (updatedPlayers[id].isActive) {
        const card = newDeck.pop()!;
        updatedPlayers[id] = {
          ...updatedPlayers[id],
          hand: [card],
          score: calculateScore([card]),
          isBusted: false,
          isStanding: false
        };
      } else {
        updatedPlayers[id].hand = [];
        updatedPlayers[id].score = 0;
      }
    });

    const nextStatus = game.mode === 'MULTI' ? 'TURN_CPU1' : 'TURN_PLAYER';

    setGame(prev => ({
      ...prev,
      deck: newDeck,
      players: updatedPlayers,
      status: nextStatus,
      message: nextStatus === 'TURN_CPU1' ? "Turno di CPU 1..." : "Tocca a te!",
    }));
    setAdvice("");
  };

  const executeCPUTurn = useCallback(async (playerId: PlayerId, nextStatus: GameStatus) => {
    let currentDeck = [...gameRef.current.deck];
    let currentHand = [...gameRef.current.players[playerId].hand];
    let currentScore = calculateScore(currentHand);

    while (currentScore < 5) {
      await new Promise(r => setTimeout(r, 800));
      const nextCard = currentDeck.pop()!;
      currentHand.push(nextCard);
      currentScore = calculateScore(currentHand);
      
      setGame(prev => ({
        ...prev,
        deck: [...currentDeck],
        players: {
          ...prev.players,
          [playerId]: {
            ...prev.players[playerId],
            hand: [...currentHand],
            score: currentScore,
            isBusted: currentScore > 7.5
          }
        }
      }));

      if (currentScore > 7.5) break;
    }

    await new Promise(r => setTimeout(r, 400));
    setGame(prev => ({
      ...prev,
      status: nextStatus,
      message: nextStatus === 'TURN_PLAYER' ? "Tocca a te! 'Carta' o 'Stai'?" : `Turno di ${prev.players[playerId === 'CPU1' ? 'CPU2' : 'DEALER'].name}...`
    }));
  }, []);

  useEffect(() => {
    if (game.status === 'TURN_CPU1') {
      executeCPUTurn('CPU1', 'TURN_PLAYER');
    } else if (game.status === 'TURN_CPU2') {
      executeCPUTurn('CPU2', 'DEALER_TURN');
    }
  }, [game.status, executeCPUTurn]);

  const playerHit = () => {
    if (game.status !== 'TURN_PLAYER') return;

    const newDeck = [...game.deck];
    const nextCard = newDeck.pop()!;
    const newHand = [...game.players.PLAYER.hand, nextCard];
    const newScore = calculateScore(newHand);
    const isBusted = newScore > 7.5;

    const nextStatus = isBusted 
      ? (game.mode === 'MULTI' ? 'TURN_CPU2' : 'DEALER_TURN')
      : 'TURN_PLAYER';

    setGame(prev => ({
      ...prev,
      deck: newDeck,
      players: {
        ...prev.players,
        PLAYER: { ...prev.players.PLAYER, hand: newHand, score: newScore, isBusted }
      },
      status: nextStatus,
      message: isBusted 
        ? (game.mode === 'MULTI' ? "Hai sballato! Turno di CPU 2..." : "Hai sballato! Turno del Banco...")
        : "Hai chiesto carta."
    }));
  };

  const playerStand = () => {
    if (game.status !== 'TURN_PLAYER') return;
    const nextStatus = game.mode === 'MULTI' ? 'TURN_CPU2' : 'DEALER_TURN';
    setGame(prev => ({
      ...prev,
      status: nextStatus,
      message: nextStatus === 'TURN_CPU2' ? "Ti sei fermato. Turno di CPU 2..." : "Ti sei fermato. Turno del Banco..."
    }));
  };

  const executeDealerTurn = useCallback(async () => {
    if (game.status !== 'DEALER_TURN') return;

    let currentDealerHand = [...game.players.DEALER.hand];
    let currentDeck = [...game.deck];
    let currentDealerScore = calculateScore(currentDealerHand);

    const activePlayers = (Object.values(game.players) as PlayerState[]).filter(p => p.id !== 'DEALER' && p.isActive);
    const nonBustedScores = activePlayers.filter(p => !p.isBusted).map(p => p.score);
    const targetScore = nonBustedScores.length > 0 ? Math.max(...nonBustedScores) : 0;

    while (currentDealerScore < 7.5 && (currentDealerScore < targetScore || (targetScore === 0 && currentDealerScore < 4.5))) {
      await new Promise(r => setTimeout(r, 800));
      const nextCard = currentDeck.pop()!;
      currentDealerHand.push(nextCard);
      currentDealerScore = calculateScore(currentDealerHand);

      setGame(prev => ({
        ...prev,
        deck: [...currentDeck],
        players: {
          ...prev.players,
          DEALER: {
            ...prev.players.DEALER,
            hand: [...currentDealerHand],
            score: currentDealerScore,
            isBusted: currentDealerScore > 7.5
          }
        }
      }));
    }

    let rawBalance = game.balance;
    let resultMsg = "";
    let gameResult: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';

    const playerScore = game.players.PLAYER.score;
    const playerBusted = game.players.PLAYER.isBusted;

    if (playerBusted) {
      resultMsg = "Hai sballato e perso.";
      rawBalance -= game.currentBet;
      gameResult = 'LOSS';
    } else if (currentDealerScore > 7.5) {
      resultMsg = "Il banco ha sballato! Vinto!";
      rawBalance += game.currentBet;
      gameResult = 'WIN';
    } else if (currentDealerScore >= playerScore) {
      resultMsg = `Banco vince (${currentDealerScore} a ${playerScore}).`;
      rawBalance -= game.currentBet;
      gameResult = 'LOSS';
    } else {
      resultMsg = `Hai vinto! (${playerScore} a ${currentDealerScore})`;
      rawBalance += game.currentBet;
      gameResult = 'WIN';
    }

    const finalBalance = rawBalance <= 0 ? INITIAL_BALANCE : rawBalance;
    setGame(prev => ({
      ...prev,
      status: 'RESULT',
      message: resultMsg,
      balance: finalBalance,
      history: [...prev.history, { result: gameResult, amount: prev.currentBet }]
    }));
  }, [game]);

  useEffect(() => {
    if (game.status === 'DEALER_TURN') {
      executeDealerTurn();
    }
  }, [game.status, executeDealerTurn]);

  const fetchAdvice = async () => {
    if (game.status !== 'TURN_PLAYER') return;
    setLoadingAdvice(true);
    const result = await getStrategyAdvice(game.players.PLAYER.hand, game.players.DEALER.hand[0] || null, game.players.PLAYER.score);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  const adjustBet = (amount: number) => {
    setGame(prev => {
      const nextBet = Math.max(10, Math.min(prev.balance, prev.currentBet + amount));
      return { ...prev, currentBet: nextBet };
    });
  };

  const chartData = game.history.map((h, i) => ({
    round: i + 1,
    balance: INITIAL_BALANCE + game.history.slice(0, i + 1).reduce((acc, curr) => 
      curr.result === 'WIN' ? acc + curr.amount : curr.result === 'LOSS' ? acc - curr.amount : acc, 0)
  }));

  const renderPlayerArea = (playerId: PlayerId, positionClass: string) => {
    const player = game.players[playerId];
    if (!player.isActive) return null;

    const isCurrentTurn = game.status.includes(playerId) || (playerId === 'DEALER' && game.status === 'DEALER_TURN');
    const isDealer = playerId === 'DEALER';
    const hideCards = isDealer && game.status !== 'DEALER_TURN' && game.status !== 'RESULT';

    // Regoliamo l'overlap per le nuove proporzioni delle carte napoletane
    const handWidth = game.mode === 'MULTI' ? 'max-w-[140px] md:max-w-[200px]' : 'max-w-[220px] md:max-w-[350px]';
    const cardOverlap = player.hand.length > 2 ? '-mx-8 md:-mx-12' : '-mx-4 md:-mx-6';

    return (
      <div className={`flex flex-col items-center gap-1 ${positionClass} transition-all duration-300 ${isCurrentTurn ? 'scale-105 z-30' : 'opacity-80 scale-95 z-10'}`}>
        <div className={`flex items-center gap-1 text-[8px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${isCurrentTurn ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-black/20 text-white/60 border border-white/10'}`}>
          {isDealer ? <Cpu size={10}/> : (playerId.startsWith('CPU') ? <Cpu size={10}/> : <User size={10}/>)}
          {player.name}
        </div>
        
        <div className={`flex flex-nowrap justify-center p-2 bg-black/30 rounded-xl border border-white/5 shadow-inner ${handWidth} overflow-visible min-h-[80px] md:min-h-[140px]`}>
          {player.hand.map((card, idx) => (
            <div 
              key={card.id} 
              className={`${cardOverlap} first:ml-0 last:mr-0 transition-all duration-300`}
              style={{ zIndex: idx }}
            >
               <CardUI card={card} hidden={hideCards && idx === 0} />
            </div>
          ))}
          {player.hand.length === 0 && <div className="w-10 h-16 md:w-16 md:h-24 border border-dashed border-white/10 rounded-md" />}
        </div>

        {(!hideCards || game.status === 'RESULT') && player.hand.length > 0 && (
          <div className={`px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-black border ${player.isBusted ? 'bg-red-500/40 border-red-500 text-red-50' : 'bg-black/60 border-white/20 text-yellow-400'}`}>
            {player.isBusted ? 'SBALLATO' : player.score}
          </div>
        )}
      </div>
    );
  };

  if (game.status === 'MODE_SELECTION') {
    return (
      <div className="felt-bg h-full flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-2xl flex flex-col items-center text-center gap-8">
           <div>
             <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-black text-3xl shadow-lg ring-4 ring-yellow-400/10 mx-auto mb-4">7½</div>
             <h1 className="text-3xl font-black italic tracking-tighter mb-1 uppercase">Sette e Mezzo</h1>
             <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Pro Edition</p>
           </div>
           
           <div className="grid grid-cols-1 gap-4 w-full">
             <button 
               onClick={() => selectMode('SINGLE')}
               className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-all active:scale-95 text-left"
             >
               <div className="bg-yellow-400/20 p-3 rounded-xl">
                 <UserCheck size={32} className="text-yellow-400" />
               </div>
               <div>
                 <h3 className="font-black text-sm uppercase">1 vs 1</h3>
                 <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Tu contro il banco</p>
               </div>
             </button>
             
             <button 
               onClick={() => selectMode('MULTI')}
               className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-all active:scale-95 text-left"
             >
               <div className="bg-blue-400/20 p-3 rounded-xl">
                 <Users size={32} className="text-blue-400" />
               </div>
               <div>
                 <h3 className="font-black text-sm uppercase">4 Giocatori</h3>
                 <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Tavolo completo con CPU</p>
               </div>
             </button>
           </div>
           
           <footer className="text-[8px] text-white/20 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
             <BrainCircuit size={10} /> Powered by Gemini
           </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="felt-bg h-full flex flex-col items-center overflow-hidden select-none safe-pb safe-pt">
      {/* Mini Header - Fixed to top */}
      <header className="w-full max-w-5xl flex justify-between items-center p-3 md:p-4 bg-black/40 backdrop-blur-md border-b border-white/10 z-50">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setGame(prev => ({ ...prev, status: 'MODE_SELECTION' }))}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} /> Menu
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{game.mode === 'SINGLE' ? 'Single' : '4-Player'}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-1.5 text-sm md:text-base font-black text-yellow-400">
               <Coins size={14} className="text-yellow-500" />
               ${game.balance.toLocaleString()}
             </div>
          </div>
        </div>
      </header>

      {/* Main Game Area - Dynamic Height */}
      <main className="w-full max-w-5xl flex flex-col flex-grow relative overflow-hidden">
        <div className="relative flex-grow bg-gradient-to-b from-emerald-900/30 to-emerald-950/50 p-4 min-h-0 flex flex-col justify-between items-center overflow-hidden">
          
          {/* Dealer Area - Top */}
          <div className="w-full flex justify-center pt-2">
            {renderPlayerArea('DEALER', '')}
          </div>
          
          {/* Middle Row - CPU Players or Message */}
          <div className="w-full flex justify-between items-center px-2 md:px-12 relative flex-grow min-h-0">
            {game.mode === 'MULTI' ? (
              <>
                <div className="flex-1 flex justify-start">
                  {renderPlayerArea('CPU1', '')}
                </div>
                
                {/* Central Message Box - Smaller and more floating */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-40 pointer-events-none w-full max-w-[140px] md:max-w-[200px]">
                   <div className={`px-4 py-3 rounded-2xl text-[10px] md:text-xs font-black text-center shadow-2xl border backdrop-blur-3xl transition-all duration-300 w-full ${
                     game.status === 'RESULT' 
                     ? (game.message.includes('Vinto') || game.message.includes('vinto') ? 'bg-green-500/40 border-green-400 text-green-50' : 'bg-red-500/40 border-red-400 text-red-50')
                     : 'bg-black/80 border-white/10 text-white'
                   }`}>
                     {game.message}
                   </div>
                   
                   {advice && (
                     <div className="mt-2 flex items-start gap-2 bg-blue-500/30 border border-blue-400/20 p-2 rounded-xl w-full animate-in fade-in zoom-in shadow-xl backdrop-blur-md">
                       <BrainCircuit className="text-blue-300 shrink-0" size={14} />
                       <p className="text-[8px] md:text-[10px] text-blue-50 text-left italic leading-tight">"{advice}"</p>
                     </div>
                   )}
                </div>

                <div className="flex-1 flex justify-end">
                  {renderPlayerArea('CPU2', '')}
                </div>
              </>
            ) : (
              <div className="w-full flex justify-center">
                 <div className="flex flex-col items-center justify-center z-40 pointer-events-none max-w-[180px] md:max-w-[250px]">
                   <div className={`px-5 py-4 rounded-3xl text-xs md:text-sm font-black text-center shadow-2xl border backdrop-blur-2xl transition-all duration-300 w-full ${
                     game.status === 'RESULT' 
                     ? (game.message.includes('Vinto') || game.message.includes('vinto') ? 'bg-green-500/40 border-green-400 text-green-50' : 'bg-red-500/40 border-red-400 text-red-50')
                     : 'bg-black/80 border-white/10 text-white'
                   }`}>
                     {game.message}
                   </div>
                   
                   {advice && (
                     <div className="mt-3 flex items-start gap-2 bg-blue-500/30 border border-blue-400/20 p-3 rounded-2xl w-full animate-in fade-in zoom-in shadow-xl">
                       <BrainCircuit className="text-blue-300 shrink-0" size={16} />
                       <p className="text-[10px] text-blue-50 text-left italic leading-relaxed">"{advice}"</p>
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>

          {/* Player Area - Bottom */}
          <div className="w-full flex justify-center pb-2">
            {renderPlayerArea('PLAYER', '')}
          </div>
        </div>

        {/* Floating Controls Bar - Optimized for Mobile Thumb usage */}
        <div className="bg-black/60 p-3 md:p-5 border-t border-white/10 backdrop-blur-3xl flex items-center justify-center gap-3 md:gap-6 z-50">
          {game.status === 'BETTING' && (
            <div className="flex flex-col md:flex-row items-center gap-3 w-full max-w-md">
              <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10 w-full justify-between">
                <button onClick={() => adjustBet(-10)} className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all font-black text-xl">-</button>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Puntata</span>
                  <span className="font-black text-yellow-400 text-sm md:text-lg leading-none">${game.currentBet}</span>
                </div>
                <button onClick={() => adjustBet(10)} className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all font-black text-xl">+</button>
              </div>
              <button 
                onClick={startNewGame}
                className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-black w-full py-3 md:py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
              >
                <Play fill="black" size={18} /> GIOCA
              </button>
            </div>
          )}

          {game.status === 'TURN_PLAYER' && (
            <div className="flex items-center gap-3 w-full max-w-md">
              <button onClick={playerHit} className="flex-1 bg-white hover:bg-gray-100 text-emerald-950 py-3 md:py-4 rounded-xl font-black shadow-xl active:scale-95 transition-transform text-xs md:text-sm">CARTA</button>
              <button onClick={playerStand} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 md:py-4 rounded-xl font-black shadow-xl border border-emerald-400/30 active:scale-95 transition-transform text-xs md:text-sm">STAI</button>
              <button 
                onClick={fetchAdvice}
                disabled={loadingAdvice}
                className="bg-blue-600/30 text-blue-100 p-3 md:p-4 rounded-xl transition-all border border-blue-400/20 active:scale-90"
              >
                {loadingAdvice ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent" /> : <BrainCircuit size={20} />}
              </button>
            </div>
          )}

          {game.status === 'RESULT' && (
            <button 
              onClick={() => setGame(prev => ({ 
                ...prev, 
                status: 'BETTING', 
                players: Object.keys(prev.players).reduce((acc, key) => ({
                  ...acc,
                  [key]: { ...prev.players[key as PlayerId], hand: [], score: 0, isBusted: false, isStanding: false }
                }), {} as Record<PlayerId, PlayerState>),
                message: "Nuova mano!" 
              }))}
              className="w-full max-w-xs bg-white/10 hover:bg-white/20 text-white py-3 md:py-4 rounded-xl font-black flex items-center justify-center gap-2 border border-white/10 shadow-xl active:scale-95 transition-transform"
            >
              <RotateCcw size={18} /> RIGIOCARE
            </button>
          )}

          {(['TURN_CPU1', 'TURN_CPU2', 'DEALER_TURN']).includes(game.status) && (
            <div className="flex items-center gap-3 py-3">
               <div className="w-5 h-5 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
               <span className="text-[10px] font-black text-white/40 tracking-widest uppercase italic">Il Banco decide...</span>
            </div>
          )}
        </div>
      </main>

      {/* Mini Stats Chart - Solo se c'è spazio e storia */}
      {game.history.length > 0 && (
        <div className="hidden md:block w-full max-w-5xl bg-black/20 p-2 h-16 border-t border-white/5">
           <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="balance" stroke="#fbbf24" strokeWidth={2} dot={false} animationDuration={500} />
              </LineChart>
           </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default App;
