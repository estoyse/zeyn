import Ionicons from "@expo/vector-icons/Ionicons";
import { type ComponentProps } from "react";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type OnboardingSlide = {
  key: string;
  icon: IoniconName;
  titleKey: string;
  descKey: string;
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    key: "realtime",
    icon: "flash",
    titleKey: "slide1.title",
    descKey: "slide1.description",
  },
  {
    key: "friends",
    icon: "people",
    titleKey: "slide2.title",
    descKey: "slide2.description",
  },
  {
    key: "uzbekistan",
    icon: "globe",
    titleKey: "slide3.title",
    descKey: "slide3.description",
  },
];
