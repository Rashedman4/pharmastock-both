"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WhatsAppButtonProps {
  lang: "en" | "ar";
}

export default function WhatsAppButton({ lang }: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleWhatsAppClick = (type: "service" | "signals") => {
    const phoneNumber = "971509363328";
    if (!phoneNumber) {
      console.error("WhatsApp number is not set in environment variables.");
      return;
    }

    const messages = {
      service: {
        en: "Hello, I need help with...",
        ar: "مرحباً، أحتاج مساعدة في...",
      },
      signals: {
        en: "Hello, I would like to receive the latest signals.",
        ar: "مرحباً، أود أن أتلقى أحدث الإشارات.",
      },
    };

    const message = encodeURIComponent(messages[type][lang]);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    console.log("WhatsApp URL:", whatsappUrl); // Debugging
    window.open(whatsappUrl, "_blank");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="relative group">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white rounded-full p-4 shadow-xl focus:outline-none"
            >
              <MessageCircle className="w-7 h-7" />
            </motion.button>
          </div>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <div className="flex flex-col items-center gap-2">
              <MessageCircle className="w-10 h-10 text-green-500" />
              <DialogTitle className="text-xl font-semibold">
                {lang === "ar" ? "اختر الخدمة" : "Choose Service"}
              </DialogTitle>
              <p className="text-sm text-gray-500 text-center">
                {lang === "ar"
                  ? "حدد الطريقة التي ترغب في التواصل بها عبر واتساب"
                  : "Select how you want to connect on WhatsApp"}
              </p>
            </div>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            <Button
              onClick={() => handleWhatsAppClick("service")}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg shadow transition"
            >
              {lang === "ar" ? "خدمة العملاء" : "Customer Service"}
            </Button>
            <Button
              onClick={() => handleWhatsAppClick("signals")}
              className="w-full bg-royalBlue hover:bg-royalBlue/90 text-white py-3 rounded-lg shadow transition"
            >
              {lang === "ar" ? "تلقى أحدث الإشارات" : "Get Latest Signals"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
