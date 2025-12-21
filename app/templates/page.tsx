import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Edit, Trash, Loader2 } from "lucide-react";
import { templatesApi } from "@/lib/api";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Templates() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ["templates", search],
    queryFn: () => templatesApi.getAll(search || undefined),
  });

  const handleUseTemplate = (template: typeof templates[0]) => {
    // Copy template to clipboard or navigate to studio with template
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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">مكتبة القوالب</h1>
          <p className="text-muted-foreground mt-2">قوالب جاهزة لبدء العمل بسرعة ({templates.length} قالب)</p>
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute right-3 top-3 size-4 text-muted-foreground" />
        <Input 
          className="pl-4 pr-10 h-10 w-full md:w-96 bg-card" 
          placeholder="بحث في القوالب..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-templates"
        />
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          لا توجد قوالب مطابقة للبحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer border-muted bg-card" data-testid={`card-template-${template.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="mb-2">{template.category}</Badge>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="line-clamp-2">{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(template.tags as string[]).map((tag: string) => (
                    <span key={tag} className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">#{tag}</span>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="secondary" onClick={() => handleUseTemplate(template)} data-testid={`button-use-template-${template.id}`}>
                  <Copy className="ml-2 size-4" />
                  استخدام القالب
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
