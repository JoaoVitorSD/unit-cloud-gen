import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export default function Header({ darkMode, onToggleDarkMode }) {
    return (
        <Card as="header" className="h-[10vh] border-b bg-card text-card-foreground rounded-none shadow-none">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Unit Cloud Gen</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleDarkMode}
                    className="rounded-full hover:bg-muted transition-colors"
                >
                    {darkMode ? (
                        <Sun className="h-5 w-5 text-primary" />
                    ) : (
                        <Moon className="h-5 w-5 text-primary" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </div>
        </Card>
    );
} 