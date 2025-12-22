# مثال توضيحي لـ Strands Agent (بدون الحاجة لمفاتيح API)
from strands import Agent, tool

# أدوات مخصصة بسيطة للتوضيح
@tool
def simple_calculator(expression: str) -> str:
    """حاسبة بسيطة لتقييم التعبيرات الرياضية.
    
    Args:
        expression: التعبير الرياضي (مثل: "2 + 3 * 4")
    """
    try:
        # تقييم آمن للتعبيرات الرياضية البسيطة
        allowed_chars = set('0123456789+-*/(). ')
        if all(c in allowed_chars for c in expression):
            result = eval(expression)
            return f"النتيجة: {result}"
        else:
            return "خطأ: التعبير يحتوي على رموز غير مسموحة"
    except Exception as e:
        return f"خطأ في الحساب: {e}"
@tool
def text_analyzer(text: str) -> str:
    """تحليل النص وإعطاء إحصائيات بسيطة.
    
    Args:
        text: النص المراد تحليله
    """
    words = text.split()
    chars = len(text)
    chars_no_spaces = len(text.replace(' ', ''))
    
    return f"""تحليل النص:
    - عدد الكلمات: {len(words)}
    - عدد الأحرف (مع المسافات): {chars}
    - عدد الأحرف (بدون مسافات): {chars_no_spaces}
    - متوسط طول الكلمة: {chars_no_spaces / len(words) if words else 0:.1f}"""

@tool
def unit_converter(value: float, from_unit: str, to_unit: str) -> str:
    """محول وحدات بسيط.
    
    Args:
        value: القيمة المراد تحويلها
        from_unit: الوحدة الأصلية (cm, m, km, g, kg)
        to_unit: الوحدة المستهدفة (cm, m, km, g, kg)
    """
    # تحويلات الطول (إلى متر)
    length_to_meter = {
        'cm': 0.01,
        'm': 1.0,
        'km': 1000.0
    }
    
    # تحويلات الوزن (إلى جرام)
    weight_to_gram = {
        'g': 1.0,
        'kg': 1000.0
    }
    
    try:
        if from_unit in length_to_meter and to_unit in length_to_meter:
            # تحويل الطول
            meters = value * length_to_meter[from_unit]
            result = meters / length_to_meter[to_unit]
            return f"{value} {from_unit} = {result} {to_unit}"
            
        elif from_unit in weight_to_gram and to_unit in weight_to_gram:
            # تحويل الوزن
            grams = value * weight_to_gram[from_unit]
            result = grams / weight_to_gram[to_unit]
            return f"{value} {from_unit} = {result} {to_unit}"
            
        else:
            return "خطأ: وحدات غير مدعومة أو غير متطابقة"
            
    except Exception as e:
        return f"خطأ في التحويل: {e}"

def demo_without_api():
    """مثال توضيحي بدون الحاجة لمفاتيح API"""
    
    print("مثال توضيحي لـ Strands Agent")
    print("هذا المثال يعمل بأدوات محلية بدون الحاجة لمفاتيح API\n")
    
    # محاولة إنشاء وكيل بسيط
    try:
        # ملاحظة: هذا سيفشل بدون مفاتيح API، لكنه يوضح البنية
        agent = Agent(
            tools=[simple_calculator, text_analyzer, unit_converter],
            system_prompt="""أنت مساعد محلي بسيط. يمكنك:
            - إجراء حسابات رياضية بسيطة
            - تحليل النصوص
            - تحويل الوحدات
            
            استخدم الأدوات المتاحة لمساعدة المستخدم."""
        )
        
        print("تم إنشاء الوكيل بنجاح!")
        return agent
        
    except Exception as e:
        print(f"لا يمكن إنشاء الوكيل: {e}")
        print("\nلاستخدام Strands بالكامل، تحتاج إلى:")
        print("1. إعداد مفتاح API (راجع setup_api_keys.md)")
        print("2. تشغيل agent_example.py أو advanced_agent_example.py")
        return None

def test_tools_directly():
    """اختبار الأدوات مباشرة بدون وكيل"""
    
    print("\naختبار الأدوات مباشرة:")
    
    # اختبار الحاسبة
    calc_result = simple_calculator("15 * 3 + 7")
    print(f"حاسبة: {calc_result}")
    
    # اختبار محلل النصوص
    text_result = text_analyzer("مرحباً بك في عالم الذكاء الاصطناعي")
    print(f"تحليل النص:\n{text_result}")
    
    # اختبار محول الوحدات
    unit_result = unit_converter(100, "cm", "m")
    print(f"تحويل الوحدات: {unit_result}")

if __name__ == "__main__":
    # تشغيل المثال التوضيحي
    agent = demo_without_api()
    
    # اختبار الأدوات مباشرة
    test_tools_directly()
    
    print("\nالخطوات التالية:")
    print("1. راجع ملف setup_api_keys.md لإعداد مفاتيح API")
    print("2. شغّل agent_example.py للمثال البسيط")
    print("3. شغّل advanced_agent_example.py للمثال المتقدم")