import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save, FileJson, LayoutTemplate, Link as LinkIcon } from "lucide-react";
import { Link } from "wouter";

interface Stage6OrganizeProps {
  onSaveTemplate: () => void;
  onExportJSON: () => void;
}

export function Stage6Organize({
  onSaveTemplate,
  onExportJSON,
}: Stage6OrganizeProps) {
  return (
    <Card data-testid="stage-6-organize">
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-2">حفظ وتنظيم المطالبة</h3>
          <p className="text-sm text-muted-foreground">
            احفظ المطالبة كقالب لإعادة استخدامها أو صدّرها بصيغة JSON
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <LayoutTemplate className="size-5" />
              <h4 className="font-semibold">حفظ كقالب</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              احفظ المطالبة في مكتبة القوالب لإعادة استخدامها
            </p>
            <Button onClick={onSaveTemplate} className="w-full" data-testid="button-save-template">
              <Save className="ml-2 size-4" />
              حفظ كقالب
            </Button>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <FileJson className="size-5" />
              <h4 className="font-semibold">تصدير JSON</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              صدّر المطالبة بصيغة JSON للاستخدام خارج التطبيق
            </p>
            <Button onClick={onExportJSON} variant="outline" className="w-full" data-testid="button-export-json">
              <FileJson className="ml-2 size-4" />
              تصدير JSON
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">روابط سريعة</h4>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/templates">
              <Button variant="outline" className="w-full" data-testid="link-templates">
                <LinkIcon className="ml-2 size-4" />
                مكتبة القوالب
              </Button>
            </Link>
            <Link href="/runs">
              <Button variant="outline" className="w-full" data-testid="link-runs">
                <LinkIcon className="ml-2 size-4" />
                سجل التشغيلات
              </Button>
            </Link>
            <Link href="/techniques">
              <Button variant="outline" className="w-full" data-testid="link-techniques">
                <LinkIcon className="ml-2 size-4" />
                التقنيات
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full" data-testid="link-settings">
                <LinkIcon className="ml-2 size-4" />
                الإعدادات
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
