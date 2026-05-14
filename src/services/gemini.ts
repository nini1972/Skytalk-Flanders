/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality } from "@google/genai";
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

  const response = await chat.sendMessage({ message });
  return response.text;
}

export async function getTTS(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: `Say in Flemish (Belgian accent): ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          prebuiltVoiceConfig: { voiceName: 'Zephyr' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
}
