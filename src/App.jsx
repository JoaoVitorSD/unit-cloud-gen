import { useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import CodeGenerator from '../frontend/src/components/CodeGenerator';
import Header from '../frontend/src/components/Header';

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
    const [darkMode, setDarkMode] = useState(true);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark');
    };

    return (
        <QueryClientProvider client={queryClient}>
            <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
                <Header darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
                <main className="container mx-auto px-4 py-8 flex-1">
                    <CodeGenerator />
                </main>
            </div>
        </QueryClientProvider>
    );
}

export default App; 