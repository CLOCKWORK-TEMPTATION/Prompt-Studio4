import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  Share2, 
  MessageCircle, 
  Clock, 
  Eye,
  Edit,
  UserPlus,
  Settings
} from "lucide-react";

interface CollaborationSession {
  id: string;
  name: string;
  description: string;
  participants: number;
  status: "active" | "inactive";
  lastActivity: string;
  owner: string;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline";
  role: "owner" | "editor" | "viewer";
}

export default function Collaboration() {
  const [sessions] = useState<CollaborationSession[]>([
    {
      id: "1",
      name: "مشروع التسويق الرقمي",
      description: "تطوير موجهات للحملات التسويقية",
      participants: 3,
      status: "active",
      lastActivity: "منذ 5 دقائق",
      owner: "أحمد محمد"
    },
    {
      id: "2", 
      name: "تحليل البيانات",
      description: "موجهات لتحليل وتفسير البيانات",
      participants: 2,
      status: "inactive",
      lastActivity: "منذ ساعتين",
      owner: "فاطمة علي"
    }
  ]);

  const [participants] = useState<Participant[]>([
    {
      id: "1",
      name: "أحمد محمد",
      status: "online",
      role: "owner"
    },
    {
      id: "2", 
      name: "سارة أحمد",
      status: "online",
      role: "editor"
    },
    {
      id: "3",
      name: "محمد علي", 
      status: "offline",
      role: "viewer"
    }
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="size-8 text-primary" />
            التعاون الحي
          </h1>
          <p className="text-muted-foreground mt-2">
            تعاون مع فريقك في الوقت الفعلي لتطوير الموجهات
          </p>
        </div>
        <Button>
          <Plus className="size-4 ml-2" />
          إنشاء جلسة جديدة
        </Button>
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sessions">الجلسات</TabsTrigger>
          <TabsTrigger value="active">الجلسة النشطة</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{session.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {session.description}
                      </CardDescription>
                    </div>
                    <Badge variant={session.status === "active" ? "default" : "secondary"}>
                      {session.status === "active" ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">المشاركون</span>
                      <span className="font-medium">{session.participants}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">آخر نشاط</span>
                      <span className="font-medium">{session.lastActivity}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">المالك</span>
                      <span className="font-medium">{session.owner}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1">
                        <Edit className="size-4 ml-2" />
                        انضمام
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>مشروع التسويق الرقمي</CardTitle>
                  <CardDescription>
                    تطوير موجهات للحملات التسويقية
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg min-h-[400px]">
                    <p className="text-muted-foreground text-center mt-20">
                      محرر التعاون الحي سيظهر هنا...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="size-5" />
                    المشاركون
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback>
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{participant.name}</p>
                        <div className="flex items-center gap-2">
                          <div className={`size-2 rounded-full ${
                            participant.status === "online" ? "bg-green-500" : "bg-gray-400"
                          }`} />
                          <span className="text-xs text-muted-foreground">
                            {participant.role === "owner" ? "مالك" : 
                             participant.role === "editor" ? "محرر" : "مشاهد"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    <UserPlus className="size-4 ml-2" />
                    دعوة مشارك
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="size-5" />
                    التعليقات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">أحمد محمد</p>
                      <p className="text-muted-foreground mt-1">
                        ما رأيكم في إضافة متغير للجمهور المستهدف؟
                      </p>
                      <span className="text-xs text-muted-foreground">منذ 10 دقائق</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">سارة أحمد</p>
                      <p className="text-muted-foreground mt-1">
                        فكرة ممتازة! سأضيفها الآن.
                      </p>
                      <span className="text-xs text-muted-foreground">منذ 8 دقائق</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Input placeholder="اكتب تعليقاً..." />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="size-5" />
                    النشاط الأخير
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-blue-500" />
                      <span>سارة عدلت الموجه الرئيسي</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-green-500" />
                      <span>أحمد أضاف تعليقاً</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-purple-500" />
                      <span>محمد انضم للجلسة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}