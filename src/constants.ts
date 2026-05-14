/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lesson } from "./types";

export const LESSONS: Lesson[] = [
  {
    id: "landing-zaventem",
    title: "Landing in Zaventem",
    description: "Prepare for arrival at Brussels Airport and greet your grandparents.",
    category: "travel",
    difficulty: 1,
    flemishPhrases: [
      { flemish: "Dag oma en opa!", translation: "Hi grandma and grandpa!", pronunciation: "Dah-ch oh-mah en oh-pah" },
      { flemish: "Hoe gaat het met jullie?", translation: "How are you guys doing?", pronunciation: "Hoo haht et met yoo-lee" },
      { flemish: "Ik ben blij jullie weer te zien.", translation: "I'm happy to see you again.", pronunciation: "Ik ben blay yoo-lee veer tuh zeen" }
    ]
  },
  {
    id: "cockpit-checks",
    title: "Cockpit Checks",
    description: "Technical terms for your flight and arrival.",
    category: "aviation",
    difficulty: 2,
    flemishPhrases: [
      { flemish: "De vlucht was prima.", translation: "The flight was fine.", pronunciation: "Duh vlookt vahs pree-mah" },
      { flemish: "We gaan zometeen landen.", translation: "We are going to land soon.", pronunciation: "Vuh hahn zoh-muh-tayn lahn-duhn" },
      { flemish: "De piloot doet de landing.", translation: "The pilot is doing the landing.", pronunciation: "Duh pee-loht doot duh lahn-ding" }
    ]
  },
  {
    id: "family-dinner",
    title: "Family Dinner",
    description: "Conversation at the Belgian dinner table.",
    category: "family",
    difficulty: 1,
    flemishPhrases: [
      { flemish: "Eet smakelijk!", translation: "Enjoy your meal!", pronunciation: "Ayt smah-kuh-luk" },
      { flemish: "Dat is heel lekker.", translation: "That is very tasty.", pronunciation: "Daht is hayl leh-kuhr" },
      { flemish: "Mag ik nog wat frietjes?", translation: "Can I have some more fries?", pronunciation: "Mahch ik nohch vaht freet-yuhs" }
    ]
  }
];
