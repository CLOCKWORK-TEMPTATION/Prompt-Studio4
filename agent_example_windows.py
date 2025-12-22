# مثال متقدم لوكيل ذكي باستخدام Strands SDK - متوافق مع Windows مع دعم نماذج متعددة
import os
from strands import Agent, tool

# قراءة ملف .env إذا كان موجوداً
def load_env_file():
    """قراءة متغيرات البيئة من ملف .env"""
    try:
        with open('.env', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    except FileNotFoundError:
        pass

# تحميل متغيرات البيئة
load_env_file()

# أدوات مخصصة متوافقة مع Windows
@tool
def calculator(expression: str) -> str:
    """حاسبة رياضية متقدمة.
    
    Args:
        expression: التعبير الرياضي (مثل: "sqrt(16) + 2**3")
    """
    import math
    
    try:
        # إضافة دوال رياضية آمنة
        safe_dict = {
            "__builtins__": {},
            "abs": abs, "round": round, "min": min, "max": max,
            "sum": sum, "pow": pow,
            "sqrt": math.sqrt, "sin": math.sin, "cos": math.cos,
            "tan": math.tan, "log": math.log, "exp": math.exp,
            "pi": math.pi, "e": math.e
        }
        
        result = eval(expression, safe_dict)
        return f"النتيجة: {result}"
    except Exception as e:
        return f"خطأ في الحساب: {e}"

@tool
def simple_http_request(url: str) -> str:
    """طلب HTTP بسيط.
    
    Args:
        url: الرابط المراد الوصول إليه
    """
    try:
        import requests
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            # محاولة تحليل JSON
            try:
                data = response.json()
                return f"استجابة JSON: {str(data)[:500]}..."
            except:
                # إذا لم يكن JSON، إرجاع النص
                return f"استجابة نصية: {response.text[:500]}..."
        else:
            return f"خطأ HTTP: {response.status_code}"
            
    except Exception as e:
        return f"خطأ في الطلب: {e}"

@tool
def text_processor(text: str, operation: str) -> str:
    """معالج نصوص متقدم.
    
    Args:
        text: النص المراد معالجته
        operation: العملية (upper, lower, reverse, count_words, count_chars)
    """
    try:
        if operation == "upper":
            return text.upper()
        elif operation == "lower":
            return text.lower()
        elif operation == "reverse":
            return text[::-1]
        elif operation == "count_words":
            return f"عدد الكلمات: {len(text.split())}"
        elif operation == "count_chars":
            return f"عدد الأحرف: {len(text)}"
        else:
            return "العمليات المتاحة: upper, lower, reverse, count_words, count_chars"
    except Exception as e:
        return f"خطأ في المعالجة: {e}"

def create_bedrock_agent():
    """إنشاء وكيل باستخدام Amazon Bedrock (افتراضي)"""
    return Agent(
        # يستخدم Bedrock Claude 4 Sonnet افتراضياً
        tools=[calculator, simple_http_request, text_processor],
        system_prompt="""أنت مساعد ذكي متخصص في Amazon Bedrock. يمكنك:
        - الحسابات الرياضية المتقدمة
        - طلبات HTTP وجلب البيانات
        - معالجة النصوص
        
        استخدم الأدوات المتاحة لك للإجابة على الأسئلة بدقة."""
    )

def create_bedrock_agent_with_model(model_id: str):
    """إنشاء وكيل Bedrock مع نموذج محدد"""
    return Agent(
        model=model_id,
        tools=[calculator, simple_http_request, text_processor],
        system_prompt=f"""أنت مساعد ذكي يعمل بنموذج {model_id}. يمكنك:
        - الحسابات الرياضية المتقدمة
        - طلبات HTTP وجلب البيانات
        - معالجة النصوص
        
        استخدم الأدوات المتاحة لك للإجابة على الأسئلة بدقة."""
    )

def create_anthropic_agent():
    """إنشاء وكيل باستخدام Anthropic Claude مباشرة"""
    try:
        from strands.models.anthropic import AnthropicModel
        
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            print("مفتاح ANTHROPIC_API_KEY غير موجود")
            return None
            
        model = AnthropicModel(
            client_args={"api_key": api_key},
            model_id="claude-sonnet-4-20250514",
            max_tokens=2048,
            params={"temperature": 0.7}
        )
        
        return Agent(
            model=model,
            tools=[calculator, simple_http_request, text_processor],
            system_prompt="أنت خبير في التحليل والحسابات الدقيقة باستخدام Anthropic Claude."
        )
    except ImportError:
        print("Anthropic غير مثبت. شغّل: pip install 'strands-agents[anthropic]'")
        return None
    except Exception as e:
        print(f"خطأ في إعداد Anthropic: {e}")
        return None

def create_openai_agent():
    """إنشاء وكيل باستخدام OpenAI GPT"""
    try:
        from strands.models.openai import OpenAIModel
        
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            print("مفتاح OPENAI_API_KEY غير موجود")
            return None
            
        model = OpenAIModel(
            client_args={"api_key": api_key},
            model_id="gpt-4",
        )
        
        return Agent(
            model=model,
            tools=[calculator, simple_http_request, text_processor],
            system_prompt="أنت مساعد إبداعي ومبتكر في حل المشاكل باستخدام OpenAI GPT."
        )
    except ImportError:
        print("OpenAI غير مثبت. شغّل: pip install 'strands-agents[openai]'")
        return None
    except Exception as e:
        print(f"خطأ في إعداد OpenAI: {e}")
        return None

def create_gemini_agent():
    """إنشاء وكيل باستخدام Google Gemini"""
    try:
        from strands.models.gemini import GeminiModel
        
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            print("مفتاح GOOGLE_API_KEY غير موجود")
            return None
            
        model = GeminiModel(
            client_args={"api_key": api_key},
            model_id="gemini-2.5-pro",
        )
        
        return Agent(
            model=model,
            tools=[calculator, simple_http_request, text_processor],
            system_prompt="أنت مساعد ذكي متطور باستخدام Google Gemini."
        )
    except ImportError:
        print("Gemini غير مثبت. شغّل: pip install 'strands-agents[gemini]'")
        return None
    except Exception as e:
        print(f"خطأ في إعداد Gemini: {e}")
        return None

def show_available_models():
    """عرض النماذج المتاحة في Bedrock"""
    bedrock_models = {
        "1": "anthropic.claude-sonnet-4-20250514-v1:0 (افتراضي)",
        "2": "anthropic.claude-3-5-sonnet-20241022-v2:0",
        "3": "us.amazon.nova-premier-v1:0",
        "4": "us.amazon.nova-pro-v1:0",
        "5": "us.meta.llama3-2-90b-instruct-v1:0"
    }
    
    print("\nنماذج Bedrock المتاحة:")
    for key, model in bedrock_models.items():
        print(f"{key}. {model}")
    
    return bedrock_models

def main():
    """
    إنشاء وكيل ذكي مع دعم نماذج متعددة
    """
    
    print("مرحباً بك في Strands Agent مع دعم النماذج المتعددة!")
    print("\nالموفرون المتاحون:")
    print("1. Amazon Bedrock (افتراضي)")
    print("2. Amazon Bedrock (اختيار نموذج)")
    print("3. Anthropic Claude (مباشر)")
    print("4. OpenAI GPT")
    print("5. Google Gemini")
    print("6. خروج")
    
    while True:
        try:
            choice = input("\nاختر موفر (1-6): ").strip()
            
            if choice == "6":
                print("وداعاً!")
                break
                
            agent = None
            agent_name = ""
            
            if choice == "1":
                # التحقق من مفتاح Bedrock
                if not os.environ.get('AWS_BEDROCK_API_KEY'):
                    print("مفتاح AWS_BEDROCK_API_KEY غير موجود")
                    continue
                agent = create_bedrock_agent()
                agent_name = "Bedrock (افتراضي)"
                
            elif choice == "2":
                # التحقق من مفتاح Bedrock
                if not os.environ.get('AWS_BEDROCK_API_KEY'):
                    print("مفتاح AWS_BEDROCK_API_KEY غير موجود")
                    continue
                    
                models = show_available_models()
                model_choice = input("\nاختر نموذج (1-5): ").strip()
                
                if model_choice in models:
                    model_id = models[model_choice].split(" ")[0]
                    agent = create_bedrock_agent_with_model(model_id)
                    agent_name = f"Bedrock ({model_id})"
                else:
                    print("خيار غير صحيح")
                    continue
                    
            elif choice == "3":
                agent = create_anthropic_agent()
                agent_name = "Anthropic Claude"
                
            elif choice == "4":
                agent = create_openai_agent()
                agent_name = "OpenAI GPT"
                
            elif choice == "5":
                agent = create_gemini_agent()
                agent_name = "Google Gemini"
                
            else:
                print("خيار غير صحيح")
                continue
                
            if agent is None:
                continue
                
            print(f"\nتم تفعيل {agent_name}")
            print("اكتب 'رجوع' للعودة لقائمة الموفرين")
            
            # حلقة المحادثة مع الوكيل المختار
            while True:
                user_input = input(f"\nسؤالك لـ {agent_name}: ").strip()
                
                if user_input.lower() in ['رجوع', 'back']:
                    break
                    
                if not user_input:
                    continue
                    
                print("يعمل...")
                try:
                    response = agent(user_input)
                    print(f"{agent_name}: {response}")
                except Exception as e:
                    print(f"خطأ: {e}")
                    print("تأكد من إعداد مفاتيح API المطلوبة.")
                    
        except KeyboardInterrupt:
            print("\nتم الإنهاء.")
            break
        except Exception as e:
            print(f"خطأ عام: {e}")

if __name__ == "__main__":
    main()