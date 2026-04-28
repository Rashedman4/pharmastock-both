"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

interface LangProps {
  lang: "en" | "ar";
}

const translations = {
  en: {
    title: "Ask a Question for Tomorrow's Video",
    placeholder:
      "Enter your question here. Be specific and provide context to get the best answer in tomorrow's video.",
    submit: "Submit Question",
    authRequired: "Authentication Required",
    authDescription: "Please sign in to submit a question",
    success: "Success",
    successDescription: "Your question has been submitted",
    error: "Error",
    errorDescription: "Failed to submit question",
  },
  ar: {
    title: "اطرح سؤالًا لفيديو الغد",
    placeholder:
      "أدخل سؤالك هنا. كن محددًا وقدم سياقًا للحصول على أفضل إجابة في فيديو الغد.",
    submit: "إرسال السؤال",
    authRequired: "مطلوب تسجيل الدخول",
    authDescription: "يرجى تسجيل الدخول لتقديم سؤال",
    success: "نجاح",
    successDescription: "تم تقديم سؤالك",
    error: "خطأ",
    errorDescription: "فشل في تقديم السؤال",
  },
};

export default function QuestionForm({ lang }: LangProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");

  const handleSubmit = async () => {
    if (!session) {
      toast({
        title: translations[lang].authRequired,
        description: translations[lang].authDescription,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/daily-video/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: question }),
      });

      if (response.ok) {
        toast({
          title: translations[lang].success,
          description: translations[lang].successDescription,
        });
        setQuestion("");
      }
    } catch (error) {
      console.log(error);

      toast({
        title: translations[lang].error,
        description: translations[lang].errorDescription,
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-royalBlue">
            {translations[lang].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder={translations[lang].placeholder}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              className="w-full p-2 border rounded-md"
            />
            <Button
              onClick={handleSubmit}
              className="w-full bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
            >
              <Send className={`w-4 h-4 ${lang === "ar" ? "ml-2" : "mr-2"} `} />
              {translations[lang].submit}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
