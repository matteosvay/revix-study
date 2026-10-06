import desk from "./desk.webp";
import notebook from "./notebook.webp";
import quiz from "./quiz.webp";
import flashcards from "./flashcards.webp";
import adventure from "./adventure.webp";
import planning from "./planning.webp";
import backpack from "./backpack.webp";
import streak from "./streak.webp";
import campus from "./campus.webp";
import upload from "./upload.webp";
import duel from "./duel.webp";
import group from "./group.webp";
import stats from "./stats.webp";
import brain from "./brain.webp";
import sparkle from "./sparkle.webp";
import card from "./card.webp";
import books from "./books.webp";
import star from "./star.webp";
import medalBronze from "./medal-bronze.webp";
import medalSilver from "./medal-silver.webp";
import medalGold from "./medal-gold.webp";
import cap from "./cap.webp";
import crown from "./crown.webp";
import trophy from "./trophy.webp";
import gem from "./gem.webp";
import heartFire from "./heart-fire.webp";
import diamond from "./diamond.webp";
import flame from "./flame.webp";
import flameDouble from "./flame-double.webp";
import volcano from "./volcano.webp";
import storm from "./storm.webp";
import phoenix from "./phoenix.webp";
import sun from "./sun.webp";
import supernova from "./supernova.webp";
import constellation from "./constellation.webp";
import infinity from "./infinity.webp";
import doc from "./doc.webp";
import target from "./target.webp";
import muscle from "./muscle.webp";
import folder from "./folder.webp";
import lootbox from "./lootbox.webp";

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
  lootbox,
} as const;

export type IlluKey = keyof typeof illu;