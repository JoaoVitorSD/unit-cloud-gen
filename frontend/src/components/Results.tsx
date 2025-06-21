import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BarChart, Clock, Code, Coins, GitBranch } from 'lucide-react';
import React from 'react';

interface Metrics {
    codeCoverage: number;
    branchCoverage: number;
    timeSpent: string;
    tokensUsed: number;
    cost: string;
}

const Results: React.FC = () => {
    // Mock data for demonstration
    const metrics: Metrics = {
        codeCoverage: 87,
        branchCoverage: 92,
        timeSpent: '2.3s',
        tokensUsed: 1250,
        cost: '$0.0025'
    };

    const getCoverageColor = (value: number): string => {
        if (value >= 90) return 'bg-green-100 text-green-800 hover:bg-green-200';
        if (value >= 70) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
        return 'bg-red-100 text-red-800 hover:bg-red-200';
    };

    return (
        <div className="h-[90vh] w-[30vw] bg-background border-l border-border shadow-2xl">
            <Card className="h-full rounded-none border-0 bg-card">
                <CardHeader className="border-b border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BarChart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Results</h2>
                            <p className="text-sm text-muted-foreground">Code analysis and metrics</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* Code Coverage Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-foreground">Coverage Metrics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Code className="h-4 w-4" />
                                    <span>Code Coverage</span>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={`${getCoverageColor(metrics.codeCoverage)} transition-colors`}
                                >
                                    {metrics.codeCoverage}%
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <GitBranch className="h-4 w-4" />
                                    <span>Branch Coverage</span>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={`${getCoverageColor(metrics.branchCoverage)} transition-colors`}
                                >
                                    {metrics.branchCoverage}%
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Performance Metrics */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-foreground">Performance</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Time Spent</span>
                                </div>
                                <span className="text-sm font-medium text-foreground">{metrics.timeSpent}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Code className="h-4 w-4" />
                                    <span>Tokens Used</span>
                                </div>
                                <span className="text-sm font-medium text-foreground">{metrics.tokensUsed.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Coins className="h-4 w-4" />
                                    <span>Cost</span>
                                </div>
                                <span className="text-sm font-medium text-foreground">{metrics.cost}</span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Recommendations */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-foreground">Recommendations</h3>
                        <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                                • Add more test cases for uncovered branches
                            </div>
                            <div className="text-sm text-muted-foreground">
                                • Consider optimizing token usage
                            </div>
                            <div className="text-sm text-muted-foreground">
                                • Review edge cases in conditional statements
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Results; 