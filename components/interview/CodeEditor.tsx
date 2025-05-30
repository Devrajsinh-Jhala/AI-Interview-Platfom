// components/interview/CodeEditor.tsx
"use client";

import { useState, useEffect } from "react"; // Import useEffect
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
  initialCode?: string; // Optional: if you want to pass initial code from parent
  initialLanguage?: string; // Optional: if you want to pass initial language from parent
}

const getStarterTemplate = (lang: string) => {
  switch (lang) {
    case "javascript":
      return "// Write your JavaScript solution here\n\nfunction solution() {\n  // Your code here\n}\n";
    case "typescript":
      return "// Write your TypeScript solution here\n\nfunction solution(): void {\n  // Your code here\n}\n"; // Added TS template
    case "python":
      return "# Write your Python solution here\n\ndef solution():\n    # Your code here\n    pass\n";
    case "java":
      return "// Write your Java solution here\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n    // Example method\n    // public int solve() {\n    //    return 0;\n    // }\n}\n";
    case "cpp":
      return '// Write your C++ solution here\n\n#include <iostream>\n\nint main() {\n  // Your code here\n  std::cout << "Hello, C++!" << std::endl;\n  return 0;\n}\n';
    default:
      return `// Write your ${lang} solution here\n`;
  }
};

export function CodeEditor({
  onChange,
  initialCode,
  initialLanguage = "cpp", // Default to JavaScript
}: CodeEditorProps) {
  const [language, setLanguage] = useState(initialLanguage);
  // State to hold the current code in the editor
  const [code, setCode] = useState<string>(
    initialCode || getStarterTemplate(initialLanguage)
  );

  // Effect to update editor content when language changes
  useEffect(() => {
    // If initialCode was not provided for the current language, set the template
    // This specifically handles the language switch, not the very first load if initialCode exists
    // We only want to reset to template if the user *explicitly* changes language from the dropdown.
    // However, the current `handleLanguageChange` already does this.
    // This effect can be simplified or removed if `handleLanguageChange` is the sole source of truth for template resets.
    // For now, let's keep it to ensure the `code` state is in sync if `initialLanguage` prop changes.
    if (!initialCode || language !== initialLanguage) {
      // Condition to avoid overriding passed initial code unless language changes
      // This condition is tricky. The goal is:
      // 1. On first load, use initialCode if provided, else template for initialLanguage.
      // 2. When language dropdown changes, ALWAYS use the new language's template.
      // The current `handleLanguageChange` handles #2.
      // This `useEffect` could handle if `initialLanguage` prop itself changed.
    }
  }, [language, initialLanguage, initialCode]);

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode); // Update local code state
    onChange?.(newCode); // Notify parent
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    const newTemplate = getStarterTemplate(newLanguage);
    setCode(newTemplate); // Directly update the code state with the new template
    onChange?.(newTemplate); // Notify parent about the template change
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 border-b bg-card">
        <h3 className="text-sm font-medium pl-2">Code Editor</h3>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-xs"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-grow relative">
        {" "}
        {/* Added relative for potential overlays */}
        <Editor
          height="100%" // Ensure Editor takes full height of its container
          language={language}
          value={code} // Controlled component: use `value` prop
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: "on",
            automaticLayout: true, // Important for responsiveness
            wordWrap: "on", // Optional: for better readability
            tabSize: 2, // Optional: common preference
            insertSpaces: true, // Optional: common preference
            padding: {
              top: 10, // Add some padding
            },
          }}
        />
      </div>
    </div>
  );
}
