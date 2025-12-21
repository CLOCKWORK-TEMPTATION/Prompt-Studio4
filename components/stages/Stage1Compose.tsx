import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";
import { AgentComposeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Stage1ComposeProps {
  status: AgentComposeStatus | null;
}

export function Stage1Compose({ status }: Stage1ComposeProps) {
  if (!status) {
    return (
      <Card data-testid="stage-1-compose">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-10">
            <Loader2 className="size-12 mx-auto mb-4 animate-spin" />
            <p>جاري بدء عملية التحويل...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stages = [
    { id: "agent1", label: "الوكيل 1: المُحوِّل", progressRange: [0, 40] },
    { id: "agent2", label: "الوكيل 2: المُشكِّك", progressRange: [40, 70] },
    { id: "agent3", label: "الوكيل 3: الحَكَم", progressRange: [70, 100] },
  ];

  const getStageStatus = (stageId: string) => {
    if (status.stage === "done") return "completed";
    if (status.stage === stageId) return "in-progress";
    const stageIndex = stages.findIndex((s) => s.id === stageId);
    const currentStageIndex = stages.findIndex((s) => s.id === status.stage);
    return stageIndex < currentStageIndex ? "completed" : "pending";
  };

  return (
    <Card data-testid="stage-1-compose">
      <CardContent className="p-6 space-y-4">
        {status.status === "failed" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{status.error || "فشل التحويل"}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {stages.map((stage) => {
            const stageStatus = getStageStatus(stage.id);
            return (
              <div
                key={stage.id}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border",
                  stageStatus === "in-progress" && "bg-blue-50 border-blue-200",
                  stageStatus === "completed" && "bg-green-50 border-green-200"
                )}
                data-testid={`agent-stage-${stage.id}`}
              >
                <div>
                  {stageStatus === "completed" && (
                    <CheckCircle2 className="size-6 text-green-600" />
                  )}
                  {stageStatus === "in-progress" && (
                    <Loader2 className="size-6 text-blue-600 animate-spin" />
                  )}
                  {stageStatus === "pending" && (
                    <Circle className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{stage.label}</p>
                  {stageStatus === "in-progress" && (
                    <p className="text-sm text-muted-foreground">
                      {status.progress}% مكتمل
                    </p>
                  )}
                  {stageStatus === "completed" && (
                    <p className="text-sm text-green-600">مكتمل</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">التقدم الكلي</span>
            <span className="text-muted-foreground">{status.progress}%</span>
          </div>
          <Progress value={status.progress} className="h-2" data-testid="compose-progress" />
        </div>
      </CardContent>
    </Card>
  );
}
