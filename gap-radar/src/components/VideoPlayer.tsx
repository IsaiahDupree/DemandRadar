"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Video } from "lucide-react";

interface VideoData {
  id: string;
  title: string;
  description: string;
  embedUrl: string;
  duration: string;
}

interface CourseInfo {
  courseTitle: string;
  lessonNumber: number;
  totalLessons: number;
}

interface VideoPlayerProps {
  video: VideoData;
  isWatched?: boolean;
  courseInfo?: CourseInfo;
  onProgressUpdate?: (videoId: string, watched: boolean) => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function VideoPlayer({
  video,
  isWatched = false,
  courseInfo,
  onProgressUpdate,
  onNext,
  onPrevious,
}: VideoPlayerProps) {
  const [watched, setWatched] = useState(isWatched);

  const handleMarkWatched = () => {
    setWatched(true);
    if (onProgressUpdate) {
      onProgressUpdate(video.id, true);
    }
  };

  const showPrevious = onPrevious && (!courseInfo || courseInfo.lessonNumber > 1);
  const showNext = onNext && (!courseInfo || courseInfo.lessonNumber < courseInfo.totalLessons);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {courseInfo && (
              <div className="mb-2">
                <Badge variant="outline" className="gap-1">
                  <Video className="h-3 w-3" />
                  Lesson {courseInfo.lessonNumber} of {courseInfo.totalLessons}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {courseInfo.courseTitle}
                </p>
              </div>
            )}
            <CardTitle>{video.title}</CardTitle>
            <CardDescription>{video.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {video.duration}
            </Badge>
            {watched && (
              <Badge variant="default" className="gap-1" data-testid="watched-indicator">
                <CheckCircle2 className="h-3 w-3" />
                Watched
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Embed */}
        <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
          <iframe
            src={video.embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>

        {/* Progress Tracking */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {!watched ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkWatched}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark as Watched
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Watched
              </p>
            )}
          </div>

          {/* Course Navigation */}
          {(showPrevious || showNext) && (
            <div className="flex items-center gap-2">
              {showPrevious && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrevious}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}
              {showNext && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onNext}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Not Watched Indicator */}
        {!watched && (
          <p className="text-xs text-muted-foreground">
            Not watched yet. Click "Mark as Watched" when you complete this video.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
