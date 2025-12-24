import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save, FileJson, LayoutTemplate, Link as LinkIcon, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { PromptHistory, PromptHistoryItem } from "@/components/PromptHistory";

interface Stage6OrganizeProps {
  onSaveTemplate: () => void;
  onExportJSON: () => void;
  onStartNew?: () => void;
  onLoadHistory?: (item: PromptHistoryItem) => void;
}

export function Stage6Organize({
  onSaveTemplate,
  onExportJSON,
  onStartNew,
  onLoadHistory,
}: Stage6OrganizeProps) {
  return (
    <div className="space-y-6" data-testid="stage-6-organize">
      <Card>
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

          {onStartNew && (
            <div className="border-t pt-4">
              <Button
                onClick={onStartNew}
                variant="default"
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                data-testid="button-start-new"
              >
                <RefreshCw className="ml-2 size-5" />
                بدء مطالبة جديدة
              </Button>
            </div>
          )}

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

      {/* History Section */}
      {onLoadHistory && <PromptHistory onLoad={onLoadHistory} />}
    </div>
  );
}

