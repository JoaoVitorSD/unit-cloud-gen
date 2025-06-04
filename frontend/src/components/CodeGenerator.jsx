import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import MonacoEditor from '@monaco-editor/react';
import { Code, Copy, Play, Settings } from 'lucide-react';
import React, { useState } from 'react';

const languages = [
    { id: 'javascript', name: 'JavaScript', monaco: 'javascript' },
    { id: 'python', name: 'Python', monaco: 'python' },
    { id: 'java', name: 'Java', monaco: 'java' },
    { id: 'go', name: 'Go', monaco: 'go' },
    { id: 'typescript', name: 'TypeScript', monaco: 'typescript' },
    { id: 'rust', name: 'Rust', monaco: 'rust' }
];

const CodeGenerator = () => {
    const [code, setCode] = useState('// Paste your code here\nfunction hello() {\n  console.log("Hello World!");\n}');
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleLanguageChange = (value) => {
        setSelectedLanguage(value);
    };

    const handleGenerate = async () => {
        setIsProcessing(true);
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Processing code:', code);
        setIsProcessing(false);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    const getLanguageBadgeColor = (lang) => {
        const colors = {
            javascript: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
            python: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
            java: 'bg-red-100 text-red-800 hover:bg-red-200',
            go: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
            typescript: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
            rust: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
        };
        return colors[lang] || 'bg-accent text-accent-foreground hover:bg-accent/80';
    };

    const monacoLang = languages.find(l => l.id === selectedLanguage)?.monaco || 'javascript';

    return (
        <div className="h-[90vh] w-[35vw] bg-background border-l border-border shadow-2xl">
            <Card className="h-full rounded-none border-0 bg-card">
                {/* Header */}
                <CardHeader className="border-b border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Code className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Code Editor</h2>
                                <p className="text-sm text-muted-foreground">Write and preview your code</p>
                            </div>
                        </div>
                        <Badge
                            variant="secondary"
                            className={`${getLanguageBadgeColor(selectedLanguage)} transition-colors cursor-pointer`}
                        >
                            {languages.find(lang => lang.id === selectedLanguage)?.name}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-[140px] bg-background border-input">
                                <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((lang) => (
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
                    </div>
                </CardHeader>

                {/* Code Editor */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <div className="h-[calc(100vh-180px)] p-4">
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
                                wordWrap: 'on',
                                fontFamily: 'Fira Mono, monospace',
                                automaticLayout: true,
                                lineNumbers: 'on',
                                roundedSelection: false,
                                scrollbar: {
                                    vertical: 'auto',
                                    horizontal: 'auto'
                                },
                                tabSize: 2,
                                renderLineHighlight: 'all',
                                formatOnPaste: true,
                                formatOnType: true,
                                fixedOverflowWidgets: true,
                                theme: 'vs-dark',
                            }}
                            onChange={value => setCode(value || '')}
                        />
                    </div>
                </CardContent>

                {/* Footer */}
                <div className="border-t border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Settings className="h-4 w-4" />
                            <span>Lines: {code.split('\n').length}</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span>Chars: {code.length}</span>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={isProcessing}
                            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4" />
                                    Generate
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default CodeGenerator;