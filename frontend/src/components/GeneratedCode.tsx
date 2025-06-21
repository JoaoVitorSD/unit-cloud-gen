import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import MonacoEditor from '@monaco-editor/react';
import { Check, Code, Copy } from 'lucide-react';
import React, { useState } from 'react';

const GeneratedCode = () => {
    const [copied, setCopied] = useState(false);
    // Mock generated code
    const generatedCode = `// Generated test cases
describe('Calculator', () => {
    let calculator;

    beforeEach(() => {
        calculator = new Calculator();
    });

    test('adds two numbers correctly', () => {
        expect(calculator.add(2, 3)).toBe(5);
        expect(calculator.add(-1, 1)).toBe(0);
        expect(calculator.add(0, 0)).toBe(0);
    });

    test('subtracts two numbers correctly', () => {
        expect(calculator.subtract(5, 3)).toBe(2);
        expect(calculator.subtract(1, 1)).toBe(0);
        expect(calculator.subtract(0, 5)).toBe(-5);
    });

    test('handles edge cases', () => {
        expect(() => calculator.divide(5, 0)).toThrow('Division by zero');
        expect(calculator.multiply(Number.MAX_SAFE_INTEGER, 2)).toBe(Infinity);
    });
});`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    return (
        <div className="h-[90vh] w-[35vw] bg-background border-l border-border shadow-2xl">
            <Card className="h-full rounded-none border-0 bg-card">
                <CardHeader className="border-b border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Code className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Generated Code</h2>
                                <p className="text-sm text-muted-foreground">Test cases and coverage</p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                            Jest
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            className="gap-2 hover:bg-accent"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4" />
                                    Copy
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden">
                    <div className="h-[calc(100vh-180px)] p-4">
                        <MonacoEditor
                            height="100%"
                            width="100%"
                            language="javascript"
                            value={generatedCode}
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
                                readOnly: true,
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default GeneratedCode; 