import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Zap, DollarSign, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock analytics data
const ANALYTICS_DATA = {
  totalRuns: 42,
  totalCost: 0.124,
  totalTokens: 15420,
  avgDuration: 2.3,
  successRate: 95.2,
  trends: {
    runsChange: +12,
    costChange: -8,
    tokensChange: +5,
    durationChange: -15,
  },
  topModels: [
    { name: "GPT-4o", runs: 25, cost: 0.089, avgTokens: 580 },
    { name: "Claude 3.5 Sonnet", runs: 12, cost: 0.025, avgTokens: 420 },
    { name: "Gemini Pro", runs: 5, cost: 0.010, avgTokens: 350 },
  ],
  recentActivity: [
    { id: 1, prompt: "تحليل كود بايثون", model: "gpt-4o", tokens: 450, cost: 0.0045, status: "success", time: "منذ ساعة" },
    { id: 2, prompt: "كتابة محتوى تسويقي", model: "claude-3-5-sonnet", tokens: 620, cost: 0.0062, status: "success", time: "منذ 3 ساعات" },
    { id: 3, prompt: "ترجمة مستند تقني", model: "gpt-4o", tokens: 890, cost: 0.0089, status: "success", time: "منذ 5 ساعات" },
    { id: 4, prompt: "توليد اختبارات", model: "gemini-pro", tokens: 320, cost: 0.0016, status: "failed", time: "منذ يوم" },
  ],
  qualityMetrics: {
    avgClarity: 85,
    avgSpecificity: 78,
    avgStructure: 92,
    avgExamples: 65,
  },
};

export default function Analytics() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">لوحة التحليلات</h1>
        <p className="text-muted-foreground mt-2">نظرة شاملة على أداء البرومبتات</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي التشغيلات</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ANALYTICS_DATA.totalRuns}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp className="size-3" />
              <span>+{ANALYTICS_DATA.trends.runsChange}% هذا الأسبوع</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي التكلفة</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${ANALYTICS_DATA.totalCost.toFixed(3)}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingDown className="size-3" />
              <span>{ANALYTICS_DATA.trends.costChange}% هذا الأسبوع</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي التوكنات</CardTitle>
            <Zap className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ANALYTICS_DATA.totalTokens.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
              <TrendingUp className="size-3" />
              <span>+{ANALYTICS_DATA.trends.tokensChange}% هذا الأسبوع</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">متوسط الوقت</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ANALYTICS_DATA.avgDuration}s</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingDown className="size-3" />
              <span>{Math.abs(ANALYTICS_DATA.trends.durationChange)}% أسرع</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Models */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>النماذج الأكثر استخداماً</CardTitle>
            <CardDescription>مقارنة الأداء حسب النموذج</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ANALYTICS_DATA.topModels.map((model, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{model.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {model.runs} تشغيل | متوسط {model.avgTokens} توكن
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-green-600">
                      ${model.cost.toFixed(4)}
                    </div>
                    <div className="text-xs text-muted-foreground">تكلفة إجمالية</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quality Score */}
        <Card>
          <CardHeader>
            <CardTitle>متوسط الجودة</CardTitle>
            <CardDescription>مقاييس جودة البرومبتات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>الوضوح</span>
                <span className="font-bold">{ANALYTICS_DATA.qualityMetrics.avgClarity}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500"
                  style={{ width: `${ANALYTICS_DATA.qualityMetrics.avgClarity}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>التحديد</span>
                <span className="font-bold">{ANALYTICS_DATA.qualityMetrics.avgSpecificity}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500"
                  style={{ width: `${ANALYTICS_DATA.qualityMetrics.avgSpecificity}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>البنية</span>
                <span className="font-bold">{ANALYTICS_DATA.qualityMetrics.avgStructure}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500"
                  style={{ width: `${ANALYTICS_DATA.qualityMetrics.avgStructure}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>الأمثلة</span>
                <span className="font-bold">{ANALYTICS_DATA.qualityMetrics.avgExamples}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500"
                  style={{ width: `${ANALYTICS_DATA.qualityMetrics.avgExamples}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>النشاط الأخير</CardTitle>
          <CardDescription>آخر عمليات التشغيل</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ANALYTICS_DATA.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-sm">{activity.prompt}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="text-xs">{activity.model}</Badge>
                    <span className="text-xs text-muted-foreground">{activity.tokens} tokens</span>
                    <span className="text-xs text-muted-foreground">${activity.cost.toFixed(4)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                  <Badge 
                    className={cn(
                      "text-xs",
                      activity.status === "success" 
                        ? "bg-green-100 text-green-700 hover:bg-green-100" 
                        : "bg-red-100 text-red-700 hover:bg-red-100"
                    )}
                  >
                    {activity.status === "success" ? "نجح" : "فشل"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
