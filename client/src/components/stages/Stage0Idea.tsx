import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Zap, History, BookOpen, Copy, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { promptEnhancementApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface HistoryItem {
  id: string;
  idea: string;
  timestamp: string;
}

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

const SUGGESTIONS = [
  'كتابة مقال عن الذكاء الاصطناعي',
  'إنشاء خطة تسويقية للمنتجات',
  'توليد أفكار إبداعية للمشاريع',
  'تحليل نقاط القوة والضعف',
  'كتابة كود برمجي احترافي',
  'إنشاء سيرة ذاتية احترافية',
];

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
  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedIdea, setEnhancedIdea] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);

  // تحميل السجل من localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ideaHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }

    // تحميل القالب من sessionStorage إذا كان موجوداً
    const template = sessionStorage.getItem('selectedTemplate');
    if (template) {
      try {
        const parsedTemplate = JSON.parse(template);
        const templateIdea = sessionStorage.getItem('templateIdea') || '';
        
        // ملء جميع الحقول من بيانات القالب
        onRawIdeaChange(templateIdea);
        onGoalChange(parsedTemplate.sections?.system || '');
        onConstraintsChange(parsedTemplate.sections?.developer || '');
        onOutputFormatChange(parsedTemplate.sections?.context || '');
        
        // تنظيف sessionStorage
        sessionStorage.removeItem('selectedTemplate');
        sessionStorage.removeItem('templateIdea');
        
        toast({ 
          title: "تم تحميل القالب", 
          description: "تم ملء جميع الحقول من القالب المختار بنجاح ✅" 
        });
      } catch (e) {
        console.error('Failed to load template:', e);
      }
    }
  }, []);

  // حفظ السجل في localStorage
  const saveToHistory = (idea: string) => {
    const newItem = {
      id: Date.now().toString(),
      idea,
      timestamp: new Date().toLocaleString('ar-EG'),
    };
    const updated = [newItem, ...history.slice(0, 9)];
    setHistory(updated);
    localStorage.setItem('ideaHistory', JSON.stringify(updated));
  };

  // تحسين الفكرة باستخدام AI
  const handleEnhance = async () => {
    if (!rawIdea.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال فكرة أولاً",
        variant: "destructive"
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const result = await promptEnhancementApi.enhance(rawIdea, goal || '');
      setEnhancedIdea(result.enhanced);
      toast({
        title: "تم التحسين بنجاح",
        description: `تم تحسين الفكرة بـ ${result.latency}ms`
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحسين الفكرة",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // استخدام الفكرة المحسّنة
  const handleUseEnhanced = () => {
    if (enhancedIdea) {
      onRawIdeaChange(enhancedIdea);
      saveToHistory(enhancedIdea);
      setEnhancedIdea("");
      toast({
        title: "تم",
        description: "تم استخدام الفكرة المحسّنة"
      });
    }
  };

  // نسخ النص
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // استخدام اقتراح
  const handleUseSuggestion = (suggestion: string) => {
    onRawIdeaChange(suggestion);
    saveToHistory(suggestion);
  };

  // استخدام من السجل
  const handleUseFromHistory = (item: HistoryItem) => {
    onRawIdeaChange(item.idea);
  };

  return (
    <div className="space-y-4" data-testid="stage-0-idea">
      {/* Suggestions */}
      {history.length === 0 && (
        <Card className="bg-gradient-to-r from-blue-950/50 to-purple-950/50 border-blue-800/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-300 mb-2">اقتراحات سريعة</h3>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUseSuggestion(suggestion)}
                      className="text-xs bg-blue-900/40 hover:bg-blue-800/60 text-blue-100"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Card */}
      <Card>
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

          {/* Enhanced Idea Preview */}
          {enhancedIdea && (
            <div className="bg-green-950/30 border border-green-800/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-green-300">✨ الفكرة المحسّنة</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(enhancedIdea)}
                  className="h-7 text-xs"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-green-100 whitespace-pre-wrap">{enhancedIdea}</p>
              <Button
                onClick={handleUseEnhanced}
                size="sm"
                className="w-full bg-green-700 hover:bg-green-600"
              >
                استخدام الفكرة المحسّنة
              </Button>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t flex-col sm:flex-row">
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
              onClick={handleEnhance}
              disabled={!isReady || isEnhancing}
              variant="secondary"
              size="lg"
              className="flex-1"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="ml-2 size-5 animate-spin" />
                  جاري التحسين...
                </>
              ) : (
                <>
                  <Zap className="ml-2 size-5" />
                  تحسين الفكرة بـ AI
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onSkipToManual}
              size="lg"
            >
              تحرير يدوي
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Accordion */}
      {history.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="history">
            <AccordionTrigger className="text-sm hover:no-underline">
              <History className="w-4 h-4 mr-2" />
              السجل ({history.length})
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer group"
                  onClick={() => handleUseFromHistory(item)}
                >
                  <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {item.idea.substring(0, 80)}...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.timestamp}</p>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}

