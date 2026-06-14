import desk from "./desk.png";
import notebook from "./notebook.png";
import quiz from "./quiz.png";
import flashcards from "./flashcards.png";
import adventure from "./adventure.png";
import planning from "./planning.png";
import backpack from "./backpack.png";
import streak from "./streak.png";

export const illu = {
  desk,
  notebook,
  quiz,
  flashcards,
  adventure,
  planning,
  backpack,
  streak,
} as const;

export type IlluKey = keyof typeof illu;