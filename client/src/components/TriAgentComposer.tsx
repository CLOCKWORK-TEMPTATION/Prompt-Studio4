import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { agentComposeApi } from "@/lib/api";
import { AgentComposeStatus, Variable, PromptSections } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface TriAgentComposerProps {
  onApply: (sections: PromptSections, variables: Variable[]) => void;
  modelConfig: { model: string; temperature: number; maxTokens?: number };
}

export function TriAgentComposer({ onApply, modelConfig }: TriAgentComposerProps) {
  const [rawIdea, setRawIdea] = useState("");
  const [goal, setGoal] = useState("");
  const [constraints, setConstraints] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [runId, setRunId] = useState<number | null>(null);
  const [status, setStatus] = useState<AgentComposeStatus | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!runId || !isComposing) return;

    const pollStatus = async () => {
      try {
        const result = await agentComposeApi.getStatus(runId);
        setStatus(result);

        if (result.status === "completed") {
          setIsComposing(false);
          toast({
            title: "تم التحويل بنجاح",
            description: "تم تحويل فكرتك إلى الأقسام الأربعة",
          });
        } else if (result.status === "failed") {
          setIsComposing(false);
          toast({
            title: "فشل التحويل",
            description: result.error || "حدث خطأ أثناء المعالجة",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [runId, isComposing, toast]);

  const handleCompose = async () => {
    if (!rawIdea.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى كتابة فكرتك أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsComposing(true);
    setStatus(null);
    try {
      const result = await agentComposeApi.start({
        rawIdea,
        goal: goal || undefined,
        constraints: constraints || undefined,
        outputFormat: outputFormat || undefined,
        modelConfig,
      });
      setRunId(result.runId);
    } catch (error) {
      setIsComposing(false);
      toast({
        title: "فشل البدء",
        description: error instanceof Error ? error.message : "حدث خطأ",
        variant: "destructive",
      });
    }
  };

  const handleApply = () => {
    if (!status?.result?.agent3) return;

    const { finalPrompt, finalVariables } = status.result.agent3;
    onApply(finalPrompt, finalVariables);
    toast({
      title: "تم الاعتماد",
      description: "تم ملء الأقسام الأربعة من نتائج الوكلاء",
    });
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "agent1": return "الوكيل الأول: المُحوِّل";
      case "agent2": return "الوكيل الثاني: المُشكِّك";
      case "agent3": return "الوكيل الثالث: الحَكَم";
      case "done": return "مكتمل";
      default: return stage;
    }
  };

  return (
    <Card className="mb-6" data-testid="card-tri-agent-composer">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          Tri-Agent Composer: اكتب فكرتك فقط
        </CardTitle>
        <CardDescription>
          اكتب فكرتك أو مهمتك، وسيقوم ثلاثة وكلاء ذكاء اصطناعي بتحويلها إلى الأقسام الأربعة (System/Developer/User/Context) تلقائياً
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">الفكرة / المهمة / الهدف *</label>
            <Textarea
              placeholder="مثال: أريد بوت يساعد المستخدمين في كتابة السيرة الذاتية بطريقة احترافية..."
              value={rawIdea}
              onChange={(e) => setRawIdea(e.target.value)}
              className="min-h-[120px]"
              disabled={isComposing}
              data-testid="textarea-raw-idea"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">الهدف النهائي (اختياري)</label>
              <Input
                placeholder="مثال: توليد سيرة ذاتية بصيغة PDF"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                disabled={isComposing}
                data-testid="input-goal"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">القيود (اختياري)</label>
              <Input
                placeholder="مثال: أقل من 500 كلمة"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                disabled={isComposing}
                data-testid="input-constraints"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">شكل المخرجات (اختياري)</label>
              <Input
                placeholder="مثال: JSON, Markdown"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                disabled={isComposing}
                data-testid="input-output-format"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleCompose}
            disabled={isComposing || !rawIdea.trim()}
            className="flex-1"
            data-testid="button-compose"
          >
            {isComposing ? (
              <>
                <Loader2 className="ml-2 size-4 animate-spin" />
                جاري التحويل...
              </>
            ) : (
              <>
                <Sparkles className="ml-2 size-4" />
                حوّلها إلى الأقسام الأربعة
              </>
            )}
          </Button>
          {status?.status === "completed" && (
            <Button
              onClick={handleApply}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-apply-result"
            >
              <CheckCircle2 className="ml-2 size-4" />
              اعتماد النتيجة
            </Button>
          )}
        </div>

        {status && (
          <div className="space-y-3 border-t pt-4">
            {status.status === "running" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{getStageLabel(status.stage)}</span>
                  <span className="text-muted-foreground">{status.progress}%</span>
                </div>
                <Progress value={status.progress} className="h-2" data-testid="progress-compose" />
              </div>
            )}

            {status.status === "failed" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{status.error || "فشل التحويل"}</AlertDescription>
              </Alert>
            )}

            {status.status === "completed" && status.result && (
              <Accordion type="single" collapsible className="w-full" data-testid="accordion-results">
                <AccordionItem value="agent1">
                  <AccordionTrigger className="text-sm">
                    الوكيل 1: النسخة الأولية (Agent 1)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div><strong>System:</strong> {status.result.agent1.system}</div>
                      <div><strong>Developer:</strong> {status.result.agent1.developer}</div>
                      <div><strong>User:</strong> {status.result.agent1.user}</div>
                      <div><strong>Context:</strong> {status.result.agent1.context || "لا يوجد"}</div>
                      {status.result.agent1.variables.length > 0 && (
                        <div><strong>المتغيرات:</strong> {status.result.agent1.variables.map(v => v.name).join(", ")}</div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="agent2">
                  <AccordionTrigger className="text-sm">
                    الوكيل 2: النقد والبديل (Agent 2)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm">
                      <div>
                        <strong>النقد:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {status.result.agent2.criticisms.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong>الإصلاحات المقترحة:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {status.result.agent2.fixes.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="agent3">
                  <AccordionTrigger className="text-sm font-semibold text-primary">
                    الوكيل 3: النسخة النهائية (Agent 3) ⭐
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm bg-primary/5 p-4 rounded-lg">
                      <div><strong>System:</strong> {status.result.agent3.finalPrompt.system}</div>
                      <div><strong>Developer:</strong> {status.result.agent3.finalPrompt.developer}</div>
                      <div><strong>User:</strong> {status.result.agent3.finalPrompt.user}</div>
                      <div><strong>Context:</strong> {status.result.agent3.finalPrompt.context || "لا يوجد"}</div>
                      {status.result.agent3.finalVariables.length > 0 && (
                        <div><strong>المتغيرات:</strong> {status.result.agent3.finalVariables.map(v => v.name).join(", ")}</div>
                      )}
                      {status.result.agent3.decisionNotes.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <strong>ملاحظات القرار:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {status.result.agent3.decisionNotes.map((note, i) => (
                              <li key={i}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
