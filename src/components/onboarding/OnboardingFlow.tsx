import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Settings, 
  Users, 
  FileText,
  Zap,
  Target,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  completed: boolean;
  required: boolean;
}

interface OnboardingData {
  companyName: string;
  industry: string;
  teamSize: string;
  primaryGoal: string;
  hasInvoices: boolean;
  preferredFeatures: string[];
}

const OnboardingFlow: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    companyName: '',
    industry: '',
    teamSize: '',
    primaryGoal: '',
    hasInvoices: false,
    preferredFeatures: []
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Oil & Gas Billing',
      description: 'Let\'s get you set up for success',
      icon: Target,
      component: WelcomeStep,
      completed: false,
      required: true
    },
    {
      id: 'company-info',
      title: 'Company Information',
      description: 'Tell us about your organization',
      icon: Users,
      component: CompanyInfoStep,
      completed: false,
      required: true
    },
    {
      id: 'goals',
      title: 'Your Goals',
      description: 'What do you want to achieve?',
      icon: Target,
      component: GoalsStep,
      completed: false,
      required: true
    },
    {
      id: 'features',
      title: 'Choose Features',
      description: 'Select the features most important to you',
      icon: Settings,
      component: FeaturesStep,
      completed: false,
      required: false
    },
    {
      id: 'first-invoice',
      title: 'Upload Your First Invoice',
      description: 'Get started with invoice processing',
      icon: Upload,
      component: FirstInvoiceStep,
      completed: false,
      required: false
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Ready to start managing your invoices',
      icon: CheckCircle,
      component: CompleteStep,
      completed: false,
      required: true
    }
  ];

  const [stepStates, setStepStates] = useState(steps);
  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateData = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  const markStepComplete = (stepIndex: number) => {
    setStepStates(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, completed: true } : step
    ));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      markStepComplete(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipStep = () => {
    if (!stepStates[currentStep].required) {
      nextStep();
    }
  };

  const completeOnboarding = async () => {
    try {
      // Save onboarding data to user profile
      markStepComplete(currentStep);
      
      toast({
        title: "Welcome aboard! 🎉",
        description: "Your account is now set up and ready to use.",
      });

      // Close onboarding and redirect to dashboard
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Setup Error",
        description: "There was an issue completing your setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const CurrentStepComponent = stepStates[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Getting Started</h1>
            </div>
            <Badge variant="secondary">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between mt-4">
            {stepStates.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                  ${index < currentStep ? 'bg-green-500 text-white' : 
                    index === currentStep ? 'bg-primary text-white' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                <span className="text-xs mt-1 text-center max-w-16 truncate">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <stepStates[currentStep].icon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{stepStates[currentStep].title}</CardTitle>
            <CardDescription className="text-lg">
              {stepStates[currentStep].description}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <CurrentStepComponent 
              data={onboardingData}
              updateData={updateData}
              onNext={nextStep}
              onComplete={completeOnboarding}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex space-x-2">
            {!stepStates[currentStep].required && currentStep < steps.length - 1 && (
              <Button variant="ghost" onClick={skipStep}>
                Skip for now
              </Button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep} className="flex items-center space-x-2">
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={completeOnboarding} className="flex items-center space-x-2">
                <span>Complete Setup</span>
                <Zap className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const WelcomeStep: React.FC<{
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}> = ({ onNext }) => {
  const { user } = useAuth();

  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          Hello {user?.user_metadata?.full_name || user?.email || 'there'}! 👋
        </p>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Welcome to the Oil & Gas Billing Platform. We'll help you streamline your invoice 
          processing, ensure compliance, and gain insights into your operations. 
          This quick setup will take about 3 minutes.
        </p>
        <div className="bg-primary/10 p-4 rounded-lg max-w-md mx-auto">
          <h3 className="font-semibold mb-2">What you'll set up:</h3>
          <ul className="text-sm text-left space-y-1">
            <li>• Company information</li>
            <li>• Your primary goals</li>
            <li>• Feature preferences</li>
            <li>• Optional: Upload your first invoice</li>
          </ul>
        </div>
      </div>
      
      <Button onClick={onNext} size="lg" className="mt-6">
        Let's Get Started
      </Button>
    </div>
  );
};

const CompanyInfoStep: React.FC<{
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}> = ({ data, updateData, onNext }) => {
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    setCanContinue(data.companyName.length > 0 && data.industry.length > 0 && data.teamSize.length > 0);
  }, [data]);

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div>
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          value={data.companyName}
          onChange={(e) => updateData({ companyName: e.target.value })}
          placeholder="Enter your company name"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="industry">Industry *</Label>
        <select
          id="industry"
          value={data.industry}
          onChange={(e) => updateData({ industry: e.target.value })}
          className="w-full mt-1 p-2 border rounded-md"
        >
          <option value="">Select your industry</option>
          <option value="upstream">Upstream (Exploration & Production)</option>
          <option value="midstream">Midstream (Transportation & Storage)</option>
          <option value="downstream">Downstream (Refining & Marketing)</option>
          <option value="oilfield-services">Oilfield Services</option>
          <option value="petrochemicals">Petrochemicals</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <Label htmlFor="teamSize">Team Size *</Label>
        <select
          id="teamSize"
          value={data.teamSize}
          onChange={(e) => updateData({ teamSize: e.target.value })}
          className="w-full mt-1 p-2 border rounded-md"
        >
          <option value="">Select team size</option>
          <option value="1-5">1-5 people</option>
          <option value="6-20">6-20 people</option>
          <option value="21-50">21-50 people</option>
          <option value="51-100">51-100 people</option>
          <option value="100+">100+ people</option>
        </select>
      </div>

      <Button 
        onClick={onNext} 
        disabled={!canContinue}
        className="w-full mt-6"
      >
        Continue
      </Button>
    </div>
  );
};

const GoalsStep: React.FC<{
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}> = ({ data, updateData, onNext }) => {
  const goals = [
    { id: 'efficiency', label: 'Improve invoice processing efficiency', icon: Zap },
    { id: 'compliance', label: 'Ensure regulatory compliance', icon: CheckCircle },
    { id: 'visibility', label: 'Gain better financial visibility', icon: Target },
    { id: 'automation', label: 'Automate manual processes', icon: Settings },
    { id: 'reporting', label: 'Generate better reports', icon: FileText },
    { id: 'integration', label: 'Integrate with existing systems', icon: Users }
  ];

  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground mb-6">
        What's your primary goal with this platform?
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {goals.map((goal) => (
          <Card
            key={goal.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              data.primaryGoal === goal.id ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
            onClick={() => updateData({ primaryGoal: goal.id })}
          >
            <CardContent className="p-4 flex items-center space-x-3">
              <goal.icon className="h-5 w-5 text-primary" />
              <span className="text-sm">{goal.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        onClick={onNext} 
        disabled={!data.primaryGoal}
        className="w-full mt-6"
      >
        Continue
      </Button>
    </div>
  );
};

const FeaturesStep: React.FC<{
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}> = ({ data, updateData, onNext }) => {
  const features = [
    'Automated Invoice Processing',
    'Compliance Monitoring',
    'Advanced Analytics',
    'Workflow Automation',
    'Integration APIs',
    'Mobile Access',
    'Custom Reporting',
    'Audit Trail'
  ];

  const toggleFeature = (feature: string) => {
    const current = data.preferredFeatures || [];
    const updated = current.includes(feature)
      ? current.filter(f => f !== feature)
      : [...current, feature];
    updateData({ preferredFeatures: updated });
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground mb-6">
        Which features are most important to you? (Optional)
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature) => (
          <Badge
            key={feature}
            variant={data.preferredFeatures?.includes(feature) ? "default" : "outline"}
            className="cursor-pointer p-3 text-center justify-center"
            onClick={() => toggleFeature(feature)}
          >
            {feature}
          </Badge>
        ))}
      </div>

      <Button onClick={onNext} className="w-full mt-6">
        Continue
      </Button>
    </div>
  );
};

const FirstInvoiceStep: React.FC<{
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}> = ({ data, updateData, onNext }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Handle file upload logic here
    updateData({ hasInvoices: true });
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground mb-6">
        Want to upload your first invoice now? (Optional)
      </p>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">Drop an invoice here</p>
        <p className="text-sm text-muted-foreground mb-4">
          Supports PDF, PNG, JPG files up to 10MB
        </p>
        <Button variant="outline">Choose File</Button>
      </div>

      <div className="flex space-x-2 justify-center">
        <Button variant="ghost" onClick={onNext}>
          Skip for now
        </Button>
        <Button onClick={onNext}>
          Continue to Dashboard
        </Button>
      </div>
    </div>
  );
};

const CompleteStep: React.FC<{
  data: OnboardingData;
  onComplete: () => void;
}> = ({ data, onComplete }) => {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-2">Setup Complete! 🎉</h3>
        <p className="text-muted-foreground">
          Your account is configured and ready to use. Here's what you can do next:
        </p>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg text-left max-w-md mx-auto">
        <h4 className="font-semibold mb-2">Quick Next Steps:</h4>
        <ul className="space-y-1 text-sm">
          <li>• Upload and process your first invoice</li>
          <li>• Set up validation rules</li>
          <li>• Configure integrations</li>
          <li>• Explore analytics dashboard</li>
        </ul>
      </div>

      <Button onClick={onComplete} size="lg" className="mt-6">
        Go to Dashboard
      </Button>
    </div>
  );
};

export default OnboardingFlow;