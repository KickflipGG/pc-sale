/** Сопоставление ЧПУ категории с изображениями, выгруженными из макета Figma. */

/** Плитки разделов каталога на главной странице (288×140). */
const TILE_SLUGS = new Set([
  "ready-pc",
  "cpu",
  "gpu",
  "motherboards",
  "ram",
  "storage",
  "psu",
  "cases",
  "cpu-coolers",
  "liquid-cooling",
  "keyboards",
  "mice",
  "monitors",
  "headphones",
]);

/** Крупные карточки подразделов «Готовые компьютеры» (556×430). */
const SECTION_SLUGS = new Set(["office", "home-study", "gaming"]);

export const FALLBACK_IMAGE = "/images/products/pc.svg";

/** Изображение плитки раздела каталога. */
export function tileImage(slug) {
  return TILE_SLUGS.has(slug) ? `/images/tiles/${slug}.png` : FALLBACK_IMAGE;
}

/** Изображение карточки подраздела. */
export function sectionImage(slug) {
  return SECTION_SLUGS.has(slug) ? `/images/sections/${slug}.png` : FALLBACK_IMAGE;
}

/**
 * Универсальный выбор изображения категории: для подразделов «Готовые
 * компьютеры» используется крупная карточка, для остальных — плитка.
 */
export function categoryImage(slug) {
  if (SECTION_SLUGS.has(slug)) return sectionImage(slug);
  return tileImage(slug);
}
