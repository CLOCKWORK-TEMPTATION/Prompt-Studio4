import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Code,
  Download,
  Copy,
  Play,
  Settings,
  FileCode,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
  TestTube
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SDKConfig {
  language: string;
  packageName: string;
  version: string;
  description: string;
  author: string;
}

interface SDKOptions {
  asyncMode: boolean;
  includeRetryLogic: boolean;
  includeErrorHandling: boolean;
  includeTypes: boolean;
  includeDocstrings: boolean;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
  className: string;
  functionName: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  sections: {
    system: string;
    developer: string;
    user: string;
    context: string;
  };
  variables: Array<{
    id: string;
    name: string;
    value: string;
  }>;
}

interface GeneratedSDK {
  language: string;
  code: string;
  types?: string;
  filename: string;
  dependencies: string[];
}

interface TestResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number;
}

export default function SDKGenerator() {
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sdkConfig, setSdkConfig] = useState<SDKConfig>({
    language: "typescript",
    packageName: "my-prompt-sdk",
    version: "1.0.0",
    description: "SDK مولد تلقائياً للموجهات",
    author: "المطور"
  });
  const [sdkOptions, setSdkOptions] = useState<SDKOptions>({
    asyncMode: true,
    includeRetryLogic: true,
    includeErrorHandling: true,
    includeTypes: true,
    includeDocstrings: true,
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000,
    className: "PromptClient",
    functionName: "execute",
  });
  const [generatedSDK, setGeneratedSDK] = useState<GeneratedSDK | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const languages = [
    { id: "typescript", name: "TypeScript", icon: "📘" },
    { id: "python", name: "Python", icon: "🐍" },
    { id: "javascript", name: "JavaScript", icon: "📜" },
    { id: "go", name: "Go", icon: "🔷" },
    { id: "curl", name: "cURL", icon: "🌐" }
  ];

  // تحميل القوالب عند بدء التحميل
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };

    loadTemplates();
  }, []);

  const generateSDK = async () => {
    if (!selectedPrompt) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار موجه أولاً",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sdk/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId: selectedPrompt,
          language: sdkConfig.language,
          options: sdkOptions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate SDK');
      }

      const sdk: GeneratedSDK = await response.json();
      setGeneratedSDK(sdk);

      toast({
        title: "نجاح",
        description: `تم توليد SDK بنجاح للغة ${languages.find(l => l.id === sdkConfig.language)?.name}`,
      });
    } catch (error) {
      console.error('SDK generation failed:', error);
      toast({
        title: "خطأ",
        description: "فشل في توليد SDK",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testGeneratedSDK = async () => {
    if (!generatedSDK) {
      toast({
        title: "خطأ",
        description: "يرجى توليد SDK أولاً",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/sdk/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sdk: generatedSDK,
          promptId: selectedPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('SDK test failed');
      }

      const result: TestResult = await response.json();
      setTestResult(result);

      toast({
        title: result.success ? "نجاح" : "فشل",
        description: result.success
          ? `تم اختبار SDK بنجاح في ${result.executionTime}ms`
          : `فشل اختبار SDK: ${result.error}`,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('SDK test failed:', error);
      toast({
        title: "خطأ",
        description: "فشل في اختبار SDK",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const downloadSDK = () => {
    if (!generatedSDK) return;

    const blob = new Blob([generatedSDK.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedSDK.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "تم التحميل",
      description: `تم تحميل الملف ${generatedSDK.filename}`,
    });
  };

  const copyToClipboard = () => {
    if (!generatedSDK?.code) return;

    navigator.clipboard.writeText(generatedSDK.code);
    toast({
      title: "تم النسخ",
      description: "تم نسخ الكود إلى الحافظة",
    });
  };
    const sampleCode = `# ${sdkConfig.packageName} v${sdkConfig.version}
# ${sdkConfig.description}

import requests
from typing import Optional, Dict, Any

class PromptSDK:
    def __init__(self, api_key: str, base_url: str = "https://api.example.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def execute_prompt(self, 
                      prompt: str, 
                      variables: Optional[Dict[str, Any]] = None,
                      model: str = "gpt-4",
                      temperature: float = 0.7) -> Dict[str, Any]:
        """
        تنفيذ الموجه مع المتغيرات المحددة
        
        Args:
            prompt: نص الموجه
            variables: متغيرات الموجه
            model: النموذج المستخدم
            temperature: درجة الحرارة
            
        Returns:
            استجابة النموذج
        """
        payload = {
            "prompt": prompt,
            "variables": variables or {},
            "model": model,
            "temperature": temperature
        }
        
        response = requests.post(
            f"{self.base_url}/api/prompts/execute",
            json=payload,
            headers=self.headers
        )
        
        response.raise_for_status()
        return response.json()
    
    def get_templates(self) -> Dict[str, Any]:
        """الحصول على قائمة القوالب المتاحة"""
        response = requests.get(
            f"{self.base_url}/api/templates",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# مثال على الاستخدام
if __name__ == "__main__":
    sdk = PromptSDK("your-api-key-here")
    
    result = sdk.execute_prompt(
        prompt="مرحباً {name}، كيف يمكنني مساعدتك في {task}؟",
        variables={"name": "أحمد", "task": "البرمجة"},
        model="gpt-4",
        temperature=0.7
    )
    
    print(result)`;
    
    setGeneratedCode(sampleCode);
  };


  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Code className="size-8 text-primary" />
            مولد SDK
          </h1>
          <p className="text-muted-foreground mt-2">
            إنشاء مكتبات برمجية متقدمة لاستخدام موجهاتك في تطبيقاتك
          </p>
        </div>
        <div className="flex items-center gap-2">
          {generatedSDK && (
            <>
              <Button variant="outline" onClick={testGeneratedSDK} disabled={testing}>
                {testing ? (
                  <Loader2 className="size-4 ml-2 animate-spin" />
                ) : (
                  <TestTube className="size-4 ml-2" />
                )}
                {testing ? 'جاري الاختبار...' : 'اختبار SDK'}
              </Button>
              <Button variant="outline" onClick={downloadSDK}>
                <Download className="size-4 ml-2" />
                تحميل
              </Button>
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="size-4 ml-2" />
                نسخ
              </Button>
            </>
          )}
          <Button onClick={generateSDK} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 ml-2 animate-spin" />
            ) : (
              <Package className="size-4 ml-2" />
            )}
            {loading ? 'جاري التوليد...' : 'توليد SDK'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="size-5" />
                اختيار الموجه
              </CardTitle>
              <CardDescription>
                اختر الموجه الذي تريد إنشاء SDK له
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt-select">الموجه</Label>
                <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر موجه..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {template.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5" />
                إعدادات SDK
              </CardTitle>
              <CardDescription>
                تخصيص إعدادات SDK المولد
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="language">اللغة البرمجية</Label>
                <Select
                  value={sdkConfig.language}
                  onValueChange={(value) =>
                    setSdkConfig({ ...sdkConfig, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        <div className="flex items-center gap-2">
                          <span>{lang.icon}</span>
                          <span>{lang.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="package-name">اسم الحزمة</Label>
                <Input
                  id="package-name"
                  value={sdkConfig.packageName}
                  onChange={(e) =>
                    setSdkConfig({ ...sdkConfig, packageName: e.target.value })
                  }
                  placeholder="my-prompt-sdk"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="version">الإصدار</Label>
                  <Input
                    id="version"
                    value={sdkConfig.version}
                    onChange={(e) =>
                      setSdkConfig({ ...sdkConfig, version: e.target.value })
                    }
                    placeholder="1.0.0"
                  />
                </div>
                <div>
                  <Label htmlFor="author">المؤلف</Label>
                  <Input
                    id="author"
                    value={sdkConfig.author}
                    onChange={(e) =>
                      setSdkConfig({ ...sdkConfig, author: e.target.value })
                    }
                    placeholder="المطور"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={sdkConfig.description}
                  onChange={(e) =>
                    setSdkConfig({ ...sdkConfig, description: e.target.value })
                  }
                  placeholder="وصف SDK المولد"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5" />
                خيارات متقدمة
              </CardTitle>
              <CardDescription>
                تخصيص ميزات SDK المتقدمة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="async-mode">الوضع غير المتزامن</Label>
                <Switch
                  id="async-mode"
                  checked={sdkOptions.asyncMode}
                  onCheckedChange={(checked) =>
                    setSdkOptions({ ...sdkOptions, asyncMode: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="retry-logic">منطق إعادة المحاولة</Label>
                <Switch
                  id="retry-logic"
                  checked={sdkOptions.includeRetryLogic}
                  onCheckedChange={(checked) =>
                    setSdkOptions({ ...sdkOptions, includeRetryLogic: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="error-handling">معالجة الأخطاء</Label>
                <Switch
                  id="error-handling"
                  checked={sdkOptions.includeErrorHandling}
                  onCheckedChange={(checked) =>
                    setSdkOptions({ ...sdkOptions, includeErrorHandling: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="type-definitions">تعريفات الأنواع</Label>
                <Switch
                  id="type-definitions"
                  checked={sdkOptions.includeTypes}
                  onCheckedChange={(checked) =>
                    setSdkOptions({ ...sdkOptions, includeTypes: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="documentation">التوثيق</Label>
                <Switch
                  id="documentation"
                  checked={sdkOptions.includeDocstrings}
                  onCheckedChange={(checked) =>
                    setSdkOptions({ ...sdkOptions, includeDocstrings: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="class-name">اسم الكلاس</Label>
                <Input
                  id="class-name"
                  value={sdkOptions.className}
                  onChange={(e) =>
                    setSdkOptions({ ...sdkOptions, className: e.target.value })
                  }
                  placeholder="PromptClient"
                />
              </div>

              <div>
                <Label htmlFor="function-name">اسم الدالة</Label>
                <Input
                  id="function-name"
                  value={sdkOptions.functionName}
                  onChange={(e) =>
                    setSdkOptions({ ...sdkOptions, functionName: e.target.value })
                  }
                  placeholder="execute"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retry-attempts">عدد المحاولات</Label>
                  <Input
                    id="retry-attempts"
                    type="number"
                    value={sdkOptions.retryAttempts}
                    onChange={(e) =>
                      setSdkOptions({ ...sdkOptions, retryAttempts: parseInt(e.target.value) || 3 })
                    }
                    min={1}
                    max={10}
                  />
                </div>
                <div>
                  <Label htmlFor="timeout">المهلة (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={sdkOptions.timeout}
                    onChange={(e) =>
                      setSdkOptions({ ...sdkOptions, timeout: parseInt(e.target.value) || 30000 })
                    }
                    min={1000}
                    max={120000}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الموجهات المتاحة</CardTitle>
              <CardDescription>
                اختر الموجهات لتضمينها في SDK
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {["موجه التسويق", "موجه التحليل", "موجه الترجمة"].map((prompt) => (
                  <div key={prompt} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={prompt}
                      className="rounded"
                    />
                    <label htmlFor={prompt} className="text-sm">{prompt}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {generatedSDK && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="size-5" />
                      SDK المولد
                    </CardTitle>
                    <CardDescription>
                      مكتبة {generatedSDK.language} جاهزة للاستخدام
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {generatedSDK.filename}
                    </Badge>
                    {testResult && (
                      <Badge variant={testResult.success ? "default" : "destructive"}>
                        {testResult.success ? (
                          <CheckCircle className="size-3 mr-1" />
                        ) : (
                          <AlertCircle className="size-3 mr-1" />
                        )}
                        {testResult.success ? 'نجح الاختبار' : 'فشل الاختبار'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="code" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="code">الكود</TabsTrigger>
                    <TabsTrigger value="dependencies">التبعيات</TabsTrigger>
                    {testResult && <TabsTrigger value="test-results">نتائج الاختبار</TabsTrigger>}
                  </TabsList>

                  <TabsContent value="code">
                    <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto max-h-[500px]">
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {generatedSDK.code}
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="dependencies">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">التبعيات المطلوبة:</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedSDK.dependencies.map((dep, index) => (
                            <Badge key={index} variant="secondary">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {generatedSDK.types && (
                        <div>
                          <h4 className="font-medium mb-2">تعريفات الأنواع:</h4>
                          <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto max-h-[300px]">
                            <pre className="text-sm font-mono whitespace-pre-wrap">
                              {generatedSDK.types}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {testResult && (
                    <TabsContent value="test-results">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className={`size-3 rounded-full ${testResult.success ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="font-medium">
                              {testResult.success ? 'نجح الاختبار' : 'فشل الاختبار'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              وقت التنفيذ: {testResult.executionTime}ms
                            </p>
                          </div>
                        </div>

                        {testResult.output && (
                          <div>
                            <h4 className="font-medium mb-2">المخرجات:</h4>
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                              <pre className="text-sm font-mono whitespace-pre-wrap text-green-800">
                                {testResult.output}
                              </pre>
                            </div>
                          </div>
                        )}

                        {testResult.error && (
                          <div>
                            <h4 className="font-medium mb-2 text-red-600">الأخطاء:</h4>
                            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                              <pre className="text-sm font-mono whitespace-pre-wrap text-red-800">
                                {testResult.error}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          )}

          {!generatedSDK && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileCode className="size-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">ابدأ بتوليد SDK</h3>
                <p className="text-muted-foreground mb-4">
                  اختر موجه من القائمة واضبط الإعدادات ثم اضغط على "توليد SDK"
                </p>
                <div className="flex justify-center gap-2">
                  {languages.map((lang) => (
                    <Badge key={lang.id} variant="outline">
                      {lang.icon} {lang.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="usage" className="space-y-4">
            <TabsList>
              <TabsTrigger value="usage">طريقة الاستخدام</TabsTrigger>
              <TabsTrigger value="installation">التثبيت</TabsTrigger>
              <TabsTrigger value="examples">أمثلة</TabsTrigger>
            </TabsList>

            <TabsContent value="usage">
              <Card>
                <CardHeader>
                  <CardTitle>طريقة الاستخدام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">1</Badge>
                      <div>
                        <p className="font-medium">تثبيت المكتبة</p>
                        <p className="text-sm text-muted-foreground">
                          قم بتثبيت المكتبة في مشروعك
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">2</Badge>
                      <div>
                        <p className="font-medium">إعداد المفتاح</p>
                        <p className="text-sm text-muted-foreground">
                          أضف مفتاح API الخاص بك
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">3</Badge>
                      <div>
                        <p className="font-medium">استخدام الموجهات</p>
                        <p className="text-sm text-muted-foreground">
                          ابدأ في استخدام الموجهات في تطبيقك
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="installation">
              <Card>
                <CardHeader>
                  <CardTitle>تعليمات التثبيت</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-sm">
                      {sdkConfig.language === "python" && `pip install ${sdkConfig.packageName}`}
                      {sdkConfig.language === "typescript" && `npm install ${sdkConfig.packageName}`}
                      {sdkConfig.language === "javascript" && `npm install ${sdkConfig.packageName}`}
                      {sdkConfig.language === "go" && `go get github.com/user/${sdkConfig.packageName}`}
                    </code>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examples">
              <Card>
                <CardHeader>
                  <CardTitle>أمثلة الاستخدام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">مثال بسيط</h4>
                      <div className="bg-muted p-3 rounded text-sm font-mono">
                        sdk.execute_prompt("مرحباً بالعالم!")
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">مثال مع متغيرات</h4>
                      <div className="bg-muted p-3 rounded text-sm font-mono">
                        sdk.execute_prompt("مرحباً {"{name}"}", {"{"}name: "أحمد"{"}"})
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}