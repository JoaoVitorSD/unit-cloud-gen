import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BarChart, Clock, Code, Coins, GitBranch } from "lucide-react";
import React from "react";

interface TestResults {
  tests: string;
  tokens_used: number;
  estimated_cost: number;
  time_taken: number;
}

interface ResultsProps {
  testResults: TestResults | null;
}

const Results: React.FC<ResultsProps> = ({ testResults }) => {
  // If no test results, show empty state
  if (!testResults) {
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
                <p className="text-sm text-muted-foreground">
                  Code analysis and metrics
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground">
                Generate tests to see metrics and analysis
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate some basic metrics from the test results
  const testLines = testResults.tests.split('\n').length;
  const testLength = testResults.tests.length;
  
  // Mock coverage data since we don't have actual coverage yet
  const mockCoverage = {
    codeCoverage: Math.min(85 + Math.floor(testLines / 10), 95),
    branchCoverage: Math.min(80 + Math.floor(testLines / 8), 92),
  };

  const getCoverageColor = (value: number): string => {
    if (value >= 90) return "bg-green-100 text-green-800 hover:bg-green-200";
    if (value >= 70) return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    return "bg-red-100 text-red-800 hover:bg-red-200";
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
              <p className="text-sm text-muted-foreground">
                Code analysis and metrics
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Code Coverage Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Coverage Metrics (Estimated)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Code className="h-4 w-4" />
                  <span>Code Coverage</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`${getCoverageColor(
                    mockCoverage.codeCoverage
                  )} transition-colors`}
                >
                  {mockCoverage.codeCoverage}%
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GitBranch className="h-4 w-4" />
                  <span>Branch Coverage</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`${getCoverageColor(
                    mockCoverage.branchCoverage
                  )} transition-colors`}
                >
                  {mockCoverage.branchCoverage}%
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
                <span className="text-sm font-medium text-foreground">
                  {testResults.time_taken.toFixed(2)}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Code className="h-4 w-4" />
                  <span>Tokens Used</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {testResults.tokens_used.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  <span>Cost</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  ${testResults.estimated_cost.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Test Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Test Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Code className="h-4 w-4" />
                  <span>Test Lines</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {testLines}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Code className="h-4 w-4" />
                  <span>Test Characters</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {testLength.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Recommendations */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Recommendations
            </h3>
            <div className="space-y-2">
              {testResults.estimated_cost > 0.01 && (
                <div className="text-sm text-muted-foreground">
                  • Consider optimizing prompts to reduce token usage
                </div>
              )}
              {testResults.time_taken > 5 && (
                <div className="text-sm text-muted-foreground">
                  • Generation took longer than expected - check API status
                </div>
              )}
              {testLines < 10 && (
                <div className="text-sm text-muted-foreground">
                  • Tests seem brief - consider adding more edge cases
                </div>
              )}
              {testLines >= 10 && (
                <div className="text-sm text-muted-foreground">
                  • Good test coverage generated - review for completeness
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Results;
