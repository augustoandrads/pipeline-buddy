/**
 * Service for managing tasks (US-08, US-09)
 */

import { supabase } from "@/integrations/supabase/client";
import { Task, TaskType, TaskStatus } from "@/types/crm";

/**
 * Create a new task for a lead
 */
export async function createTask(
  leadId: string,
  title: string,
  type: TaskType,
  dueDate: string,
  assignee?: string,
  result?: string
): Promise<Task | null> {
  try {
    if (!leadId || !title || !type || !dueDate) {
      throw new Error("leadId, title, type, and dueDate are required");
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        lead_id: leadId,
        title,
        type,
        due_date: dueDate,
        assignee: assignee || null,
        status: "PENDING",
        result: result || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

/**
 * Get all tasks for a lead
 */
export async function getLeadTasks(leadId: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("lead_id", leadId)
      .order("due_date", { ascending: true });

    if (error) throw error;
    return (data || []) as Task[];
  } catch (error) {
    console.error("Error fetching lead tasks:", error);
    return [];
  }
}

/**
 * Update task status and result
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  result?: string
): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        status,
        result: result || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}

/**
 * Get today's tasks for a user (US-09)
 */
export async function getTodaysTasks(assignee: string): Promise<Task[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("assignee", assignee)
      .lte("due_date", tomorrow.toISOString())
      .in("status", ["PENDING", "OVERDUE"])
      .order("due_date", { ascending: true });

    if (error) throw error;
    return (data || []) as Task[];
  } catch (error) {
    console.error("Error fetching today's tasks:", error);
    return [];
  }
}

/**
 * Get tasks for "My Day" panel with proper grouping
 */
export async function getMyDayTasks(assignee: string) {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from("tasks")
      .select("*, leads(nome, empresa)")
      .eq("assignee", assignee)
      .lte("due_date", tomorrow.toISOString())
      .in("status", ["PENDING", "OVERDUE"])
      .order("due_date", { ascending: true });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasks = (data || []) as Record<string, any>[];
    return groupTasksByStatus(tasks, today);
  } catch (error) {
    console.error("Error fetching my day tasks:", error);
    return { overdue: [], dueToday: [], dueTomorrow: [] };
  }
}

/**
 * Group tasks by status (overdue, due today, due tomorrow)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupTasksByStatus(tasks: Record<string, any>[], today: Date) {
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);

  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups: { overdue: Record<string, any>[]; dueToday: Record<string, any>[]; dueTomorrow: Record<string, any>[] } = {
    overdue: [],
    dueToday: [],
    dueTomorrow: [],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks.forEach((task: Record<string, any>) => {
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < todayDate) {
      groups.overdue.push(task);
    } else if (
      dueDate.getTime() === todayDate.getTime()
    ) {
      groups.dueToday.push(task);
    } else if (
      dueDate.getTime() === tomorrowDate.getTime()
    ) {
      groups.dueTomorrow.push(task);
    }
  });

  return groups;
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting task:", error);
    return false;
  }
}

/**
 * Update task (US-08)
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}
