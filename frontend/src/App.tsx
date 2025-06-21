import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
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
  const [darkMode, setDarkMode] = React.useState(true);
  const [testResults, setTestResults] = React.useState<TestResults | null>(
    null
  );

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen flex flex-col ${darkMode ? "dark" : ""}`}>
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
