export type StageId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type StageStatus = "incomplete" | "in-progress" | "completed";

export interface WorkflowStage {
  id: StageId;
  title: string;
  description: string;
  status: StageStatus;
  icon?: string;
}

export const WORKFLOW_STAGES: Record<StageId, Omit<WorkflowStage, "status">> = {
  0: {
    id: 0,
    title: "إدخال الفكرة",
    description: "اكتب ما في خاطرك فقط",
    icon: "Lightbulb",
  },
  1: {
    id: 1,
    title: "التحويل عبر 3 وكلاء",
    description: "تشغيل الوكلاء الثلاثة",
    icon: "Sparkles",
  },
  2: {
    id: 2,
    title: "مراجعة واعتماد",
    description: "عرض النتائج واعتماد النهائي",
    icon: "CheckCircle",
  },
  3: {
    id: 3,
    title: "التحرير المتقدم",
    description: "تحرير الأقسام الأربعة والمتغيرات",
    icon: "Edit",
  },
  4: {
    id: 4,
    title: "الجودة",
    description: "التحليل والتحسين",
    icon: "Sparkles",
  },
  5: {
    id: 5,
    title: "التشغيل",
    description: "تنفيذ المطالبة وحفظ النتيجة",
    icon: "Play",
  },
  6: {
    id: 6,
    title: "الحفظ والتوزيع",
    description: "حفظ كقالب أو تصدير",
    icon: "Save",
  },
};

export interface WorkflowState {
  currentStage: StageId;
  stages: Record<StageId, StageStatus>;
  rawIdea: string;
  composeRunId: number | null;
  composedSections: boolean;
  hasEditedSections: boolean;
  hasCritiqued: boolean;
  hasRun: boolean;
  hasSaved: boolean;
}

export const getInitialWorkflowState = (): WorkflowState => ({
  currentStage: 0,
  stages: {
    0: "incomplete",
    1: "incomplete",
    2: "incomplete",
    3: "incomplete",
    4: "incomplete",
    5: "incomplete",
    6: "incomplete",
  },
  rawIdea: "",
  composeRunId: null,
  composedSections: false,
  hasEditedSections: false,
  hasCritiqued: false,
  hasRun: false,
  hasSaved: false,
});

export const canNavigateToStage = (
  targetStage: StageId,
  state: WorkflowState
): boolean => {
  if (targetStage === 0) return true;
  if (targetStage === 3) return true; // يمكن التحرير يدوياً مباشرة
  
  // باقي المراحل تحتاج المرحلة السابقة مكتملة
  const previousStage = (targetStage - 1) as StageId;
  return state.stages[previousStage] === "completed";
};
