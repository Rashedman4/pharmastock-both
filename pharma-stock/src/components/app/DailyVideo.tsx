"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface VideoData {
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  link: string;
  key_points_en: string[];
  key_points_ar: string[];
  duration: number;
  date_uploaded: string;
}

interface LangProps {
  lang: "en" | "ar";
}

export default function DailyVideo({ lang }: LangProps) {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch("/api/daily-video/video");
        if (!response.ok) {
          throw new Error("Failed to fetch video");
        }
        const data = await response.json();
        setVideoData(data);
      } catch (error) {
        setError("Failed to load video " + error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !videoData) {
    return <div>Error: {error}</div>;
  }

  const getYouTubeId = (url: string) => {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : url.split("/").pop();
  };

  const youtubeId = getYouTubeId(videoData.link);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <Card className="overflow-hidden">
        <CardHeader
          className={`bg-royalBlue text-pureWhite ${
            lang === "ar" ? "text-right" : ""
          }`}
        >
          <CardTitle className="text-2xl">
            {lang === "ar" ? videoData.title_ar : videoData.title_en}
          </CardTitle>
          <div
            className={`flex items-center text-sm mt-2 ${
              lang === "ar" ? "justify-end space-x-reverse" : "space-x-4"
            }`}
          >
            <div className="flex items-center">
              <CalendarDays
                className={`w-4 h-4 ${lang === "ar" ? "ml-1" : "mr-1"}`}
              />
              {format(new Date(videoData.date_uploaded), "yyyy-MM-dd", {
                locale: lang === "ar" ? ar : undefined,
              })}
            </div>
            <div className="flex items-center">
              <Clock className={`w-4 h-4 ${lang === "ar" ? "ml-1" : "mr-1"}`} />
              {videoData.duration}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="aspect-w-16 aspect-h-9">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=0&showinfo=0`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <div className={`p-6 ${lang === "ar" ? "text-right" : ""}`}>
            <p className="text-gray-700 mb-4">
              {lang === "ar" ? videoData.content_ar : videoData.content_en}
            </p>
            <h3 className="font-semibold text-lg mb-2">
              {lang === "ar" ? "النقاط الرئيسية:" : "Key Points:"}
            </h3>
            <ul className="space-y-2">
              {(lang === "ar"
                ? videoData.key_points_ar
                : videoData.key_points_en
              ).map((point, index) => (
                <li
                  key={index}
                  className={`flex items-start ${
                    lang === "ar" ? "flex-row-reverse" : ""
                  }`}
                >
                  <Badge
                    variant="outline"
                    className={lang === "ar" ? "ml-2" : "mr-2"}
                  >
                    0{index + 1}
                  </Badge>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
