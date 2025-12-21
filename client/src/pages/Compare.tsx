import { useState, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, ArrowLeftRight, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockRun } from "@/lib/mock-api";
import { PromptSections, Variable } from "@/lib/types";
import { cn } from "@/lib/utils";
import { calculateTokenEstimate, formatCost } from "@/lib/token-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DEFAULT_SECTIONS: PromptSections = {
  system: "أنت مساعد ذكي ومفيد.",
  developer: "",
  user: "مرحباً، كيف حالك؟",
  context: ""
};

export default function Compare() {
  const [promptA, setPromptA] = useState<PromptSections>(DEFAULT_SECTIONS);
  const [promptB, setPromptB] = useState<PromptSections>(DEFAULT_SECTIONS);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [settings, setSettings] = useState({ model: "gpt-4o", temperature: 0.7, maxTokens: 1000 });
  
  const [isRunningA, setIsRunningA] = useState(false);
  const [isRunningB, setIsRunningB] = useState(false);
  const [resultA, setResultA] = useState<any>(null);
  const [resultB, setResultB] = useState<any>(null);
  
  const { toast } = useToast();

  const runPrompt = async (prompt: PromptSections, setRunning: (v: boolean) => void, setResult: (v: any) => void) => {
    setRunning(true);
    try {
      const result = await mockRun(prompt, variables, settings);
      setResult(result);
    } catch (e) {
      toast({ title: "خطأ", description: "فشل التشغيل", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const runBoth = async () => {
    await Promise.all([
      runPrompt(promptA, setIsRunningA, setResultA),
      runPrompt(promptB, setIsRunningB, setResultB)
    ]);
    toast({ title: "تم التشغيل", description: "تم تشغيل كلا الإصدارين بنجاح" });
  };

  const handleSectionChange = (side: 'A' | 'B', section: keyof PromptSections, value: string) => {
    if (side === 'A') {
      setPromptA(prev => ({ ...prev, [section]: value }));
    } else {
      setPromptB(prev => ({ ...prev, [section]: value }));
    }
  };

  const getWinner = () => {
    if (!resultA || !resultB) return null;
    
    // Compare based on tokens, cost, and length
    const scoreA = {
      tokens: resultA.tokens?.total || 0,
      cost: resultA.cost || 0,
      outputLength: resultA.output.length
    };
    
    const scoreB = {
      tokens: resultB.tokens?.total || 0,
      cost: resultB.cost || 0,
      outputLength: resultB.output.length
    };
    
    // Lower cost and tokens is better, longer output might be better depending on use case
    const costEfficiencyA = scoreA.outputLength / Math.max(scoreA.cost * 1000, 1);
    const costEfficiencyB = scoreB.outputLength / Math.max(scoreB.cost * 1000, 1);
    
    return costEfficiencyA > costEfficiencyB ? 'A' : 'B';
  };

  const winner = getWinner();

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ArrowLeftRight className="size-5" />
            مقارنة A/B
          </h2>
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
        </div>

        <Button size="sm" onClick={runBoth} disabled={isRunningA || isRunningB}>
          <Play className="ml-2 size-4" />
          {(isRunningA || isRunningB) ? "جاري التشغيل..." : "تشغيل كلاهما"}
        </Button>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* Prompt A */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col border-r">
            <div className="h-12 border-b flex items-center justify-between px-4 bg-blue-50">
              <span className="font-semibold flex items-center gap-2">
                الإصدار A
                {winner === 'A' && <Badge className="bg-green-600">فائز 🏆</Badge>}
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => runPrompt(promptA, setIsRunningA, setResultA)}
                disabled={isRunningA}
              >
                <Play className="ml-1 size-3" />
                تشغيل
              </Button>
            </div>
            
            <Tabs defaultValue="user" className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-2 bg-transparent h-9 justify-start gap-2">
                <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
                <TabsTrigger value="developer" className="text-xs">Developer</TabsTrigger>
                <TabsTrigger value="user" className="text-xs">User</TabsTrigger>
                <TabsTrigger value="output" className="text-xs bg-blue-100">Output</TabsTrigger>
              </TabsList>

              <div className="flex-1 px-4 pb-4 overflow-hidden">
                {(['system', 'developer', 'user'] as const).map(section => (
                  <TabsContent key={section} value={section} className="h-full mt-2">
                    <Textarea 
                      className="h-full resize-none text-sm"
                      placeholder={`${section}...`}
                      value={promptA[section]}
                      onChange={(e) => handleSectionChange('A', section, e.target.value)}
                    />
                  </TabsContent>
                ))}

                <TabsContent value="output" className="h-full mt-2">
                  {resultA ? (
                    <div className="h-full flex flex-col">
                      <div className="flex gap-2 mb-2 text-xs">
                        <Badge variant="outline">{resultA.tokens?.total} tokens</Badge>
                        <Badge variant="outline">{formatCost(resultA.cost)}</Badge>
                        <Badge variant="outline">{resultA.duration?.toFixed(2)}s</Badge>
                      </div>
                      <ScrollArea className="flex-1 border rounded-md p-3 bg-muted/30">
                        <div className="text-sm whitespace-pre-wrap">{resultA.output}</div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      لا توجد نتائج
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Prompt B */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
            <div className="h-12 border-b flex items-center justify-between px-4 bg-purple-50">
              <span className="font-semibold flex items-center gap-2">
                الإصدار B
                {winner === 'B' && <Badge className="bg-green-600">فائز 🏆</Badge>}
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => runPrompt(promptB, setIsRunningB, setResultB)}
                disabled={isRunningB}
              >
                <Play className="ml-1 size-3" />
                تشغيل
              </Button>
            </div>
            
            <Tabs defaultValue="user" className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-2 bg-transparent h-9 justify-start gap-2">
                <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
                <TabsTrigger value="developer" className="text-xs">Developer</TabsTrigger>
                <TabsTrigger value="user" className="text-xs">User</TabsTrigger>
                <TabsTrigger value="output" className="text-xs bg-purple-100">Output</TabsTrigger>
              </TabsList>

              <div className="flex-1 px-4 pb-4 overflow-hidden">
                {(['system', 'developer', 'user'] as const).map(section => (
                  <TabsContent key={section} value={section} className="h-full mt-2">
                    <Textarea 
                      className="h-full resize-none text-sm"
                      placeholder={`${section}...`}
                      value={promptB[section]}
                      onChange={(e) => handleSectionChange('B', section, e.target.value)}
                    />
                  </TabsContent>
                ))}

                <TabsContent value="output" className="h-full mt-2">
                  {resultB ? (
                    <div className="h-full flex flex-col">
                      <div className="flex gap-2 mb-2 text-xs">
                        <Badge variant="outline">{resultB.tokens?.total} tokens</Badge>
                        <Badge variant="outline">{formatCost(resultB.cost)}</Badge>
                        <Badge variant="outline">{resultB.duration?.toFixed(2)}s</Badge>
                      </div>
                      <ScrollArea className="flex-1 border rounded-md p-3 bg-muted/30">
                        <div className="text-sm whitespace-pre-wrap">{resultB.output}</div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      لا توجد نتائج
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}
