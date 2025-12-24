import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [baseUrl, setBaseUrl] = useState("https://api.groq.com/openai/v1");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [rtlMode, setRtlMode] = useState(true);

  // Load available models
  const { data: models } = useQuery({
    queryKey: ["models"],
    queryFn: settingsApi.getModels,
  });

  // Load current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.getSettings,
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setBaseUrl(settings.llm.baseUrl);
      setSelectedModel(settings.llm.model);
      setDarkMode(settings.ui.darkMode);
      setRtlMode(settings.ui.rtlMode);
      
      // Apply dark mode to document
      if (settings.ui.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings]);

  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: settingsApi.saveSettings,
    onSuccess: () => {
      toast({
        title: "نجح الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => {
      toast({
        title: "فشل الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettings.mutate({
      llm: {
        baseUrl,
        model: selectedModel,
        ...(apiKey && { apiKey }),
      },
      ui: {
        darkMode,
        rtlMode,
      },
    });
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">الإعدادات</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>مزود الخدمة (LLM Provider)</CardTitle>
            <CardDescription>إعدادات الاتصال بنماذج الذكاء الاصطناعي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input 
                placeholder="https://api.openai.com/v1" 
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="font-mono text-sm" 
              />
              <p className="text-xs text-muted-foreground">اتركه افتراضياً لـ OpenAI أو غيّره لـ Local LLM</p>
            </div>
            
            <div className="space-y-2">
              <Label>النموذج (Model)</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النموذج..." />
                </SelectTrigger>
                <SelectContent>
                  {models?.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">اختر النموذج الذي تريد استخدامه افتراضياً</p>
            </div>
            
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input 
                  type="password" 
                  placeholder="sk-..." 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono text-sm pl-10" 
                />
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 p-2 rounded mt-1 border border-yellow-200 dark:border-yellow-800">
                ملاحظة: يتم حفظ المفاتيح في الجلسة الخاصة بك ولا تظهر في المتصفح.
              </p>
            </div>
          </CardContent>
          <div className="border-t p-4 flex justify-end">
            <Button onClick={handleSave} disabled={saveSettings.isPending}>
              {saveSettings.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </Card>

        <Card>
           <CardHeader>
            <CardTitle>تفضيلات الواجهة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>الوضع الليلي</Label>
                  <p className="text-xs text-muted-foreground">تفعيل المظهر الداكن</p>
                </div>
                <Switch checked={darkMode} onCheckedChange={handleDarkModeToggle} />
             </div>
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>اتجاه الواجهة</Label>
                  <p className="text-xs text-muted-foreground">فرض RTL دائماً</p>
                </div>
                <Switch checked={rtlMode} onCheckedChange={setRtlMode} />
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
