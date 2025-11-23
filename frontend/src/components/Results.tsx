import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  BarChart,
  Clock,
  Code,
  Coins,
  GitBranch,
  Lightbulb,
  MessageSquare,
  Save,
  Star,
} from "lucide-react";
import React, { useState } from "react";
import type { ProblemDefinition } from "./ProblemDefinitionModal";

interface TestResults {
  tests: string;
  tokens_used: number;
  estimated_cost: number;
  time_taken: number;
}

interface TestQualityResults {
  quality_score: number;
  feedback: string[];
  suggestions: string[];
  coverage_estimate: number;
  actual_coverage: number;
  lines_covered: number;
  lines_total: number;
  branch_coverage: number; // Branch coverage percentage (0-100)
  branches_total: number;
  coverage_error: string;
  // Test execution results
  test_execution_success: boolean;
  test_suites_total: number;
  test_suites_failed: number;
  tests_total: number;
  tests_failed: number;
  tests_passed: number;
  execution_time: number;
  execution_error: string;
  // Individual test results
  test_details?: Array<{
    suite: string;
    name: string;
    status: string;
    error_message?: string;
  }>;
  // Evaluation cost and time
  evaluation_tokens_used?: number;
  evaluation_cost?: number;
  evaluation_time?: number;
}

interface ResultsProps {
  testResults: TestResults | null;
  qualityResults?: TestQualityResults | null;
  problemDefinition?: ProblemDefinition | null;
  sourceCode?: string;
  testCode?: string;
}

