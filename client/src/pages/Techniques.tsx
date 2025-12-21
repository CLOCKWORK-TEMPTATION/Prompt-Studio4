import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_TECHNIQUES } from "@/lib/mock-api";
import { CheckCircle2, XCircle } from "lucide-react";

export default function Techniques() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">تقنيات الهندسة</h1>
        <p className="text-muted-foreground mt-2">تعلم أفضل الممارسات لتحسين جودة مخرجات النماذج</p>
      </div>

      <div className="grid gap-6">
        {MOCK_TECHNIQUES.map((tech) => (
          <Card key={tech.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-primary">{tech.title}</CardTitle>
                <Badge>Technique</Badge>
              </div>
              <CardDescription className="text-base mt-2">{tech.description}</CardDescription>
            </CardHeader>
            
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <CheckCircle2 className="size-5" />
                  مثال جيد
                </div>
                <div className="bg-green-50 border border-green-100 p-4 rounded-md text-sm whitespace-pre-wrap text-green-900">
                  {tech.goodExample}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600 font-semibold">
                  <XCircle className="size-5" />
                  مثال سيئ
                </div>
                <div className="bg-red-50 border border-red-100 p-4 rounded-md text-sm whitespace-pre-wrap text-red-900">
                  {tech.badExample}
                </div>
              </div>
            </div>

            <Accordion type="single" collapsible className="px-6 pb-4">
              <AccordionItem value="mistakes" className="border-b-0">
                <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline">أخطاء شائعة</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pr-4">
                    {tech.commonMistakes.map((mistake, i) => (
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
