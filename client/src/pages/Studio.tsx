import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { aiApi, agentComposeApi, templatesApi } from "@/lib/api";
import { PromptSections, Variable, CritiqueResult, AgentComposeStatus } from "@/lib/types";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { StageHeader } from "@/components/StageHeader";
import { Stage0Idea } from "@/components/stages/Stage0Idea";
import { Stage1Compose } from "@/components/stages/Stage1Compose";
import { Stage2Review } from "@/components/stages/Stage2Review";
import { Stage3Edit } from "@/components/stages/Stage3Edit";
import { Stage4Quality } from "@/components/stages/Stage4Quality";
import { Stage5Run } from "@/components/stages/Stage5Run";
import { Stage6Organize } from "@/components/stages/Stage6Organize";
import { WorkflowMapDialog } from "@/components/WorkflowMapDialog";
import { decodePromptFromUrl } from "@/lib/share";
import {
  StageId,
  WorkflowState,
  getInitialWorkflowState,
  canNavigateToStage,
} from "@/lib/workflow-types";

const DEFAULT_SECTIONS: PromptSections = {
  system: "أنت مساعد ذكي ومفيد.",
  developer: "تجنب الإجابات الطويلة جداً.",
  user: "مرحباً، كيف حالك؟",
  context: ""
};

const AI_MODELS = [
  // Groq Models
  { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick 17B 128E", provider: "groq" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B 16E", provider: "groq" },
  { id: "moonshotai/kimi-k2-instruct-0905", name: "Kimi K2 0905", provider: "groq" },
  { id: "qwen/qwen3-32b", name: "Qwen3-32B", provider: "groq" },
  
  // OpenAI Models
  { id: "gpt-5", name: "GPT-5", provider: "openai" },
  { id: "gpt-5.2", name: "GPT-5.2", provider: "openai" },
  
  // Google Models
  { id: "models/gemini-3-flash-preview", name: "Gemini 3 Flash Preview", provider: "google" },
  { id: "models/gemini-3-pro-preview", name: "Gemini 3 Pro Preview", provider: "google" },
  
  // Anthropic Models
  { id: "claude-4-sonnet", name: "Claude Sonnet 4", provider: "anthropic" },
  { id: "claude-4.5-sonnet", name: "Claude Sonnet 4.5", provider: "anthropic" },
];

