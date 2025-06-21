import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import MonacoEditor from "@monaco-editor/react";
import { Check, Code, Copy, Star } from "lucide-react";
import React, { useState } from "react";

interface TestQualityResponse {
  quality_score: number;
  feedback: string[];
  suggestions: string[];
  coverage_estimate: number;
  actual_coverage: number;
  lines_covered: number;
  lines_total: number;
  branches_covered: number;
  branches_total: number;
  coverage_error: string;
  // Test execution results
  test_execution_success: boolean;
  test_suites_total: number;
  test_suites_failed: number;
  tests_total: number;
  tests_failed: number;
  tests_passed: number;
  execution_time: number;
  execution_error: string;
}

interface GeneratedCodeProps {
  generatedCode: string;
  setGeneratedCode: (code: string) => void;
  language: string;
  provider: string;
  model: string;
  originalCode: string;
  onQualityResults?: (results: TestQualityResponse) => void;
}

interface LanguageConfig {
  monaco: string;
  framework: string;
  badgeColor: string;
}

const languageConfigs: { [key: string]: LanguageConfig } = {
  javascript: {
    monaco: "javascript",
    framework: "Jest",
    badgeColor:
      "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30",
  },
  typescript: {
    monaco: "typescript",
    framework: "Jest",
    badgeColor:
      "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30",
  },
  python: {
    monaco: "python",
    framework: "pytest",
    badgeColor:
      "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30",
  },
  java: {
    monaco: "java",
    framework: "JUnit",
    badgeColor:
      "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
  },
  go: {
    monaco: "go",
    framework: "testing",
    badgeColor:
      "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:hover:bg-cyan-900/30",
  },
  rust: {
    monaco: "rust",
    framework: "cargo test",
    badgeColor:
      "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30",
  },
};

const GeneratedCode: React.FC<GeneratedCodeProps> = ({
  generatedCode,
  setGeneratedCode,
  language,
  provider,
  model,
  originalCode,
  onQualityResults,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [testExecutionStatus, setTestExecutionStatus] = useState<{
    success: boolean;
    failed: number;
    total: number;
    error?: string;
  } | null>(null);

  const config = languageConfigs[language] || languageConfigs.javascript;

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleAnalyze = async (): Promise<void> => {
    if (!generatedCode.trim() || !originalCode.trim()) {
      return;
    }

    console.log("Starting quality analysis...");
    setIsAnalyzing(true);

    try {
      const requestBody = {
        code: originalCode,
        test_code: generatedCode,
        language: language,
      };
      console.log("Quality analysis request:", requestBody);

      const response = await fetch(
        "http://localhost:8000/evaluate-test-quality",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TestQualityResponse = await response.json();
      console.log("Test analysis response:", data);

      // Pass the quality results back to the parent component
      onQualityResults?.(data);
      console.log("Quality results passed to parent component");

      // Update test execution status
      setTestExecutionStatus({
        success: data.test_execution_success,
        failed: data.tests_failed,
        total: data.tests_total,
        error: data.execution_error || undefined,
      });
    } catch (err) {
      console.error("Error analyzing tests:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-[90vh] w-[35vw] bg-background border-l border-border shadow-lg transition-colors duration-300">
      <Card className="h-full rounded-none border-0 bg-card transition-colors duration-300">
        <CardHeader className="border-b border-border bg-muted/30 p-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg transition-colors duration-300">
                <Code className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Generated Tests
                </h2>
                <p className="text-sm text-muted-foreground">
                  Generated by {provider} ({model})
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`${config.badgeColor} transition-colors duration-300`}
            >
              {config.framework}
            </Badge>
          </div>

          {/* Test Execution Status */}
          {testExecutionStatus && (
            <div className="mt-2 p-2 rounded border">
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    testExecutionStatus.success ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="font-medium">
                  {testExecutionStatus.success
                    ? "Tests Passed"
                    : "Tests Failed"}
                </span>
                <span className="text-muted-foreground">
                  ({testExecutionStatus.failed} failed,{" "}
                  {testExecutionStatus.total} total)
                </span>
              </div>
              {testExecutionStatus.error && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Error: {testExecutionStatus.error}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2 hover:bg-accent transition-colors duration-200"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Tests
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={
                isAnalyzing || !generatedCode.trim() || !originalCode.trim()
              }
              className="gap-2 hover:bg-accent transition-colors duration-200"
              title="Evaluate test quality and get coverage metrics"
            >
              {isAnalyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4" />
                  Evaluate Quality
                </>
              )}
            </Button>

            <div className="text-sm text-muted-foreground ml-2">
              {generatedCode.split("\n").length} lines • {generatedCode.length}{" "}
              chars
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="h-[60vh] p-4">
            <MonacoEditor
              height="100%"
              width="100%"
              language={config.monaco}
              value={generatedCode}
              onChange={(value) => setGeneratedCode(value || "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                fontFamily: "Fira Mono, monospace",
                automaticLayout: true,
                lineNumbers: "on",
                roundedSelection: false,
                scrollbar: {
                  vertical: "auto",
                  horizontal: "auto",
                },
                tabSize: 2,
                renderLineHighlight: "all",
                formatOnPaste: true,
                formatOnType: true,
                fixedOverflowWidgets: true,
                readOnly: false,
                placeholder:
                  "No tests generated yet, provide a code and click generate tests button",
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneratedCode;
