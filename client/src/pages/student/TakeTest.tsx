import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import SecureTestEnvironment from '@/components/SecureTestEnvironment';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  scorePerQuestion?: number;
  originalCorrectAnswer?: number;
  optionMapping?: number[];
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
  const options = [question.optionA, question.optionB, question.optionC, question.optionD];
  const originalCorrectAnswer = question.correctAnswer;

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
    scorePerQuestion: question.scorePerQuestion || 1
  };
};

const TakeTest = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<"code" | "preview" | "test" | "result">("code");
  const [testCode, setTestCode] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
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
  const [securityViolations, setSecurityViolations] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "test" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

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
      // Check if test code exists and is active
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

      // Set test metadata for preview
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
      // Fetch questions for this test
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

      // Format and shuffle questions for the test
      const formattedQuestions: Question[] = questions.map((q: any, index: number) => 
        shuffleQuestionOptions({
          ...q,
          id: index + 1,
          scorePerQuestion: testMetadata.scorePerQuestion || 1
        })
      );

      // Shuffle the order of questions
      const shuffledQuestions = shuffleArray(formattedQuestions);

      const testTitle = `${testMetadata.subject} - ${testMetadata.term} Term (${testMetadata.class})`;

      setTestData({
        title: testTitle,
        questions: shuffledQuestions,
        duration: testMetadata.timeLimit * 60, // Convert minutes to seconds
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

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: parseInt(value)
    }));
  };

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

    // Auto-submit test after 3 violations
    if (securityViolations.length >= 2) {
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

  const handleSubmitTest = async () => {
    if (!testData || !user || !testMetadata) return;

    let correctAnswers = 0;
    let totalScore = 0;
    let totalPossibleScore = 0;

    // Create a mapping of answers for submission
    const mappedAnswers: { [key: number]: number } = {};

    testData.questions.forEach((question, index) => {
      const questionScore = question.scorePerQuestion || 1;
      totalPossibleScore += questionScore;

      // Check if student's answer is correct
      const studentAnswer = answers[index];
      const isCorrect = studentAnswer === question.correctAnswer;

      if (isCorrect) {
        correctAnswers++;
        totalScore += questionScore;
      }

      // Map the student's shuffled answer back to original option index for storage
      if (studentAnswer !== undefined && question.optionMapping) {
        mappedAnswers[index] = question.optionMapping[studentAnswer];
      }
    });

    try {
      // First get the test code details to get the actual UUID
      const testCodeResponse = await fetch(`/api/test-codes/${testCode.toUpperCase()}`, {
        credentials: 'include'
      });

      if (!testCodeResponse.ok) {
        throw new Error('Failed to get test code details');
      }

      const testCodeData = await testCodeResponse.json();

      // Save test result to database
      const timeTaken = testData.duration - timeLeft;
      const response = await fetch('/api/test-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          testCodeId: testCodeData.id, // Use the actual UUID from the database
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

      // Deactivate the test code
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
    }
  };

  if (step === "code") {
      const TestContent = () => (
        <DashboardLayout>
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Take Test</h1>
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Enter Test Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="testCode">Test Code</Label>
                  <Input
                    id="testCode"
                    placeholder="Enter test code (e.g., MATH001)"
                    value={testCode}
                    onChange={(e) => setTestCode(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleStartTest} className="w-full" disabled={loading}>
                  {loading ? "Starting..." : "Start Test"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      );
      return (
          <SecureTestEnvironment
              onSecurityViolation={handleSecurityViolation}
              isTestActive={false}
          >
              <TestContent />
          </SecureTestEnvironment>
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

  const TestContent = () => (
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
              <RadioGroup
                value={answers[currentQuestion]?.toString() || ""}
                onValueChange={handleAnswerChange}
                className="space-y-4"
              >
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`option-${index}`} 
                      className="mt-1 flex-shrink-0"
                    />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 cursor-pointer text-sm sm:text-base leading-relaxed"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
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
                onClick={handleSubmitTest}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
              >
                Submit Test
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
        </div>
      </DashboardLayout>
    );

    return (
      <SecureTestEnvironment
        onSecurityViolation={handleSecurityViolation}
        isTestActive={step === 'test'}
      >
        <TestContent />
      </SecureTestEnvironment>
    );
};

export default TakeTest;