const Results: React.FC<ResultsProps> = ({
  testResults,
  qualityResults,
  problemDefinition,
  sourceCode,
  testCode,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(
    null
  );

  const handleSave = async () => {
    if (!testResults || !qualityResults || !sourceCode || !testCode || !problemDefinition) {
      console.warn("Cannot save: missing required data", {
        testResults: !!testResults,
        qualityResults: !!qualityResults,
        sourceCode: !!sourceCode,
        testCode: !!testCode,
        problemDefinition: !!problemDefinition,
      });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      console.log("Saving with data:", {
        problemDefinition,
        sourceCode: sourceCode.substring(0, 50) + "...",
        testCode: testCode.substring(0, 50) + "...",
      });
      
      const saveData = {
        problem_name: problemDefinition?.problem_name || null,
        leetcode_link: problemDefinition?.leetcode_link || null,
        rank: problemDefinition?.rank || null,
        problem_type: problemDefinition?.problem_type || null,
        definition: problemDefinition?.definition || null,
        code: sourceCode,
        test_code: testCode,
        quality_score: qualityResults.quality_score,
        coverage_estimate: qualityResults.coverage_estimate,
        actual_coverage: qualityResults.actual_coverage,
        tests_total: qualityResults.tests_total,
        tests_passed: qualityResults.tests_passed,
        tests_failed: qualityResults.tests_failed,
        execution_time: qualityResults.execution_time,
        evaluation_time: qualityResults.evaluation_time || 0,
        generation_tokens: testResults.tokens_used,
        generation_cost: testResults.estimated_cost,
        evaluation_tokens: qualityResults.evaluation_tokens_used || 0,
        evaluation_cost: qualityResults.evaluation_cost || 0,
        test_details: qualityResults.test_details || null,
        execution_error: qualityResults.execution_error || null,
        coverage_error: qualityResults.coverage_error || null,
      };

      const response = await fetch("http://localhost:8000/save-problem-result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error("Error saving:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Debug logging
  console.log("Results component received:", {
    testResults,
    qualityResults,
    problemDefinition,
  });

  // If no test results, show empty state
  if (!testResults) {
    return (
      <div className="h-[90vh] w-[30vw] bg-background border-l border-border shadow-lg transition-colors duration-300">
        <Card className="h-full rounded-none border-0 bg-card transition-colors duration-300">
          <CardHeader className="border-b border-border bg-muted/30 p-4 transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg transition-colors duration-300">
                <BarChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Results
                </h2>
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
  const testLines = testResults.tests.split("\n").length;
  const testLength = testResults.tests.length;

  // Use actual coverage data if available
  const coverageData = qualityResults
    ? {
        codeCoverage: qualityResults.actual_coverage,
        branchCoverage: qualityResults.branch_coverage, // Already a percentage
        estimatedCoverage: qualityResults.coverage_estimate,
        linesCovered: qualityResults.lines_covered,
        linesTotal: qualityResults.lines_total,
        branchesCovered: qualityResults.branch_coverage, // Branch coverage percentage
        branchesTotal: qualityResults.branches_total,
        hasError: !!qualityResults.coverage_error,
      }
    : null;

  const getCoverageColor = (value: number): string => {
    if (value >= 90)
      return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30";
    if (value >= 70)
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30";
    return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30";
  };

  const getQualityColor = (score: number): string => {
    if (score >= 8)
      return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30";
    if (score >= 6)
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30";
    return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30";
  };

  return (
    <div className="h-[90vh] w-[30vw] bg-background border-l border-border shadow-lg transition-colors duration-300">
      <Card className="h-full rounded-none border-0 bg-card transition-colors duration-300">
        <CardHeader className="border-b border-border bg-muted/30 p-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg transition-colors duration-300">
                <BarChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Results</h2>
                <p className="text-sm text-muted-foreground">
                  Code analysis and metrics
                </p>
              </div>
            </div>
            {qualityResults && sourceCode && testCode && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : saveStatus === "success" ? (
                  <>
                    <Save className="h-4 w-4" />
                    Saved!
                  </>
                ) : saveStatus === "error" ? (
                  <>
                    <Save className="h-4 w-4" />
                    Error
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
          {/* Quality Score Section */}
          {qualityResults && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Test Quality Score
                </h3>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={`${getQualityColor(
                      qualityResults.quality_score
                    )} transition-colors duration-300 text-lg px-4 py-2`}
                  >
                    {qualityResults.quality_score.toFixed(1)}/10
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {qualityResults.quality_score >= 8
                      ? "Excellent"
                      : qualityResults.quality_score >= 6
                      ? "Good"
                      : qualityResults.quality_score >= 4
                      ? "Fair"
                      : "Needs Improvement"}
                  </span>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Code Coverage Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Coverage Metrics {qualityResults ? "(Actual)" : ""}
            </h3>
            {coverageData ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Code className="h-4 w-4" />
                      <span>Code Coverage</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${getCoverageColor(
                        coverageData.codeCoverage
                      )} transition-colors duration-300`}
                    >
                      {coverageData.codeCoverage.toFixed(1)}%
                    </Badge>
                    {coverageData.linesTotal > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {coverageData.linesCovered}/{coverageData.linesTotal}{" "}
                        lines
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GitBranch className="h-4 w-4" />
                      <span>Branch Coverage</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${getCoverageColor(
                        coverageData.branchCoverage
                      )} transition-colors duration-300`}
                    >
                      {coverageData.branchCoverage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                {/* Coverage Error Display */}
                {coverageData.hasError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Coverage analysis failed: {qualityResults?.coverage_error}
                    </span>
                  </div>
                )}

                {/* Estimated vs Actual Coverage Comparison */}
                <div className="text-xs text-muted-foreground">
                  Estimated: {coverageData.estimatedCoverage.toFixed(1)}% |
                  Actual: {coverageData.codeCoverage.toFixed(1)}%
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                Click "Evaluate Quality" in the generated tests panel to see
                coverage metrics
              </div>
            )}
          </div>

          <Separator />

          {/* Test Execution Results */}
          {qualityResults && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Test Execution Results
                </h3>
                <div className="space-y-4">
                  {/* Execution Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          qualityResults.test_execution_success
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span>Execution Status</span>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        qualityResults.test_execution_success
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {qualityResults.test_execution_success
                        ? "Success"
                        : "Failed"}
                    </span>
                  </div>

                  {/* Test Suites */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Code className="h-4 w-4" />
                      <span>Test Suites</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {qualityResults.test_suites_failed} failed,{" "}
                      {qualityResults.test_suites_total} total
                    </span>
                  </div>

                  {/* Tests */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Code className="h-4 w-4" />
                      <span>Tests</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {qualityResults.tests_failed} failed,{" "}
                      {qualityResults.tests_passed} passed,{" "}
                      {qualityResults.tests_total} total
                    </span>
                  </div>

                  {/* Execution Time */}
                  {qualityResults.execution_time > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Execution Time</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {qualityResults.execution_time.toFixed(2)}s
                      </span>
                    </div>
                  )}

                  {/* Generation Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Generation Time</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {testResults.time_taken.toFixed(2)}s
                    </span>
                  </div>

                  {/* Tokens Used */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Code className="h-4 w-4" />
                      <span>Tokens Used</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {testResults.tokens_used.toLocaleString()}
                    </span>
                  </div>

                  {/* Cost */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Coins className="h-4 w-4" />
                      <span>Cost</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      ${testResults.estimated_cost.toFixed(4)}
                    </span>
                  </div>

                  {/* Execution Error - only show if we don't have test_details */}
                  {qualityResults.execution_error &&
                    (!qualityResults.test_details ||
                      qualityResults.test_details.length === 0) && (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs">
                          {qualityResults.execution_error}
                        </span>
                      </div>
                    )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Performance Metrics (when no quality results) */}
          {!qualityResults && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">
                  Performance
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Generation Time</span>
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

              {/* Individual Test Results - moved here for better visibility */}
              {qualityResults?.test_details &&
                qualityResults?.test_details?.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Individual Test Results (
                      {qualityResults?.test_details?.length})
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {qualityResults?.test_details?.map(
                        (
                          test: {
                            suite: string;
                            name: string;
                            status: string;
                            error_message?: string;
                          },
                          index: number
                        ) => (
                          <div
                            key={index}
                            className={`p-2 rounded ${
                              test.status === "passed"
                                ? "bg-green-50 dark:bg-green-900/20"
                                : "bg-red-50 dark:bg-red-900/20"
                            }`}
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  test.status === "passed"
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />
                              <span
                                className={`font-medium ${
                                  test.status === "passed"
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-red-700 dark:text-red-300"
                                }`}
                              >
                                {test.status === "passed" ? "✓" : "✕"}
                              </span>
                              <span
                                className={`flex-1 ${
                                  test.status === "passed"
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-red-700 dark:text-red-300"
                                }`}
                              >
                                {test.name}
                              </span>
                            </div>
                            {test.status === "failed" && test.error_message && (
                              <div className="mt-1 ml-6 text-xs text-red-600 dark:text-red-400 font-mono bg-red-100 dark:bg-red-950/30 p-2 rounded border border-red-200 dark:border-red-800">
                                → {test.error_message}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Add separator after Individual Test Results */}
              {qualityResults?.test_details &&
                qualityResults?.test_details.length > 0 && <Separator />}
            </>
          )}

          {/* Quality Feedback Section */}
          {qualityResults && qualityResults.feedback.length > 0 && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Quality Feedback
                </h3>
                <div className="space-y-2">
                  {qualityResults.feedback.map((feedback, index) => (
                    <div
                      key={index}
                      className="text-sm text-muted-foreground bg-muted/30 p-2 rounded"
                    >
                      • {feedback}
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Suggestions Section */}
          {qualityResults && qualityResults.suggestions.length > 0 && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Suggestions
                </h3>
                <div className="space-y-2">
                  {qualityResults.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded"
                    >
                      💡 {suggestion}
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Test Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Test Information
            </h3>
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
              {coverageData && coverageData.codeCoverage < 80 && (
                <div className="text-sm text-muted-foreground">
                  • Consider adding more test cases to improve coverage
                </div>
              )}
              {testLines < 10 && (
                <div className="text-sm text-muted-foreground">
                  • Generated tests seem minimal - review the input code
                </div>
              )}
              {qualityResults && qualityResults.quality_score < 6 && (
                <div className="text-sm text-muted-foreground">
                  • Test quality is below average - consider regenerating with
                  better prompts
                </div>
              )}
              {qualityResults &&
                coverageData &&
                Math.abs(
                  coverageData.estimatedCoverage - coverageData.codeCoverage
                ) > 20 && (
                  <div className="text-sm text-muted-foreground">
                    • Large gap between estimated and actual coverage - review
                    test quality
                  </div>
                )}
              {qualityResults && !qualityResults.test_execution_success && (
                <div className="text-sm text-muted-foreground">
                  • Tests failed to execute - check test syntax and dependencies
                </div>
              )}
              {qualityResults && qualityResults.tests_failed > 0 && (
                <div className="text-sm text-muted-foreground">
                  • {qualityResults.tests_failed} test(s) failed - review test
                  logic and assertions
                </div>
              )}
              {qualityResults && qualityResults.execution_error && (
                <div className="text-sm text-muted-foreground">
                  • Test execution error: {qualityResults.execution_error}
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
