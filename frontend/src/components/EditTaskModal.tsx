import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Modal,
  Pressable,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Task } from "../types/task";
import Button from "./ui/Button";
import StatusBadge from "./ui/StatusBadge";
import DateTimePickerModal from "./ui/DateTimePickerModal";
import { COLORS, FONTS } from "../constants/theme";

interface EditTaskModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onChange: (updatedTask: Task) => void;
}

export default function EditTaskModal({
  visible,
  task,
  onClose,
  onSave,
  onDelete,
  onChange,
}: EditTaskModalProps) {
  const [showModal, setShowModal] = useState(visible);
  const [isEditing, setIsEditing] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (visible) {
      if (task) setIsEditing(task.id === 0);
      setShowModal(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: false,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && isMounted.current) {
          setShowModal(false);
        }
      });
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  if (!task) return null;

  return (
    <Modal
      visible={showModal}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <TouchableWithoutFeedback>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%" }}
          >
            <Animated.View
              style={[
                styles.modalContent,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditing
                    ? task.id === 0
                      ? "Create Task"
                      : "Edit Task"
                    : "Task Details"}
                </Text>
                {!isEditing && task.id !== 0 && (
                  <Pressable
                    onPress={() => setIsEditing(true)}
                    style={styles.editIconBtn}
                  >
                    <Ionicons
                      name="pencil"
                      size={20}
                      color={COLORS.textWhite}
                    />
                  </Pressable>
                )}
              </View>

              {!isEditing ? (
                <View>
                  <Text style={styles.label}>Title</Text>
                  <Text style={styles.detailText}>{task.title}</Text>

                  <Text style={styles.label}>Description</Text>
                  <ScrollView style={{ maxHeight: 150, marginVertical: 4 }}>
                    <Text style={[styles.detailText, { marginTop: 0, marginBottom: 0 }]}>
                      {task.description || "-"}
                    </Text>
                  </ScrollView>

                  <Text style={styles.label}>Status</Text>
                  <View style={{ marginTop: 8, alignSelf: "flex-start" }}>
                    <StatusBadge status={task.status} variant="badge" />
                  </View>

                  <Text style={styles.label}>Assignee ID</Text>
                  <Text style={styles.detailText}>
                    {task.assignee_id ? `#${task.assignee_id}` : "Unassigned"}
                  </Text>
                  
                  <Text style={styles.label}>Due Date</Text>
                  <Text style={styles.detailText}>
                    {task.due_date ? new Date(task.due_date).toLocaleString() : "No deadline"}
                  </Text>

                  {task.created_at && (
                    <>
                      <Text style={styles.label}>Created At</Text>
                      <Text style={styles.detailText}>
                        {new Date(task.created_at).toLocaleString()}
                      </Text>
                    </>
                  )}

                  <View style={styles.modalActions}>
                    <Button
                      title="Close"
                      variant="cancel"
                      onPress={handleClose}
                    />
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={styles.label}>Title</Text>
                  <TextInput
                    style={styles.input}
                    value={task.title}
                    onChangeText={(t) => onChange({ ...task, title: t })}
                  />

                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        minHeight: 120,
                        paddingTop: 16,
                        textAlignVertical: "top",
                      },
                    ]}
                    multiline
                    value={task.description}
                    onChangeText={(d) => onChange({ ...task, description: d })}
                  />

                  <Text style={styles.label}>Status</Text>
                  <View style={styles.statusSelectRow}>
                    {["pending", "in_progress", "completed"].map((s) => (
                      <StatusBadge
                        key={s}
                        status={s}
                        variant="option"
                        active={task.status === s}
                        onPress={() => onChange({ ...task, status: s })}
                      />
                    ))}
                  </View>

                  <Text style={styles.label}>Assignee ID</Text>
                  <TextInput
                    style={styles.input}
                    value={task.assignee_id ? task.assignee_id.toString() : ""}
                    keyboardType="numeric"
                    onChangeText={(v) => {
                      const sanitized = v.replace(/[^0-9]/g, "");
                      onChange({
                        ...task,
                        assignee_id: sanitized ? parseInt(sanitized, 10) : null,
                      });
                    }}
                    placeholder="Enter User ID (Optional)"
                    placeholderTextColor={COLORS.textLight}
                  />

                  <Text style={styles.label}>Due Date</Text>
                  <Pressable
                    style={[styles.input, { paddingVertical: 14 }]}
                    onPress={() => setDatePickerVisible(true)}
                  >
                    <Text style={{ color: task.due_date ? COLORS.textDark : COLORS.textLight }}>
                      {task.due_date ? new Date(task.due_date).toLocaleString() : "Select Date (Optional)"}
                    </Text>
                  </Pressable>
                  <DateTimePickerModal
                    visible={datePickerVisible}
                    onClose={() => setDatePickerVisible(false)}
                    initialDate={(() => {
                      if (!task.due_date) return "";
                      const d = new Date(task.due_date);
                      if (isNaN(d.getTime())) return "";
                      const y = d.getFullYear();
                      const m = (d.getMonth() + 1).toString().padStart(2, '0');
                      const day = d.getDate().toString().padStart(2, '0');
                      const h = d.getHours().toString().padStart(2, '0');
                      const min = d.getMinutes().toString().padStart(2, '0');
                      return `${y}-${m}-${day}T${h}:${min}`;
                    })()}
                    onSelect={(dateStr) => {
                      let isoStr = "";
                      if (dateStr) {
                        const parsed = new Date(dateStr);
                        if (!isNaN(parsed.getTime())) {
                          isoStr = parsed.toISOString();
                        } else {
                          const p = dateStr.split(/[-T:]/).map(Number);
                          const d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1, p[3] || 0, p[4] || 0);
                          isoStr = d.toISOString();
                        }
                      }
                      onChange({ ...task, due_date: isoStr || null });
                    }}
                  />

                  <View style={styles.modalActions}>
                    <Button
                      title={task.id === 0 ? "Cancel" : "Cancel Edit"}
                      variant="cancel"
                      onPress={() =>
                        task.id === 0 ? handleClose() : setIsEditing(false)
                      }
                    />
                    {task.id !== 0 && (
                      <Button
                        title="Delete"
                        variant="danger"
                        onPress={onDelete}
                      />
                    )}
                    <Button
                      title={task.id === 0 ? "Create" : "Save"}
                      variant="primary"
                      onPress={onSave}
                    />
                  </View>
                </View>
              )}
            </Animated.View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    color: COLORS.textDark,
  },
  editIconBtn: {
    padding: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  detailText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textDark,
    marginBottom: 8,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.textGray,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    fontFamily: FONTS.regular,
    fontSize: 16,
    backgroundColor: COLORS.surface,
  },
  statusSelectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    gap: 8,
  },
});
