import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Key, X, CheckCircle2, AlertTriangle, SkipForward, Share2, Copy, Check } from "lucide-react";
import { sessionApiKeyApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CopyButton } from "@/components/CopyButton";
import { PromptSections, Variable } from "@/lib/types";
import { sharePrompt, copyShareUrl, ShareablePrompt } from "@/lib/share";

interface Stage5RunProps {
  sections: PromptSections;
  variables: Variable[];
  output: string;
  latency: number | null;
  tokenUsage: { prompt: number; completion: number; total: number } | null;
  isRunning: boolean;
  onRun: () => void;
  onSkipToOrganize?: () => void;
}

export function Stage5Run({
  sections,
  variables,
  output,
  latency,
  tokenUsage,
  isRunning,
  onRun,
  onSkipToOrganize,
}: Stage5RunProps) {
  
  const getFullPrompt = () => {
    let text = `${sections.system}\n\n${sections.developer}\n\n${sections.context}\n\n${sections.user}`;
    variables.forEach(v => {
      text = text.replace(new RegExp(`{{${v.name}}}`, 'g'), v.value || `{{${v.name}}}`);
    });
    return text;
  };
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<{
    hasSessionKey: boolean;
    hasEnvironmentKey: boolean;
    canRun: boolean;
  } | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      const status = await sessionApiKeyApi.getStatus();
      setApiKeyStatus(status);
    } catch (error) {
      console.error("Failed to check API key status:", error);
    }
  };

  const handleActivateKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال مفتاح API",
        variant: "destructive",
      });
      return;
    }

    setIsActivating(true);
    try {
      await sessionApiKeyApi.activate(apiKey);
      toast({
        title: "تم التفعيل",
        description: "تم تفعيل مفتاح API للجلسة الحالية",
      });
      setApiKey("");
      setShowApiKeyInput(false);
      await checkApiKeyStatus();
    } catch (error) {
      toast({
        title: "فشل التفعيل",
        description: error instanceof Error ? error.message : "حدث خطأ",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const shareablePrompt: ShareablePrompt = {
        rawIdea: sections.user,
        goal: sections.system,
        constraints: sections.developer,
        outputFormat: sections.context,
      };
      
      const success = await sharePrompt(shareablePrompt);
      if (success) {
        toast({
          title: "تم المشاركة",
          description: "تم نسخ رابط المشاركة أو مشاركة الموجهة",
        });
      }
    } catch (error) {
      toast({
        title: "فشلت المشاركة",
        description: error instanceof Error ? error.message : "حدث خطأ",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareUrl = async () => {
    const shareablePrompt: ShareablePrompt = {
      rawIdea: sections.user,
      goal: sections.system,
      constraints: sections.developer,
      outputFormat: sections.context,
    };
    
    const success = await copyShareUrl(shareablePrompt);
    if (success) {
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط المشاركة إلى الحافظة",
      });
      setShareUrl("تم النسخ");
      setTimeout(() => setShareUrl(""), 2000);
    }
  };

  return (
    <Card data-testid="stage-5-run">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">تشغيل المطالبة</h3>
            <p className="text-sm text-muted-foreground">نفّذ المطالبة واحصل على النتيجة</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCopyShareUrl}
              variant="outline"
              size="sm"
              title="نسخ رابط المشاركة"
            >
              {shareUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              disabled={isSharing}
              title="مشاركة الموجهة"
            >
              <Share2 className="ml-2 size-4" />
              مشاركة
            </Button>
            <Button
              onClick={onRun}
              disabled={isRunning || !apiKeyStatus || (apiKeyStatus && !apiKeyStatus.canRun)}
              size="lg"
              data-testid="button-run-prompt"
            >
              <Play className="ml-2 size-5" />
              {!apiKeyStatus ? "جاري التحميل..." : isRunning ? "جاري التشغيل..." : "تشغيل"}
            </Button>
          </div>
        </div>

        {/* Prompt Preview Tabs */}
        <Tabs defaultValue="full" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="full">البرومبت الكامل</TabsTrigger>
            <TabsTrigger value="sections">الأقسام المنفصلة</TabsTrigger>
          </TabsList>
          
          <TabsContent value="full" className="mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">البرومبت الذي سيتم تنفيذه:</h4>
                <CopyButton text={getFullPrompt()} label="نسخ البرومبت" />
              </div>
              <ScrollArea className="h-[300px] border rounded-lg p-4 bg-muted/50">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {getFullPrompt()}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="sections" className="mt-4">
            <div className="space-y-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className="text-sm font-semibold">System:</h5>
                  <CopyButton text={sections.system} size="icon" variant="ghost" />
                </div>
                <p className="text-sm text-muted-foreground">{sections.system}</p>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className="text-sm font-semibold">Developer:</h5>
                  <CopyButton text={sections.developer} size="icon" variant="ghost" />
                </div>
                <p className="text-sm text-muted-foreground">{sections.developer}</p>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className="text-sm font-semibold">User:</h5>
                  <CopyButton text={sections.user} size="icon" variant="ghost" />
                </div>
                <p className="text-sm text-muted-foreground">{sections.user}</p>
              </div>
              
              {sections.context && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h5 className="text-sm font-semibold">Context:</h5>
                    <CopyButton text={sections.context} size="icon" variant="ghost" />
                  </div>
                  <p className="text-sm text-muted-foreground">{sections.context}</p>
                </div>
              )}
              
              {variables.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h5 className="text-sm font-semibold mb-2">المتغيرات:</h5>
                  <div className="space-y-1">
                    {variables.map((v, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-mono text-blue-600">{`{{${v.name}}}`}</span>
                        {v.value && <span className="text-muted-foreground"> = {v.value}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* API Key Status & Input */}
        <div className="space-y-3">
          {apiKeyStatus && !apiKeyStatus.canRun && (
            <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="size-4 text-amber-600" />
              <AlertDescription className="text-sm">
                <strong>مرحلة التشغيل اختيارية.</strong> للتجربة، يرجى إدخال مفتاح API الخاص بك أدناه.
                {" "}
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-primary"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  data-testid="button-toggle-api-key-input"
                >
                  {showApiKeyInput ? "إخفاء" : "إدخال مفتاح API"}
                </Button>
                {onSkipToOrganize && (
                  <>
                    {" أو "}
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-primary font-semibold"
                      onClick={onSkipToOrganize}
                      data-testid="button-skip-to-organize"
                    >
                      تخطي والانتقال للمرحلة الأخيرة
                    </Button>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {apiKeyStatus?.hasSessionKey && (
            <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="size-4 text-green-600" />
              <AlertDescription className="text-sm flex items-center justify-between">
                <span>مفتاح API مفعّل للجلسة الحالية</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearKey}
                  data-testid="button-clear-api-key"
                >
                  <X className="ml-1 size-4" /> إلغاء
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {apiKeyStatus?.hasEnvironmentKey && !apiKeyStatus?.hasSessionKey && (
            <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
              <CheckCircle2 className="size-4 text-blue-600" />
              <AlertDescription className="text-sm">
                يستخدم مفتاح API من متغيرات البيئة (GROQ_API_KEY)
              </AlertDescription>
            </Alert>
          )}

          {showApiKeyInput && (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="size-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">إدخال مفتاح API للتجربة</h4>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="gsk_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleActivateKey();
                    }}
                    disabled={isActivating}
                    data-testid="input-api-key"
                  />
                  <Button
                    onClick={handleActivateKey}
                    disabled={isActivating || !apiKey.trim()}
                    data-testid="button-activate-api-key"
                  >
                    {isActivating ? "جاري التفعيل..." : "تفعيل"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  المفتاح يُحفظ فقط في جلستك الحالية ولن يُخزن في قاعدة البيانات.
                  احصل على مفتاح مجاني من{" "}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    console.groq.com
                  </a>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {output && (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              {latency !== null && (
                <div className="bg-muted px-3 py-1.5 rounded-md">
                  <span className="text-muted-foreground">الوقت: </span>
                  <span className="font-medium">{latency}ms</span>
                </div>
              )}
              {tokenUsage && (
                <>
                  <div className="bg-muted px-3 py-1.5 rounded-md">
                    <span className="text-muted-foreground">Prompt: </span>
                    <span className="font-medium">{tokenUsage.prompt}</span>
                  </div>
                  <div className="bg-muted px-3 py-1.5 rounded-md">
                    <span className="text-muted-foreground">Completion: </span>
                    <span className="font-medium">{tokenUsage.completion}</span>
                  </div>
                  <div className="bg-muted px-3 py-1.5 rounded-md">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-medium">{tokenUsage.total}</span>
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">المخرجات:</h4>
                <CopyButton text={output} label="نسخ المخرجات" />
              </div>
              <ScrollArea className="h-[350px] border rounded-lg p-4 bg-muted/50">
                <pre className="whitespace-pre-wrap text-sm font-mono" data-testid="output-text">
                  {output}
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}

        {!output && !isRunning && (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground border rounded-lg">
            <div className="text-center">
              <Play className="size-16 mb-4 opacity-50 mx-auto" />
              <p>اضغط على "تشغيل" لتنفيذ المطالبة</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
