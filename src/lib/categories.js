import {
  Music,
  Store,
  Wine,
  Image as ImageIcon,
  Coffee,
  Utensils,
  Trees,
  BookOpen,
  Moon,
  Mountain,
  Sparkles,
} from "lucide-react";

export const categories = [
  { key: "all", label_zh: "全部", label_en: "All", Icon: Sparkles },
  { key: "cafe", label_zh: "咖啡", label_en: "Cafes", Icon: Coffee },
  { key: "bar", label_zh: "酒吧", label_en: "Bars", Icon: Wine },
  { key: "music", label_zh: "音乐", label_en: "Music", Icon: Music },
  { key: "exhibition", label_zh: "展览", label_en: "Exhibitions", Icon: ImageIcon },
  { key: "market", label_zh: "市集", label_en: "Markets", Icon: Store },
  { key: "park", label_zh: "公园", label_en: "Parks", Icon: Trees },
  { key: "restaurant", label_zh: "餐厅", label_en: "Restaurants", Icon: Utensils },
  { key: "nightlife", label_zh: "夜生活", label_en: "Nightlife", Icon: Moon },
  { key: "bookstore", label_zh: "书店", label_en: "Bookstores", Icon: BookOpen },
  { key: "outdoor", label_zh: "户外", label_en: "Outdoor", Icon: Mountain },
];

export function labelFor(record, lang) {
  return lang === "en"
    ? record.name_en || record.title_en || record.name_zh || record.title_zh
    : record.name_zh || record.title_zh || record.name_en || record.title_en;
}

export function descFor(record, lang) {
  return lang === "en"
    ? record.description_en || record.description_zh
    : record.description_zh || record.description_en;
}

export function priceFor(record, lang) {
  if (lang === "en" && record.price_label_en) return record.price_label_en;
  if (record.price_label_zh) return record.price_label_zh;
  const price = record.price ?? record.average_price;
  if (price == null) return "";
  return Number(price) === 0 ? (lang === "en" ? "Free" : "免费") : `¥${Number(price).toFixed(0)}`;
}

export function districtFor(record) {
  return record.business_area || record.district || "";
}
