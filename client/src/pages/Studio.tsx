import { useState, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Save, Wand2, Plus, Trash2, Eye, LayoutTemplate, Copy, History, DollarSign, Zap, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockRun, mockCritique } from "@/lib/mock-api";
import { PromptSections, Variable, CritiqueResult, TokenEstimate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { calculateTokenEstimate, formatCost } from "@/lib/token-utils";
import { saveVersion, getVersionHistory, formatVersionTimestamp } from "@/lib/version-utils";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DEFAULT_SECTIONS: PromptSections = {
  system: "أنت مساعد ذكي ومفيد.",
  developer: "تجنب الإجابات الطويلة جداً.",
  user: "مرحباً، كيف حالك؟",
  context: ""
};

export default function Studio() {
  const [sections, setSections] = useState<PromptSections>(DEFAULT_SECTIONS);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [critique, setCritique] = useState<CritiqueResult | null>(null);
  const [output, setOutput] = useState("");
  const [settings, setSettings] = useState({ model: "gpt-4o", temperature: 0.7, maxTokens: 1000 });
  const [tokenEstimate, setTokenEstimate] = useState<TokenEstimate | null>(null);
  const [versionHistory, setVersionHistory] = useState(getVersionHistory());
  const [lastRunResult, setLastRunResult] = useState<any>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const { toast } = useToast();

  // Update token estimate when sections or settings change
  useEffect(() => {
    const estimate = calculateTokenEstimate(sections, settings.model, settings.maxTokens);
    setTokenEstimate(estimate);
  }, [sections, settings.model, settings.maxTokens]);

  const handleSectionChange = (section: keyof PromptSections, value: string) => {
    setSections(prev => ({ ...prev, [section]: value }));
  };

  const addVariable = () => {
    const id = Math.random().toString(36).substring(2, 7);
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
    try {
      const result = await mockRun(sections, variables, settings);
      setOutput(result.output);
      setLastRunResult(result);
      
      // Auto-save version after successful run
      saveVersion(sections, variables, `Run ${new Date().toLocaleTimeString('ar-EG')}`);
      setVersionHistory(getVersionHistory());
      
      toast({ 
        title: "تم التشغيل بنجاح", 
        description: `التكلفة: ${formatCost(result.cost || 0)} | الوقت: ${result.duration?.toFixed(1)}s` 
      });
    } catch (e) {
      toast({ title: "خطأ", description: "فشل الاتصال بالنموذج.", variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  const runCritique = async () => {
    setIsCritiquing(true);
    try {
      const result = await mockCritique(sections);
      setCritique(result);
      toast({ title: "تم التحليل", description: `النتيجة: ${result.score}/100` });
    } catch (e) {
      toast({ title: "خطأ", description: "فشل التحليل.", variant: "destructive" });
    } finally {
      setIsCritiquing(false);
    }
  };

  const getPreview = () => {
    let text = `${sections.system}\n\n${sections.developer}\n\n${sections.context}\n\n${sections.user}`;
    variables.forEach(v => {
      text = text.replace(new RegExp(`{{${v.name}}}`, 'g'), v.value || `{{${v.name}}}`);
    });
    return text;
  };

  const handleSaveVersion = () => {
    setShowSaveDialog(true);
  };

  const confirmSaveVersion = () => {
    saveVersion(sections, variables, versionLabel || undefined);
    setVersionHistory(getVersionHistory());
    setShowSaveDialog(false);
    setVersionLabel("");
    toast({ title: "تم الحفظ", description: "تم حفظ النسخة في السجل" });
  };

  const handleLoadVersion = (versionId: string) => {
    const version = versionHistory.find(v => v.id === versionId);
    if (version) {
      setSections(version.sections);
      setVariables(version.variables);
      toast({ title: "تم التحميل", description: "تم استرجاع النسخة" });
    }
  };

  const applyAutoFix = (issue: any) => {
    if (issue.section === "system" && !sections.system.length) {
      handleSectionChange("system", "أنت مساعد ذكي ومفيد متخصص في مساعدة المستخدمين.");
    } else if (issue.section === "developer" && issue.title.includes("تنسيق الإخراج")) {
      const current = sections.developer;
      handleSectionChange("developer", current + (current ? "\n" : "") + "قدم الإجابة بتنسيق واضح ومنظم.");
    }
    toast({ title: "تم التطبيق", description: "تم تطبيق الإصلاح التلقائي" });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Select value={settings.model} onValueChange={(v) => setSettings({ ...settings, model: v })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="اختر النموذج" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
              <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 border-r pr-4 mr-2">
            <span className="text-sm text-muted-foreground">Temp:</span>
            <Input 
              type="number" 
              className="w-16 h-8 text-xs" 
              value={settings.temperature} 
              onChange={e => setSettings({...settings, temperature: parseFloat(e.target.value)})}
              step={0.1} min={0} max={1}
            />
          </div>
          
          {/* Token Counter & Cost */}
          {tokenEstimate && (
            <div className="flex items-center gap-3 text-sm border-r pr-4">
              <div className="flex items-center gap-1.5">
                <Zap className="size-4 text-blue-500" />
                <span className="font-mono text-xs font-medium">{tokenEstimate.total}</span>
                <span className="text-xs text-muted-foreground">tokens</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="size-4 text-green-600" />
                <span className="font-mono text-xs font-medium text-green-600">
                  {formatCost(tokenEstimate.estimatedCost)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Version History */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="ml-2 size-4" />
                السجل ({versionHistory.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm mb-3">سجل الإصدارات</h4>
                <ScrollArea className="h-64">
                  {versionHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">لا يوجد إصدارات محفوظة</p>
                  ) : (
                    <div className="space-y-2">
                      {versionHistory.map((v) => (
                        <div 
                          key={v.id} 
                          className="p-2 border rounded hover:bg-muted/50 cursor-pointer text-sm"
                          onClick={() => handleLoadVersion(v.id)}
                        >
                          <div className="font-medium">{v.label || "بدون اسم"}</div>
                          <div className="text-xs text-muted-foreground">{formatVersionTimestamp(v.timestamp)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="sm" onClick={runCritique} disabled={isCritiquing}>
            <Wand2 className="ml-2 size-4" />
            {isCritiquing ? "جاري التحليل..." : "نقد (Critique)"}
          </Button>
          <Button size="sm" onClick={runPrompt} disabled={isRunning} className="bg-primary hover:bg-primary/90">
            <Play className="ml-2 size-4" />
            {isRunning ? "جاري التشغيل..." : "تشغيل (Run)"}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSaveVersion}>
            <Save className="size-4" />
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
                  />
                </TabsContent>
              ))}

              <TabsContent value="variables" className="h-full mt-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">المتغيرات</h3>
                    <Button onClick={addVariable} size="sm" variant="outline"><Plus className="size-4 ml-2" /> إضافة متغير</Button>
                  </div>
                  {variables.length === 0 && (
                    <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                      لا يوجد متغيرات. أضف متغير لاستخدامه بصيغة {'{{var}}'}
                    </div>
                  )}
                  <div className="space-y-3">
                    {variables.map((v) => (
                      <div key={v.id} className="flex gap-2 items-start bg-card border rounded-md p-3">
                        <div className="space-y-2 flex-1">
                          <Input 
                            placeholder="اسم المتغير (بدون أقواس)" 
                            value={v.name} 
                            onChange={(e) => updateVariable(v.id, 'name', e.target.value)}
                            className="font-mono text-sm h-8"
                          />
                          <Textarea 
                            placeholder="القيمة الافتراضية" 
                            value={v.value} 
                            onChange={(e) => updateVariable(v.id, 'value', e.target.value)}
                            className="text-sm min-h-[60px]"
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeVariable(v.id)}>
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
              {critique && <span className="text-xs font-bold text-orange-600 px-2">Score: {critique.score}</span>}
            </div>

            <TabsContent value="preview" className="flex-1 p-0 m-0 overflow-hidden">
               <ScrollArea className="h-full p-4">
                 <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border">
                   {getPreview()}
                 </pre>
               </ScrollArea>
            </TabsContent>

            <TabsContent value="output" className="flex-1 p-0 m-0 overflow-hidden bg-zinc-950 text-zinc-100">
               {output ? (
                 <div className="h-full flex flex-col">
                   {/* Run Stats */}
                   {lastRunResult && (
                     <div className="border-b border-zinc-800 px-4 py-2 bg-zinc-900/50 flex items-center gap-4 text-xs">
                       <div className="flex items-center gap-1.5">
                         <Zap className="size-3 text-blue-400" />
                         <span className="text-zinc-400">Tokens:</span>
                         <span className="font-mono text-blue-400">{lastRunResult.tokens?.total || 0}</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <DollarSign className="size-3 text-green-400" />
                         <span className="text-zinc-400">Cost:</span>
                         <span className="font-mono text-green-400">{formatCost(lastRunResult.cost || 0)}</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <span className="text-zinc-400">⏱️ Duration:</span>
                         <span className="font-mono text-zinc-300">{lastRunResult.duration?.toFixed(2)}s</span>
                       </div>
                       <div className="ml-auto">
                         <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                           {settings.model}
                         </Badge>
                       </div>
                     </div>
                   )}
                   <ScrollArea className="flex-1 p-6">
                     <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                       {output}
                     </div>
                   </ScrollArea>
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                   <Play className="size-12 mb-4 opacity-20" />
                   <p>اضغط "تشغيل" لرؤية النتيجة</p>
                 </div>
               )}
            </TabsContent>

            <TabsContent value="critique" className="flex-1 p-0 m-0 overflow-hidden bg-orange-50/50">
               {critique ? (
                 <ScrollArea className="h-full p-6">
                   <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">تحليل الجودة</h3>
                        <div className={cn("px-3 py-1 rounded-full text-sm font-bold", 
                          critique.score > 80 ? "bg-green-100 text-green-700" : 
                          critique.score > 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                        )}>
                          {critique.score}/100
                        </div>
                     </div>
                     
                     {/* Metrics */}
                     {critique.metrics && (
                       <div className="grid grid-cols-2 gap-3 bg-white border rounded-lg p-4">
                         <div className="space-y-1">
                           <div className="text-xs text-muted-foreground">الوضوح (Clarity)</div>
                           <div className="flex items-center gap-2">
                             <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                               <div 
                                 className={cn("h-full transition-all", 
                                   critique.metrics.clarity > 80 ? "bg-green-500" : "bg-yellow-500"
                                 )}
                                 style={{ width: `${critique.metrics.clarity}%` }}
                               />
                             </div>
                             <span className="text-xs font-bold">{critique.metrics.clarity}</span>
                           </div>
                         </div>
                         
                         <div className="space-y-1">
                           <div className="text-xs text-muted-foreground">التحديد (Specificity)</div>
                           <div className="flex items-center gap-2">
                             <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                               <div 
                                 className={cn("h-full transition-all", 
                                   critique.metrics.specificity > 80 ? "bg-green-500" : "bg-yellow-500"
                                 )}
                                 style={{ width: `${critique.metrics.specificity}%` }}
                               />
                             </div>
                             <span className="text-xs font-bold">{critique.metrics.specificity}</span>
                           </div>
                         </div>
                         
                         <div className="space-y-1">
                           <div className="text-xs text-muted-foreground">البنية (Structure)</div>
                           <div className="flex items-center gap-2">
                             <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                               <div 
                                 className={cn("h-full transition-all", 
                                   critique.metrics.structure > 80 ? "bg-green-500" : "bg-yellow-500"
                                 )}
                                 style={{ width: `${critique.metrics.structure}%` }}
                               />
                             </div>
                             <span className="text-xs font-bold">{critique.metrics.structure}</span>
                           </div>
                         </div>
                         
                         <div className="space-y-1">
                           <div className="text-xs text-muted-foreground">الأمثلة (Examples)</div>
                           <div className="flex items-center gap-2">
                             <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                               <div 
                                 className={cn("h-full transition-all", 
                                   critique.metrics.examples > 80 ? "bg-green-500" : "bg-yellow-500"
                                 )}
                                 style={{ width: `${critique.metrics.examples}%` }}
                               />
                             </div>
                             <span className="text-xs font-bold">{critique.metrics.examples}</span>
                           </div>
                         </div>
                       </div>
                     )}
                     
                     <div className="space-y-3">
                       {critique.issues.map((issue, idx) => (
                         <div key={idx} className="bg-white border border-orange-200 rounded-lg p-4 shadow-sm">
                           <div className="flex items-start gap-3">
                             <div className={cn("size-2 mt-2 rounded-full shrink-0", 
                               issue.severity === 'high' ? 'bg-red-500' : 
                               issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                             )} />
                             <div className="flex-1">
                               <h4 className="font-semibold text-sm">{issue.title}</h4>
                               <p className="text-xs text-muted-foreground mt-1">المكان: {issue.section}</p>
                               <p className="text-sm mt-2 text-zinc-700">{issue.fix}</p>
                               <div className="flex gap-2 mt-3">
                                 {issue.autoFixable && (
                                   <Button 
                                     size="sm" 
                                     variant="outline" 
                                     className="text-xs h-7 border-green-200 hover:bg-green-50 text-green-700"
                                     onClick={() => applyAutoFix(issue)}
                                   >
                                     <CheckCircle2 className="size-3 ml-1" />
                                     تطبيق تلقائي
                                   </Button>
                                 )}
                                 <Button size="sm" variant="outline" className="text-xs h-7 border-orange-200 hover:bg-orange-50 text-orange-700">
                                   تطبيق يدوياً
                                 </Button>
                               </div>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>

                     {critique.improvements.length > 0 && (
                       <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                         <h4 className="font-semibold text-blue-800 text-sm mb-2">مقترحات تحسين عامة</h4>
                         <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                           {critique.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                         </ul>
                       </div>
                     )}
                   </div>
                 </ScrollArea>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                   <Wand2 className="size-12 mb-4 opacity-20" />
                   <p>اضغط "نقد" لتحليل المطالبة</p>
                 </div>
               )}
            </TabsContent>
           </Tabs>
        </ResizablePanel>

      </ResizablePanelGroup>

      {/* Save Version Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>حفظ نسخة جديدة</DialogTitle>
            <DialogDescription>
              أدخل اسماً لهذه النسخة (اختياري)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="مثال: نسخة محسّنة 1"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmSaveVersion();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={confirmSaveVersion}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
