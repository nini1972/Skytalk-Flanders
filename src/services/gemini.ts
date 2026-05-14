/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getCoPilotResponse(history: ChatMessage[], message: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are JARVIS-Vlaanderen, a futuristic AI co-pilot for a 16-year-old plane enthusiast learning Flemish (Belgian Dutch). 
      The user is living in Milan, speaks English and Italian, and wants to talk to his family in Belgium.
      Year is 2036. Use aviation terminology (Roger, Cabin Crew, Altitude, Takeoff) to make it fun.
      
      Your goal:
      1. Help the user translate English/Italian phrases to Flemish.
      2. Correct his Flemish grammar.
      3. Use a mix of English and Italian if he's stuck, but encourage Flemish.
      4. Focus on the Flemish (Belgian) dialect specifically.
      
      Keep it cool, technical, and supportive.`,
    },
  });

  // Convert history to Gemini format
  // Note: history should not include the latest message which is sent via sendMessage
  const response = await chat.sendMessage({ message });
  return response.text;
}
