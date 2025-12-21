import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2 } from "lucide-react";
import { AgentComposeStatus } from "@/lib/types";

interface Stage2ReviewProps {
  status: AgentComposeStatus | null;
  onApprove: () => void;
}

export function Stage2Review({ status, onApprove }: Stage2ReviewProps) {
  if (!status || !status.result) {
    return (
      <Card data-testid="stage-2-review">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-10">
            <p>لا توجد نتائج للمراجعة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { agent1, agent2, agent3 } = status.result;

  return (
    <Card data-testid="stage-2-review">
      <CardContent className="p-6 space-y-4">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="agent1">
            <AccordionTrigger>الوكيل 1: النسخة الأولية</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                <div><strong>System:</strong> {agent1.system}</div>
                <div><strong>Developer:</strong> {agent1.developer}</div>
                <div><strong>User:</strong> {agent1.user}</div>
                <div><strong>Context:</strong> {agent1.context || "لا يوجد"}</div>
                {agent1.variables.length > 0 && (
                  <div><strong>المتغيرات:</strong> {agent1.variables.map(v => v.name).join(", ")}</div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="agent2">
            <AccordionTrigger>الوكيل 2: النقد والبديل</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>النقد:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {agent2.criticisms.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>الإصلاحات المقترحة:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {agent2.fixes.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="agent3">
            <AccordionTrigger className="text-primary font-semibold">
              الوكيل 3: النسخة النهائية ⭐
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm bg-primary/5 p-4 rounded-lg">
                <div><strong>System:</strong> {agent3.finalPrompt.system}</div>
                <div><strong>Developer:</strong> {agent3.finalPrompt.developer}</div>
                <div><strong>User:</strong> {agent3.finalPrompt.user}</div>
                <div><strong>Context:</strong> {agent3.finalPrompt.context || "لا يوجد"}</div>
                {agent3.finalVariables.length > 0 && (
                  <div><strong>المتغيرات:</strong> {agent3.finalVariables.map(v => v.name).join(", ")}</div>
                )}
                {agent3.decisionNotes.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <strong>ملاحظات القرار:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {agent3.decisionNotes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="pt-4 border-t">
          <Button
            onClick={onApprove}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
            data-testid="button-approve-result"
          >
            <CheckCircle2 className="ml-2 size-5" />
            اعتماد النتيجة النهائية والانتقال للتحرير
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
