import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Clock, Copy, Check } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export interface PromptHistoryItem {
  id: string;
  idea: string;
  sections?: {
    system: string;
    developer: string;
    user: string;
    context: string;
  };
  output?: string;
  timestamp: string;
  model?: string;
}

interface PromptHistoryProps {
  onLoad: (item: PromptHistoryItem) => void;
}

export function PromptHistory({ onLoad }: PromptHistoryProps) {
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('promptFullHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  const saveHistory = (items: PromptHistoryItem[]) => {
    setHistory(items);
    localStorage.setItem('promptFullHistory', JSON.stringify(items));
  };

  const deleteItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    saveHistory(updated);
  };

  const deleteAll = () => {
    if (confirm('هل تريد حذف جميع السجلات؟')) {
      saveHistory([]);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (history.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">لا توجد عمليات سابقة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          السجل ({history.length})
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={deleteAll}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-2">
          {history.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex-1 text-right">
                  <p className="font-medium text-sm">
                    {item.idea.substring(0, 60)}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.timestamp}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                {item.idea && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">الفكرة الأصلية:</p>
                    <p className="text-sm p-2 bg-muted/50 rounded">{item.idea}</p>
                  </div>
                )}

                {item.sections && (
                  <div className="space-y-2">
                    {item.sections.system && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">نظام:</p>
                        <p className="text-sm p-2 bg-muted/50 rounded line-clamp-2">
                          {item.sections.system}
                        </p>
                      </div>
                    )}
                    {item.sections.user && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">مستخدم:</p>
                        <p className="text-sm p-2 bg-muted/50 rounded line-clamp-2">
                          {item.sections.user}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {item.output && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">المخرجات:</p>
                    <p className="text-sm p-2 bg-green-950/20 rounded line-clamp-3">
                      {item.output}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onLoad(item)}
                    className="flex-1"
                  >
                    استخدام
                  </Button>
                  {item.output && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(item.output || '', item.id)}
                    >
                      {copied === item.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
