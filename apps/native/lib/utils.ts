import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const TEXT_SIZES = [
  "display",
  "title-1",
  "title-2",
  "title-3",
  "body",
  "callout",
  "footnote",
  "caption",
];

const RADII = ["card", "pill", "row", "field"];

const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: TEXT_SIZES }],
      rounded: [{ rounded: RADII }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
