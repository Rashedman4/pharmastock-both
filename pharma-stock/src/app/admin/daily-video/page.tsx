"use client";

import type React from "react";
import { format, parseISO } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VideoData {
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  link: string;
  key_points_en: string[];
  key_points_ar: string[];
  duration: number;
}

export default function DailyVideoManagement() {
  const [videoData, setVideoData] = useState<VideoData>({
    title_en: "",
    title_ar: "",
    content_en: "",
    content_ar: "",
    link: "",
    key_points_en: [""],
    key_points_ar: [""],
    duration: 0,
  });
  const [userQuestions, setUserQuestions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchquestions = async () => {
      try {
        const response = await fetch("/api/daily-video/questions");
        if (response.ok) {
          const data = await response.json();
          setUserQuestions(data);
        }
      } catch (error) {
        setError("Failed to fetch questions: " + error);
      }
    };

    fetchquestions();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setVideoData((prev) => ({ ...prev, [name]: value }));
  };

  const handleKeyPointChange = (
    language: "en" | "ar",
    index: number,
    value: string
  ) => {
    const field = `key_points_${language}`;
    const newKeyPoints = [...(videoData[field as keyof VideoData] as string[])];
    newKeyPoints[index] = value;
    setVideoData((prev) => ({ ...prev, [field]: newKeyPoints }));
  };

  const addKeyPoint = (language: "en" | "ar") => {
    const field = `key_points_${language}`;
    setVideoData((prev) => ({
      ...prev,
      [field]: [...(prev[field as keyof VideoData] as string[]), ""],
    }));
  };

  const removeKeyPoint = (language: "en" | "ar", index: number) => {
    const field = `key_points_${language}`;
    const newKeyPoints = (
      videoData[field as keyof VideoData] as string[]
    ).filter((_, i) => i !== index);
    setVideoData((prev) => ({ ...prev, [field]: newKeyPoints }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/daily-video/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(videoData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload video");
      }

      // Clear form after successful submission
      setVideoData({
        title_en: "",
        title_ar: "",
        content_en: "",
        content_ar: "",
        link: "",
        key_points_en: [""],
        key_points_ar: [""],
        duration: 0,
      });

      alert("Video uploaded successfully!");
    } catch (error) {
      setError("Failed to upload video " + error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-royalBlue">
        Daily Video Management
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            Upload Daily Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="link"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Video Link
              </label>
              <Input
                id="link"
                name="link"
                value={videoData.link}
                onChange={handleInputChange}
                placeholder="Enter YouTube video link"
                required
              />
            </div>

            {/* English Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">English Content</h3>
              <div>
                <label
                  htmlFor="title_en"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Title (English)
                </label>
                <Input
                  id="title_en"
                  name="title_en"
                  value={videoData.title_en}
                  onChange={handleInputChange}
                  placeholder="Enter English title"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="content_en"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Content (English)
                </label>
                <Textarea
                  id="content_en"
                  name="content_en"
                  value={videoData.content_en}
                  onChange={handleInputChange}
                  placeholder="Enter English content"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Points (English)
                </label>
                {videoData.key_points_en.map((point, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <Input
                      value={point}
                      onChange={(e) =>
                        handleKeyPointChange("en", index, e.target.value)
                      }
                      placeholder={`Key point ${index + 1}`}
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      onClick={() => removeKeyPoint("en", index)}
                      className="ml-2 bg-red-500 hover:bg-red-600 text-pureWhite"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => addKeyPoint("en")}
                  className="mt-2 bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
                >
                  Add English Key Point
                </Button>
              </div>
            </div>

            {/* Arabic Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Arabic Content</h3>
              <div>
                <label
                  htmlFor="title_ar"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Title (Arabic)
                </label>
                <Input
                  id="title_ar"
                  name="title_ar"
                  value={videoData.title_ar}
                  onChange={handleInputChange}
                  placeholder="Enter Arabic title"
                  required
                  dir="rtl"
                />
              </div>
              <div>
                <label
                  htmlFor="content_ar"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Content (Arabic)
                </label>
                <Textarea
                  id="content_ar"
                  name="content_ar"
                  value={videoData.content_ar}
                  onChange={handleInputChange}
                  placeholder="Enter Arabic content"
                  rows={4}
                  required
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Points (Arabic)
                </label>
                {videoData.key_points_ar.map((point, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <Input
                      value={point}
                      onChange={(e) =>
                        handleKeyPointChange("ar", index, e.target.value)
                      }
                      placeholder={`Key point ${index + 1}`}
                      className="flex-grow text-right"
                      dir="rtl"
                    />
                    <Button
                      type="button"
                      onClick={() => removeKeyPoint("ar", index)}
                      className="ml-2 bg-red-500 hover:bg-red-600 text-pureWhite"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => addKeyPoint("ar")}
                  className="mt-2 bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
                >
                  Add Arabic Key Point
                </Button>
              </div>
            </div>

            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Video Duration
              </label>
              <Input
                type="number"
                id="duration"
                name="duration"
                value={videoData.duration}
                onChange={handleInputChange}
                placeholder="Enter video duration (e.g., 10.30)"
                required
              />
            </div>

            <Button
              type="submit"
              className="bg-brightTeal hover:bg-brightTeal/90 text-pureWhite"
            >
              Upload Video
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-royalBlue">
            User Questions for Next Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userQuestions.map((q: any) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      {" "}
                      {q.provider
                        ? `${q.provider_email} (${q.provider})`
                        : q.email}
                    </TableCell>
                    <TableCell>{q.content}</TableCell>
                    <TableCell>{formatDate(q.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
