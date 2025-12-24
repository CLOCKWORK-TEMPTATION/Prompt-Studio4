import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Map } from "lucide-react";
import { StageId, WORKFLOW_STAGES } from "@/lib/workflow-types";
import { Progress } from "@/components/ui/progress";

interface StageHeaderProps {
  currentStage: StageId;
  onPrevious: () => void;
  onNext: () => void;
  onShowMap: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function StageHeader({
  currentStage,
  onPrevious,
  onNext,
  onShowMap,
  canGoPrevious,
  canGoNext,
}: StageHeaderProps) {
  const stage = WORKFLOW_STAGES[currentStage];
  const progressPercent = ((currentStage + 1) / 7) * 100;

  return (
    <div className="border-b bg-background p-4" data-testid="stage-header">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {currentStage + 1}
          </div>
          <div>
            <h2 className="font-bold text-lg">{stage.title}</h2>
            <p className="text-sm text-muted-foreground">{stage.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onShowMap}
            data-testid="button-show-map"
          >
            <Map className="ml-2 size-4" />
            خريطة سير العمل
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            data-testid="button-previous-stage"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNext}
            disabled={!canGoNext}
            data-testid="button-next-stage"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>المرحلة {currentStage + 1} من 7</span>
        <Progress value={progressPercent} className="h-1.5 flex-1" />
        <span>{Math.round(progressPercent)}%</span>
      </div>
    </div>
  );
}
