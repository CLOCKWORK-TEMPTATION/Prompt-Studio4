# مثال متقدم لوكلاء مختلفين مع موفري نماذج متعددين
import os
from strands import Agent, tool
from strands_tools import calculator, python_repl, http_request

# أداة مخصصة للطقس (مثال)
@tool
def get_weather_info(city: str) -> str:
    """الحصول على معلومات الطقس لمدينة معينة.
    
    Args:
        city: اسم المدينة
    """
    # هذا مثال بسيط - في الواقع ستحتاج API حقيقي للطقس
    weather_data = {
        "القاهرة": "مشمس، 28°م",
        "الرياض": "حار، 35°م", 
        "دبي": "مشمس، 32°م",
        "بيروت": "غائم جزئياً، 25°م"
    }
    return weather_data.get(city, f"لا توجد بيانات طقس متاحة لـ {city}")

# أداة مخصصة للترجمة البسيطة
@tool
def simple_translate(text: str, target_lang: str) -> str:
    """ترجمة بسيطة للنص.
    
    Args:
        text: النص المراد ترجمته
        target_lang: اللغة المستهدفة (en, ar, fr, es)
    """
    # مثال بسيط - في الواقع ستحتاج خدمة ترجمة حقيقية
    translations = {
        "مرحبا": {"en": "Hello", "fr": "Bonjour", "es": "Hola"},
        "شكرا": {"en": "Thank you", "fr": "Merci", "es": "Gracias"},
        "وداعا": {"en": "Goodbye", "fr": "Au revoir", "es": "Adiós"}
    }
    
    if text in translations and target_lang in translations[text]:
        return translations[text][target_lang]
    return f"ترجمة غير متاحة لـ '{text}' إلى {target_lang}"

def create_bedrock_agent():
    """إنشاء وكيل باستخدام Amazon Bedrock"""
    return Agent(
        # يستخدم Bedrock Claude 4 Sonnet افتراضياً
        tools=[calculator, python_repl, http_request, get_weather_info, simple_translate],
        system_prompt="""أنت مساعد ذكي متعدد المهارات. يمكنك:
        - إجراء حسابات رياضية معقدة
        - تنفيذ وتطوير كود Python
        - جلب البيانات من الإنترنت
        - تقديم معلومات الطقس
        - الترجمة البسيطة
        
        استخدم الأدوات المناسبة لكل مهمة واعطِ إجابات دقيقة ومفيدة."""
    )

def create_anthropic_agent():
    """إنشاء وكيل باستخدام Anthropic Claude مباشرة"""
    try:
        from strands.models.anthropic import AnthropicModel
        
        model = AnthropicModel(
            client_args={"api_key": os.environ.get("ANTHROPIC_API_KEY")},
            model_id="claude-sonnet-4-20250514",
            max_tokens=2048,
            params={"temperature": 0.7}
        )
        
        return Agent(
            model=model,
            tools=[calculator, python_repl, get_weather_info],
            system_prompt="أنت خبير في التحليل والحسابات الدقيقة."
        )
    except ImportError:
        print("❌ Anthropic غير مثبت. شغّل: pip install 'strands-agents[anthropic]'")
        return None
    except Exception as e:
        print(f"❌ خطأ في إعداد Anthropic: {e}")
        return None

def create_openai_agent():
    """إنشاء وكيل باستخدام OpenAI GPT"""
    try:
        from strands.models.openai import OpenAIModel
        
        model = OpenAIModel(
            client_args={"api_key": os.environ.get("OPENAI_API_KEY")},
            model_id="gpt-4",
        )
        
        return Agent(
            model=model,
            tools=[calculator, python_repl, simple_translate],
            system_prompt="أنت مساعد إبداعي ومبتكر في حل المشاكل."
        )
    except ImportError:
        print("❌ OpenAI غير مثبت. شغّل: pip install 'strands-agents[openai]'")
        return None
    except Exception as e:
        print(f"❌ خطأ في إعداد OpenAI: {e}")
        return None

def main():
    """تشغيل مثال متقدم مع خيارات متعددة"""
    
    print("🚀 مرحباً بك في مثال Strands المتقدم!")
    print("\nالوكلاء المتاحون:")
    print("1. Bedrock Agent (افتراضي)")
    print("2. Anthropic Agent") 
    print("3. OpenAI Agent")
    print("4. خروج")
    
    while True:
        try:
            choice = input("\nاختر وكيل (1-4): ").strip()
            
            if choice == "4":
                print("👋 وداعاً!")
                break
                
            agent = None
            agent_name = ""
            
            if choice == "1":
                agent = create_bedrock_agent()
                agent_name = "Bedrock"
            elif choice == "2":
                agent = create_anthropic_agent()
                agent_name = "Anthropic"
            elif choice == "3":
                agent = create_openai_agent()
                agent_name = "OpenAI"
            else:
                print("❌ خيار غير صحيح")
                continue
                
            if agent is None:
                continue
                
            print(f"\n✅ تم تفعيل {agent_name} Agent")
            print("اكتب 'رجوع' للعودة لقائمة الوكلاء")
            
            # حلقة المحادثة مع الوكيل المختار
            while True:
                user_input = input(f"\n👤 سؤالك لـ {agent_name}: ").strip()
                
                if user_input.lower() in ['رجوع', 'back']:
                    break
                    
                if not user_input:
                    continue
                    
                print("🤖 يعمل...")
                try:
                    response = agent(user_input)
                    print(f"🤖 {agent_name}: {response}")
                except Exception as e:
                    print(f"❌ خطأ: {e}")
                    print("تأكد من إعداد مفاتيح API المطلوبة.")
                    
        except KeyboardInterrupt:
            print("\n👋 تم الإنهاء.")
            break
        except Exception as e:
            print(f"❌ خطأ عام: {e}")

if __name__ == "__main__":
    main()