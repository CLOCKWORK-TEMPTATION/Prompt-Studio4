import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  sections: {
    system: string;
    developer: string;
    user: string;
    context: string;
  };
  variables?: string[];
  tags?: string[];
}

interface TemplatePreviewProps {
  template: Template;
  onUse: (template: Template) => void;
}

export function TemplatePreview({ template, onUse }: TemplatePreviewProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopySection = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: "فشل النسخ", variant: "destructive" });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="w-4 h-4" />
          معاينة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template.name}
            <Badge variant="outline">{template.category}</Badge>
          </DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sections" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="sections">الأقسام</TabsTrigger>
            <TabsTrigger value="variables">المتغيرات</TabsTrigger>
            <TabsTrigger value="full">المعاينة الكاملة</TabsTrigger>
          </TabsList>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-4">
            {Object.entries(template.sections).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm capitalize">{key}</h4>
                  <Button
                    onClick={() => handleCopySection(value)}
                    variant="ghost"
                    size="sm"
                    className="h-6"
                  >
                    {copied ? (
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
                <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {value}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Variables Tab */}
          <TabsContent value="variables" className="space-y-4">
            {template.variables && template.variables.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  هذا القالب يحتوي على {template.variables.length} متغيرات:
                </p>
                <div className="flex flex-wrap gap-2">
                  {template.variables.map((variable, idx) => (
                    <Badge key={idx} variant="secondary">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
                {template.tags && template.tags.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">العلامات:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد متغيرات في هذا القالب</p>
            )}
          </TabsContent>

          {/* Full Preview Tab */}
          <TabsContent value="full" className="space-y-4">
            <div className="bg-muted p-4 rounded text-sm whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
              <div className="space-y-2">
                <div>
                  <strong className="block mb-1">System:</strong>
                  <div className="ml-4">{template.sections.system}</div>
                </div>
                <div>
                  <strong className="block mb-1">Developer:</strong>
                  <div className="ml-4">{template.sections.developer}</div>
                </div>
                {template.sections.context && (
                  <div>
                    <strong className="block mb-1">Context:</strong>
                    <div className="ml-4">{template.sections.context}</div>
                  </div>
                )}
                <div>
                  <strong className="block mb-1">User:</strong>
                  <div className="ml-4">{template.sections.user}</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={() => {
              onUse(template);
              window.location.href = '/studio';
            }}
            className="flex-1"
          >
            استخدام هذا القالب
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
