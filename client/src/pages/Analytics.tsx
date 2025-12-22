import { useState, useEffect } from "react";
import { BarChart2, RefreshCw, Trash2, Settings as SettingsIcon, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface CacheAnalytics {
    totalEntries: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    tokensSaved: number;
    estimatedCostSaved: number;
    averageSimilarity: number;
    cacheSize: number;
    oldestEntry: string;
    newestEntry: string;
    topTags: Array<{ tag: string; count: number }>;
    dailyStats: any[];
}

interface CacheConfig {
    enabled: boolean;
    similarityThreshold: number;
    defaultTTLSeconds: number;
    maxCacheSize: number;
}

interface CleanupStatus {
    isRunning: boolean;
    isEnabled: boolean;
    intervalMinutes: number;
    isCleanupInProgress: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<CacheAnalytics | null>(null);
    const [config, setConfig] = useState<CacheConfig | null>(null);
    const [cleanupStatus, setCleanupStatus] = useState<CleanupStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch analytics data
            const analyticsResponse = await fetch("/api/cache/analytics");
            if (!analyticsResponse.ok) throw new Error("Failed to fetch analytics");

            const analyticsData = await analyticsResponse.json();
            setAnalytics(analyticsData);

            // Fetch cache configuration
            const configResponse = await fetch("/api/cache/config");
            if (!configResponse.ok) throw new Error("Failed to fetch config");

            const configData = await configResponse.json();
            setConfig(configData);

            // Fetch cleanup scheduler status
            const cleanupResponse = await fetch("/api/cache/cleanup/status");
            if (cleanupResponse.ok) {
                const cleanupData = await cleanupResponse.json();
                setCleanupStatus(cleanupData);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load analytics");
            toast({
                title: "خطأ",
                description: "فشل في تحميل بيانات التحليلات",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClearCache = async () => {
        if (!window.confirm("هل أنت متأكد من رغبتك في مسح جميع بيانات التخزين المؤقت؟")) return;

        try {
            const response = await fetch("/api/cache/invalidate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ type: "all" }),
            });

            if (!response.ok) throw new Error("Failed to clear cache");

            toast({
                title: "نجاح",
                description: "تم مسح التخزين المؤقت بنجاح",
            });

            // Refresh analytics after clearing
            fetchAnalytics();
        } catch (err) {
            toast({
                title: "خطأ",
                description: "فشل في مسح التخزين المؤقت",
                variant: "destructive",
            });
        }
    };

    const handleUpdateConfig = async (updates: Partial<CacheConfig>) => {
        try {
            const response = await fetch("/api/cache/config", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) throw new Error("Failed to update config");

            const updatedConfig = await response.json();
            setConfig(updatedConfig);

            toast({
                title: "نجاح",
                description: "تم تحديث إعدادات التخزين المؤقت",
            });
        } catch (err) {
            toast({
                title: "خطأ",
                description: "فشل في تحديث الإعدادات",
                variant: "destructive",
            });
        }
    };

    const handleManualCleanup = async () => {
        try {
            const response = await fetch("/api/cache/cleanup", {
                method: "POST",
            });

            if (!response.ok) throw new Error("Failed to trigger cleanup");

            const result = await response.json();

            toast({
                title: "نجاح",
                description: `تم حذف ${result.deletedCount} عنصر منتهي الصلاحية في ${result.duration}ms`,
            });

            // Refresh analytics after cleanup
            fetchAnalytics();
        } catch (err) {
            toast({
                title: "خطأ",
                description: "فشل في تنفيذ التنظيف",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                    <BarChart2 className="size-5" />
                    <h1 className="text-2xl font-bold">التحليلات</h1>
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                    <BarChart2 className="size-5" />
                    <h1 className="text-2xl font-bold">التحليلات</h1>
                </div>
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-destructive mb-4">خطأ: {error}</p>
                        <Button onClick={fetchAnalytics}>
                            <RefreshCw className="size-4 mr-2" />
                            إعادة المحاولة
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <BarChart2 className="size-5" />
                    <h1 className="text-2xl font-bold">التحليلات</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchAnalytics}>
                        <RefreshCw className="size-4 mr-2" />
                        تحديث
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleManualCleanup}>
                        <Play className="size-4 mr-2" />
                        تنظيف يدوي
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleClearCache}>
                        <Trash2 className="size-4 mr-2" />
                        مسح الكل
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">معدل الإصابات</CardTitle>
                        <BarChart2 className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analytics?.hitRate ? `${analytics.hitRate.toFixed(1)}%` : "0%"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {(analytics?.totalHits || 0)} إصابات من {(analytics?.totalHits || 0) + (analytics?.totalMisses || 0)} طلبات
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الرموز المحفوظة</CardTitle>
                        <BarChart2 className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analytics?.tokensSaved ? analytics.tokensSaved.toLocaleString() : "0"}
                        </div>
                        <p className="text-xs text-muted-foreground">رموز تم حفظها بواسطة التخزين</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">التكلفة المحفوظة</CardTitle>
                        <BarChart2 className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${analytics?.estimatedCostSaved ? analytics.estimatedCostSaved.toFixed(4) : "0.0000"}
                        </div>
                        <p className="text-xs text-muted-foreground">تكلفة تقديرية تم حفظها</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">حجم التخزين</CardTitle>
                        <BarChart2 className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analytics?.totalEntries ? analytics.totalEntries.toLocaleString() : "0"}
                        </div>
                        <p className="text-xs text-muted-foreground">إدخالات نشطة في التخزين</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                    <TabsTrigger value="performance">الأداء</TabsTrigger>
                    <TabsTrigger value="charts">الرسوم البيانية</TabsTrigger>
                    <TabsTrigger value="tags">العلامات</TabsTrigger>
                    <TabsTrigger value="config">الإعدادات</TabsTrigger>
                    <TabsTrigger value="scheduler">المُجدول</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card>
                        <CardHeader>
                            <CardTitle>إحصائيات التخزين الدلالي</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">معدل التشابه المتوسط</p>
                                    <p className="text-2xl font-bold">
                                        {analytics?.averageSimilarity ? (analytics.averageSimilarity * 100).toFixed(1) + "%" : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">أقدم إدخال</p>
                                    <p className="text-sm">
                                        {analytics?.oldestEntry || "لا توجد بيانات"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">أحدث إدخال</p>
                                    <p className="text-sm">
                                        {analytics?.newestEntry || "لا توجد بيانات"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance">
                    <Card>
                        <CardHeader>
                            <CardTitle>أداء التخزين</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">إجمالي الإصابات</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {analytics?.totalHits?.toLocaleString() || "0"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">إجمالي الفوات</p>
                                    <p className="text-3xl font-bold text-red-600">
                                        {analytics?.totalMisses?.toLocaleString() || "0"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">نسبة النجاح</p>
                                    <p className="text-3xl font-bold text-primary">
                                        {analytics?.totalHits && analytics?.totalMisses
                                            ? `${((((analytics.totalHits || 0) / ((analytics.totalHits || 0) + (analytics.totalMisses || 0))) * 100)).toFixed(1)}%`
                                            : "0%"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="charts" className="space-y-4">
                    {/* رسم بياني لإحصائيات الأداء اليومية */}
                    <Card>
                        <CardHeader>
                            <CardTitle>الإحصائيات اليومية</CardTitle>
                            <CardDescription>آخر 30 يوماً من أداء التخزين المؤقت</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics?.dailyStats || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(date) => new Date(date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis />
                                    <Tooltip 
                                        labelFormatter={(date) => new Date(date).toLocaleDateString('ar-SA')}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="hits" stroke="#22c55e" name="الإصابات" strokeWidth={2} />
                                    <Line type="monotone" dataKey="misses" stroke="#ef4444" name="الفوات" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* رسم بياني للرموز المحفوظة */}
                    <Card>
                        <CardHeader>
                            <CardTitle>الرموز المحفوظة</CardTitle>
                            <CardDescription>عدد الرموز التي تم حفظها يومياً</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics?.dailyStats || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(date) => new Date(date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis />
                                    <Tooltip 
                                        labelFormatter={(date) => new Date(date).toLocaleDateString('ar-SA')}
                                    />
                                    <Bar dataKey="tokensSaved" fill="#3b82f6" name="الرموز المحفوظة" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* رسم دائري لنسبة الإصابات والفوات */}
                    <Card>
                        <CardHeader>
                            <CardTitle>توزيع الإصابات والفوات</CardTitle>
                            <CardDescription>النسبة المئوية للإصابات مقابل الفوات</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'الإصابات', value: analytics?.totalHits || 0 },
                                            { name: 'الفوات', value: analytics?.totalMisses || 0 },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        <Cell fill="#22c55e" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tags">
                    <Card>
                        <CardHeader>
                            <CardTitle>العلامات الأكثر استخدامًا</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {analytics?.topTags && analytics.topTags.length > 0 ? (
                                <div className="space-y-4">
                                    {analytics.topTags.slice(0, 10).map((tag, index) => (
                                        <div key={tag.tag} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{tag.tag}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {tag.count} استخدامات
                                                </span>
                                                <div className="w-32 h-2 bg-gray-200 rounded-full">
                                                    <div
                                                        className="h-2 bg-primary rounded-full"
                                                        style={{
                                                            width: `${Math.min((tag.count / (analytics.topTags[0]?.count || 1)) * 100, 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">لا توجد علامات متاحة</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="config">
                    <Card>
                        <CardHeader>
                            <CardTitle>إعدادات التخزين الدلالي</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {config && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">التخزين مفعّل</p>
                                            <p className="font-medium">
                                                {config.enabled ? "مفعّل" : "معطل"}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={config.enabled ? "destructive" : "default"}
                                            onClick={() => handleUpdateConfig({ enabled: !config.enabled })}
                                        >
                                            {config.enabled ? "تعطيل" : "تفعيل"}
                                        </Button>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">عتبة التشابه</p>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="0.99"
                                                step="0.01"
                                                value={config.similarityThreshold}
                                                onChange={(e) =>
                                                    handleUpdateConfig({
                                                        similarityThreshold: parseFloat(e.target.value)
                                                    })
                                                }
                                                className="flex-1"
                                            />
                                            <span className="text-sm font-medium">
                                                {(config.similarityThreshold * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">الحد الأقصى لحجم التخزين</p>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="1000"
                                                max="50000"
                                                step="1000"
                                                value={config.maxCacheSize}
                                                onChange={(e) =>
                                                    handleUpdateConfig({
                                                        maxCacheSize: parseInt(e.target.value)
                                                    })
                                                }
                                                className="flex-1"
                                            />
                                            <span className="text-sm font-medium">
                                                {config.maxCacheSize.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">الوقت الافتراضي للاحتفاظ (بالثواني)</p>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="300"
                                                max="86400"
                                                step="300"
                                                value={config.defaultTTLSeconds}
                                                onChange={(e) =>
                                                    handleUpdateConfig({
                                                        defaultTTLSeconds: parseInt(e.target.value)
                                                    })
                                                }
                                                className="flex-1"
                                            />
                                            <span className="text-sm font-medium">
                                                {Math.floor(config.defaultTTLSeconds / 60)} دقائق
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="scheduler">
                    <Card>
                        <CardHeader>
                            <CardTitle>مُجدول التنظيف التلقائي</CardTitle>
                            <CardDescription>إدارة عمليات التنظيف الدورية للتخزين المؤقت</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {cleanupStatus && (
                                <>
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Clock className="size-5 text-primary" />
                                            <div>
                                                <p className="font-medium">حالة المُجدول</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {cleanupStatus.isRunning 
                                                        ? `يعمل - التنظيف كل ${cleanupStatus.intervalMinutes} دقيقة` 
                                                        : 'متوقف'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`size-3 rounded-full ${cleanupStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                    </div>

                                    {cleanupStatus.isCleanupInProgress && (
                                        <div className="p-4 border border-yellow-500 rounded-lg bg-yellow-50">
                                            <div className="flex items-center gap-2 text-yellow-800">
                                                <RefreshCw className="size-4 animate-spin" />
                                                <span className="text-sm font-medium">عملية تنظيف جارية...</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-2">الفترة الزمنية (بالدقائق)</p>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="1440"
                                                    step="5"
                                                    value={cleanupStatus.intervalMinutes}
                                                    onChange={async (e) => {
                                                        const newInterval = parseInt(e.target.value);
                                                        try {
                                                            await fetch("/api/cache/cleanup/config", {
                                                                method: "PUT",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ 
                                                                    intervalMinutes: newInterval,
                                                                    enabled: cleanupStatus.isEnabled 
                                                                }),
                                                            });
                                                            fetchAnalytics();
                                                        } catch (err) {
                                                            toast({
                                                                title: "خطأ",
                                                                description: "فشل في تحديث الإعدادات",
                                                                variant: "destructive",
                                                            });
                                                        }
                                                    }}
                                                    className="flex-1"
                                                />
                                                <span className="text-sm font-medium w-24">
                                                    {cleanupStatus.intervalMinutes < 60
                                                        ? `${cleanupStatus.intervalMinutes} دقيقة`
                                                        : `${Math.floor(cleanupStatus.intervalMinutes / 60)} ساعة`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">التفعيل التلقائي</p>
                                                <p className="font-medium">
                                                    {cleanupStatus.isEnabled ? "مفعّل" : "معطل"}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={cleanupStatus.isEnabled ? "destructive" : "default"}
                                                onClick={async () => {
                                                    try {
                                                        await fetch("/api/cache/cleanup/config", {
                                                            method: "PUT",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ 
                                                                intervalMinutes: cleanupStatus.intervalMinutes,
                                                                enabled: !cleanupStatus.isEnabled 
                                                            }),
                                                        });
                                                        fetchAnalytics();
                                                    } catch (err) {
                                                        toast({
                                                            title: "خطأ",
                                                            description: "فشل في تحديث الإعدادات",
                                                            variant: "destructive",
                                                        });
                                                    }
                                                }}
                                            >
                                                {cleanupStatus.isEnabled ? "تعطيل" : "تفعيل"}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
