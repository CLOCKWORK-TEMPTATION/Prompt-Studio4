"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Run } from "@/lib/types";
import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Runs() {
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);

  const { data: runs = [], isLoading, error } = useQuery({
    queryKey: ["runs"],
    queryFn: () => runsApi.getAll(50),
  });

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
        حدث خطأ أثناء تحميل التشغيلات
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy HH:mm", { locale: ar });
    } catch {
      return dateStr;
    }
  };

  const getPromptPreview = (run: Run) => {
    const text = run.sections.user || run.sections.system || "";
    return text.length > 50 ? text.substring(0, 50) + "..." : text;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">سجل التشغيلات</h1>
        <p className="text-muted-foreground mt-2">تاريخ جميع عمليات التشغيل والنتائج ({runs.length} تشغيل)</p>
      </div>

      {runs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
          لا توجد تشغيلات بعد. قم بتشغيل مطالبة من الاستوديو لرؤيتها هنا.
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-right">المعرف</TableHead>
                <TableHead className="text-right">المطالبة (مقتطف)</TableHead>
                <TableHead className="text-right">النموذج</TableHead>
                <TableHead className="text-right">التكلفة (Tokens)</TableHead>
                <TableHead className="text-right">الوقت</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id} data-testid={`row-run-${run.id}`}>
                  <TableCell className="font-mono text-xs text-muted-foreground">#{run.id}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{getPromptPreview(run)}</TableCell>
                  <TableCell><Badge variant="outline">{run.model}</Badge></TableCell>
                  <TableCell>{run.tokenUsage?.total || "-"}</TableCell>
                  <TableCell>{run.latency ? `${run.latency}ms` : "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(run.createdAt)}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedRun(run)} data-testid={`button-view-run-${run.id}`}>
                          <Eye className="size-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>تفاصيل التشغيل #{run.id}</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh]">
                          <div className="space-y-4 p-4">
                            <div>
                              <h4 className="font-semibold mb-2">النموذج:</h4>
                              <Badge>{run.model}</Badge>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold mb-2">المطالبة:</h4>
                              <div className="bg-muted p-3 rounded-md text-sm space-y-2">
                                {run.sections.system && (
                                  <div><span className="text-primary font-medium">System:</span> {run.sections.system}</div>
                                )}
                                {run.sections.developer && (
                                  <div><span className="text-primary font-medium">Developer:</span> {run.sections.developer}</div>
                                )}
                                {run.sections.user && (
                                  <div><span className="text-primary font-medium">User:</span> {run.sections.user}</div>
                                )}
                                {run.sections.context && (
                                  <div><span className="text-primary font-medium">Context:</span> {run.sections.context}</div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">المخرجات:</h4>
                              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-md text-sm whitespace-pre-wrap">
                                {run.output}
                              </div>
                            </div>

                            <div className="flex gap-4 text-sm text-muted-foreground">
                              {run.latency && <span>الوقت: {run.latency}ms</span>}
                              {run.tokenUsage && <span>Tokens: {run.tokenUsage.total}</span>}
                              <span>درجة الحرارة: {run.temperature / 100}</span>
                            </div>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
