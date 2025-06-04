import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';

export default function Header({ darkMode, onToggleDarkMode }) {
    return (
        <header className="border-b">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Unit Cloud Gen</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleDarkMode}
                    className="rounded-full"
                >
                    {darkMode ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </div>
        </header>
    );
} 