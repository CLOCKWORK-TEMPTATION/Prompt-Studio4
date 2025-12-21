import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { techniquesApi } from "@/lib/api";
import { CheckCircle2, XCircle, Copy, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Techniques() {
  const { toast } = useToast();

  const { data: techniques = [], isLoading, error } = useQuery({
    queryKey: ["techniques"],
    queryFn: techniquesApi.getAll,
  });

  const copySnippet = (snippet: string | null) => {
    if (snippet) {
      navigator.clipboard.writeText(snippet);
      toast({ title: "تم النسخ", description: "تم نسخ المقتطف إلى الحافظة" });
    }
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
        حدث خطأ أثناء تحميل التقنيات
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">تقنيات الهندسة</h1>
        <p className="text-muted-foreground mt-2">تعلم أفضل الممارسات لتحسين جودة مخرجات النماذج ({techniques.length} تقنية)</p>
      </div>

      <div className="grid gap-6">
        {techniques.map((tech) => (
          <Card key={tech.id} className="overflow-hidden" data-testid={`card-technique-${tech.id}`}>
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-primary">{tech.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {tech.snippet && (
                    <Button variant="ghost" size="sm" onClick={() => copySnippet(tech.snippet)} data-testid={`button-copy-snippet-${tech.id}`}>
                      <Copy className="size-4 ml-1" /> نسخ المقتطف
                    </Button>
                  )}
                  <Badge>Technique</Badge>
                </div>
              </div>
              <CardDescription className="text-base mt-2">{tech.description}</CardDescription>
            </CardHeader>
            
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <CheckCircle2 className="size-5" />
                  مثال جيد
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 p-4 rounded-md text-sm whitespace-pre-wrap text-green-900 dark:text-green-100">
                  {tech.goodExample}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600 font-semibold">
                  <XCircle className="size-5" />
                  مثال سيئ
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 p-4 rounded-md text-sm whitespace-pre-wrap text-red-900 dark:text-red-100">
                  {tech.badExample}
                </div>
              </div>
            </div>

            <Accordion type="single" collapsible className="px-6 pb-4">
              <AccordionItem value="mistakes" className="border-b-0">
                <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline">أخطاء شائعة</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pr-4">
                    {(tech.commonMistakes as string[]).map((mistake: string, i: number) => (
                      <li key={i}>{mistake}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        ))}
      </div>
    </div>
  );
}
