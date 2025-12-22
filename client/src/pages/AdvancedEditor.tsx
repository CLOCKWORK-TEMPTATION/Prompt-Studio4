import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit3, Play, Save, Settings, Variable, Code } from "lucide-react";

export default function AdvancedEditor() {
  const [prompt, setPrompt] = useState("");
  const [variables, setVariables] = useState<{ name: string; value: string; type: string }[]>([
    { name: "user_name", value: "أحمد", type: "string" },
    { name: "task_type", value: "تحليل", type: "string" }
  ]);

  const addVariable = () => {
    setVariables([...variables, { name: "", value: "", type: "string" }]);
  };

  const updateVariable = (index: number, field: string, value: string) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Edit3 className="size-8 text-primary" />
            المحرر المتقدم
          </h1>
          <p className="text-muted-foreground mt-2">
            محرر متقدم للموجهات مع دعم المتغيرات والقوالب المعقدة
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Save className="size-4 ml-2" />
            حفظ
          </Button>
          <Button size="sm">
            <Play className="size-4 ml-2" />
            تشغيل
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="size-5" />
                محرر الموجه
              </CardTitle>
              <CardDescription>
                اكتب موجهك هنا مع دعم المتغيرات باستخدام {"{variable_name}"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="مرحبًا {user_name}، أريد منك أن تقوم بـ {task_type} للنص التالي..."
                className="min-h-[300px] font-mono"
              />
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Variable className="size-4" />
                المتغيرات المتاحة: {variables.map(v => v.name).join(", ")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>معاينة الموجه</CardTitle>
              <CardDescription>
                معاينة الموجه بعد استبدال المتغيرات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg min-h-[150px] font-mono text-sm">
                {prompt ? (
                  variables.reduce((text, variable) => {
                    return text.replace(
                      new RegExp(`\\{${variable.name}\\}`, 'g'),
                      variable.value || `{${variable.name}}`
                    );
                  }, prompt)
                ) : (
                  <span className="text-muted-foreground">معاينة الموجه ستظهر هنا...</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Variable className="size-5" />
                إدارة المتغيرات
              </CardTitle>
              <CardDescription>
                تحديد قيم المتغيرات المستخدمة في الموجه
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {variables.map((variable, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">متغير {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariable(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      حذف
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="اسم المتغير"
                      value={variable.name}
                      onChange={(e) => updateVariable(index, "name", e.target.value)}
                    />
                    <Input
                      placeholder="القيمة"
                      value={variable.value}
                      onChange={(e) => updateVariable(index, "value", e.target.value)}
                    />
                    <select
                      className="w-full p-2 border rounded-md"
                      value={variable.type}
                      onChange={(e) => updateVariable(index, "type", e.target.value)}
                    >
                      <option value="string">نص</option>
                      <option value="number">رقم</option>
                      <option value="boolean">منطقي</option>
                    </select>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addVariable} className="w-full">
                إضافة متغير جديد
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5" />
                إعدادات النموذج
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>النموذج</Label>
                <select className="w-full p-2 border rounded-md mt-1">
                  <option>GPT-4</option>
                  <option>GPT-3.5 Turbo</option>
                  <option>Claude-3</option>
                </select>
              </div>
              <div>
                <Label>درجة الحرارة</Label>
                <Input type="number" min="0" max="2" step="0.1" defaultValue="0.7" className="mt-1" />
              </div>
              <div>
                <Label>الحد الأقصى للرموز</Label>
                <Input type="number" min="1" max="4000" defaultValue="1000" className="mt-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}