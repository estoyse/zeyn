import { StyleSheet, Text as RNText } from "react-native";

const familyByWeight: Record<string, string> = {
  "100": "IBMPlexSans_400Regular",
  "200": "IBMPlexSans_400Regular",
  "300": "IBMPlexSans_400Regular",
  "400": "IBMPlexSans_400Regular",
  normal: "IBMPlexSans_400Regular",
  "500": "IBMPlexSans_500Medium",
  "600": "IBMPlexSans_600SemiBold",
  "700": "IBMPlexSans_700Bold",
  "800": "IBMPlexSans_700Bold",
  "900": "IBMPlexSans_700Bold",
  bold: "IBMPlexSans_700Bold",
};

function familyFor(weight?: string | number): string {
  if (weight == null) return "IBMPlexSans_400Regular";
  return familyByWeight[String(weight)] ?? "IBMPlexSans_400Regular";
}

type TextProps = { style?: unknown };

const AnyText = RNText as unknown as {
  render?: (props: TextProps, ref: unknown) => unknown;
  __zeynFontPatched?: boolean;
};

if (AnyText.render && !AnyText.__zeynFontPatched) {
  const originalRender = AnyText.render;
  AnyText.render = function patchedRender(props: TextProps, ref: unknown) {
    const flat = (StyleSheet.flatten(props?.style as never) ?? {}) as {
      fontFamily?: string;
      fontWeight?: string | number;
    };
    if (flat.fontFamily) return originalRender.call(this, props, ref);
    const style = [{ fontFamily: familyFor(flat.fontWeight) }, props?.style];
    return originalRender.call(this, { ...props, style }, ref);
  };
  AnyText.__zeynFontPatched = true;
}
