The code has been modified to make the entire option clickable for checkbox selection and to display the test type in various places.
```

```replit_final_file
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import SecureTestEnvironment from '@/components/SecureTestEnvironment';
import { Textarea } from '@/components/ui/textarea';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  scorePerQuestion?: number;
  originalCorrectAnswer?: number;
  optionMapping?: number[];
  questionType: string;
  imageUrl?: string;
  correctAnswerText?: string;
}

// Utility function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Function to shuffle options and update correct answer index
const shuffleQuestionOptions = (question: any): Question => {
  // Only shuffle options for multiple choice and image-based questions
  if (question.questionType === 'multiple_choice' || question.questionType === 'image_based') {
    const options = [question.optionA, question.optionB, question.optionC, question.optionD];
    const originalCorrectAnswer = parseInt(question.correctAnswer);

    // Create array of indices to track option mapping
    const optionIndices = [0, 1, 2, 3];
    const shuffledIndices = shuffleArray(optionIndices);

    // Shuffle options based on shuffled indices
    const shuffledOptions = shuffledIndices.map(index => options[index]);

    // Find new position of correct answer
    const newCorrectAnswer = shuffledIndices.indexOf(originalCorrectAnswer);

    return {
      id: question.id || Math.random(),
      question: question.question,
      options: shuffledOptions,
      correctAnswer: newCorrectAnswer,
      originalCorrectAnswer: originalCorrectAnswer,
      optionMapping: shuffledIndices,
      scorePerQuestion: question.scorePerQuestion || 1,
      questionType: question.questionType,
      imageUrl: question.imageUrl
    };
  } else {
    // For other question types, don't shuffle anything
    return {
      id: question.id || Math.random(),
      question: question.question,
      options: [],
      correctAnswer: question.correctAnswer,
      correctAnswerText: question.correctAnswerText,
      scorePerQuestion: question.scorePerQuestion || 1,
      questionType: question.questionType,
      imageUrl: question.imageUrl
    };
  }
};

