import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Edit, Trash, Download, Upload, Plus, FileDown } from "lucide-react";
import { MOCK_TEMPLATES } from "@/lib/mock-api";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  downloadTemplate, 
  downloadTemplates, 
  importTemplate, 
  readFileAsText,
  saveCustomTemplate,
  getCustomTemplates,
  deleteCustomTemplate
} from "@/lib/template-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Template } from "@/lib/types";

export default function Templates() {
  const [search, setSearch] = useState("");
  const [customTemplates, setCustomTemplates] = useState<Template[]>(getCustomTemplates());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const allTemplates = [...MOCK_TEMPLATES, ...customTemplates];
  const filtered = allTemplates.filter(t => 
    t.name.includes(search) || 
    t.description.includes(search) ||
    t.tags.some(tag => tag.includes(search))
  );

  const handleExport = (template: Template) => {
    downloadTemplate(template);
    toast({ title: "تم التصدير", description: `تم تصدير القالب "${template.name}" بنجاح` });
  };

  const handleExportAll = () => {
    downloadTemplates(allTemplates, 'all_templates.json');
    toast({ title: "تم التصدير", description: `تم تصدير ${allTemplates.length} قالب` });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      const template = importTemplate(content);
      
      // Generate new ID for imported template
      template.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      saveCustomTemplate(template);
      setCustomTemplates(getCustomTemplates());
      
      toast({ 
        title: "تم الاستيراد", 
        description: `تم استيراد القالب "${template.name}" بنجاح` 
      });
    } catch (error) {
      toast({ 
        title: "خطأ في الاستيراد", 
        description: error instanceof Error ? error.message : "فشل استيراد القالب",
        variant: "destructive" 
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (template: Template) => {
    if (!template.id.startsWith('imported_') && !template.id.startsWith('custom_')) {
      toast({ 
        title: "غير مسموح", 
        description: "لا يمكن حذف القوالب المدمجة",
        variant: "destructive" 
      });
      return;
    }

    deleteCustomTemplate(template.id);
    setCustomTemplates(getCustomTemplates());
    toast({ title: "تم الحذف", description: `تم حذف القالب "${template.name}"` });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">مكتبة القوالب</h1>
          <p className="text-muted-foreground mt-2">قوالب جاهزة لبدء العمل بسرعة</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="ml-2 size-4" />
            استيراد
          </Button>
          <Button variant="outline" onClick={handleExportAll}>
            <FileDown className="ml-2 size-4" />
            تصدير الكل
          </Button>
          <Button>
            <Plus className="ml-2 size-4" />
            قالب جديد
          </Button>
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute right-3 top-3 size-4 text-muted-foreground" />
        <Input 
          className="pl-4 pr-10 h-10 w-full md:w-96 bg-card" 
          placeholder="بحث في القوالب..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(template => (
          <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer border-muted bg-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <Badge variant="outline" className="mb-2">{template.category}</Badge>
                  {(template.id.startsWith('imported_') || template.id.startsWith('custom_')) && (
                    <Badge variant="secondary" className="mb-2 text-xs">مخصص</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 text-muted-foreground"
                     onClick={(e) => {
                       e.stopPropagation();
                       handleExport(template);
                     }}
                   >
                     <Download className="size-3" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                     <Edit className="size-3" />
                   </Button>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 text-muted-foreground"
                     onClick={(e) => {
                       e.stopPropagation();
                       handleDelete(template);
                     }}
                   >
                     <Trash className="size-3" />
                   </Button>
                </div>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="line-clamp-2">{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mt-2">
                {template.tags.map(tag => (
                  <span key={tag} className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">#{tag}</span>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="secondary">
                <Copy className="ml-2 size-4" />
                استخدام القالب
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          لم يتم العثور على قوالب تطابق البحث
        </div>
      )}
    </div>
  );
}
