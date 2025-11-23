import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";

export interface ProblemDefinition {
    problem_name: string;
    leetcode_link: string;
    rank: string;
    problem_type: string;
    definition: string;
}

interface ProblemDefinitionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (definition: ProblemDefinition) => void;
    initialValues?: Partial<ProblemDefinition>;
}

const ProblemDefinitionModal: React.FC<ProblemDefinitionModalProps> = ({
    open,
    onOpenChange,
    onConfirm,
    initialValues,
}) => {
    const [formData, setFormData] = useState<ProblemDefinition>({
        problem_name: initialValues?.problem_name || "",
        leetcode_link: initialValues?.leetcode_link || "",
        rank: initialValues?.rank || "",
        problem_type: initialValues?.problem_type || "",
        definition: initialValues?.definition || "",
    });

    React.useEffect(() => {
        if (initialValues) {
            setFormData({
                problem_name: initialValues.problem_name || "",
                leetcode_link: initialValues.leetcode_link || "",
                rank: initialValues.rank || "",
                problem_type: initialValues.problem_type || "",
                definition: initialValues.definition || "",
            });
        } else {
            setFormData({
                problem_name: "",
                leetcode_link: "",
                rank: "",
                problem_type: "",
                definition: "",
            });
        }
    }, [initialValues]);

    const handleSubmit = () => {
        if (!formData.problem_name.trim()) {
            return;
        }
        onConfirm(formData);
        onOpenChange(false);
    };

    const updateField = <K extends keyof ProblemDefinition>(
        field: K,
        value: ProblemDefinition[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Problem Definition</DialogTitle>
                    <DialogDescription>
                        Provide details about the problem to improve test
                        generation quality.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="problem_name">
                            Problem Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="problem_name"
                            placeholder="e.g., Two Sum"
                            value={formData.problem_name}
                            onChange={(e) =>
                                updateField("problem_name", e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="leetcode_link">LeetCode Link</Label>
                        <Input
                            id="leetcode_link"
                            type="url"
                            placeholder="https://leetcode.com/problems/..."
                            value={formData.leetcode_link}
                            onChange={(e) =>
                                updateField("leetcode_link", e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="rank">Difficulty</Label>
                        <Select
                            value={formData.rank}
                            onValueChange={(value) =>
                                updateField("rank", value)
                            }
                        >
                            <SelectTrigger id="rank">
                                <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Easy">Easy</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="problem_type">Problem Type</Label>
                        <Input
                            id="problem_type"
                            placeholder="e.g., Array, String, Dynamic Programming"
                            value={formData.problem_type}
                            onChange={(e) =>
                                updateField("problem_type", e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="definition">
                            Definition / Description
                        </Label>
                        <Textarea
                            id="definition"
                            placeholder="Describe the problem, constraints, and expected behavior..."
                            value={formData.definition}
                            onChange={(e) =>
                                updateField("definition", e.target.value)
                            }
                            className="min-h-[120px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!formData.problem_name.trim()}
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProblemDefinitionModal;
