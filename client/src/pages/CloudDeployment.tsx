/**
 * صفحة النشر السحابي
 * تسمح للمستخدمين بنشر المطالبات على منصات سحابية مختلفة
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { 
  Cloud, 
  Rocket, 
  Settings, 
  Monitor, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Copy,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface PlatformTemplate {
  name: string;
  displayName: string;
  description: string;
  defaultConfig: any;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  supportedRegions: string[];
  configFiles: string[];
}

interface DeploymentConfig {
  platform: string;
  projectName: string;
  region: string;
  environment: 'development' | 'staging' | 'production';
  envVars?: Record<string, string>;
}

interface DeploymentStatus {
  id: string;
  status: 'pending' | 'building' | 'ready' | 'error';
  url?: string;
  createdAt: string;
  updatedAt: string;
  logs: string[];
}

interface HealthCheck {
  deploymentId: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: string;
  error?: string;
}

export default function CloudDeployment() {
  const [platforms, setPlatforms] = useState<PlatformTemplate[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [config, setConfig] = useState<DeploymentConfig>({
    platform: '',
    projectName: '',
    region: '',
    environment: 'production'
  });
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([]);
  const [healthChecks, setHealthChecks] = useState<Record<string, HealthCheck>>({});
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [prompts, setPrompts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('deploy');

  // تحميل البيانات الأولية
  useEffect(() => {
    loadPlatforms();
    loadPrompts();
    loadDeployments();
  }, []);

  // تحميل المنصات المدعومة
  const loadPlatforms = async () => {
    try {
      const response = await fetch('/api/deploy/platforms');
      const data = await response.json();
      if (data.success) {
        setPlatforms(data.data);
      }
    } catch (error) {
      console.error('خطأ في تحميل المنصات:', error);
    }
  };

  // تحميل المطالبات
  const loadPrompts = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setPrompts(data);
    } catch (error) {
      console.error('خطأ في تحميل المطالبات:', error);
    }
  };

  // تحميل النشرات الموجودة
  const loadDeployments = async () => {
    try {
      const response = await fetch('/api/deploy/deployments');
      const data = await response.json();
      if (data.success) {
        setDeployments(data.data);
        
        // تحميل فحوصات الصحة
        for (const deployment of data.data) {
          loadHealthCheck(deployment.id);
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل النشرات:', error);
    }
  };

  // تحميل فحص الصحة
  const loadHealthCheck = async (deploymentId: string) => {
    try {
      const response = await fetch(`/api/deploy/health/${deploymentId}`);
      const data = await response.json();
      if (data.success) {
        setHealthChecks(prev => ({
          ...prev,
          [deploymentId]: data.data
        }));
      }
    } catch (error) {
      // تجاهل أخطاء فحص الصحة
    }
  };

  // اختيار منصة
  const handlePlatformSelect = (platform: string) => {
    setSelectedPlatform(platform);
    const template = platforms.find(p => p.name === platform);
    if (template) {
      setConfig({
        ...template.defaultConfig,
        projectName: config.projectName || `prompt-${Date.now()}`
      });
      
      // تهيئة متغيرات البيئة المطلوبة
      const newEnvVars: Record<string, string> = {};
      template.requiredEnvVars.forEach(envVar => {
        newEnvVars[envVar] = '';
      });
      setEnvVars(newEnvVars);
    }
  };

  // تحديث الإعدادات
  const updateConfig = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // تحديث متغير البيئة
  const updateEnvVar = (key: string, value: string) => {
    setEnvVars(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // نشر المطالبة
  const handleDeploy = async () => {
    if (!selectedPrompt || !selectedPlatform) {
      alert('يرجى اختيار مطالبة ومنصة');
      return;
    }

    setIsDeploying(true);
    setDeploymentLogs([]);

    try {
      const deploymentConfig = {
        ...config,
        envVars
      };

      const response = await fetch('/api/deploy/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          promptId: selectedPrompt,
          config: deploymentConfig
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setDeploymentLogs(result.data.logs);
        
        if (result.data.success) {
          alert('تم النشر بنجاح!');
          loadDeployments();
          setActiveTab('monitor');
        } else {
          alert(`فشل النشر: ${result.data.error}`);
        }
      } else {
        alert(`خطأ: ${result.error}`);
      }
    } catch (error) {
      console.error('خطأ في النشر:', error);
      alert('حدث خطأ أثناء النشر');
    } finally {
      setIsDeploying(false);
    }
  };

  // حذف نشر
  const handleDeleteDeployment = async (deploymentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا النشر؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/deploy/deployments/${deploymentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadDeployments();
      } else {
        alert('فشل في حذف النشر');
      }
    } catch (error) {
      console.error('خطأ في حذف النشر:', error);
      alert('حدث خطأ أثناء حذف النشر');
    }
  };

  // نسخ الرابط
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('تم نسخ الرابط');
  };

  // الحصول على لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500';
      case 'building': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // الحصول على لون الصحة
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const selectedTemplate = platforms.find(p => p.name === selectedPlatform);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Cloud className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">النشر السحابي</h1>
          <p className="text-gray-600">انشر مطالباتك على منصات سحابية مختلفة</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deploy" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            نشر جديد
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            مراقبة النشرات
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        {/* تبويب النشر الجديد */}
        <TabsContent value="deploy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* اختيار المطالبة والمنصة */}
            <Card>
              <CardHeader>
                <CardTitle>إعدادات النشر</CardTitle>
                <CardDescription>اختر المطالبة والمنصة السحابية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt">المطالبة</Label>
                  <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مطالبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {prompts.map(prompt => (
                        <SelectItem key={prompt.id} value={prompt.id.toString()}>
                          {prompt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="platform">المنصة السحابية</Label>
                  <Select value={selectedPlatform} onValueChange={handlePlatformSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر منصة" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map(platform => (
                        <SelectItem key={platform.name} value={platform.name}>
                          {platform.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {selectedTemplate.description}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* إعدادات المشروع */}
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات المشروع</CardTitle>
                  <CardDescription>تخصيص إعدادات النشر</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="projectName">اسم المشروع</Label>
                    <Input
                      id="projectName"
                      value={config.projectName}
                      onChange={(e) => updateConfig('projectName', e.target.value)}
                      placeholder="my-prompt-app"
                    />
                  </div>

                  <div>
                    <Label htmlFor="region">المنطقة</Label>
                    <Select value={config.region} onValueChange={(value) => updateConfig('region', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر منطقة" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTemplate.supportedRegions.map(region => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="environment">البيئة</Label>
                    <Select value={config.environment} onValueChange={(value) => updateConfig('environment', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">تطوير</SelectItem>
                        <SelectItem value="staging">اختبار</SelectItem>
                        <SelectItem value="production">إنتاج</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* متغيرات البيئة */}
          {selectedTemplate && selectedTemplate.requiredEnvVars.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>متغيرات البيئة</CardTitle>
                <CardDescription>أدخل المتغيرات المطلوبة للنشر</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTemplate.requiredEnvVars.map(envVar => (
                  <div key={envVar}>
                    <Label htmlFor={envVar}>
                      {envVar} <Badge variant="destructive">مطلوب</Badge>
                    </Label>
                    <Input
                      id={envVar}
                      type={envVar.includes('KEY') || envVar.includes('SECRET') ? 'password' : 'text'}
                      value={envVars[envVar] || ''}
                      onChange={(e) => updateEnvVar(envVar, e.target.value)}
                      placeholder={`أدخل ${envVar}`}
                    />
                  </div>
                ))}
                
                {selectedTemplate.optionalEnvVars.map(envVar => (
                  <div key={envVar}>
                    <Label htmlFor={envVar}>
                      {envVar} <Badge variant="secondary">اختياري</Badge>
                    </Label>
                    <Input
                      id={envVar}
                      type={envVar.includes('KEY') || envVar.includes('SECRET') ? 'password' : 'text'}
                      value={envVars[envVar] || ''}
                      onChange={(e) => updateEnvVar(envVar, e.target.value)}
                      placeholder={`أدخل ${envVar}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* زر النشر */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">جاهز للنشر؟</h3>
                  <p className="text-sm text-gray-600">سيتم إنشاء نشر جديد على {selectedTemplate?.displayName}</p>
                </div>
                <Button 
                  onClick={handleDeploy} 
                  disabled={isDeploying || !selectedPrompt || !selectedPlatform}
                  className="flex items-center gap-2"
                >
                  {isDeploying ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      جاري النشر...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      نشر الآن
                    </>
                  )}
                </Button>
              </div>

              {/* سجلات النشر */}
              {deploymentLogs.length > 0 && (
                <div className="mt-4">
                  <Label>سجلات النشر</Label>
                  <Textarea
                    value={deploymentLogs.join('\n')}
                    readOnly
                    className="mt-2 h-32 font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب مراقبة النشرات */}
        <TabsContent value="monitor" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">النشرات النشطة</h2>
            <Button onClick={loadDeployments} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              تحديث
            </Button>
          </div>

          <div className="grid gap-4">
            {deployments.map(deployment => {
              const healthCheck = healthChecks[deployment.id];
              
              return (
                <Card key={deployment.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(deployment.status)}`} />
                          <h3 className="font-semibold">{deployment.id}</h3>
                          <Badge variant="outline">{deployment.status}</Badge>
                        </div>
                        
                        {deployment.url && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <ExternalLink className="h-4 w-4" />
                            <a 
                              href={deployment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {deployment.url}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyUrl(deployment.url!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {healthCheck && (
                          <div className="flex items-center gap-4 text-sm">
                            <div className={`flex items-center gap-1 ${getHealthColor(healthCheck.status)}`}>
                              {healthCheck.status === 'healthy' ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <AlertCircle className="h-4 w-4" />
                              )}
                              {healthCheck.status}
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="h-4 w-4" />
                              {healthCheck.responseTime}ms
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          تم الإنشاء: {new Date(deployment.createdAt).toLocaleString('ar')}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadHealthCheck(deployment.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDeployment(deployment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {deployment.logs.length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-medium">
                          عرض السجلات ({deployment.logs.length})
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono">
                          {deployment.logs.map((log, index) => (
                            <div key={index}>{log}</div>
                          ))}
                        </div>
                      </details>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {deployments.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <Cloud className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد نشرات حالياً</p>
                  <p className="text-sm">ابدأ بإنشاء نشر جديد من تبويب "نشر جديد"</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* تبويب الإعدادات */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النشر السحابي</CardTitle>
              <CardDescription>تخصيص إعدادات النشر العامة</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">ستتم إضافة إعدادات إضافية هنا لاحقاً</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}