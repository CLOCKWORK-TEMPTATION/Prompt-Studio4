import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Edit, Trash } from "lucide-react";
import { MOCK_TEMPLATES } from "@/lib/mock-api";
import { useState } from "react";

export default function Templates() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_TEMPLATES.filter(t => t.name.includes(search) || t.tags.some(tag => tag.includes(search)));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">مكتبة القوالب</h1>
          <p className="text-muted-foreground mt-2">قوالب جاهزة لبدء العمل بسرعة</p>
        </div>
        <Button>قالب جديد</Button>
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
                <Badge variant="outline" className="mb-2">{template.category}</Badge>
                <div className="flex gap-1">
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Edit className="size-3" /></Button>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Trash className="size-3" /></Button>
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
    </div>
  );
}
