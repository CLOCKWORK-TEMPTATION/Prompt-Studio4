# مثال بسيط لوكيل ذكي باستخدام Strands SDK
from strands import Agent
from strands_tools import calculator, python_repl, http_request

def main():
    """
    إنشاء وكيل ذكي بسيط مع أدوات مختلفة
    """
    
    # إنشاء الوكيل مع أدوات من المجتمع
    agent = Agent(
        tools=[calculator, python_repl, http_request],
        system_prompt="""أنت مساعد ذكي متخصص في:
        - الحسابات الرياضية
        - تنفيذ كود Python
        - طلبات HTTP والبيانات
        
        استخدم الأدوات المتاحة لك للإجابة على الأسئلة بدقة."""
    )
    
    print("🤖 مرحباً! أنا وكيل ذكي مزود بأدوات مختلفة.")
    print("يمكنني مساعدتك في الحسابات، تنفيذ Python، وطلبات HTTP.")
    print("اكتب 'خروج' للإنهاء.\n")
    
    while True:
        try:
            # الحصول على سؤال من المستخدم
            user_input = input("👤 سؤالك: ").strip()
            
            if user_input.lower() in ['خروج', 'exit', 'quit']:
                print("👋 وداعاً!")
                break
                
            if not user_input:
                continue
                
            # إرسال السؤال للوكيل
            print("🤖 يفكر...")
            response = agent(user_input)
            print(f"🤖 الإجابة: {response}\n")
            
        except KeyboardInterrupt:
            print("\n👋 تم الإنهاء بواسطة المستخدم.")
            break
        except Exception as e:
            print(f"❌ خطأ: {e}")
            print("تأكد من إعداد مفاتيح API المطلوبة.\n")

if __name__ == "__main__":
    main()