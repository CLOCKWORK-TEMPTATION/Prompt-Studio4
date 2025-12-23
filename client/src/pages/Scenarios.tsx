import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Play, Download, Trash, Upload, FileJson } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Scenarios() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newScenario, setNewScenario] = useState({ title: "", description: "", content: "{}" });

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["scenarios"],
    queryFn: async () => {
      const res = await fetch("/api/scenarios");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: (query) => {
        const data = query.state.data as any[];
        if (data?.some((s: any) => s.status === "running")) return 1000;
        return false;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      setIsUploadOpen(false);
      setNewScenario({ title: "", description: "", content: "{}" });
      toast({ title: "تم", description: "تم إنشاء السيناريو بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إنشاء السيناريو" });
    }
  });

  const runMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/scenarios/${id}/run`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to run");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      toast({ title: "جاري التشغيل", description: "بدأ تنفيذ السيناريو" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تشغيل السيناريو" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      toast({ title: "تم الحذف", description: "تم حذف السيناريو بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف السيناريو" });
    }
  });

  const handleCreate = () => {
    try {
        const contentJson = JSON.parse(newScenario.content);
        createMutation.mutate({ ...newScenario, content: contentJson });
    } catch (e) {
        toast({ variant: "destructive", title: "خطأ", description: "محتوى JSON غير صالح" });
    }
  };

  const handleExport = (id: number) => {
    window.location.href = `/api/scenarios/${id}/export`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة السيناريوهات</h1>
          <p className="text-muted-foreground mt-2">تحميل وتشغيل سيناريوهات الاختبار ({scenarios.length})</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
                <Button><Upload className="ml-2 size-4" /> تحميل سيناريو</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تحميل سيناريو جديد</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">العنوان</Label>
                        <Input id="title" value={newScenario.title} onChange={e => setNewScenario({...newScenario, title: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">الوصف</Label>
                        <Input id="description" value={newScenario.description} onChange={e => setNewScenario({...newScenario, description: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="content">محتوى JSON</Label>
                        <Textarea id="content" rows={10} value={newScenario.content} onChange={e => setNewScenario({...newScenario, content: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="file">أو تحميل ملف JSON</Label>
                        <Input id="file" type="file" accept=".json" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    const text = e.target?.result as string;
                                    setNewScenario(prev => ({ ...prev, content: text }));
                                };
                                reader.readAsText(file);
                            }
                        }} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                        {createMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                        حفظ
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {scenarios.map((scenario: any) => (
          <Card key={scenario.id}>
            <CardHeader>
                <div className="flex justify-between">
                    <div>
                        <CardTitle>{scenario.title}</CardTitle>
                        <CardDescription>{scenario.description}</CardDescription>
                    </div>
                    <Badge variant={scenario.status === 'completed' ? 'default' : scenario.status === 'running' ? 'secondary' : 'outline'}>
                        {scenario.status === 'completed' ? 'مكتمل' : scenario.status === 'running' ? 'جاري التشغيل' : scenario.status === 'failed' ? 'فشل' : 'معلق'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {scenario.status === 'running' && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>جاري التنفيذ...</span>
                            <span>{scenario.progress}%</span>
                        </div>
                        <Progress value={scenario.progress} />
                    </div>
                )}
                {scenario.status === 'completed' && scenario.result && (
                     <div className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(scenario.result, null, 2)}</pre>
                     </div>
                )}
                 {scenario.status === 'failed' && scenario.result && (
                     <div className="mt-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                        Error: {scenario.result.error}
                     </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(scenario.id)}>
                    <Trash className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport(scenario.id)} disabled={scenario.status !== 'completed'}>
                    <Download className="ml-2 size-4" /> تصدير التقرير
                </Button>
                <Button size="sm" onClick={() => runMutation.mutate(scenario.id)} disabled={scenario.status === 'running'}>
                    <Play className="ml-2 size-4" /> تشغيل
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
