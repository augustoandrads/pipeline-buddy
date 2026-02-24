/**
 * Tasks Tab for Lead Card (US-08)
 * Displays tasks related to a lead with create, update, and complete functionality
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Plus, Check, Trash2 } from "lucide-react";
import { getLeadTasks, createTask, updateTaskStatus, deleteTask } from "@/services/tasksService";
import { TASK_TYPE_LABELS } from "@/types/crm";
import type { Task, TaskType } from "@/types/crm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface TasksTabProps {
  leadId: string;
}

export function TasksTab({ leadId }: TasksTabProps) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompletingTaskId, setIsCompletingTaskId] = useState<string | null>(null);
  const [completionResult, setCompletionResult] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("CALL");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["leadTasks", leadId],
    queryFn: () => getLeadTasks(leadId),
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: () =>
      createTask(leadId, title, type, new Date(dueDate).toISOString(), assignee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      // Reset form
      setTitle("");
      setType("CALL");
      setDueDate("");
      setAssignee("");
      setIsCreateOpen(false);
    },
  });

  // Complete task mutation
  const completeMutation = useMutation({
    mutationFn: (taskId: string) =>
      updateTaskStatus(taskId, "COMPLETED", completionResult),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leadTasks", leadId] });
      setIsCompletingTaskId(null);
      setCompletionResult("");
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leadTasks", leadId] });
    },
  });

  const getStatusColor = (task: Task) => {
    const now = new Date();
    const due = new Date(task.due_date);

    if (task.status === "COMPLETED") return "bg-green-50";
    if (task.status === "OVERDUE" || (due < now && task.status === "PENDING"))
      return "bg-red-50";
    return "bg-blue-50";
  };

  const getStatusBadge = (task: Task) => {
    const now = new Date();
    const due = new Date(task.due_date);

    if (task.status === "COMPLETED")
      return <Badge className="bg-green-600">Concluída</Badge>;
    if (task.status === "OVERDUE" || (due < now && task.status === "PENDING"))
      return (
        <Badge className="bg-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Atrasada
        </Badge>
      );
    return <Badge className="bg-blue-600">Pendente</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Create Task Button */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Tarefa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-sm font-medium block mb-1">Título *</label>
              <Input
                placeholder="Descreva a tarefa..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-sm font-medium block mb-1">Tipo *</label>
              <Select value={type} onValueChange={(v) => setType(v as TaskType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-sm font-medium block mb-1">Data/Hora *</label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="text-sm font-medium block mb-1">Responsável</label>
              <Input
                placeholder="Nome do responsável (opcional)"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!title || !dueDate || createMutation.isPending}
              >
                {createMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tasks List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Carregando tarefas...
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma tarefa criada. Clique em "Nova Tarefa" para começar.
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task: Task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border ${getStatusColor(task)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {task.title}
                    </span>
                    {getStatusBadge(task)}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Tipo: {TASK_TYPE_LABELS[task.type]}</p>
                    <p>
                      Vencimento:{" "}
                      {new Date(task.due_date).toLocaleString("pt-BR")}
                    </p>
                    {task.assignee && <p>Responsável: {task.assignee}</p>}
                    {task.result && (
                      <p className="text-green-700 font-medium">
                        Resultado: {task.result}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {task.status !== "COMPLETED" && (
                  <div className="flex gap-1">
                    <Dialog
                      open={isCompletingTaskId === task.id}
                      onOpenChange={(open) =>
                        setIsCompletingTaskId(open ? task.id : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Marcar como concluída"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Completar Tarefa</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Descreva o resultado ou resultado da tarefa..."
                            value={completionResult}
                            onChange={(e) => setCompletionResult(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => setIsCompletingTaskId(null)}
                              disabled={completeMutation.isPending}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={() =>
                                completeMutation.mutate(task.id)
                              }
                              disabled={completeMutation.isPending}
                            >
                              {completeMutation.isPending
                                ? "Salvando..."
                                : "Concluir"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => deleteMutation.mutate(task.id)}
                      disabled={deleteMutation.isPending}
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
