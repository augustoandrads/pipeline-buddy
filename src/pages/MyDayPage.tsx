/**
 * My Day Tasks Panel (US-09)
 * Dashboard showing today's and overdue tasks for the logged-in user
 */

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle, Calendar } from "lucide-react";
import { getMyDayTasks, updateTaskStatus } from "@/services/tasksService";
import { TASK_TYPE_LABELS } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types/crm";

interface TaskGroup {
  title: string;
  icon: React.ReactNode;
  color: string;
  tasks: Task[];
}

export function MyDayPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const assignee = "current-user"; // TODO: Get from auth context

  // Fetch my day tasks
  const { data: groupedTasks, isLoading } = useQuery({
    queryKey: ["myDayTasks", assignee],
    queryFn: () => getMyDayTasks(assignee),
    refetchInterval: 60000, // Refetch every minute
  });

  // Complete task mutation
  const completeMutation = useMutation({
    mutationFn: (taskId: string) =>
      updateTaskStatus(taskId, "COMPLETED", "Concluída via My Day"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myDayTasks", assignee] });
    },
  });

  // Group tasks by status
  const taskGroups = useMemo((): TaskGroup[] => {
    if (!groupedTasks)
      return [
        { title: "Atrasadas", icon: <AlertCircle />, color: "red", tasks: [] },
        { title: "Vencendo Hoje", icon: <Calendar />, color: "orange", tasks: [] },
        { title: "Vencendo Amanhã", icon: <Calendar />, color: "blue", tasks: [] },
      ];

    return [
      {
        title: "Atrasadas",
        icon: <AlertCircle className="w-5 h-5" />,
        color: "red",
        tasks: groupedTasks.overdue || [],
      },
      {
        title: "Vencendo Hoje",
        icon: <Calendar className="w-5 h-5" />,
        color: "orange",
        tasks: groupedTasks.dueToday || [],
      },
      {
        title: "Vencendo Amanhã",
        icon: <Calendar className="w-5 h-5" />,
        color: "blue",
        tasks: groupedTasks.dueTomorrow || [],
      },
    ];
  }, [groupedTasks]);

  const totalTasks = taskGroups.reduce((sum, group) => sum + group.tasks.length, 0);
  const colorMap = {
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      badge: "bg-red-600",
      header: "border-red-200 bg-red-50",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      badge: "bg-orange-600",
      header: "border-orange-200 bg-orange-50",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      badge: "bg-blue-600",
      header: "border-blue-200 bg-blue-50",
    },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Meu Dia</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas tarefas para hoje e acompanhe prazos
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendentes para hoje e amanhã
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {groupedTasks?.overdue?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requer atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Próximas 48h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(groupedTasks?.dueToday?.length || 0) +
                (groupedTasks?.dueTomorrow?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Vencimento hoje ou amanhã
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Groups */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando tarefas...
        </div>
      ) : totalTasks === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">Nenhuma tarefa!</h3>
            <p className="text-muted-foreground">
              Você está em dia com suas tarefas. Ótimo trabalho!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {taskGroups.map((group) => {
            if (group.tasks.length === 0) return null;

            const colors =
              colorMap[group.color as keyof typeof colorMap];

            return (
              <Card key={group.title} className={`border-l-4 ${colors.border}`}>
                <CardHeader className={`pb-3 ${colors.header}`}>
                  <div className="flex items-center gap-2">
                    <span className={colors.text}>{group.icon}</span>
                    <CardTitle className="text-base">
                      {group.title}{" "}
                      <Badge variant="secondary" className="ml-2">
                        {group.tasks.length}
                      </Badge>
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {group.tasks.map((task: Task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded border flex items-center justify-between gap-4 ${colors.bg} ${colors.border}`}
                      >
                        <div className="flex-1 min-w-0 cursor-pointer hover:opacity-75" onClick={() => navigate(`/leads`)}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {task.title}
                            </span>
                            <Badge className={colors.badge} variant="secondary">
                              {TASK_TYPE_LABELS[task.type]}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>
                              Lead:{" "}
                              {task.leads
                                ? `${(task.leads as Record<string, string>).nome} (${(task.leads as Record<string, string>).empresa})`
                                : "N/A"}
                            </p>
                            {task.assignee && <p>Responsável: {task.assignee}</p>}
                            <p>
                              Vencimento:{" "}
                              {new Date(task.due_date).toLocaleString(
                                "pt-BR"
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Complete Button */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              completeMutation.mutate(task.id)
                            }
                            disabled={completeMutation.isPending}
                            className="whitespace-nowrap"
                          >
                            {completeMutation.isPending ? "..." : "Concluir"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
