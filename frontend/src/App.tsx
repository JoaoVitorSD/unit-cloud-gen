import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";
import CodeGenerator from "./components/CodeGenerator";
import Header from "./components/Header";
import Results from "./components/Results";

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

interface TestResults {
  tests: string;
  tokens_used: number;
  estimated_cost: number;
  time_taken: number;
}

interface TestQualityResults {
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

function App() {
  const [darkMode, setDarkMode] = React.useState(() => {
    // Check for saved preference or default to light mode
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [testResults, setTestResults] = React.useState<TestResults | null>(
    null
  );
  const [qualityResults, setQualityResults] =
    React.useState<TestQualityResults | null>(null);

  // Debug state changes
  React.useEffect(() => {
    console.log("App component - testResults updated:", testResults);
  }, [testResults]);

  React.useEffect(() => {
    console.log("App component - qualityResults updated:", qualityResults);
  }, [qualityResults]);

  // Apply dark mode class to document on mount and when it changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col transition-colors duration-300">
        <Header darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <main className="flex">
          <CodeGenerator
            onTestResults={setTestResults}
            onQualityResults={setQualityResults}
          />
          <Results testResults={testResults} qualityResults={qualityResults} />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
