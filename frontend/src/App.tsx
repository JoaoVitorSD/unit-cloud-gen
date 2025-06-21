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

function App() {
  const [darkMode, setDarkMode] = React.useState(() => {
    // Check for saved preference or default to light mode
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [testResults, setTestResults] = React.useState<TestResults | null>(
    null
  );

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
          <CodeGenerator onTestResults={setTestResults} />
          <Results testResults={testResults} />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
