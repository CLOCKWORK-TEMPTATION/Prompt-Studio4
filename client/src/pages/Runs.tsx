import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Runs() {
  const runs = [
    { id: "run_1", prompt: "تحليل كود بايثون...", model: "gpt-4o", tokens: 450, time: "2.1s", status: "success", date: "2024-05-20 10:30" },
    { id: "run_2", prompt: "كتابة قصة قصيرة", model: "claude-3-5", tokens: 1200, time: "5.4s", status: "success", date: "2024-05-19 14:15" },
    { id: "run_3", prompt: "توليد SQL", model: "gpt-3.5", tokens: 120, time: "0.8s", status: "failed", date: "2024-05-18 09:00" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">سجل التشغيلات</h1>
        <p className="text-muted-foreground mt-2">تاريخ جميع عمليات التشغيل والنتائج</p>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-right">المعرف</TableHead>
              <TableHead className="text-right">المطالبة (مقتطف)</TableHead>
              <TableHead className="text-right">النموذج</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">التكلفة (Tokens)</TableHead>
              <TableHead className="text-right">الوقت</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{run.id}</TableCell>
                <TableCell className="font-medium">{run.prompt}</TableCell>
                <TableCell><Badge variant="outline">{run.model}</Badge></TableCell>
                <TableCell>
                  {run.status === 'success' ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">ناجح</Badge>
                  ) : (
                    <Badge variant="destructive">فشل</Badge>
                  )}
                </TableCell>
                <TableCell>{run.tokens}</TableCell>
                <TableCell>{run.time}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{run.date}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm"><Eye className="size-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
