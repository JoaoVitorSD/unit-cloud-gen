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
import GeneratedCode from "./GeneratedCode";

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

interface ProvidersResponse {
  providers: string[];
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

const modelOptions: { [key: string]: string[] } = {
  openai: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-sonnet", "claude-3-haiku"],
  local: ["local-model"],
};

interface CodeGeneratorProps {
  onTestResults?: (results: GenerateTestsResponse) => void;
}

const CodeGenerator: React.FC<CodeGeneratorProps> = ({ onTestResults }) => {
  const [code, setCode] = useState<string>(
    getDefaultCodeForLanguage("javascript")
  );
  const [selectedLanguage, setSelectedLanguage] =
    useState<string>("javascript");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("openai");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4");
  const [generatedTests, setGeneratedTests] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Fetch available providers on component mount
  useEffect(() => {
    const fetchProviders = async (): Promise<void> => {
      try {
        const response = await fetch("http://localhost:8000/providers");
        if (!response.ok) {
          throw new Error("Failed to fetch providers");
        }
        const data: ProvidersResponse = await response.json();
        setProviders(data.providers);
        if (
          data.providers.length > 0 &&
          !data.providers.includes(selectedProvider)
        ) {
          setSelectedProvider(data.providers[0]);
          const availableModels = modelOptions[data.providers[0]] || [];
          if (availableModels.length > 0) {
            setSelectedModel(availableModels[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching providers:", err);
        setError("Failed to load providers");
      }
    };

    fetchProviders();
  }, [selectedProvider]);

  // Update code when language changes
  useEffect(() => {
    setCode(getDefaultCodeForLanguage(selectedLanguage));
  }, [selectedLanguage]);

  const handleLanguageChange = (value: string): void => {
    setSelectedLanguage(value);
  };

  const handleProviderChange = (value: string): void => {
    setSelectedProvider(value);
    const availableModels = modelOptions[value] || [];
    if (availableModels.length > 0) {
      setSelectedModel(availableModels[0]);
    }
  };

  const handleModelChange = (value: string): void => {
    setSelectedModel(value);
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
      onTestResults?.(data);
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
      javascript: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      python: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      java: "bg-red-100 text-red-800 hover:bg-red-200",
      go: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
      typescript: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      rust: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      csharp: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    };
    return (
      colors[lang] || "bg-accent text-accent-foreground hover:bg-accent/80"
    );
  };

  const monacoLang: string =
    languages.find((l) => l.id === selectedLanguage)?.monaco || "javascript";

  return (
    <div className="flex h-[90vh]">
      {/* Original Code Editor */}
      <div className="w-[35vw] bg-background border-l border-border shadow-2xl">
        <Card className="h-full rounded-none border-0 bg-card">
          {/* Header */}
          <CardHeader className="border-b border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
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
                )} transition-colors cursor-pointer`}
              >
                {languages.find((lang) => lang.id === selectedLanguage)?.name}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Select
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger className="w-[140px] bg-background border-input">
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
                className="gap-2 hover:bg-accent"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>AI Settings:</span>
              </div>

              <Select
                value={selectedProvider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger className="w-[120px] bg-background border-input">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider: string) => (
                    <SelectItem key={provider} value={provider}>
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-[150px] bg-background border-input">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {(modelOptions[selectedProvider] || []).map(
                    (model: string) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          {/* Code Editor */}
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-[60vh] p-4">
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
          <div className="border-t border-border bg-muted/30 p-4">
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
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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

      <GeneratedCode
        generatedCode={generatedTests}
        setGeneratedCode={setGeneratedTests}
        language={selectedLanguage}
        provider={selectedProvider}
        model={selectedModel}
      />
    </div>
  );
};

export default CodeGenerator;
