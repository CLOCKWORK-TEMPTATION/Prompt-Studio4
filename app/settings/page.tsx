import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Lock } from "lucide-react";

export default function Settings() {
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
              <Input placeholder="https://api.openai.com/v1" defaultValue="https://api.openai.com/v1" className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">اتركه افتراضياً لـ OpenAI أو غيّره لـ Local LLM</p>
            </div>
            
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input type="password" placeholder="sk-..." className="font-mono text-sm pl-10" />
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded mt-1 border border-yellow-200">
                ملاحظة: يتم حفظ المفاتيح في Secrets الخاصة بـ NEXT ولا تظهر في المتصفح.
              </p>
            </div>
          </CardContent>
          <div className="border-t p-4 flex justify-end">
            <Button>حفظ التغييرات</Button>
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
                <Switch />
             </div>
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>اتجاه الواجهة</Label>
                  <p className="text-xs text-muted-foreground">فرض RTL دائماً</p>
                </div>
                <Switch defaultChecked />
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
