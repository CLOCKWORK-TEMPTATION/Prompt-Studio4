import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Server, 
  Database, 
  Cpu, 
  MemoryStick,
  Wifi,
  Bell,
  Settings
} from 'lucide-react';

/**
 * صفحة المراقبة والتنبيهات
 */

interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  process: {
    memoryUsage: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    uptime: number;
    pid: number;
  };
  database: {
    connectionCount: number;
    responseTime: number;
    isHealthy: boolean;
  };
  redis: {
    isConnected: boolean;
    responseTime: number;
    memoryUsage: number;
  };
  http: {
    activeConnections: number;
    requestsPerMinute: number;
    averageResponseTime: number;
  };
}

interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  uptime: number;
  lastCheck: number;
}

export default function Monitoring() {
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // جلب البيانات
  const fetchData = async () => {
    try {
      const [metricsRes, healthRes, activeAlertsRes, allAlertsRes] = await Promise.all([
        fetch('/api/monitoring/metrics/current'),
        fetch('/api/monitoring/health'),
        fetch('/api/monitoring/alerts/active'),
        fetch('/api/monitoring/alerts?limit=50'),
      ]);

      if (metricsRes.ok) {
        const metrics = await metricsRes.json();
        setCurrentMetrics(metrics);
      }

      if (healthRes.ok) {
        const health = await healthRes.json();
        setHealthStatus(health);
      }

      if (activeAlertsRes.ok) {
        const alerts = await activeAlertsRes.json();
        setActiveAlerts(alerts);
      }

      if (allAlertsRes.ok) {
        const alerts = await allAlertsRes.json();
        setAllAlerts(alerts);
      }

      setError(null);
    } catch (err) {
      setError('فشل في جلب بيانات المراقبة');
      console.error('خطأ في جلب بيانات المراقبة:', err);
    } finally {
      setLoading(false);
    }
  };

  // تحديث تلقائي
  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // كل 30 ثانية
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // حل تنبيه
  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitoring/alerts/${alertId}/resolve`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchData(); // تحديث البيانات
      } else {
        throw new Error('فشل في حل التنبيه');
      }
    } catch (err) {
      console.error('خطأ في حل التنبيه:', err);
    }
  };

  // تنسيق الوقت
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ar-EG');
  };

  // تنسيق الحجم
  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // تنسيق مدة التشغيل
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} يوم، ${hours} ساعة`;
    } else if (hours > 0) {
      return `${hours} ساعة، ${minutes} دقيقة`;
    } else {
      return `${minutes} دقيقة`;
    }
  };

  // الحصول على لون الشدة
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  // الحصول على أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>جاري تحميل بيانات المراقبة...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مراقبة النظام</h1>
          <p className="text-muted-foreground">
            مراقبة الأداء والصحة العامة للتطبيق
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            تحديث تلقائي
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            تحديث الآن
          </Button>
        </div>
      </div>

      {/* رسالة خطأ */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* حالة الصحة العامة */}
      {healthStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(healthStatus.status)}
              حالة النظام العامة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
                  {healthStatus.status === 'healthy' ? 'سليم' : 
                   healthStatus.status === 'warning' ? 'تحذير' : 'حرج'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مدة التشغيل</p>
                <p className="font-medium">{formatUptime(healthStatus.uptime)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">آخر فحص</p>
                <p className="font-medium">{formatTime(healthStatus.lastCheck)}</p>
              </div>
            </div>
            {healthStatus.issues.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">المشاكل المكتشفة:</p>
                <ul className="space-y-1">
                  {healthStatus.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">المقاييس</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        {/* تبويب المقاييس */}
        <TabsContent value="metrics" className="space-y-4">
          {currentMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* استخدام المعالج */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">استخدام المعالج</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMetrics.cpu.usage.toFixed(1)}%</div>
                  <Progress value={currentMetrics.cpu.usage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    متوسط التحميل: {currentMetrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}
                  </p>
                </CardContent>
              </Card>

              {/* استخدام الذاكرة */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">استخدام الذاكرة</CardTitle>
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMetrics.memory.percentage.toFixed(1)}%</div>
                  <Progress value={currentMetrics.memory.percentage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatBytes(currentMetrics.memory.used)} / {formatBytes(currentMetrics.memory.total)}
                  </p>
                </CardContent>
              </Card>

              {/* قاعدة البيانات */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">قاعدة البيانات</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {currentMetrics.database.isHealthy ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm">
                      {currentMetrics.database.isHealthy ? 'متصلة' : 'غير متصلة'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    زمن الاستجابة: {currentMetrics.database.responseTime.toFixed(0)}ms
                  </p>
                  <p className="text-xs text-muted-foreground">
                    الاتصالات النشطة: {currentMetrics.database.connectionCount}
                  </p>
                </CardContent>
              </Card>

              {/* Redis */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Redis</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {currentMetrics.redis.isConnected ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm">
                      {currentMetrics.redis.isConnected ? 'متصل' : 'غير متصل'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    زمن الاستجابة: {currentMetrics.redis.responseTime.toFixed(0)}ms
                  </p>
                  <p className="text-xs text-muted-foreground">
                    استخدام الذاكرة: {formatBytes(currentMetrics.redis.memoryUsage)}
                  </p>
                </CardContent>
              </Card>

              {/* HTTP */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">HTTP</CardTitle>
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMetrics.http.activeConnections}</div>
                  <p className="text-xs text-muted-foreground mt-2">اتصالات نشطة</p>
                  <p className="text-xs text-muted-foreground">
                    طلبات/دقيقة: {currentMetrics.http.requestsPerMinute}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    متوسط الاستجابة: {currentMetrics.http.averageResponseTime.toFixed(0)}ms
                  </p>
                </CardContent>
              </Card>

              {/* ذاكرة العملية */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ذاكرة العملية</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatBytes(currentMetrics.process.memoryUsage.heapUsed)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    المجموع: {formatBytes(currentMetrics.process.memoryUsage.heapTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    RSS: {formatBytes(currentMetrics.process.memoryUsage.rss)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    مدة التشغيل: {formatUptime(currentMetrics.process.uptime)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* تبويب التنبيهات */}
        <TabsContent value="alerts" className="space-y-4">
          {/* التنبيهات النشطة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                التنبيهات النشطة ({activeAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlerts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  لا توجد تنبيهات نشطة
                </p>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {alert.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{alert.message}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        حل
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* سجل التنبيهات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                سجل التنبيهات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allAlerts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  لا يوجد سجل تنبيهات
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-2 border-b">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityColor(alert.severity) as any} className="text-xs">
                            {alert.severity}
                          </Badge>
                          {alert.resolved && (
                            <Badge variant="secondary" className="text-xs">محلول</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTime(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الإعدادات */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات المراقبة
              </CardTitle>
              <CardDescription>
                إدارة إعدادات المراقبة والتنبيهات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">التحديث التلقائي</p>
                    <p className="text-sm text-muted-foreground">
                      تحديث البيانات تلقائياً كل 30 ثانية
                    </p>
                  </div>
                  <Button
                    variant={autoRefresh ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                  >
                    {autoRefresh ? 'مفعل' : 'معطل'}
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    لإعداد قنوات التنبيه والقواعد المخصصة، يرجى استخدام API المراقبة.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}