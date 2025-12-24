import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Check, RotateCcw, Copy } from "lucide-react";
import { PromptSections, Variable } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { CopyButton } from "@/components/CopyButton";

interface Stage3EditProps {
  sections: PromptSections;
  variables: Variable[];
  committedSections?: PromptSections;
  committedVariables?: Variable[];
  onSectionChange: (section: keyof PromptSections, value: string) => void;
  onAddVariable: () => void;
  onRemoveVariable: (id: string) => void;
  onUpdateVariable: (id: string, field: keyof Variable, value: string) => void;
  onApplyChanges?: () => void;
  onResetToAgents?: () => void;
}

export function Stage3Edit({
  sections,
  variables,
  committedSections,
  committedVariables,
  onSectionChange,
  onAddVariable,
  onRemoveVariable,
  onUpdateVariable,
  onApplyChanges,
  onResetToAgents,
}: Stage3EditProps) {
  const { toast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!committedSections) {
      setHasUnsavedChanges(false);
      return;
    }

    const changed =
      sections.system !== committedSections.system ||
      sections.developer !== committedSections.developer ||
      sections.user !== committedSections.user ||
      sections.context !== committedSections.context ||
      JSON.stringify(variables) !== JSON.stringify(committedVariables);

    setHasUnsavedChanges(changed);
  }, [sections, variables, committedSections, committedVariables]);

  const handleApply = () => {
    if (onApplyChanges) {
      onApplyChanges();
      toast({
        title: "تم تطبيق التعديلات",
        description: "تم حفظ التعديلات بنجاح",
      });
    }
  };

  const handleReset = () => {
    if (onResetToAgents) {
      onResetToAgents();
      toast({
        title: "تم إعادة الضبط",
        description: "تم إعادة الضبط إلى ناتج الوكلاء الأصلي",
      });
    }
  };

  const getPreview = () => {
    let text = `${sections.system}\n\n${sections.developer}\n\n${sections.context}\n\n${sections.user}`;
    variables.forEach(v => {
      text = text.replace(new RegExp(`{{${v.name}}}`, 'g'), v.value || `{{${v.name}}}`);
    });
    return text;
  };

  const handleCopyField = async (field: keyof PromptSections, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast({ title: "تم النسخ" });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({ title: "فشل النسخ", variant: "destructive" });
    }
  };

  return (
    <Card data-testid="stage-3-edit">
      <CardContent className="p-6">
        {/* Apply/Reset Buttons */}
        {committedSections && (
          <div className="flex gap-2 mb-4 pb-4 border-b">
            <Button
              onClick={handleApply}
              disabled={!hasUnsavedChanges}
              variant="default"
              size="sm"
              data-testid="button-apply-changes"
            >
              <Check className="ml-2 size-4" />
              تطبيق التعديلات
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              data-testid="button-reset-to-agents"
            >
              <RotateCcw className="ml-2 size-4" />
              إعادة ضبط إلى ناتج الوكلاء
            </Button>
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 flex items-center mr-2">
                • لديك تعديلات غير محفوظة
              </span>
            )}
          </div>
        )}

        <Tabs defaultValue="system" className="w-full">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="developer">Developer</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="context">Context</TabsTrigger>
            <TabsTrigger value="variables">المتغيرات ({variables.length})</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {(['system', 'developer', 'user', 'context'] as const).map(section => (
            <TabsContent key={section} value={section} className="space-y-2">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-sm font-medium">{section}</label>
                <Button
                  onClick={() => handleCopyField(section, sections[section])}
                  variant="ghost"
                  size="sm"
                  className="h-6"
                >
                  {copiedField === section ? (
                    <>
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600 ml-1">تم</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-xs ml-1">نسخ</span>
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                className="min-h-[300px] font-mono text-sm"
                placeholder={`اكتب تعليمات الـ ${section} هنا...`}
                value={sections[section]}
                onChange={(e) => onSectionChange(section, e.target.value)}
                data-testid={`textarea-${section}`}
              />
            </TabsContent>
          ))}

          <TabsContent value="variables" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">المتغيرات</h4>
              <Button onClick={onAddVariable} size="sm" variant="outline" data-testid="button-add-variable">
                <Plus className="size-4 ml-2" /> إضافة متغير
              </Button>
            </div>
            {variables.length === 0 && (
              <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                لا يوجد متغيرات. أضف متغير لاستخدامه بصيغة {'{{var}}'}
              </div>
            )}
            <div className="space-y-3">
              {variables.map((v) => (
                <div key={v.id} className="flex gap-2 items-start bg-card border rounded-md p-3" data-testid={`variable-${v.id}`}>
                  <div className="space-y-2 flex-1">
                    <Input
                      placeholder="اسم المتغير (بدون أقواس)"
                      value={v.name}
                      onChange={(e) => onUpdateVariable(v.id, 'name', e.target.value)}
                      className="font-mono text-sm"
                      data-testid={`input-variable-name-${v.id}`}
                    />
                    <Textarea
                      placeholder="القيمة الافتراضية"
                      value={v.value}
                      onChange={(e) => onUpdateVariable(v.id, 'value', e.target.value)}
                      className="text-sm min-h-[60px]"
                      data-testid={`input-variable-value-${v.id}`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveVariable(v.id)}
                    className="shrink-0"
                    data-testid={`button-remove-variable-${v.id}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="flex justify-end mb-2">
              <CopyButton text={getPreview()} label="نسخ المعاينة" />
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border min-h-[300px]">
              <pre className="whitespace-pre-wrap text-sm font-mono" data-testid="preview-text">
                {getPreview()}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
