import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Pause,
  Settings,
  Trash2,
  Plus,
  CheckCircle,
  AlertTriangle,
  Mail,
  Database,
} from "lucide-react";
import { WorkflowStep, Workflow } from "@/hooks/useWorkflows";
import ConditionBuilder from "./ConditionBuilder";

interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave: (workflow: Omit<Workflow, "id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
}

const stepTypes = [
  {
    type: "condition",
    name: "Condition",
    icon: AlertTriangle,
    color: "bg-amber-500",
    description: "Conditional routing based on data",
  },
  {
    type: "validation",
    name: "Validation",
    icon: CheckCircle,
    color: "bg-status-processing",
    description: "Validate data against rules",
  },
  {
    type: "approval",
    name: "Approval",
    icon: AlertTriangle,
    color: "bg-status-pending",
    description: "Require manual approval",
  },
  {
    type: "notification",
    name: "Notification",
    icon: Mail,
    color: "bg-primary",
    description: "Send notifications",
  },
  {
    type: "integration",
    name: "Integration",
    icon: Database,
    color: "bg-secondary",
    description: "Connect to external systems",
  },
];

const WorkflowBuilder = ({ workflow, onSave, onCancel }: WorkflowBuilderProps) => {
  const [name, setName] = useState(workflow?.name || "");
  const [description, setDescription] = useState(workflow?.description || "");
  const [workflowType, setWorkflowType] = useState(workflow?.workflow_type || "invoice_processing");
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.steps || []);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const generateStepId = () => `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addStep = (stepType: string) => {
    const newStep: WorkflowStep = {
      id: generateStepId(),
      type: stepType as WorkflowStep["type"],
      name: `${stepTypes.find((t) => t.type === stepType)?.name || "Step"} ${steps.length + 1}`,
      config: {},
      position: { x: 100 + steps.length * 200, y: 100 },
      connections: [],
    };

    setSteps((prev) => [...prev, newStep]);
    setSelectedStep(newStep.id);
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, ...updates } : step)));
  };

  const deleteStep = (stepId: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== stepId));
    if (selectedStep === stepId) {
      setSelectedStep(null);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSteps(items);
  };

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    onSave({
      name,
      description,
      workflow_type: workflowType,
      steps,
      is_active: true,
    });
  };

  const selectedStepData = steps.find((step) => step.id === selectedStep);

  return (
    <div className="h-full flex">
      {/* Main Canvas */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {workflow ? "Edit Workflow" : "Create Workflow"}
              </h2>
              <p className="text-muted-foreground">
                Design your automated workflow with drag-and-drop steps
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!name.trim()}>
                Save Workflow
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter workflow name"
              />
            </div>
            <div>
              <Label htmlFor="workflow-type">Workflow Type</Label>
              <Select value={workflowType} onValueChange={setWorkflowType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice_processing">Invoice Processing</SelectItem>
                  <SelectItem value="compliance_check">Compliance Check</SelectItem>
                  <SelectItem value="exception_handling">Exception Handling</SelectItem>
                  <SelectItem value="approval_workflow">Approval Workflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="workflow-description">Description</Label>
              <Input
                id="workflow-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
        </div>

        {/* Step Types Palette */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Step Types</h3>
          <div className="flex gap-3">
            {stepTypes.map((stepType) => {
              const Icon = stepType.icon;
              return (
                <Button
                  key={stepType.type}
                  variant="outline"
                  onClick={() => addStep(stepType.type)}
                  className="flex items-center gap-2 h-auto p-3"
                >
                  <div className={`p-2 rounded-full ${stepType.color} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{stepType.name}</div>
                    <div className="text-xs text-muted-foreground">{stepType.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Workflow Canvas */}
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Workflow Steps ({steps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Add steps to build your workflow</p>
                </div>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="workflow-steps">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {steps.map((step, index) => {
                        const stepTypeInfo = stepTypes.find((t) => t.type === step.type);
                        const Icon = stepTypeInfo?.icon || Settings;

                        return (
                          <Draggable key={step.id} draggableId={step.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-pointer transition-all ${
                                  selectedStep === step.id
                                    ? "ring-2 ring-primary shadow-lg"
                                    : "hover:shadow-md"
                                } ${snapshot.isDragging ? "rotate-2 scale-105" : ""}`}
                                onClick={() => setSelectedStep(step.id)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`p-2 rounded-full ${stepTypeInfo?.color} text-white`}
                                      >
                                        <Icon className="h-4 w-4" />
                                      </div>
                                      <Badge variant="secondary">{index + 1}</Badge>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteStep(step.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <h4 className="font-medium mb-1">{step.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {stepTypeInfo?.description}
                                  </p>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Step Configuration Panel */}
      {selectedStepData && (
        <div className="w-80 border-l bg-muted/20 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Configure Step</h3>
            <Separator />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="step-name">Step Name</Label>
              <Input
                id="step-name"
                value={selectedStepData.name}
                onChange={(e) => updateStep(selectedStepData.id, { name: e.target.value })}
              />
            </div>

            {selectedStepData.type === "condition" && (
              <div>
                <ConditionBuilder
                  conditions={selectedStepData.conditions || []}
                  onChange={(conditions) => updateStep(selectedStepData.id, { conditions })}
                />
              </div>
            )}

            {selectedStepData.type === "validation" && (
              <div>
                <Label>Validation Rules</Label>
                <Textarea placeholder="Configure validation rules..." className="mt-2" />
              </div>
            )}

            {selectedStepData.type === "approval" && (
              <div>
                <Label>Approval Settings</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select approver role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedStepData.type === "notification" && (
              <div>
                <Label>Notification Template</Label>
                <Textarea placeholder="Email template..." className="mt-2" />
              </div>
            )}

            {selectedStepData.type === "integration" && (
              <div>
                <Label>Integration Type</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select integration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nov">NOV API</SelectItem>
                    <SelectItem value="jib">JIB System</SelectItem>
                    <SelectItem value="sap">SAP Integration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;
