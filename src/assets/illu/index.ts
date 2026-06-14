import desk from "./desk.png";
import notebook from "./notebook.png";
import quiz from "./quiz.png";
import flashcards from "./flashcards.png";
import adventure from "./adventure.png";
import planning from "./planning.png";
import backpack from "./backpack.png";
import streak from "./streak.png";
import campus from "./campus.png";
import upload from "./upload.png";
import duel from "./duel.png";
import group from "./group.png";
import stats from "./stats.png";
import brain from "./brain.png";
import sparkle from "./sparkle.png";
import card from "./card.png";
import books from "./books.png";
import star from "./star.png";
import medalBronze from "./medal-bronze.png";
import medalSilver from "./medal-silver.png";
import medalGold from "./medal-gold.png";
import cap from "./cap.png";
import crown from "./crown.png";
import trophy from "./trophy.png";
import gem from "./gem.png";
import heartFire from "./heart-fire.png";
import diamond from "./diamond.png";
import flame from "./flame.png";
import flameDouble from "./flame-double.png";
import volcano from "./volcano.png";
import storm from "./storm.png";
import phoenix from "./phoenix.png";
import sun from "./sun.png";
import supernova from "./supernova.png";
import constellation from "./constellation.png";
import infinity from "./infinity.png";
import doc from "./doc.png";
import target from "./target.png";
import muscle from "./muscle.png";
import folder from "./folder.png";

export const illu = {
  desk,
  notebook,
  quiz,
  flashcards,
  adventure,
  planning,
  backpack,
  streak,
  campus,
  upload,
  duel,
  group,
  stats,
  brain,
  sparkle,
  card,
  books,
  star,
  medalBronze,
  medalSilver,
  medalGold,
  cap,
  crown,
  trophy,
  gem,
  heartFire,
  diamond,
  flame,
  flameDouble,
  volcano,
  storm,
  phoenix,
  sun,
  supernova,
  constellation,
  infinity,
  doc,
  target,
  muscle,
  folder,
} as const;

export type IlluKey = keyof typeof illu;