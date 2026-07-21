import { StyleSheet, Text, Pressable, View } from "react-native";
import { COLORS, FONTS } from "../constants/theme";
import StatusBadge from "./ui/StatusBadge";
import { Task } from "../types/task";

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
}

export default function TaskCard({ task, onPress }: TaskCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      onPress={() => onPress(task)}
    >
      {task.due_date && task.status !== "completed" && (() => {
        const diff = new Date(task.due_date).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        const isOverdue = days < 0;
        
        let text = "";
        if (isOverdue) text = "Overdue!";
        else if (days === 0) text = "Today";
        else if (days === 1) text = "1 day left";
        else text = `${days} days left`;
        
        return (
          <View style={[
            styles.countdownBadge, 
            { backgroundColor: isOverdue ? COLORS.danger : COLORS.warning }
          ]}>
            <Text style={styles.countdownText}>{text}</Text>
          </View>
        );
      })()}
      <Text style={[styles.cardTitle, task.due_date ? { paddingRight: 70 } : {}]}>{task.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {task.description}
      </Text>

      <View style={styles.footerRow}>
        <StatusBadge status={task.status} variant="badge" />
        {task.assignee_id && (
          <Text style={styles.assigneeText}>Assignee: #{task.assignee_id}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.textLight,
    marginBottom: 16,
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assigneeText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.textGray,
  },
  countdownBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 16,
    zIndex: 1,
  },
  countdownText: {
    color: COLORS.textWhite,
    fontFamily: FONTS.bold,
    fontSize: 10,
  },
});