const TakeTest = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<"code" | "preview" | "test" | "result">("code");
  const [testCode, setTestCode] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: any }>({});
  const [timeLeft, setTimeLeft] = useState(1800);
  const [testData, setTestData] = useState<{
    title: string;
    questions: Question[];
    duration: number;
    testCodeId: string;
  } | null>(null);
  const [testMetadata, setTestMetadata] = useState<{
    subject: string;
    class: string;
    term: string;
    session: string;
    numQuestions: number;
    timeLimit: number;
    scorePerQuestion: number;
  } | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [securityViolations, setSecurityViolations] = useState<string[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "test" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1 && !submitting) {
            handleSubmitTest(); // Force submit when time is up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timeLeft, submitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestionContent = useCallback((question: Question) => {
    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={answers[currentQuestion]?.toString() || ""}
            onValueChange={handleAnswerChange}
            className="space-y-3"
          >
            {question.options.map((option: string, index: number) => (
              <div 
                key={index} 
                className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                onClick={() => handleAnswerChange(index.toString())}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {String.fromCharCode(65 + index)}. {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true_false':
        return (
          <RadioGroup
            value={answers[currentQuestion]?.toString() || ""}
            onValueChange={(value) => setAnswers(prev => ({ ...prev, [currentQuestion]: value }))}
            className="space-y-3"
          >
            <div 
              className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
              onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion]: "true" }))}
            >
              <RadioGroupItem value="true" id="true-option" />
              <Label htmlFor="true-option" className="flex-1 cursor-pointer">True</Label>
            </div>
            <div 
              className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
              onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion]: "false" }))}
            >
              <RadioGroupItem value="false" id="false-option" />
              <Label htmlFor="false-option" className="flex-1 cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        );

      case 'fill_blank':
        return (
          <div className="space-y-3">
            <Label htmlFor="fill-blank-answer">Your Answer:</Label>
            <Input
              id="fill-blank-answer"
              placeholder="Type your answer here..."
              value={answers[currentQuestion] || ""}
              onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion]: e.target.value }))}
              className="w-full"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        );

      case 'essay':
        return (
          <div className="space-y-3">
            <Label htmlFor="essay-answer">Your Answer:</Label>
            <Textarea
              id="essay-answer"
              placeholder="Write your essay answer here..."
              value={answers[currentQuestion] || ""}
              onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion]: e.target.value }))}
              className="w-full min-h-[200px]"
              rows={8}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        );

      case 'image_based':
        return (
          <div className="space-y-4">
            {question.imageUrl && (
              <div className="flex justify-center">
                <img 
                  src={question.imageUrl} 
                  alt="Question image" 
                  className="max-w-full h-auto max-h-96 rounded-lg border"
                />
              </div>
            )}
            <RadioGroup
              value={answers[currentQuestion]?.toString() || ""}
              onValueChange={handleAnswerChange}
              className="space-y-3"
            >
              {question.options.map((option: string, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAnswerChange(index.toString())}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {String.fromCharCode(65 + index)}. {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  }, [answers, currentQuestion]);

  const handleStartTest = async () => {
    if (!testCode) {
      toast({
        title: "Error",
        description: "Please enter a test code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/test-codes/validate/${testCode.toUpperCase()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Invalid Code",
          description: error.error || "The test code you entered is not valid or has expired",
          variant: "destructive"
        });
        return;
      }

      const testCodeData = await response.json();

      setTestMetadata({
        subject: testCodeData.subject,
        class: testCodeData.class,
        term: testCodeData.term,
        session: testCodeData.session,
        numQuestions: testCodeData.numQuestions,
        timeLimit: testCodeData.timeLimit,
        scorePerQuestion: testCodeData.scorePerQuestion || 1
      });

      setStep("preview");

      toast({
        title: "Test Code Valid",
        description: "Review the test details and start when ready",
      });
    } catch (error) {
      console.error('Error validating test code:', error);
      toast({
        title: "Error",
        description: "Failed to validate test code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBeginTest = async () => {
    if (!testMetadata) return;

    setLoading(true);
    try {
      const questionsResponse = await fetch(`/api/questions/for-test?subject=${encodeURIComponent(testMetadata.subject)}&class=${encodeURIComponent(testMetadata.class)}&term=${encodeURIComponent(testMetadata.term)}&limit=${testMetadata.numQuestions}`, {
        credentials: 'include'
      });

      if (!questionsResponse.ok) {
        toast({
          title: "No Questions",
          description: "No questions found for this test",
          variant: "destructive"
        });
        return;
      }

      const questions = await questionsResponse.json();

      if (!questions || questions.length === 0) {
        toast({
          title: "No Questions",
          description: "No questions found for this test code",
          variant: "destructive"
        });
        return;
      }

      const formattedQuestions: Question[] = questions.map((q: any, index: number) => 
        shuffleQuestionOptions({
          ...q,
          id: index + 1,
          scorePerQuestion: testMetadata.scorePerQuestion || 1
        })
      );

      const shuffledQuestions = shuffleArray(formattedQuestions);

      const testTitle = `${testMetadata.subject} - ${testMetadata.term} Term (${testMetadata.class})`;

      setTestData({
        title: testTitle,
        questions: shuffledQuestions,
        duration: testMetadata.timeLimit * 60,
        testCodeId: testCode.toUpperCase()
      });

      setTimeLeft(testMetadata.timeLimit * 60);
      setStep("test");

      toast({
        title: "Test Started",
        description: "Good luck with your test!",
      });
    } catch (error) {
      console.error('Error starting test:', error);
      toast({
        title: "Error",
        description: "Failed to start test. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = useCallback((value: string) => {
    const question = testData?.questions[currentQuestion];
    if (!question) return;

    let answerValue: any = value;

    if (question.questionType === 'multiple_choice' || question.questionType === 'image_based') {
      answerValue = parseInt(value);
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerValue
    }));
  }, [testData, currentQuestion]);

  const handleNextQuestion = () => {
    if (!testData) return;
    if (currentQuestion < testData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSecurityViolation = (violation: string) => {
    setSecurityViolations(prev => [...prev, violation]);
    console.log('Security violation:', violation);

    if (securityViolations.length >= 2 && !submitting) {
      toast({
        title: "Security Alert",
        description: "Multiple violations detected. Test will be auto-submitted.",
        variant: "destructive"
      });
      handleSubmitTest();
    } else {
      toast({
        title: "Security Warning",
        description: violation,
        variant: "destructive"
      });
    }
  };

  const handleRequestSubmit = () => {
    setShowSubmitModal(true);
  };

  const handleSubmitTest = async () => {
    if (!testData || !user || !testMetadata || submitting) return;

    setShowSubmitModal(false);
    setSubmitting(true);
    let correctAnswers = 0;
    let totalScore = 0;
    let totalPossibleScore = 0;

    const mappedAnswers: { [key: number]: number } = {};

    testData.questions.forEach((question, index) => {
      const questionScore = question.scorePerQuestion || 1;
      totalPossibleScore += questionScore;

      const studentAnswer = answers[index];
      let isCorrect = false;

      if (question.questionType === 'multiple_choice' || question.questionType === 'image_based') {
        isCorrect = studentAnswer === question.correctAnswer;
      } else if (question.questionType === 'true_false') {
        isCorrect = studentAnswer?.toString() === question.correctAnswer?.toString();
      } else if (question.questionType === 'fill_blank' || question.questionType === 'essay') {
        const studentText = studentAnswer?.toString().trim().toLowerCase();
        const correctText = question.correctAnswerText?.trim().toLowerCase();
        isCorrect = studentText === correctText;
      }

      if (isCorrect) {
        correctAnswers++;
        totalScore += questionScore;
      }

      if (studentAnswer !== undefined) {
        if ((question.questionType === 'multiple_choice' || question.questionType === 'image_based') && question.optionMapping) {
          mappedAnswers[index] = question.optionMapping[studentAnswer];
        } else {
          mappedAnswers[index] = studentAnswer;
        }
      }
    });

    try {
      const testCodeResponse = await fetch(`/api/test-codes/${testCode.toUpperCase()}`, {
        credentials: 'include'
      });

      if (!testCodeResponse.ok) {
        throw new Error('Failed to get test code details');
      }

      const testCodeData = await testCodeResponse.json();

      const timeTaken = testData.duration - timeLeft;
      const response = await fetch('/api/test-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          testCodeId: testCodeData.id,
          score: totalScore,
          totalQuestions: testData.questions.length,
          totalPossibleScore: totalPossibleScore,
          timeTaken: timeTaken,
          answers: mappedAnswers,
          securityViolations: securityViolations
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit test');
      }

      await fetch(`/api/test-codes/${testCode.toUpperCase()}/deactivate`, {
        method: 'PUT',
        credentials: 'include'
      });

      setScore(totalScore);
      setStep("result");
      toast({
        title: "Test Submitted",
        description: "Your test has been submitted successfully!",
      });
    } catch (error) {
      console.error('Error submitting test:', error);
      toast({
        title: "Error",
        description: "Failed to submit test. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "code") {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">Take Test</h1>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Enter Test Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleStartTest(); }}>
                <div>
                  <Label htmlFor="testCode">Test Code</Label>
                  <Input
                    id="testCode"
                    type="text"
                    placeholder="Enter test code (e.g., MATH001)"
                    value={testCode}
                    onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                    className="mt-1"
                    autoComplete="off"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
                <Button type="submit" className="w-full mt-4" disabled={loading}>
                  {loading ? "Starting..." : "Start Test"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (step === "preview") {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Test Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Subject:</span>
                  <span>{testMetadata?.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Class:</span>
                  <span>{testMetadata?.class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Session:</span>
                  <span>{testMetadata?.session}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Term:</span>
                  <span>{testMetadata?.term}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Questions:</span>
                  <span>{testMetadata?.numQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Time Limit:</span>
                  <span>{testMetadata?.timeLimit} minutes</span>
                </div>
              </div>
              <div className="space-y-2">
                <Button onClick={handleBeginTest} className="w-full" disabled={loading}>
                  {loading ? "Starting..." : "Start Test"}
                </Button>
                <Button variant="outline" onClick={() => setStep("code")} className="w-full">
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (step === "result") {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <CardTitle>Test Completed!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-4xl font-bold text-green-600">
                {score}/{testData?.questions.reduce((total, q) => total + (q.scorePerQuestion || 1), 0)} points
              </div>
              <p className="text-lg">
                {testData?.questions.filter((_, index) => answers[index] === testData.questions[index].correctAnswer).length} out of {testData?.questions.length} questions correct
              </p>
              <p className="text-gray-600">
                Test: {testData?.title}
              </p>
              <Button
                onClick={() => navigate("/student/dashboard")}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!testData) return null;

  const question = testData.questions[currentQuestion];

  return (
    <SecureTestEnvironment 
      onSecurityViolation={handleSecurityViolation} 
      isActive={step === "test"}
    >
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{testData.title}</h1>
              <div className="text-base sm:text-lg font-medium text-gray-600">
                Question {currentQuestion + 1} of {testData.questions.length}
              </div>
            </div>
            <div className="flex items-center text-red-600 font-medium bg-red-50 px-3 py-1 rounded-md">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl leading-relaxed">{question.question}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderQuestionContent(question)}
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
              className="flex-1 sm:flex-none"
            >
              Previous
            </Button>

            {currentQuestion === testData.questions.length - 1 ? (
              <Button
                onClick={handleRequestSubmit}
                disabled={submitting}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  "Submit Test"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                className="flex-1 sm:flex-none"
              >
                Next
              </Button>
            )}
          </div>

          <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Test</DialogTitle>
                <DialogDescription>
                  Are you sure you want to submit your test? You cannot make changes after submission.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitModal(false)}
                  className="w-full sm:w-auto"
                >
                  Continue Testing
                </Button>
                <Button
                  onClick={handleSubmitTest}
                  disabled={submitting}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    "Yes, Submit Test"
                  )}
                </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </SecureTestEnvironment>
  );
};

export default TakeTest;