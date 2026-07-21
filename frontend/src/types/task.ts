export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  assignee_id?: number | null;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
}
