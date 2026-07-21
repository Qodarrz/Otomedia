import {
  Pressable,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "danger" | "cancel";
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  style,
}: ButtonProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case "danger":
        return styles.btnDanger;
      case "cancel":
        return styles.btnCancel;
      case "primary":
      default:
        return styles.btnPrimary;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        getVariantStyle(),
        style,
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
      onPress={onPress}
    >
      <Text style={styles.btnText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDanger: {
    backgroundColor: COLORS.danger,
  },
  btnCancel: {
    backgroundColor: COLORS.btnCancel,
  },
  btnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.textWhite,
  },
});
