import { getDefaultCodeForLanguage } from "@/assets/defaultCode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import MonacoEditor from "@monaco-editor/react";
import { Code, Copy, Play, Settings, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import GeneratedTests from "./GeneratedTests";

interface Language {
  id: string;
  name: string;
  monaco: string;
}

interface ColorMap {
  [key: string]: string;
}

interface GenerateTestsResponse {
  tests: string;
  tokens_used: number;
  estimated_cost: number;
  time_taken: number;
}

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

interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

interface ProviderInfo {
  name: string;
  description: string;
  models: ModelInfo[];
}

interface ModelsResponse {
  models_by_provider: {
    [key: string]: ProviderInfo;
  };
}

const languages: Language[] = [
  { id: "javascript", name: "JavaScript", monaco: "javascript" },
  { id: "python", name: "Python", monaco: "python" },
  { id: "java", name: "Java", monaco: "java" },
  { id: "go", name: "Go", monaco: "go" },
  { id: "typescript", name: "TypeScript", monaco: "typescript" },
  { id: "rust", name: "Rust", monaco: "rust" },
  { id: "csharp", name: "C#", monaco: "csharp" },
];

interface CodeGeneratorProps {
  onTestResults?: (results: GenerateTestsResponse) => void;
  onQualityResults?: (results: TestQualityResponse) => void;
}

const CodeGenerator: React.FC<CodeGeneratorProps> = ({
  onTestResults,
  onQualityResults,
}) => {
  const [code, setCode] = useState<string>(
    getDefaultCodeForLanguage("javascript")
  );
  const [selectedLanguage, setSelectedLanguage] =
    useState<string>("javascript");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [generatedTests, setGeneratedTests] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modelsByProvider, setModelsByProvider] = useState<{
    [key: string]: ProviderInfo;
  }>({});

  // Fetch available providers and models on component mount
  useEffect(() => {
    const fetchProvidersAndModels = async (): Promise<void> => {
      try {
        // Fetch models (which includes provider info)
        const modelsResponse = await fetch("http://localhost:8000/models");
        if (!modelsResponse.ok) {
          throw new Error("Failed to fetch models");
        }
        const modelsData: ModelsResponse = await modelsResponse.json();
        setModelsByProvider(modelsData.models_by_provider);

        // Set default provider and model
        const providerKeys = Object.keys(modelsData.models_by_provider);
        if (providerKeys.length > 0) {
          const defaultProvider = providerKeys[0];
          setSelectedProvider(defaultProvider);

          const providerModels = modelsData.models_by_provider[defaultProvider];
          if (providerModels && providerModels.models.length > 0) {
            setSelectedModel(providerModels.models[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching models:", err);
        setError("Failed to load models");
      }
    };

    fetchProvidersAndModels();
  }, []);

  // Update code when language changes
  useEffect(() => {
    setCode(getDefaultCodeForLanguage(selectedLanguage));
  }, [selectedLanguage]);

  const handleLanguageChange = (value: string): void => {
    setSelectedLanguage(value);
  };

  const handleProviderChange = (value: string): void => {
    setSelectedProvider(value);
    const providerModels = modelsByProvider[value];
    if (providerModels && providerModels.models.length > 0) {
      setSelectedModel(providerModels.models[0].id);
    }
  };

  const handleModelChange = (value: string): void => {
    setSelectedModel(value);
  };

  // Helper functions to get current model and provider info
  const getCurrentModelInfo = (): ModelInfo | null => {
    const providerModels = modelsByProvider[selectedProvider];
    return (
      providerModels?.models.find((model) => model.id === selectedModel) || null
    );
  };

  const getCurrentProviderInfo = (): ProviderInfo | null => {
    return modelsByProvider[selectedProvider] || null;
  };

  const handleGenerate = async (): Promise<void> => {
    setIsProcessing(true);
    setError("");
    setGeneratedTests("");

    try {
      const response = await fetch("http://localhost:8000/generate-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          provider: selectedProvider,
          model: selectedModel,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GenerateTestsResponse = await response.json();
      setGeneratedTests(data.tests);
      console.log("Generated tests data:", data);
      onTestResults?.(data);
      console.log("Test results passed to parent component");
      console.log("Generated tests:", data);
    } catch (err) {
      console.error("Error generating tests:", err);
      setError(err instanceof Error ? err.message : "Failed to generate tests");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const getLanguageBadgeColor = (lang: string): string => {
    const colors: ColorMap = {
      javascript:
        "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30",
      python:
        "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30",
      java: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
      go: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:hover:bg-cyan-900/30",
      typescript:
        "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30",
      rust: "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30",
      csharp:
        "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30",
    };
    return (
      colors[lang] || "bg-accent text-accent-foreground hover:bg-accent/80"
    );
  };

  const monacoLang: string =
    languages.find((l) => l.id === selectedLanguage)?.monaco || "javascript";

  return (
    <div className="flex h-[90vh]">
      <div className="w-[35vw] bg-background border-r border-border shadow-lg transition-colors duration-300">
        <Card className="h-full rounded-none border-0 bg-card transition-colors duration-300 gap-1 ">
          <CardHeader className="border-b border-border bg-muted/30 p-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg transition-colors duration-300">
                  <Code className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Code Editor
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Write and preview your code
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={`${getLanguageBadgeColor(
                  selectedLanguage
                )} transition-colors duration-300 cursor-pointer`}
              >
                {languages.find((lang) => lang.id === selectedLanguage)?.name}
              </Badge>
            </div>

            <div className="flex items-center flex-wrap gap-2 mt-3">
              <Select
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger className="w-[140px] bg-background border-input transition-colors duration-300">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang: Language) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Separator orientation="vertical" className="h-6" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2 hover:bg-accent transition-colors duration-200"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>AI Settings:</span>
              </div>

              <Select
                value={selectedProvider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger className="w-auto min-w-[140px] flex-grow bg-background border-input transition-colors duration-300">
                  {selectedProvider && modelsByProvider[selectedProvider] ? (
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium text-sm">
                        {modelsByProvider[selectedProvider].name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {modelsByProvider[selectedProvider].description}
                      </span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Provider" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(modelsByProvider).map(
                    ([providerId, providerInfo]) => (
                      <SelectItem key={providerId} value={providerId}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {providerInfo.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {providerInfo.description}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-auto min-w-[200px] flex-grow bg-background border-input transition-colors duration-300">
                  {getCurrentModelInfo() ? (
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium text-sm">
                        {getCurrentModelInfo()?.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {getCurrentModelInfo()?.description}
                      </span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Model" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {(modelsByProvider[selectedProvider]?.models || []).map(
                    (model: ModelInfo) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {getCurrentProviderInfo() && getCurrentModelInfo() && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium">Provider:</span>{" "}
                {getCurrentProviderInfo()?.name} |{" "}
                <span className="font-medium">Model:</span>{" "}
                {getCurrentModelInfo()?.name}
              </div>
            )}
          </CardHeader>

          {/* Code Editor */}
          <CardContent className="flex-1 p-0">
            <div className="h-[55vh] p-4">
              <MonacoEditor
                height="100%"
                width="100%"
                language={monacoLang}
                value={code}
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
                  theme: "vs-dark",
                }}
                onChange={(value: string | undefined) => setCode(value || "")}
              />
            </div>
          </CardContent>

          {/* Footer */}
          <div className="border-t border-border bg-muted/30 p-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Settings className="h-4 w-4" />
                <span>Lines: {code.split("\n").length}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>Chars: {code.length}</span>
              </div>

              <div className="flex items-center gap-2">
                {error && <span className="text-sm text-red-500">{error}</span>}
                <Button
                  onClick={handleGenerate}
                  disabled={isProcessing || !code.trim()}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Generate Tests
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <GeneratedTests
        GeneratedTests={generatedTests}
        setGeneratedTests={setGeneratedTests}
        language={selectedLanguage}
        provider={selectedProvider}
        model={selectedModel}
        originalCode={code}
        onQualityResults={onQualityResults}
      />
    </div>
  );
};

export default CodeGenerator;
