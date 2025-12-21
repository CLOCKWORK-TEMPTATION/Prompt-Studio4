import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play } from "lucide-react";

interface Stage5RunProps {
  output: string;
  latency: number | null;
  tokenUsage: { prompt: number; completion: number; total: number } | null;
  isRunning: boolean;
  onRun: () => void;
}

export function Stage5Run({
  output,
  latency,
  tokenUsage,
  isRunning,
  onRun,
}: Stage5RunProps) {
  return (
    <Card data-testid="stage-5-run">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">تشغيل المطالبة</h3>
            <p className="text-sm text-muted-foreground">نفّذ المطالبة واحصل على النتيجة</p>
          </div>
          <Button
            onClick={onRun}
            disabled={isRunning}
            size="lg"
            data-testid="button-run-prompt"
          >
            <Play className="ml-2 size-5" />
            {isRunning ? "جاري التشغيل..." : "تشغيل"}
          </Button>
        </div>

        {output && (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              {latency !== null && (
                <div className="bg-muted px-3 py-1.5 rounded-md">
                  <span className="text-muted-foreground">الوقت: </span>
                  <span className="font-medium">{latency}ms</span>
                </div>
              )}
              {tokenUsage && (
                <>
                  <div className="bg-muted px-3 py-1.5 rounded-md">
                    <span className="text-muted-foreground">Prompt: </span>
                    <span className="font-medium">{tokenUsage.prompt}</span>
                  </div>
                  <div className="bg-muted px-3 py-1.5 rounded-md">
                    <span className="text-muted-foreground">Completion: </span>
                    <span className="font-medium">{tokenUsage.completion}</span>
                  </div>
                  <div className="bg-muted px-3 py-1.5 rounded-md">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-medium">{tokenUsage.total}</span>
                  </div>
                </>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">المخرجات:</h4>
              <ScrollArea className="h-[350px] border rounded-lg p-4 bg-muted/50">
                <pre className="whitespace-pre-wrap text-sm font-mono" data-testid="output-text">
                  {output}
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}

        {!output && !isRunning && (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground border rounded-lg">
            <div className="text-center">
              <Play className="size-16 mb-4 opacity-50 mx-auto" />
              <p>اضغط على "تشغيل" لتنفيذ المطالبة</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
