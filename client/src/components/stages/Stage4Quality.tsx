import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wand2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { CritiqueResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Stage4QualityProps {
  critique: CritiqueResult | null;
  isCritiquing: boolean;
  onRunCritique: () => void;
  onApplyRewrite: () => void;
}

export function Stage4Quality({
  critique,
  isCritiquing,
  onRunCritique,
  onApplyRewrite,
}: Stage4QualityProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error": return <AlertCircle className="size-4 text-red-500" />;
      case "warning": return <AlertCircle className="size-4 text-yellow-500" />;
      default: return <Info className="size-4 text-blue-500" />;
    }
  };

  return (
    <Card data-testid="stage-4-quality">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">تحليل الجودة (Critique)</h3>
            <p className="text-sm text-muted-foreground">احصل على تحليل فوري لجودة المطالبة</p>
          </div>
          <Button
            onClick={onRunCritique}
            disabled={isCritiquing}
            data-testid="button-run-critique"
          >
            <Wand2 className="ml-2 size-4" />
            {isCritiquing ? "جاري التحليل..." : "تشغيل التحليل"}
          </Button>
        </div>

        {critique && (
          <ScrollArea className="h-[400px] border rounded-lg p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "text-4xl font-bold",
                  critique.score >= 80 && "text-green-600",
                  critique.score >= 60 && critique.score < 80 && "text-yellow-600",
                  critique.score < 60 && "text-red-600"
                )}>
                  {critique.score}
                </div>
                <div className="text-muted-foreground">/ 100</div>
              </div>

              {critique.reasoning && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">التحليل:</h4>
                  <p className="text-sm text-muted-foreground">{critique.reasoning}</p>
                </div>
              )}

              {critique.issues.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">المشاكل المكتشفة:</h4>
                  {critique.issues.map((issue, i) => (
                    <div key={i} className="flex gap-3 p-3 border rounded-lg bg-card" data-testid={`issue-${i}`}>
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <p className="text-sm">{issue.message}</p>
                        {issue.suggestion && (
                          <p className="text-xs text-muted-foreground mt-1">اقتراح: {issue.suggestion}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {critique.rewrittenPrompt && (
                <Button
                  onClick={onApplyRewrite}
                  className="w-full"
                  variant="secondary"
                  data-testid="button-apply-rewrite"
                >
                  <CheckCircle2 className="ml-2 size-4" />
                  تطبيق النسخة المحسنة
                </Button>
              )}
            </div>
          </ScrollArea>
        )}

        {!critique && !isCritiquing && (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground border rounded-lg">
            <div className="text-center">
              <Wand2 className="size-16 mb-4 opacity-50 mx-auto" />
              <p>اضغط على "تشغيل التحليل" لتحليل المطالبة</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
