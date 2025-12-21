import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Save, Wand2, Plus, Trash2, Eye, LayoutTemplate, Copy, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { aiApi } from "@/lib/api";
import { PromptSections, Variable, CritiqueResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEFAULT_SECTIONS: PromptSections = {
  system: "أنت مساعد ذكي ومفيد.",
  developer: "تجنب الإجابات الطويلة جداً.",
  user: "مرحباً، كيف حالك؟",
  context: ""
};

const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B" },
];

export default function Studio() {
  const [sections, setSections] = useState<PromptSections>(DEFAULT_SECTIONS);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [critique, setCritique] = useState<CritiqueResult | null>(null);
  const [output, setOutput] = useState("");
  const [latency, setLatency] = useState<number | null>(null);
  const [tokenUsage, setTokenUsage] = useState<{ prompt: number; completion: number; total: number } | null>(null);
  const [settings, setSettings] = useState({ model: "llama-3.3-70b-versatile", temperature: 0.7, maxTokens: 1000 });
  const { toast } = useToast();

  const handleSectionChange = (section: keyof PromptSections, value: string) => {
    setSections(prev => ({ ...prev, [section]: value }));
  };

  const addVariable = () => {
    const id = Math.random().toString(36).substr(2, 5);
    setVariables([...variables, { id, name: `var_${variables.length + 1}`, value: "" }]);
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  const updateVariable = (id: string, field: keyof Variable, value: string) => {
    setVariables(variables.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const runPrompt = async () => {
    setIsRunning(true);
    setOutput("");
    setLatency(null);
    setTokenUsage(null);
    try {
      const result = await aiApi.run(sections, variables, settings);
      setOutput(result.output);
      setLatency(result.latency);
      if (result.tokenUsage) {
        setTokenUsage(result.tokenUsage);
      }
      toast({ title: "تم التشغيل بنجاح", description: `الوقت: ${result.latency}ms` });
    } catch (e) {
      const error = e instanceof Error ? e.message : "فشل الاتصال بالنموذج";
      toast({ title: "خطأ", description: error, variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  const runCritique = async () => {
    setIsCritiquing(true);
    try {
      const result = await aiApi.critique(sections);
      setCritique(result);
      toast({ title: "تم التحليل", description: `النتيجة: ${result.score}/100` });
    } catch (e) {
      const error = e instanceof Error ? e.message : "فشل التحليل";
      toast({ title: "خطأ", description: error, variant: "destructive" });
    } finally {
      setIsCritiquing(false);
    }
  };

  const applyRewrite = () => {
    if (critique?.rewrittenPrompt) {
      try {
        const rewritten = JSON.parse(critique.rewrittenPrompt);
        setSections({
          system: rewritten.system || sections.system,
          developer: rewritten.developer || sections.developer,
          user: rewritten.user || sections.user,
          context: rewritten.context || sections.context,
        });
        toast({ title: "تم التطبيق", description: "تم تطبيق النسخة المحسنة" });
      } catch {
        toast({ title: "خطأ", description: "فشل تطبيق النسخة المحسنة", variant: "destructive" });
      }
    }
  };

  const getPreview = () => {
    let text = `${sections.system}\n\n${sections.developer}\n\n${sections.context}\n\n${sections.user}`;
    variables.forEach(v => {
      text = text.replace(new RegExp(`{{${v.name}}}`, 'g'), v.value || `{{${v.name}}}`);
    });
    return text;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error": return <AlertCircle className="size-4 text-red-500" />;
      case "warning": return <AlertCircle className="size-4 text-yellow-500" />;
      default: return <Info className="size-4 text-blue-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Select value={settings.model} onValueChange={(v) => setSettings({ ...settings, model: v })}>
            <SelectTrigger className="w-[200px]" data-testid="select-model">
              <SelectValue placeholder="اختر النموذج" />
            </SelectTrigger>
            <SelectContent>
              {GROQ_MODELS.map(model => (
                <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 border-r pr-4 mr-2">
            <span className="text-sm text-muted-foreground">Temp:</span>
            <Input 
              type="number" 
              className="w-16 h-8 text-xs" 
              value={settings.temperature} 
              onChange={e => setSettings({...settings, temperature: parseFloat(e.target.value)})}
              step={0.1} min={0} max={2}
              data-testid="input-temperature"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={runCritique} disabled={isCritiquing} data-testid="button-critique">
            <Wand2 className="ml-2 size-4" />
            {isCritiquing ? "جاري التحليل..." : "نقد (Critique)"}
          </Button>
          <Button size="sm" onClick={runPrompt} disabled={isRunning} className="bg-primary hover:bg-primary/90" data-testid="button-run">
            <Play className="ml-2 size-4" />
            {isRunning ? "جاري التشغيل..." : "تشغيل (Run)"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* Editor Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <Tabs defaultValue="system" className="h-full flex flex-col">
            <div className="border-b px-4 bg-muted/20">
              <TabsList className="bg-transparent h-10 w-full justify-start gap-4">
                <TabsTrigger value="system" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">System</TabsTrigger>
                <TabsTrigger value="developer" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Developer</TabsTrigger>
                <TabsTrigger value="user" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">User</TabsTrigger>
                <TabsTrigger value="context" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Context</TabsTrigger>
                <TabsTrigger value="variables" className="mr-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                   المتغيرات ({variables.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 p-4 bg-background">
              {(['system', 'developer', 'user', 'context'] as const).map(section => (
                <TabsContent key={section} value={section} className="h-full mt-0">
                  <Textarea 
                    className="h-full resize-none font-mono text-sm leading-relaxed border-0 focus-visible:ring-0 p-0"
                    placeholder={`اكتب تعليمات الـ ${section} هنا...`}
                    value={sections[section]}
                    onChange={(e) => handleSectionChange(section, e.target.value)}
                    data-testid={`textarea-${section}`}
                  />
                </TabsContent>
              ))}

              <TabsContent value="variables" className="h-full mt-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">المتغيرات</h3>
                    <Button onClick={addVariable} size="sm" variant="outline" data-testid="button-add-variable">
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
                            onChange={(e) => updateVariable(v.id, 'name', e.target.value)}
                            className="font-mono text-sm h-8"
                            data-testid={`input-variable-name-${v.id}`}
                          />
                          <Textarea 
                            placeholder="القيمة الافتراضية" 
                            value={v.value} 
                            onChange={(e) => updateVariable(v.id, 'value', e.target.value)}
                            className="text-sm min-h-[60px]"
                            data-testid={`textarea-variable-value-${v.id}`}
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeVariable(v.id)} data-testid={`button-remove-variable-${v.id}`}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Output/Critique Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
           <Tabs defaultValue="preview" className="h-full flex flex-col">
            <div className="border-b px-4 bg-muted/20 flex items-center justify-between">
              <TabsList className="bg-transparent h-10 justify-start gap-4">
                <TabsTrigger value="preview"><Eye className="ml-2 size-3" /> معاينة</TabsTrigger>
                <TabsTrigger value="output" className="data-[state=active]:text-green-600"><LayoutTemplate className="ml-2 size-3" /> المخرجات</TabsTrigger>
                <TabsTrigger value="critique" className={cn(critique ? "text-orange-600" : "")}><Wand2 className="ml-2 size-3" /> النقد والتحسين</TabsTrigger>
              </TabsList>
              {critique && <span className="text-xs font-bold text-orange-600 px-2" data-testid="text-critique-score">Score: {critique.score}</span>}
            </div>

            <TabsContent value="preview" className="flex-1 p-0 m-0 overflow-hidden">
               <ScrollArea className="h-full p-4">
                 <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border" data-testid="text-preview">
                   {getPreview()}
                 </pre>
               </ScrollArea>
            </TabsContent>

            <TabsContent value="output" className="flex-1 p-0 m-0 overflow-hidden bg-zinc-950 text-zinc-100">
               {output ? (
                 <ScrollArea className="h-full p-6">
                   {(latency || tokenUsage) && (
                     <div className="flex gap-4 mb-4 text-xs text-zinc-400">
                       {latency && <span>الوقت: {latency}ms</span>}
                       {tokenUsage && <span>Tokens: {tokenUsage.total}</span>}
                     </div>
                   )}
                   <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap" data-testid="text-output">
                     {output}
                   </div>
                 </ScrollArea>
               ) : (
                 <div className="h-full flex items-center justify-center text-zinc-500">
                   <div className="text-center">
                     <LayoutTemplate className="size-16 mb-4 opacity-50 mx-auto" />
                     <p>اضغط على "تشغيل" لعرض الناتج هنا</p>
                   </div>
                 </div>
               )}
            </TabsContent>

            <TabsContent value="critique" className="flex-1 p-0 m-0 overflow-hidden">
              {critique ? (
                <ScrollArea className="h-full p-6">
                  <div className="space-y-6">
                    {/* Score */}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "text-4xl font-bold",
                        critique.score >= 80 ? "text-green-500" :
                        critique.score >= 60 ? "text-yellow-500" :
                        "text-red-500"
                      )}>
                        {critique.score}
                      </div>
                      <div className="text-muted-foreground">/ 100</div>
                    </div>

                    {/* Reasoning */}
                    {critique.reasoning && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">التحليل:</h4>
                        <p className="text-sm text-muted-foreground">{critique.reasoning}</p>
                      </div>
                    )}

                    {/* Issues */}
                    {critique.issues.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">المشاكل المكتشفة:</h4>
                        {critique.issues.map((issue, i) => (
                          <div key={i} className="flex gap-3 p-3 border rounded-lg bg-card" data-testid={`issue-${i}`}>
                            {getSeverityIcon(issue.severity)}
                            <div className="flex-1">
                              <p className="text-sm">{issue.message}</p>
                              {issue.suggestion && (
                                <p className="text-xs text-muted-foreground mt-1">اقتراح: {issue.suggestion}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Apply Rewrite Button */}
                    {critique.rewrittenPrompt && (
                      <Button onClick={applyRewrite} className="w-full" variant="secondary" data-testid="button-apply-rewrite">
                        <CheckCircle2 className="ml-2 size-4" />
                        تطبيق النسخة المحسنة
                      </Button>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Wand2 className="size-16 mb-4 opacity-50 mx-auto" />
                    <p>اضغط على "نقد" لتحليل المطالبة</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
