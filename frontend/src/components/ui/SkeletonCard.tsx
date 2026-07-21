import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { COLORS } from "../../constants/theme";

export default function SkeletonCard() {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [fadeAnim]);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.skeletonTitle, { opacity: fadeAnim }]} />
      <Animated.View style={[styles.skeletonDesc1, { opacity: fadeAnim }]} />
      <Animated.View style={[styles.skeletonDesc2, { opacity: fadeAnim }]} />
      <Animated.View style={[styles.skeletonBadge, { opacity: fadeAnim }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  skeletonTitle: {
    height: 20,
    width: "60%",
    backgroundColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonDesc1: {
    height: 16,
    width: "100%",
    backgroundColor: COLORS.borderLight,
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonDesc2: {
    height: 16,
    width: "80%",
    backgroundColor: COLORS.borderLight,
    borderRadius: 6,
    marginBottom: 20,
  },
  skeletonBadge: {
    height: 28,
    width: 90,
    backgroundColor: COLORS.border,
    borderRadius: 20,
  },
});
