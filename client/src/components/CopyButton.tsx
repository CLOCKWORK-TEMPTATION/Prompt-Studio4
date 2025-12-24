import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function CopyButton({ 
  text, 
  label = "نسخ", 
  variant = "outline", 
  size = "sm",
  className = ""
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "تم النسخ",
        description: "تم نسخ النص إلى الحافظة",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "فشل النسخ",
        description: "حدث خطأ أثناء النسخ",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
      data-testid="copy-button"
    >
      {copied ? (
        <>
          <Check className="ml-1 size-4 text-green-600" />
          تم النسخ
        </>
      ) : (
        <>
          <Copy className="ml-1 size-4" />
          {label}
        </>
      )}
    </Button>
  );
}
