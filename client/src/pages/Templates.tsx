import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Copy, Edit, Trash, Loader2, Zap, Filter } from "lucide-react";
import { templatesApi } from "@/lib/api";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Templates() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ["templates", search, category],
    queryFn: () => templatesApi.getAll(search || undefined),
  });

  const filteredTemplates = category 
    ? templates.filter(t => t.category === category)
    : templates;

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const handleUseTemplate = (template: typeof templates[0]) => {
    // Store template in sessionStorage to be loaded in Stage0
    sessionStorage.setItem('selectedTemplate', JSON.stringify(template));
    sessionStorage.setItem('templateIdea', template.name);
    toast({ 
      title: "تم تحميل القالب", 
      description: "انتقل إلى المحرر لبدء العمل" 
    });
    setLocation('/studio');
  };

  const handleCopyTemplate = (template: typeof templates[0]) => {
    navigator.clipboard.writeText(JSON.stringify(template.sections, null, 2));
    toast({ title: "تم النسخ", description: "تم نسخ القالب إلى الحافظة" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        حدث خطأ أثناء تحميل القوالب
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">مكتبة القوالب</h1>
          <p className="text-muted-foreground mt-2">
            {filteredTemplates.length} من {templates.length} قالب جاهز للاستخدام
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-4 bg-muted/20 p-6 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="size-4 text-muted-foreground" />
          <h3 className="font-semibold">البحث والتصفية</h3>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute right-3 top-3 size-4 text-muted-foreground" />
            <Input 
              className="pl-4 pr-10 h-10 w-full bg-background" 
              placeholder="ابحث عن قالب..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={category || ""} onValueChange={(val) => setCategory(val || null)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="اختر الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع الفئات</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">لا توجد قوالب مطابقة للبحث</p>
          <p className="text-sm">جرب تغيير معايير البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <Card 
              key={template.id} 
              className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer border bg-card group"
            >
              <CardHeader>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  {template.tags && template.tags.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {template.tags.length} علامة
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                <CardDescription className="line-clamp-2 text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Variables Display */}
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">المتغيرات:</p>
                    <div className="flex flex-wrap gap-2">
                      {(template.variables as string[]).map((variable: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags Display */}
                {template.tags && template.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">العلامات:</p>
                    <div className="flex flex-wrap gap-2">
                      {(template.tags as string[]).map((tag: string, idx: number) => (
                        <span 
                          key={idx}
                          className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => handleUseTemplate(template)}
                >
                  <Zap className="ml-2 size-4" />
                  استخدام
                </Button>
                <TemplatePreview template={template} onUse={handleUseTemplate} />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCopyTemplate(template)}
                  title="نسخ القالب"
                >
                  <Copy className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
