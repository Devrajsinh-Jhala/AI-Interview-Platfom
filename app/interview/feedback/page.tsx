// app/interview/feedback/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Part,
} from "@google/generative-ai";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  MessageSquareText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react"; // Added more icons
import { InterviewConfig } from "@/types/interview";

// ... (Interface definitions remain the same) ...

interface FeedbackTranscriptMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface InterviewDataForFeedback {
  interviewConfig: InterviewConfig | null;
  problem: { title: string; description: string } | null;
  finalCode: string | null;
  cleanTranscript: FeedbackTranscriptMessage[];
}

export default function FeedbackPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewData, setInterviewData] =
    useState<InterviewDataForFeedback | null>(null);

  // ... (generateFeedback and useEffect for loading data remain largely the same,
  // ensure the prompt in generateFeedback asks Gemini to use Markdown for headings and lists) ...

  const generateFeedback = useCallback(
    async (data: InterviewDataForFeedback) => {
      setIsLoading(true);
      setError(null);

      if (
        !data.interviewConfig ||
        !data.cleanTranscript ||
        data.cleanTranscript.length === 0
      ) {
        setError(
          "Insufficient data to generate feedback. Interview transcript may be missing or empty."
        );
        setIsLoading(false);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        setError(
          "Google Gemini API Key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY."
        );
        setIsLoading(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
      });

      const geminiChatHistory: Part[] = [];
      let lastMappedRole = "";

      data.cleanTranscript.forEach((message) => {
        const currentMappedRole =
          message.role === "assistant" ? "model" : "user";
        if (geminiChatHistory.length === 0 && currentMappedRole === "model") {
          geminiChatHistory.push({
            // @ts-ignore
            role: "user",
            parts: [
              {
                text: "(Interview session context: AI started the conversation or provided initial setup information)",
              },
            ],
          });
          lastMappedRole = "user";
        }

        if (
          currentMappedRole !== lastMappedRole ||
          geminiChatHistory.length === 0
        ) {
          geminiChatHistory.push({
            // @ts-ignore
            role: currentMappedRole,
            parts: [{ text: message.content }],
          });
          lastMappedRole = currentMappedRole;
        } else {
          const lastPart = geminiChatHistory[geminiChatHistory.length - 1];
          if (
            lastPart &&
            // @ts-ignore
            Array.isArray(lastPart.parts) &&
            // @ts-ignore
            lastPart.parts[0]?.text &&
            // @ts-ignore
            typeof lastPart.parts[0].text === "string"
          ) {
            // @ts-ignore
            // @ts-ignore
            (
                // @ts-ignore
              lastPart.parts[0] as { text: string }
            ).text += `\n${message.content}`;
          } else {
            geminiChatHistory.push({
              // @ts-ignore
              role: currentMappedRole,
              parts: [{ text: message.content }],
            });
            lastMappedRole = currentMappedRole;
          }
        }
      });

      // Ensure history doesn't end with model if we're about to send a user prompt
      if (
        geminiChatHistory.length > 0 &&
        // @ts-ignore
        geminiChatHistory[geminiChatHistory.length - 1].role === "model"
      ) {
        // If AI had the last word in history, add a placeholder user turn before our main prompt
        geminiChatHistory.push({
          // @ts-ignore
          role: "user",
          parts: [
            {
              text: "(Continue generating feedback based on the above context and the following instructions.)",
            },
          ],
        });
      }

      const systemInstructionAndFinalPrompt = [
        "You are an AI Technical Interview Feedback Generator. Your goal is to provide clear, constructive, and actionable feedback.",
        `An interview was conducted with the following context:`,
        `- Type: ${data.interviewConfig.type}`,
        `- Difficulty: ${data.interviewConfig.difficulty}`,
        `- For companies: ${data.interviewConfig.companies
          .map((c) => c.name)
          .join(", ")}`,
        "\nProblem Presented:",
        `- Title: ${data.problem?.title || "Not specified"}`,
        `- Description: ${data.problem?.description || "Not specified"}`,
        `\nCandidate's Final Code (if applicable):\n\`\`\`\n${
          data.finalCode || "No code provided or not applicable."
        }\n\`\`\``,
        "\nBased on the entire preceding interview dialogue (provided as chat history) and the information above, provide comprehensive and constructive feedback for the candidate.",
        "Focus on the following areas, providing specific examples from the dialogue where possible:",
        "1. Problem Understanding & Clarification",
        "2. Problem-Solving Approach & Algorithm Design",
        "3. Coding Skills (Correctness, Efficiency, Readability, Edge Cases - if code provided)",
        "4. Communication of Thought Process",
        "5. Technical Knowledge & Application",
        "6. Response to Challenges/Hints",
        "\nIMPORTANT FORMATTING INSTRUCTIONS:",
        "Use Markdown for structure. Specifically:",
        "- Use '## Heading Name' for main sections (e.g., '## Overall Summary', '## Strengths', '## Areas for Improvement', '## Recommendations for Future Interviews').",
        "- Use '### Sub-Heading Name' for sub-sections if needed.",
        "- Use '*' or '-' for bullet points within sections.",
        "- Use bold text ('**text**') for emphasis on key terms or takeaways.",
        "Be objective, fair, and encouraging. The goal is to help the candidate learn and grow.",
        "\nGenerate the feedback now:",
      ].join("\n");

      try {
        console.log("Sending data to Gemini for feedback generation...");
        const chat = model.startChat({
          // @ts-ignore
          history: geminiChatHistory,
          generationConfig: { maxOutputTokens: 3500, temperature: 0.55 }, // Adjusted temperature
          safetySettings: [
            // Loosened for dev, tighten for prod
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
          ],
        });

        const result = await chat.sendMessage(systemInstructionAndFinalPrompt);
        const response = result.response;
        const feedbackText = response.text();

        console.log("Feedback received from Gemini (raw):", feedbackText);
        setFeedback(feedbackText);
      } catch (e: any) {
        /* ... error handling ... */
        console.error("Error generating feedback with Gemini:", e);
        let errorMessage = "Failed to generate feedback.";
        if (e.message) errorMessage += ` Details: ${e.message}`;
        if (e.toString().includes("SAFETY"))
          errorMessage = "Feedback generation blocked by safety settings.";
        else if (
          e.toString().includes("RESOURCE_EXHAUSTED") ||
          e.toString().includes("QUOTA")
        )
          errorMessage = "API quota exceeded.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const storedData = localStorage.getItem("interviewFeedbackData");
    if (storedData) {
      try {
        const parsedData: InterviewDataForFeedback = JSON.parse(storedData);
        setInterviewData(parsedData);
        // Optional: localStorage.removeItem("interviewFeedbackData");
        if (
          parsedData.cleanTranscript &&
          parsedData.cleanTranscript.length > 0
        ) {
          generateFeedback(parsedData);
        } else {
          setError("Interview transcript is empty. Cannot generate feedback.");
          setIsLoading(false);
        }
      } catch (e) {
        setError("Could not load interview data.");
        setIsLoading(false);
      }
    } else {
      setError("No interview data found.");
      setIsLoading(false);
    }
  }, [generateFeedback]);

  // Enhanced Markdown-like renderer
  const renderFeedbackContent = (text: string | null) => {
    if (!text) return null;

    const ICON_MAP = {
      Strengths: (
        <CheckCircle className="inline-block mr-2 h-5 w-5 text-green-500" />
      ),
      "Areas for Improvement": (
        <AlertTriangle className="inline-block mr-2 h-5 w-5 text-yellow-500" />
      ),
      "Recommendations for Future Interviews": (
        <HelpCircle className="inline-block mr-2 h-5 w-5 text-blue-500" />
      ),
      "Overall Summary": (
        <MessageSquareText className="inline-block mr-2 h-5 w-5 text-indigo-500" />
      ),
      // Add more mappings as needed
    };

    return text.split("\n").map((line, index) => {
      // Main Headings (##)
      if (line.startsWith("## ")) {
        const headingText = line.substring(3);
        const Icon = (ICON_MAP as any)[headingText.trim()] || null; // Type assertion
        return (
          <h2
            key={index}
            className="text-2xl font-semibold mt-6 mb-4 border-b border-border pb-2 flex items-center"
          >
            {Icon}
            {headingText}
          </h2>
        );
      }
      // Sub Headings (###)
      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-xl font-semibold mt-5 mb-2">
            {line.substring(4)}
          </h3>
        );
      }
      // Bullet points (* or -)
      if (line.startsWith("* ") || line.startsWith("- ")) {
        // Handle bold text within bullet points: **text**
        const parts = line
          .substring(2)
          .split(/(\*\*.*?\*\*)/g)
          .filter(Boolean);
        return (
          <li
            key={index}
            className="ml-6 list-disc mb-2 text-slate-700 dark:text-slate-300 leading-relaxed"
          >
            {parts.map((part, partIndex) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong
                  key={partIndex}
                  className="font-medium text-slate-800 dark:text-slate-100"
                >
                  {part.slice(2, -2)}
                </strong>
              ) : (
                part
              )
            )}
          </li>
        );
      }
      // Handle bold text in paragraphs: **text**
      if (line.includes("**")) {
        const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        return (
          <p
            key={index}
            className="mb-3 leading-relaxed text-slate-700 dark:text-slate-300"
          >
            {parts.map((part, partIndex) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong
                  key={partIndex}
                  className="font-medium text-slate-800 dark:text-slate-100"
                >
                  {part.slice(2, -2)}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      }

      // Regular paragraph
      if (line.trim() !== "") {
        return (
          <p
            key={index}
            className="mb-3 leading-relaxed text-slate-700 dark:text-slate-300"
          >
            {line}
          </p>
        );
      }
      return null; // Skip empty lines for rendering to avoid too many <br>
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 text-center">
        <div className="bg-background dark:bg-slate-800 p-8 rounded-lg shadow-xl max-w-md w-full">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3 text-red-600 dark:text-red-400">
            Feedback Error
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/")} className="w-full">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && !feedback) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 text-center">
        <div className="bg-background dark:bg-slate-800 p-8 rounded-lg shadow-xl">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-semibold mb-2 text-foreground">
            Generating Your Feedback
          </h1>
          <p className="text-muted-foreground">
            Our AI is analyzing your interview. This might take a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-background dark:bg-slate-800 shadow-xl rounded-lg">
        <header className="bg-gradient-to-r from-primary to-indigo-600 text-white p-6 sm:p-8 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center">
              <Sparkles className="h-8 w-8 mr-3" /> Interview Feedback
            </h1>
            {interviewData?.interviewConfig?.companies &&
              interviewData.interviewConfig.companies.length > 0 && (
                <div className="text-sm opacity-90 hidden sm:block">
                  For:{" "}
                  {interviewData.interviewConfig.companies
                    .map((c) => c.name)
                    .join(", ")}
                </div>
              )}
          </div>
          {interviewData?.interviewConfig && (
            <p className="text-sm opacity-90 mt-1">
              {interviewData.interviewConfig.type.toUpperCase()} Interview (
              {interviewData.interviewConfig.difficulty})
            </p>
          )}
        </header>

        <div className="p-6 md:p-8">
          {isLoading && feedback && (
            <div className="text-center p-4 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
              <p>Feedback is loading or updating...</p>
            </div>
          )}
          {!isLoading && feedback && (
            <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-h2:text-2xl prose-li:my-1">
              {renderFeedbackContent(feedback)}
            </article>
          )}
          {!isLoading && !feedback && !error && (
            <div className="p-8 text-center">
              <MessageSquareText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No feedback available at the moment. If this seems incorrect,
                please try again or contact support.
              </p>
            </div>
          )}
        </div>

        <footer className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-border text-center rounded-b-lg">
          <Button onClick={() => router.push("/")} size="lg">
            Finish & Return Home
          </Button>
        </footer>
      </div>
    </div>
  );
}