export default function StudioNew() {
  // Workflow state
  const [workflowState, setWorkflowState] = useState<WorkflowState>(getInitialWorkflowState());
  const [showWorkflowMap, setShowWorkflowMap] = useState(false);

  // Stage 0-2: Compose
  const [rawIdea, setRawIdea] = useState("");
  const [goal, setGoal] = useState("");
  const [constraints, setConstraints] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [composeStatus, setComposeStatus] = useState<AgentComposeStatus | null>(null);

  // Stage 3: Edit (draft/committed pattern)
  const [sections, setSections] = useState<PromptSections>(DEFAULT_SECTIONS);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [committedSections, setCommittedSections] = useState<PromptSections | null>(null);
  const [committedVariables, setCommittedVariables] = useState<Variable[] | null>(null);

  // Stage 4: Quality
  const [critique, setCritique] = useState<CritiqueResult | null>(null);
  const [isCritiquing, setIsCritiquing] = useState(false);

  // Stage 5: Run
  const [output, setOutput] = useState("");
  const [latency, setLatency] = useState<number | null>(null);
  const [tokenUsage, setTokenUsage] = useState<{ prompt: number; completion: number; total: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Settings
  const [settings, setSettings] = useState({ model: "meta-llama/llama-4-maverick-17b-128e-instruct", temperature: 0.7, maxTokens: 1000 });

  const { toast } = useToast();

  // Load prompt from URL on mount
  useEffect(() => {
    const sharedPrompt = decodePromptFromUrl();
    if (sharedPrompt) {
      setRawIdea(sharedPrompt.rawIdea);
      setGoal(sharedPrompt.goal);
      setConstraints(sharedPrompt.constraints);
      setOutputFormat(sharedPrompt.outputFormat);
      
      toast({
        title: "تم تحميل الموجهة",
        description: "تم تحميل الموجهة من الرابط المشترك"
      });
    }
  }, []);

  // Auto-update stage statuses based on state
  useEffect(() => {
    const newStages = { ...workflowState.stages };

    // Stage 0: completed when rawIdea is not empty
    newStages[0] = rawIdea.trim() ? "completed" : "incomplete";

    // Stage 1: completed when compose succeeded
    if (composeStatus?.status === "completed") {
      newStages[1] = "completed";
    } else if (composeStatus?.status === "running") {
      newStages[1] = "in-progress";
    }

    // Stage 2: completed when user approved
    if (workflowState.composedSections) {
      newStages[2] = "completed";
    }

    // Stage 3: completed when sections have content
    if (sections.user.trim() || sections.system.trim()) {
      newStages[3] = "completed";
    }

    // Stage 4: completed when critique ran
    if (critique) {
      newStages[4] = "completed";
    }

    // Stage 5: completed when run succeeded
    if (output) {
      newStages[5] = "completed";
    }

    // Stage 6: completed when saved
    if (workflowState.hasSaved) {
      newStages[6] = "completed";
    }

    setWorkflowState((prev) => ({ ...prev, stages: newStages }));
  }, [rawIdea, composeStatus, workflowState.composedSections, sections, critique, output, workflowState.hasSaved]);

  // Poll compose status
  useEffect(() => {
    if (!workflowState.composeRunId || composeStatus?.status === "completed" || composeStatus?.status === "failed") {
      return;
    }

    const pollStatus = async () => {
      try {
        const result = await agentComposeApi.getStatus(workflowState.composeRunId!);
        setComposeStatus(result);

        if (result.status === "completed") {
          toast({ title: "تم التحويل بنجاح", description: "تم تحويل فكرتك إلى الأقسام الأربعة" });
          setWorkflowState((prev) => ({ ...prev, currentStage: 2 }));
        } else if (result.status === "failed") {
          toast({
            title: "فشل التحويل",
            description: result.error || "حدث خطأ أثناء المعالجة",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [workflowState.composeRunId, composeStatus, toast]);

  // Stage navigation
  const handleStageClick = (stageId: StageId) => {
    if (canNavigateToStage(stageId, workflowState)) {
      setWorkflowState((prev) => ({ ...prev, currentStage: stageId }));
    } else {
      toast({
        title: "لا يمكن الانتقال",
        description: "يجب إكمال المرحلة السابقة أولاً",
        variant: "destructive",
      });
    }
  };

  const handlePreviousStage = () => {
    if (workflowState.currentStage > 0) {
      setWorkflowState((prev) => ({ ...prev, currentStage: (prev.currentStage - 1) as StageId }));
    }
  };

  const handleNextStage = () => {
    const nextStage = (workflowState.currentStage + 1) as StageId;
    if (nextStage <= 6 && canNavigateToStage(nextStage, workflowState)) {
      setWorkflowState((prev) => ({ ...prev, currentStage: nextStage }));
    } else if (nextStage <= 6) {
      toast({
        title: "لا يمكن الانتقال",
        description: "يجب إكمال المرحلة الحالية أولاً",
        variant: "destructive",
      });
    }
  };

  // Stage 0 handlers
  const handleStartCompose = async () => {
    try {
      setWorkflowState((prev) => ({ ...prev, currentStage: 1 }));
      const result = await agentComposeApi.start({
        rawIdea,
        goal: goal || undefined,
        constraints: constraints || undefined,
        outputFormat: outputFormat || undefined,
        modelConfig: settings,
      });
      setWorkflowState((prev) => ({ ...prev, composeRunId: result.runId }));
    } catch (error) {
      toast({
        title: "فشل البدء",
        description: error instanceof Error ? error.message : "حدث خطأ",
        variant: "destructive",
      });
      setWorkflowState((prev) => ({ ...prev, currentStage: 0 }));
    }
  };

  const handleSkipToManual = () => {
    // Initialize committed state for manual workflow
    setCommittedSections(sections);
    setCommittedVariables(variables);
    setWorkflowState((prev) => ({ ...prev, currentStage: 3 }));
  };

  // Stage 2 handlers
  const handleApproveResult = () => {
    if (!composeStatus?.result?.agent3) return;

    const { finalPrompt, finalVariables } = composeStatus.result.agent3;
    setSections(finalPrompt);
    setVariables(finalVariables);
    setCommittedSections(finalPrompt); // Set as committed
    setCommittedVariables(finalVariables); // Set as committed
    setWorkflowState((prev) => ({
      ...prev,
      composedSections: true,
      currentStage: 3,
    }));
    toast({ title: "تم الاعتماد", description: "تم ملء الأقسام الأربعة من نتائج الوكلاء" });
  };

  // Stage 3 handlers
  const handleSectionChange = (section: keyof PromptSections, value: string) => {
    setSections((prev) => ({ ...prev, [section]: value }));
  };

  const handleAddVariable = () => {
    const id = Math.random().toString(36).substr(2, 5);
    setVariables([...variables, { id, name: `var_${variables.length + 1}`, value: "" }]);
  };

  const handleRemoveVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
  };

  const handleUpdateVariable = (id: string, field: keyof Variable, value: string) => {
    setVariables(variables.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const handleApplyChanges = () => {
    setCommittedSections(sections);
    setCommittedVariables(variables);
  };

  const handleResetToAgents = () => {
    if (committedSections && committedVariables) {
      setSections(committedSections);
      setVariables(committedVariables);
    }
  };

  // Stage 4 handlers
  const handleRunCritique = async () => {
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

  const handleApplyRewrite = () => {
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

  // Stage 5 helpers
  const handleSkipToOrganize = () => {
    setWorkflowState((prev) => ({ ...prev, currentStage: 6 }));
    toast({ title: "تم التخطي", description: "الانتقال إلى مرحلة الحفظ والتنظيم" });
  };

  // Stage 6 helpers
  const handleStartNew = () => {
    // Reset all state to initial values
    setRawIdea("");
    setGoal("");
    setConstraints("");
    setOutputFormat("");
    setComposeStatus(null);
    setSections(DEFAULT_SECTIONS);
    setVariables([]);
    setCommittedSections(null);
    setCommittedVariables(null);
    setCritique(null);
    setOutput("");
    setLatency(null);
    setTokenUsage(null);
    setWorkflowState(getInitialWorkflowState());
    toast({ title: "بدء جديد", description: "تم إعادة تعيين جميع المراحل" });
  };

  // Stage 5 handlers
  const handleRun = async () => {
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

  // Stage 6 handlers
  const handleSaveTemplate = async () => {
    try {
      const templateData = {
        name: `مطالبة - ${new Date().toLocaleDateString('ar-EG')}`,
        description: rawIdea || "مطالبة من الاستوديو",
        sections: sections, // Object, not string
        defaultVariables: variables, // Array of Variable objects
        category: "general",
        tags: [],
      };
      
      await templatesApi.create(templateData);
      toast({ 
        title: "تم الحفظ بنجاح", 
        description: "تم حفظ المطالبة في مكتبة القوالب" 
      });
      setWorkflowState((prev) => ({ ...prev, hasSaved: true }));
    } catch (error) {
      toast({ 
        title: "فشل الحفظ", 
        description: error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ",
        variant: "destructive" 
      });
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      sections,
      variables,
      settings,
      output,
      latency,
      tokenUsage,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-${Date.now()}.json`;
    a.click();
    toast({ title: "تم التصدير", description: "تم تصدير المطالبة بصيغة JSON" });
    setWorkflowState((prev) => ({ ...prev, hasSaved: true }));
  };

  // Render current stage
  const renderCurrentStage = () => {
    switch (workflowState.currentStage) {
      case 0:
        return (
          <Stage0Idea
            rawIdea={rawIdea}
            goal={goal}
            constraints={constraints}
            outputFormat={outputFormat}
            onRawIdeaChange={setRawIdea}
            onGoalChange={setGoal}
            onConstraintsChange={setConstraints}
            onOutputFormatChange={setOutputFormat}
            onStartCompose={handleStartCompose}
            onSkipToManual={handleSkipToManual}
          />
        );
      case 1:
        return <Stage1Compose status={composeStatus} />;
      case 2:
        return <Stage2Review status={composeStatus} onApprove={handleApproveResult} />;
      case 3:
        return (
          <Stage3Edit
            sections={sections}
            variables={variables}
            committedSections={committedSections || undefined}
            committedVariables={committedVariables || undefined}
            onSectionChange={handleSectionChange}
            onAddVariable={handleAddVariable}
            onRemoveVariable={handleRemoveVariable}
            onUpdateVariable={handleUpdateVariable}
            onApplyChanges={handleApplyChanges}
            onResetToAgents={handleResetToAgents}
          />
        );
      case 4:
        return (
          <Stage4Quality
            critique={critique}
            isCritiquing={isCritiquing}
            onRunCritique={handleRunCritique}
            onApplyRewrite={handleApplyRewrite}
            onProceedToRun={handleNextStage}
          />
        );
      case 5:
        return (
          <Stage5Run
            sections={sections}
            variables={variables}
            output={output}
            latency={latency}
            tokenUsage={tokenUsage}
            isRunning={isRunning}
            onRun={handleRun}
            onSkipToOrganize={handleSkipToOrganize}
          />
        );
      case 6:
        return (
          <Stage6Organize
            onSaveTemplate={handleSaveTemplate}
            onExportJSON={handleExportJSON}
            onStartNew={handleStartNew}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex" dir="rtl" data-testid="studio-new">
      {/* Right: Workflow Stepper */}
      <WorkflowStepper
        currentStage={workflowState.currentStage}
        stageStatuses={workflowState.stages}
        onStageClick={handleStageClick}
      />

      {/* Left: Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Settings Bar */}
        <div className="h-14 border-b flex items-center justify-between px-4 bg-background shrink-0">
          <div className="flex items-center gap-4">
            <Select value={settings.model} onValueChange={(v) => setSettings({ ...settings, model: v })}>
              <SelectTrigger className="w-[200px]" data-testid="select-model">
                <SelectValue placeholder="اختر النموذج" />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {model.provider.toUpperCase()}
                      </span>
                      {model.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 border-r pr-4 mr-2">
              <span className="text-sm text-muted-foreground">Temp:</span>
              <Input
                type="number"
                className="w-16 h-8 text-xs"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                step={0.1}
                min={0}
                max={2}
                data-testid="input-temperature"
              />
            </div>
          </div>
        </div>

        {/* Stage Header */}
        <StageHeader
          currentStage={workflowState.currentStage}
          onPrevious={handlePreviousStage}
          onNext={handleNextStage}
          onShowMap={() => setShowWorkflowMap(true)}
          canGoPrevious={workflowState.currentStage > 0}
          canGoNext={workflowState.currentStage < 6}
        />

        {/* Stage Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderCurrentStage()}
        </div>
      </div>

      {/* Workflow Map Dialog */}
      <WorkflowMapDialog open={showWorkflowMap} onOpenChange={setShowWorkflowMap} />
    </div>
  );
}
