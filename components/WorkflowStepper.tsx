import { Check, Circle, Loader2, Lightbulb, Sparkles, CheckCircle, Edit, Play, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { StageId, StageStatus, WORKFLOW_STAGES } from "@/lib/workflow-types";

interface WorkflowStepperProps {
  currentStage: StageId;
  stageStatuses: Record<StageId, StageStatus>;
  onStageClick: (stage: StageId) => void;
}

const STAGE_ICONS = {
  Lightbulb,
  Sparkles,
  CheckCircle,
  Edit,
  Play,
  Save,
};

export function WorkflowStepper({ currentStage, stageStatuses, onStageClick }: WorkflowStepperProps) {
  const stages: StageId[] = [0, 1, 2, 3, 4, 5, 6];

  const getIcon = (stageId: StageId) => {
    const iconName = WORKFLOW_STAGES[stageId].icon as keyof typeof STAGE_ICONS;
    const IconComponent = STAGE_ICONS[iconName] || Circle;
    return IconComponent;
  };

  const getStatusIcon = (stageId: StageId) => {
    const status = stageStatuses[stageId];
    const Icon = getIcon(stageId);
    
    if (status === "completed") {
      return <Check className="size-4" />;
    } else if (status === "in-progress") {
      return <Loader2 className="size-4 animate-spin" />;
    } else {
      return <Icon className="size-4" />;
    }
  };

  return (
    <div className="w-64 border-l bg-muted/20 p-4 flex flex-col gap-1" data-testid="workflow-stepper">
      <h3 className="font-semibold mb-4 text-sm">سير العمل</h3>
      {stages.map((stageId, index) => {
        const stage = WORKFLOW_STAGES[stageId];
        const status = stageStatuses[stageId];
        const isCurrent = currentStage === stageId;

        return (
          <div key={stageId}>
            <button
              onClick={() => onStageClick(stageId)}
              className={cn(
                "w-full text-right p-3 rounded-lg transition-colors flex items-start gap-3",
                isCurrent && "bg-primary/10 border border-primary/20",
                !isCurrent && "hover:bg-muted/50",
                status === "completed" && !isCurrent && "opacity-60"
              )}
              data-testid={`stage-button-${stageId}`}
            >
              <div
                className={cn(
                  "mt-0.5 rounded-full p-1.5 shrink-0",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isCurrent && status === "completed" && "bg-green-500 text-white",
                  !isCurrent && status === "in-progress" && "bg-blue-500 text-white",
                  !isCurrent && status === "incomplete" && "bg-muted"
                )}
              >
                {getStatusIcon(stageId)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm flex items-center gap-2">
                  <span className="text-muted-foreground">{stageId}</span>
                  <span className={cn(isCurrent && "text-primary")}>{stage.title}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{stage.description}</div>
              </div>
            </button>
            {index < stages.length - 1 && (
              <div className="h-6 flex justify-center">
                <div className={cn(
                  "w-0.5",
                  status === "completed" ? "bg-green-500/30" : "bg-border"
                )} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
