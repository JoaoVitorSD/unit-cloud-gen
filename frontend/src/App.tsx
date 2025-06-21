import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import CodeGenerator from "./components/CodeGenerator";
import Header from "./components/Header";
import GeneratedCode from "./components/GeneratedCode";
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

function App() {
  const [darkMode, setDarkMode] = React.useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen flex flex-col ${darkMode ? "dark" : ""}`}>
        <Header darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        <main className="flex">
          <CodeGenerator />
          {/* Generated Code */}
          <GeneratedCode />

          {/* Results */}
          <Results />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
