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
  },
  {
    id: "antwerp-train",
    title: "The Antwerp Connection",
    description: "Taking the train from Brussels to Antwerp Central.",
    category: "travel",
    difficulty: 2,
    flemishPhrases: [
      { flemish: "Een ticket naar Antwerpen, alstublieft.", translation: "A ticket to Antwerp, please.", pronunciation: "Ayn tee-ket nahr Ant-vair-puhn, ahl-stoo-bleeft" },
      { flemish: "Op welk perron vertrekt de trein?", translation: "On which platform does the train move?", pronunciation: "Ohp velk pair-rohn vair-trekt duh trayn" },
      { flemish: "Is deze zitplaats vrij?", translation: "Is this seat free?", pronunciation: "Is day-zuh zit-plahts vray" }
    ]
  },
  {
    id: "weather-briefing",
    title: "Weather Briefing",
    description: "Understand the Belgian weather for your flight back to Milan.",
    category: "aviation",
    difficulty: 3,
    flemishPhrases: [
      { flemish: "Er is veel wind vandaag.", translation: "There is a lot of wind today.", pronunciation: "Air is vayl vint vahn-dahch" },
      { flemish: "Het gaat regenen in de middag.", translation: "It is going to rain in the afternoon.", pronunciation: "Et haht ray-chuh-nuhn in duh mid-dahch" },
      { flemish: "De bewolking is erg laag.", translation: "The cloud cover is very low.", pronunciation: "Duh buh-vohl-king is airch lahch" }
    ]
  },
  {
    id: "cousin-meetup",
    title: "Meeting Cousins",
    description: "Talking to your Belgian cousins about planes and life in Milan.",
    category: "family",
    difficulty: 2,
    flemishPhrases: [
      { flemish: "Ik woon nu in Milaan.", translation: "I live in Milan now.", pronunciation: "Ik vohn noo in Mee-lahn" },
      { flemish: "Ik hou van vliegtuigen.", translation: "I love airplanes.", pronunciation: "Ik hay vahn vlee-cht-eye-chuhn" },
      { flemish: "Zullen we samen iets gaan drinken?", translation: "Shall we go get a drink together?", pronunciation: "Zool-uhn vuh sah-muhn eets hahn drin-kuhn" }
    ]
  },
  {
    id: "ghent-cafe",
    title: "Coffee in Ghent",
    description: "Ordering at a trendy cafe near the Graslei.",
    category: "travel",
    difficulty: 1,
    flemishPhrases: [
      { flemish: "Ik wil graag een koffie.", translation: "I would like a coffee.", pronunciation: "Ik vil chrahch ayn koh-fee" },
      { flemish: "Zonder suiker, met melk.", translation: "Without sugar, with milk.", pronunciation: "Zohn-duhr swee-kuhr, met melk" },
      { flemish: "De rekening, alsjeblieft.", translation: "The check, please.", pronunciation: "Duh ray-kuh-ning, ahl-shuh-bleeft" }
    ]
  }
];
