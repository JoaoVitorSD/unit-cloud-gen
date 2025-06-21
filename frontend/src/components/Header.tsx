import { Card } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-separator";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, onToggleDarkMode }) => {
  return (
    <Card
      id="header"
      className="h-[10vh] border-b flex justify-center text-card-foreground rounded-none shadow-none transition-colors duration-300"
    >
      <div className="flex items-center justify-between w-full px-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-20 w-20" />
          <h1 className="text-2xl font-bold tracking-tight">Unit Cloud Gen</h1>
          <Separator orientation="vertical" className="h-10" />
          <span className="text-sm text-muted-foreground">
            An AI-powered unit test generator and coverage analyzer
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="mr-4 hover:bg-accent transition-colors duration-200"
          onClick={onToggleDarkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <Sun className="h-5 w-5 text-primary transition-transform duration-200 hover:rotate-12" />
          ) : (
            <Moon className="h-5 w-5 text-primary transition-transform duration-200 hover:rotate-12" />
          )}
        </Button>
      </div>
    </Card>
  );
};

export default Header;
