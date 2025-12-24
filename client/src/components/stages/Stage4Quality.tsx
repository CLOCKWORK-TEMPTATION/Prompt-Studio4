import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wand2, CheckCircle2, AlertCircle, Info, ArrowRight, Copy, Check } from "lucide-react";
import { CritiqueResult, PromptSections } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useToast } from "@/hooks/use-toast";

interface Stage4QualityProps {
  critique: CritiqueResult | null;
  isCritiquing: boolean;
  onRunCritique: () => void;
  onApplyRewrite: () => void;
  onProceedToRun?: () => void;
}

export function Stage4Quality({
  critique,
  isCritiquing,
  onRunCritique,
  onApplyRewrite,
  onProceedToRun,
}: Stage4QualityProps) {
  const [showRewrittenPrompt, setShowRewrittenPrompt] = useState(false);
  const [rewrittenSections, setRewrittenSections] = useState<PromptSections | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const { toast } = useToast();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error": return <AlertCircle className="size-4 text-red-500" />;
      case "warning": return <AlertCircle className="size-4 text-yellow-500" />;
      default: return <Info className="size-4 text-blue-500" />;
    }
  };

  const handleApplyRewrite = () => {
    if (critique?.rewrittenPrompt) {
      try {
        const parsed = JSON.parse(critique.rewrittenPrompt);
        setRewrittenSections(parsed);
        setShowRewrittenPrompt(true);
        toast({ 
          title: "تم تطبيق التحسينات",
          description: "تم تطبيق النسخة المحسّنة من التحليل ✅" 
        });
      } catch {
        // If parsing fails, just call the original handler
      }
    }
    onApplyRewrite();
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
                  <h4 className="font-semibold mb-2">المشاكل المكتشفة:</h4>
                  {critique.issues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{issue.type}</p>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                        {issue.suggestion && (
                          <p className="text-sm text-green-600 mt-1">💡 {issue.suggestion}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {critique.rewrittenPrompt && !showRewrittenPrompt && (
                <Button
                  onClick={handleApplyRewrite}
                  className="w-full"
                  variant="secondary"
                  data-testid="button-apply-rewrite"
                >
                  <CheckCircle2 className="ml-2 size-4" />
                  تطبيق النسخة المحسنة
                </Button>
              )}

              {showRewrittenPrompt && rewrittenSections && (
                <div className="mt-6 space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="size-5" />
                      البرومبت المحسّن (تم التطبيق)
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h5 className="text-sm font-semibold">System:</h5>
                        <CopyButton text={rewrittenSections.system} size="icon" variant="ghost" />
                      </div>
                      <p className="text-sm text-muted-foreground">{rewrittenSections.system}</p>
                    </div>
                    
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h5 className="text-sm font-semibold">Developer:</h5>
                        <CopyButton text={rewrittenSections.developer} size="icon" variant="ghost" />
                      </div>
                      <p className="text-sm text-muted-foreground">{rewrittenSections.developer}</p>
                    </div>
                    
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h5 className="text-sm font-semibold">User:</h5>
                        <CopyButton text={rewrittenSections.user} size="icon" variant="ghost" />
                      </div>
                      <p className="text-sm text-muted-foreground">{rewrittenSections.user}</p>
                    </div>
                    
                    {rewrittenSections.context && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h5 className="text-sm font-semibold">Context:</h5>
                          <CopyButton text={rewrittenSections.context} size="icon" variant="ghost" />
                        </div>
                        <p className="text-sm text-muted-foreground">{rewrittenSections.context}</p>
                      </div>
                    )}
                  </div>
                  
                  {onProceedToRun && (
                    <Button
                      onClick={onProceedToRun}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                      data-testid="button-proceed-to-run"
                    >
                      <CheckCircle2 className="ml-2 size-5" />
                      موافقة والانتقال للمرحلة الخامسة (التشغيل)
                      <ArrowRight className="mr-2 size-5" />
                    </Button>
                  )}
                </div>
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
