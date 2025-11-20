"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Check, Copy } from "lucide-react";
import { getTalkingPoints } from "./actions";
import type { Consultation } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function TalkingPoints({ consultation }: { consultation: Consultation }) {
  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    startTransition(async () => {
      setError(null);
      
      const { date, ...restOfConsultation } = consultation;
      
      // We only need a subset of fields for the AI, and notes/attendees can be large.
      const { notes, attendees, status, students, ...inputData } = restOfConsultation;

      const result = await getTalkingPoints({
        ...inputData,
        date: new Date(date).toISOString(),
      });

      if (result.success && result.talkingPoints) {
        setTalkingPoints(result.talkingPoints);
      } else {
        setError(result.error || "An unknown error occurred.");
      }
    });
  }, [consultation]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "The talking points have been copied.",
    });
  };

  const renderContent = () => {
    if (isPending) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
        </div>
      );
    }
    if (error) {
      return <p className="text-sm text-destructive">{error}</p>;
    }
    if (talkingPoints.length > 0) {
      return (
        <ul className="space-y-3">
          {talkingPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-3 text-sm">
              <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      );
    }
    return <p className="text-sm text-muted-foreground">No talking points generated.</p>;
  };
  
  const allPointsText = talkingPoints.join('\n');

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Suggested Talking Points
            </CardTitle>
            <CardDescription>
            AI-generated topics to discuss.
            </CardDescription>
        </div>
        {!isPending && talkingPoints.length > 0 && (
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(allPointsText)}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy all points</span>
            </Button>
        )}
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
