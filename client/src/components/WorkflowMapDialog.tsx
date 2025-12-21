import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WORKFLOW_STAGES, StageId } from "@/lib/workflow-types";

interface WorkflowMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkflowMapDialog({ open, onOpenChange }: WorkflowMapDialogProps) {
  const stages: StageId[] = [0, 1, 2, 3, 4, 5, 6];

  const stageDetails: Record<StageId, { input: string; output: string; when: string }> = {
    0: {
      input: "فكرة خام في خاطرك",
      output: "نص الفكرة + حقول اختيارية (هدف، قيود، شكل مخرجات)",
      when: "عندما تريد البدء من الصفر دون معرفة مسبقة بالأقسام الأربعة",
    },
    1: {
      input: "الفكرة الخام من المرحلة 0",
      output: "3 نسخ من المطالبة (Agent 1، Agent 2، Agent 3) مع تحليل ونقد",
      when: "بعد إدخال الفكرة والضغط على 'ابدأ التحويل'",
    },
    2: {
      input: "نتائج الوكلاء الثلاثة",
      output: "اختيار النسخة النهائية ونقلها للتحرير",
      when: "بعد اكتمال عمل الوكلاء الثلاثة",
    },
    3: {
      input: "الأقسام الأربعة (من Agent 3 أو يدوي)",
      output: "System, Developer, User, Context + Variables + Preview",
      when: "للتحرير اليدوي أو تعديل نتائج الوكلاء",
    },
    4: {
      input: "المطالبة المحررة",
      output: "تحليل جودة + اقتراحات تحسين + نسخة محسنة",
      when: "عندما تريد التأكد من جودة المطالبة قبل التشغيل",
    },
    5: {
      input: "المطالبة النهائية + Variables",
      output: "مخرجات النموذج + Latency + Token usage + حفظ Run",
      when: "لتنفيذ المطالبة والحصول على النتيجة",
    },
    6: {
      input: "المطالبة المكتملة + نتائج التشغيل",
      output: "Template محفوظ / JSON مصدّر",
      when: "لحفظ المطالبة للاستخدام المستقبلي أو المشاركة",
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="workflow-map-dialog">
        <DialogHeader>
          <DialogTitle>خريطة سير العمل - Prompt Engineering Studio</DialogTitle>
          <DialogDescription>
            دليل مفصل للمراحل السبع من إدخال الفكرة إلى الحفظ والتوزيع
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {stages.map((stageId) => {
            const stage = WORKFLOW_STAGES[stageId];
            const details = stageDetails[stageId];
            
            return (
              <div key={stageId} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {stageId}
                  </div>
                  <div>
                    <h3 className="font-semibold">{stage.title}</h3>
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                  </div>
                </div>
                
                <div className="mr-11 space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">المدخلات: </span>
                    <span>{details.input}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">المخرجات: </span>
                    <span>{details.output}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">متى تستخدمها: </span>
                    <span>{details.when}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">ملاحظات مهمة:</h4>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>يمكنك التنقل بين المراحل باستخدام الأزرار أو النقر على المرحلة في الجانب الأيسر</li>
            <li>يمكنك تخطي المراحل 0-2 والانتقال مباشرة للمرحلة 3 للتحرير اليدوي الكامل</li>
            <li>كل مرحلة لها CTA واحد واضح (زر أساسي) يوجهك للخطوة التالية</li>
            <li>المراحل تكتمل تلقائياً بناءً على الإجراءات التي تقوم بها</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
