
import { GoogleGenAI } from "@google/genai";
import { Card } from "../types";

export async function getStrategyAdvice(playerHand: Card[], dealerVisibleCard: Card | null, playerScore: number): Promise<string> {
  try {
    // Fix: Create a new GoogleGenAI instance right before making an API call for best practice
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Stai giocando a "7 e Mezzo" (Sette e mezzo).
      Le carte sono: 1-7 valgono il loro valore, Fante/Cavallo/Re valgono 0.5. Il Re di Denari è la Matta (valore variabile).
      La mano del giocatore è: ${playerHand.map(c => `${c.name} di ${c.suit}`).join(', ')}.
      Punteggio attuale: ${playerScore}.
      La carta visibile del banco è: ${dealerVisibleCard ? `${dealerVisibleCard.name} di ${dealerVisibleCard.suit}` : 'Sconosciuta'}.
      
      Cosa dovrebbe fare il giocatore? "CARTA" (Hit) o "STAI" (Stand)?
      Fornisci una risposta breve e incoraggiante in italiano (massimo 20 parole).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        // Fix: When maxOutputTokens is set, thinkingBudget should be provided for Gemini 3 models
        maxOutputTokens: 300,
        thinkingConfig: { thinkingBudget: 100 }
      }
    });

    // Fix: Access the response text via the .text property (not a method)
    return response.text || "Non sono sicuro, segui il tuo istinto!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Il banco sembra nervoso... decidi tu!";
  }
}
