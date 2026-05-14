/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: 'aviation' | 'family' | 'travel';
  difficulty: 1 | 2 | 3;
  flemishPhrases: Array<{
    flemish: string;
    translation: string;
    pronunciation: string;
  }>;
}

export interface UserStats {
  fuel: number; // 0-100
  altitude: number; // Experience points
  lastFlight: string;
  completedMissions: string[];
  preferredLanguage: 'en-US' | 'it-IT' | 'nl-BE';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
