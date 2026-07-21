import { View, Text, StyleSheet, Pressable } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

interface StatusBadgeProps {
  status: string;
  active?: boolean; // For selectable options
  onPress?: () => void;
  variant?: "badge" | "chip" | "option";
}

export default function StatusBadge({
  status,
  active = true,
  onPress,
  variant = "badge",
}: StatusBadgeProps) {
  const isAll = status === "";
  const displayStatus = isAll ? "All" : status.replace("_", " ");

  const getBackgroundColor = () => {
    if (!active) return COLORS.surface;
    if (isAll) return COLORS.primary;

    switch (status) {
      case "pending":
        return COLORS.warning;
      case "in_progress":
        return COLORS.primary;
      case "completed":
        return COLORS.success;
      default:
        return COLORS.primary;
    }
  };

  const getTextColor = () => {
    return active ? COLORS.textWhite : COLORS.textLight;
  };

  const badgeStyles = [
    styles.base,
    variant === "badge" && styles.variantBadge,
    variant === "chip" && styles.variantChip,
    variant === "option" && styles.variantOption,
    { backgroundColor: getBackgroundColor() },
    !active && styles.inactiveBorder,
  ];

  const textStyles = [
    variant === "badge" ? styles.textBadge : styles.textOption,
    { color: getTextColor() },
  ];

  const content = (
    <View style={badgeStyles}>
      <Text style={textStyles}>{displayStatus}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && { transform: [{ scale: 0.95 }] }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveBorder: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Used in TaskCard
  variantBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  // Used in index.tsx filter
  variantChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  // Used in EditTaskModal
  variantOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  textBadge: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    textTransform: "uppercase",
  },
  textOption: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    textTransform: "capitalize",
  },
});
