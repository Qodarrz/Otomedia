import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  SafeAreaView,
  Platform,
  Pressable,
  Modal,
  ScrollView,
  FlatList,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Task } from "../types/task";
import { taskApi } from "../api/taskApi";
import StatusBadge from "../components/ui/StatusBadge";
import SkeletonCard from "../components/ui/SkeletonCard";
import { COLORS, FONTS } from "../constants/theme";
import TaskCard from "../components/TaskCard";
import EditTaskModal from "../components/EditTaskModal";
import DateTimePickerModal from "../components/ui/DateTimePickerModal";

export default function TaskManager() {
  const { width } = useWindowDimensions();
  const numColumns = width > 768 ? 2 : 1;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("created_at desc");
  const [isOverdueFilter, setIsOverdueFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [activeDatePicker, setActiveDatePicker] = useState<"start" | "end">(
    "start",
  );

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (filterModalVisible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [filterModalVisible, scaleAnim]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTasks = async (reset = false, currentPage = 1) => {
    try {
      setLoading(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const jsonResponse = await taskApi.fetchTasks(
        {
          page: currentPage,
          limit: 10,
          keyword: search || undefined,
          status: statusFilter || undefined,
          assignee: assigneeFilter || undefined,
          start_date: startDateFilter || undefined,
          end_date: endDateFilter || undefined,
          sort: sortFilter || undefined,
          is_overdue: isOverdueFilter || undefined,
        },
        abortControllerRef.current.signal,
      );

      const taskList = jsonResponse.data || [];
      const hasNextPage = jsonResponse.meta
        ? jsonResponse.meta.current_page < jsonResponse.meta.total_pages
        : taskList.length === 10;

      if (reset) {
        setTasks(taskList);
      } else {
        setTasks((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newTasks = taskList.filter((t: any) => !existingIds.has(t.id));
          return [...prev, ...newTasks];
        });
      }

      setHasMore(hasNextPage);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setTasks([]);
    setPage(1);

    const timer = setTimeout(() => {
      fetchTasks(true, 1);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [
    search,
    statusFilter,
    assigneeFilter,
    startDateFilter,
    endDateFilter,
    sortFilter,
    isOverdueFilter,
  ]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTasks(false, nextPage);
    }
  };

  const updateTask = async () => {
    if (!selectedTask) return;
    try {
      if (selectedTask.id === 0) {
        await taskApi.createTask(selectedTask);
      } else {
        await taskApi.updateTask(selectedTask);
      }

      setEditModalVisible(false);
      setPage(1);
      await fetchTasks(true, 1);
      setTimeout(() => {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: `Task ${selectedTask.id === 0 ? "created" : "updated"} successfully!`,
        });
      }, 300);
    } catch (e: any) {
      if (e.message === "DUPLICATE_TITLE") {
        Toast.show({
          type: "error",
          text1: "Duplicate Error",
          text2: "Task title already exists.",
        });
      } else {
        console.error(e);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Update failed.",
        });
      }
    }
  };

  const deleteTask = async () => {
    if (!selectedTask) return;
    try {
      await taskApi.deleteTask(selectedTask.id);

      setEditModalVisible(false);
      setPage(1);
      await fetchTasks(true, 1);
      setTimeout(() => {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Task deleted successfully!",
        });
      }, 300);
    } catch (e) {
      console.error(e);
      Toast.show({ type: "error", text1: "Error", text2: "Delete failed." });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Task Manager</Text>
          <Pressable
            style={styles.fabHeader}
            onPress={() => {
              setSelectedTask({
                id: 0,
                title: "",
                description: "",
                status: "pending",
              });
              setEditModalVisible(true);
            }}
          >
            <Text style={styles.fabText}>+ New</Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInputFlex}
            placeholder="Search by keyword..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#999"
          />
          <Pressable
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons
              name="options-outline"
              size={24}
              color={COLORS.textDark}
            />
          </Pressable>
        </View>

        <View style={styles.statusScrollContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusScrollContent}
          >
            {["", "pending", "in_progress", "completed"].map((filter) => (
              <StatusBadge
                key={filter}
                status={filter}
                variant="chip"
                active={statusFilter === filter}
                onPress={() => setStatusFilter(filter)}
              />
            ))}
          </ScrollView>
        </View>

        {loading && page === 1 && tasks.length === 0 ? (
          <FlatList
            key={`skeleton-${numColumns}`}
            numColumns={numColumns}
            ref={flatListRef}
            data={[1, 2, 3, 4, 5, 6]}
            keyExtractor={(item) => item.toString()}
            renderItem={() => (
              <View
                style={{
                  flex: 1,
                  padding: 4,
                  maxWidth: numColumns === 2 ? "50%" : "100%",
                }}
              >
                <SkeletonCard />
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
          />
        ) : (
          <View style={{ flex: 1, opacity: loading && page === 1 ? 0.5 : 1 }}>
            <FlatList
              key={`tasks-${numColumns}`}
              numColumns={numColumns}
              ref={flatListRef}
              data={tasks}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View
                  style={{
                    flex: 1,
                    padding: 4,
                    maxWidth: numColumns === 2 ? "50%" : "100%",
                  }}
                >
                  <TaskCard
                    task={item}
                    onPress={(t) => {
                      setSelectedTask(t);
                      setEditModalVisible(true);
                    }}
                  />
                </View>
              )}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loading && page > 1 ? (
                  <View style={{ paddingBottom: 20 }}>
                    <SkeletonCard />
                  </View>
                ) : (
                  <View style={{ height: 20 }} />
                )
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No tasks found</Text>
                </View>
              }
            />
          </View>
        )}

        <EditTaskModal
          visible={editModalVisible}
          task={selectedTask}
          onClose={() => setEditModalVisible(false)}
          onSave={updateTask}
          onDelete={deleteTask}
          onChange={setSelectedTask}
        />

        <Modal
          visible={filterModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setFilterModalVisible(false)}
          >
            <Animated.View
              style={[
                styles.filterModalContent,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Pressable
                style={{ width: "100%", maxHeight: "100%" }}
                onPress={(e) => e.stopPropagation()}
              >
                <ScrollView showsVerticalScrollIndicator={true}>
                  <Text style={styles.modalTitle}>Advanced Filters</Text>

                  <Text style={styles.label}>Sort By</Text>
                  <View style={styles.radioGroup}>
                    <Pressable
                      onPress={() => setSortFilter("created_at desc")}
                      style={[
                        styles.radioBtn,
                        sortFilter === "created_at desc" &&
                          styles.radioBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.radioText,
                          sortFilter === "created_at desc" &&
                            styles.radioTextActive,
                        ]}
                      >
                        Newest
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSortFilter("created_at asc")}
                      style={[
                        styles.radioBtn,
                        sortFilter === "created_at asc" &&
                          styles.radioBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.radioText,
                          sortFilter === "created_at asc" &&
                            styles.radioTextActive,
                        ]}
                      >
                        Oldest
                      </Text>
                    </Pressable>
                  </View>

                  <View
                    style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { marginBottom: 8 }]}>
                        Start Date & Time
                      </Text>
                      <Pressable
                        style={[
                          styles.inputModal,
                          {
                            marginBottom: 0,
                            paddingVertical: 12,
                            justifyContent: "center",
                          },
                        ]}
                        onPress={() => {
                          setActiveDatePicker("start");
                          setDatePickerVisible(true);
                        }}
                      >
                        <Text
                          style={{
                            color: startDateFilter ? COLORS.textDark : "#999",
                            fontFamily: FONTS.regular,
                          }}
                        >
                          {startDateFilter || "Select"}
                        </Text>
                      </Pressable>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { marginBottom: 8 }]}>
                        End Date & Time
                      </Text>
                      <Pressable
                        style={[
                          styles.inputModal,
                          {
                            marginBottom: 0,
                            paddingVertical: 12,
                            justifyContent: "center",
                          },
                        ]}
                        onPress={() => {
                          setActiveDatePicker("end");
                          setDatePickerVisible(true);
                        }}
                      >
                        <Text
                          style={{
                            color: endDateFilter ? COLORS.textDark : "#999",
                            fontFamily: FONTS.regular,
                          }}
                        >
                          {endDateFilter || "Select"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 24,
                    }}
                  >
                    <Text style={[styles.label, { marginBottom: 0 }]}>
                      Show Overdue Tasks Only
                    </Text>
                    <Pressable
                      style={{
                        width: 50,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: isOverdueFilter
                          ? COLORS.primary
                          : COLORS.border,
                        justifyContent: "center",
                        padding: 2,
                      }}
                      onPress={() => setIsOverdueFilter(!isOverdueFilter)}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: COLORS.surface,
                          transform: [{ translateX: isOverdueFilter ? 20 : 0 }],
                        }}
                      />
                    </Pressable>
                  </View>

                  <Text style={styles.label}>Assignee ID</Text>
                  <TextInput
                    style={styles.inputModal}
                    placeholder="Enter User ID..."
                    value={assigneeFilter}
                    onChangeText={setAssigneeFilter}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />

                  <Pressable
                    style={styles.applyFilterBtn}
                    onPress={() => setFilterModalVisible(false)}
                  >
                    <Text style={styles.applyFilterBtnText}>Apply</Text>
                  </Pressable>
                </ScrollView>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
        <DateTimePickerModal
          visible={datePickerVisible}
          onClose={() => setDatePickerVisible(false)}
          initialDate={
            activeDatePicker === "start" ? startDateFilter : endDateFilter
          }
          onSelect={(dateStr) => {
            if (activeDatePicker === "start") setStartDateFilter(dateStr);
            else setEndDateFilter(dateStr);
          }}
        />
      </View>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "web" ? 20 : 10,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: FONTS.extraBold,
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  fabHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  fabText: {
    color: COLORS.textWhite,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  searchInputFlex: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    fontFamily: FONTS.regular,
    fontSize: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: Platform.OS === "web" ? 1 : 0,
    borderColor: COLORS.borderLight,
  },
  filterButton: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  filterButtonText: {
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
  },
  statusScrollContainer: {
    marginBottom: 24,
    marginHorizontal: -20, // To allow scrolling edge-to-edge
  },
  statusScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  listContent: { paddingBottom: 40 },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontFamily: FONTS.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: "flex-end",
  },
  filterModalContent: {
    width: 320,
    maxHeight: "85%", // To prevent overflowing if it's too long
    marginTop: Platform.OS === "web" ? 85 : 160,
    marginRight: 20,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    transformOrigin: "top right" as any,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
    marginBottom: 20,
  },
  label: {
    fontFamily: FONTS.medium,
    color: COLORS.textGray,
    marginBottom: 8,
  },
  inputModal: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontFamily: FONTS.regular,
    fontSize: 16,
    backgroundColor: COLORS.surface,
    marginBottom: 24,
  },
  applyFilterBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyFilterBtnText: {
    color: COLORS.textWhite,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  radioBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  radioBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  radioText: {
    fontFamily: FONTS.medium,
    color: COLORS.textGray,
  },
  radioTextActive: {
    color: COLORS.textWhite,
  },
});
