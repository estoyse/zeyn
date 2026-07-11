import { Pressable, Text, View } from "react-native";

type ErrorFallbackProps = {
  error: Error;
  retry: () => Promise<void>;
};

export function ErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        paddingHorizontal: 32,
        backgroundColor: "#090b0c",
      }}
    >
      <Text style={{ color: "#f9fbfb", fontSize: 20, fontWeight: "700", textAlign: "center" }}>
        Something went wrong
      </Text>
      <Text style={{ color: "#9ca8ab", fontSize: 14, textAlign: "center" }}>
        {error.message || "An unexpected error occurred."}
      </Text>
      <Pressable
        onPress={() => retry()}
        style={{ backgroundColor: "#3e65ed", paddingHorizontal: 24, paddingVertical: 12 }}
      >
        <Text
          style={{
            color: "#f9fbfb",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 1,
            fontSize: 12,
          }}
        >
          Try again
        </Text>
      </Pressable>
    </View>
  );
}
