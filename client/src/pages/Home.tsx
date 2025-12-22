import { Link } from "wouter";
import { 
  LayoutDashboard, 
  Library, 
  BookOpen, 
  History, 
  Settings, 
  BarChart2, 
  Home as HomeIcon,
  Users,
  Code,
  Cloud,
  Edit3,
  Sparkles,
  Zap,
  Globe
} from "lucide-react";

export default function HomePage() {
    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                        <Sparkles className="size-7" />
                    </div>
                    <h1 className="text-4xl font-bold">Prompt Studio المتقدم</h1>
                </div>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    منصة متكاملة لتصميم وتطوير وتحسين الموجهات الذكية مع ميزات التعاون الحي والنشر السحابي
                </p>
            </div>

            {/* الميزات الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <Link href="/studio" className="block">
                    <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer h-full">
                        <div className="flex items-center gap-3 mb-3">
                            <LayoutDashboard className="size-6 text-primary" />
                            <h3 className="font-semibold text-lg">المحرر الأساسي</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            ابدأ في إنشاء وتعديل الموجهات باستخدام واجهة متقدمة مع نظام الوكلاء الثلاثة
                        </p>
                    </div>
                </Link>

                <Link href="/advanced-editor" className="block">
                    <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer h-full">
                        <div className="flex items-center gap-3 mb-3">
                            <Edit3 className="size-6 text-primary" />
                            <h3 className="font-semibold text-lg">المحرر المتقدم</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            محرر متطور مع دعم المتغيرات والقوالب المعقدة وإعدادات النماذج المتقدمة
                        </p>
                    </div>
                </Link>

                <Link href="/collaboration" className="block">
                    <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer h-full">
                        <div className="flex items-center gap-3 mb-3">
                            <Users className="size-6 text-primary" />
                            <h3 className="font-semibold text-lg">التعاون الحي</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            تعاون مع فريقك في الوقت الفعلي لتطوير الموجهات مع نظام التحرير التشاركي
                        </p>
                    </div>
                </Link>
            </div>

            {/* الأدوات والخدمات */}
            <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Zap className="size-6 text-primary" />
                    الأدوات والخدمات المتقدمة
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href="/templates" className="block">
                        <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer h-full">
                            <div className="flex items-center gap-3 mb-3">
                                <Library className="size-6 text-primary" />
                                <h3 className="font-semibold text-lg">القوالب</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                استخدم القوالب الجاهزة أو احفظ موجهاتك الخاصة
                            </p>
                        </div>
                    </Link>

                    <Link href="/techniques" className="block">
                        <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer h-full">
                            <div className="flex items-center gap-3 mb-3">
                                <BookOpen className="size-6 text-primary" />
                                <h3 className="font-semibold text-lg">التقنيات</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                اكتشف تقنيات متقدمة لتحسين الموجهات
                            </p>
                        </div>
                    </Link>

                    <Link href="/sdk-generator" className="block">
                        <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer h-full">
                            <div className="flex items-center gap-3 mb-3">
                                <Code className="size-6 text-primary" />
                                <h3 className="font-semibold text-lg">توليد SDK</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                إنشاء مكتبات برمجية لاستخدام موجهاتك في تطبيقاتك
                            </p>
                        </div>
                    </Link>

                    <Link href="/cloud-deployment" className="block">
                        <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer h-full">
                            <div className="flex items-center gap-3 mb-3">
                                <Cloud className="size-6 text-primary" />
                                <h3 className="font-semibold text-lg">النشر السحابي</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                انشر موجهاتك على المنصات السحابية المختلفة
                            </p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* المراقبة والإدارة */}
            <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <BarChart2 className="size-6 text-primary" />
                    المراقبة والإدارة
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/runs" className="block">
                        <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer h-full">
                            <div className="flex items-center gap-3 mb-3">
                                <History className="size-6 text-primary" />
                                <h3 className="font-semibold text-lg">السجلات</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                راجع جميع عمليات التشغيل السابقة وتحليلات الأداء
                            </p>
                        </div>
                    </Link>

                    <Link href="/analytics" className="block">
                        <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer h-full">
                            <div className="flex items-center gap-3 mb-3">
                                <BarChart2 className="size-6 text-primary" />
                                <h3 className="font-semibold text-lg">التحليلات</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                رصد أداء النظام واستخدام التخزين الدلالي والإحصائيات المتقدمة
                            </p>
                        </div>
                    </Link>

                    <Link href="/settings" className="block">
                        <div className="bg-card p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer h-full">
                            <div className="flex items-center gap-3 mb-3">
                                <Settings className="size-6 text-primary" />
                                <h3 className="font-semibold text-lg">الإعدادات</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                إدارة إعدادات النظام والمفاتيح API وتخصيص التجربة
                            </p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* الميزات الجديدة */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-xl mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <Globe className="size-8 text-primary" />
                    <h2 className="text-2xl font-bold">الميزات الجديدة</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg">التعاون في الوقت الفعلي</h3>
                        <p className="text-muted-foreground">
                            تعاون مع فريقك على نفس الموجه في الوقت الفعلي مع نظام CRDT المتقدم
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• تحرير تشاركي فوري</li>
                            <li>• نظام التعليقات والمراجعة</li>
                            <li>• إدارة الأذونات والأدوار</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg">التخزين الدلالي الذكي</h3>
                        <p className="text-muted-foreground">
                            توفير في التكلفة والوقت مع نظام التخزين المؤقت الدلالي المتقدم
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• تحليل التشابه الدلالي</li>
                            <li>• توفير تلقائي في التكلفة</li>
                            <li>• إحصائيات مفصلة للأداء</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* معلومات النظام */}
            <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <HomeIcon className="size-5" />
                    حول النظام المتقدم
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-muted-foreground mb-4">
                            Prompt Studio المتقدم هو منصة شاملة ومتطورة مصممة لمساعدة المطورين والفرق على إنشاء وتطوير وتحسين الموجهات الذكية بكفاءة عالية.
                        </p>
                        <p className="text-muted-foreground">
                            يوفر النظام واجهة سهلة الاستخدام مع ميزات متقدمة مثل التعاون الحي، والتخزين الدلالي، وتوليد SDK، والنشر السحابي.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium mb-3">البدء السريع:</h4>
                        <ol className="text-sm text-muted-foreground space-y-2">
                            <li>1. ابدأ بالمحرر الأساسي لإنشاء موجهك الأول</li>
                            <li>2. جرب المحرر المتقدم للميزات المتطورة</li>
                            <li>3. ادع فريقك للتعاون في الوقت الفعلي</li>
                            <li>4. انشر موجهاتك على السحابة</li>
                            <li>5. راقب الأداء والإحصائيات</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
