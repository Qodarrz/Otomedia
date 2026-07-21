import { Task } from "../types/task";

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/tasks`;

export interface FetchTasksParams {
  page: number;
  limit: number;
  keyword?: string;
  status?: string;
  assignee?: string;
  start_date?: string;
  end_date?: string;
  sort?: string;
  is_overdue?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    current_page: number;
    total_pages: number;
    total_data: number;
    limit: number;
  };
}

export const taskApi = {
  fetchTasks: async (params: FetchTasksParams, signal?: AbortSignal): Promise<PaginatedResponse<Task>> => {
    const query = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });

    if (params.keyword) query.append("keyword", params.keyword);
    if (params.status) query.append("status", params.status);
    if (params.assignee) query.append("assignee", params.assignee);
    if (params.start_date) query.append("start_date", params.start_date);
    if (params.end_date) query.append("end_date", params.end_date);
    if (params.sort) query.append("sort", params.sort);
    if (params.is_overdue) query.append("is_overdue", "true");

    const res = await fetch(`${API_URL}?${query.toString()}`, { signal });
    if (!res.ok) throw new Error("Failed to fetch tasks");
    
    return await res.json();
  },

  updateTask: async (task: Task): Promise<void> => {
    const res = await fetch(`${API_URL}/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });

    if (!res.ok) {
      if (res.status === 409) {
        throw new Error("DUPLICATE_TITLE");
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || "UPDATE_FAILED");
    }
  },

  deleteTask: async (taskId: number): Promise<void> => {
    const res = await fetch(`${API_URL}/${taskId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || "DELETE_FAILED");
    }
  },

  createTask: async (task: Partial<Task>): Promise<Task> => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });

    if (!res.ok) {
      if (res.status === 409) {
        throw new Error("DUPLICATE_TITLE");
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || "CREATE_FAILED");
    }
    
    const json = await res.json();
    return json.data || json;
  },
};
