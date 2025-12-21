import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface Stage0IdeaProps {
  rawIdea: string;
  goal: string;
  constraints: string;
  outputFormat: string;
  onRawIdeaChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onConstraintsChange: (value: string) => void;
  onOutputFormatChange: (value: string) => void;
  onStartCompose: () => void;
  onSkipToManual: () => void;
}

export function Stage0Idea({
  rawIdea,
  goal,
  constraints,
  outputFormat,
  onRawIdeaChange,
  onGoalChange,
  onConstraintsChange,
  onOutputFormatChange,
  onStartCompose,
  onSkipToManual,
}: Stage0IdeaProps) {
  const isReady = rawIdea.trim().length > 0;

  return (
    <Card data-testid="stage-0-idea">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              الفكرة / المهمة / الهدف *
            </label>
            <Textarea
              placeholder="مثال: أريد بوت يساعد المستخدمين في كتابة السيرة الذاتية بطريقة احترافية..."
              value={rawIdea}
              onChange={(e) => onRawIdeaChange(e.target.value)}
              className="min-h-[150px] text-base"
              data-testid="textarea-raw-idea"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">
                الهدف النهائي (اختياري)
              </label>
              <Input
                placeholder="مثال: توليد سيرة ذاتية بصيغة PDF"
                value={goal}
                onChange={(e) => onGoalChange(e.target.value)}
                data-testid="input-goal"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">
                القيود (اختياري)
              </label>
              <Input
                placeholder="مثال: أقل من 500 كلمة"
                value={constraints}
                onChange={(e) => onConstraintsChange(e.target.value)}
                data-testid="input-constraints"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">
                شكل المخرجات (اختياري)
              </label>
              <Input
                placeholder="مثال: JSON, Markdown"
                value={outputFormat}
                onChange={(e) => onOutputFormatChange(e.target.value)}
                data-testid="input-output-format"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={onStartCompose}
            disabled={!isReady}
            className="flex-1"
            size="lg"
            data-testid="button-start-compose"
          >
            <Sparkles className="ml-2 size-5" />
            ابدأ التحويل عبر 3 وكلاء
          </Button>
          <Button
            variant="outline"
            onClick={onSkipToManual}
            data-testid="button-skip-to-manual"
          >
            تحرير يدوي بالكامل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
