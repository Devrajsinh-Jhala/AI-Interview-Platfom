// components/interview/CodeEditor.tsx
"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languageOptions = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

interface CodeEditorProps {
  onChange?: (code: string) => void;
}

export function CodeEditor({ onChange }: CodeEditorProps) {
  const [language, setLanguage] = useState("cpp");

  const getStarterTemplate = (lang: string) => {
    switch (lang) {
      case "javascript":
        return "// Write your JavaScript solution here\n\nfunction solution() {\n  // Your code here\n}\n";
      case "python":
        return "# Write your Python solution here\n\ndef solution():\n    # Your code here\n    pass\n";
      case "java":
        return "// Write your Java solution here\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}\n";
      case "cpp":
        return "// Write your C++ solution here\n\nint main() {\n  // Your code here\n  return 0;\n}\n";
      default:
        return "// Write your solution here\n";
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    onChange?.(getStarterTemplate(newLanguage));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 border-b">
        <h3 className="text-sm font-medium">Code Editor</h3>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-grow">
        <Editor
          height="100%"
          language={language}
          defaultValue={getStarterTemplate(language)}
          onChange={(value) => onChange?.(value || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: "on",
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
