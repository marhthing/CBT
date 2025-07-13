import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createTestUsers } from '@/utils/createTestUsers';

const Auth = () => {
  const { user, profile, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingTestUsers, setIsCreatingTestUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student'
  });

  // Redirect if already authenticated - moved after all hooks
  if (user && profile) {
    return <Navigate to={`/${profile.role}/dashboard`} replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInData.email || !signInData.password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(signInData.email, signInData.password);

    if (error) {
      console.error('Sign in error:', error);
      toast({
        title: 'Sign In Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Signed in successfully!'
      });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpData.email || !signUpData.password || !signUpData.fullName) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(
      signUpData.email,
      signUpData.password,
      signUpData.fullName,
      signUpData.role
    );

    if (error) {
      console.error('Sign up error:', error);
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Account created successfully! Please sign in.'
      });
    }
    setIsLoading(false);
  };

  const handleCreateTestUsers = async () => {
    setIsCreatingTestUsers(true);
    try {
      await createTestUsers();
      toast({
        title: 'Success',
        description: 'Test users created successfully!'
      });
    } catch (error) {
      console.error('Error creating test users:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test users',
        variant: 'destructive'
      });
    }
    setIsCreatingTestUsers(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-3 sm:px-4 py-4">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <GraduationCap className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-blue-600" />
          <h1 className="mt-3 sm:mt-4 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">CBT Portal</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Computer-Based Testing System</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 p-3 sm:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8 sm:h-10">
                <TabsTrigger value="signin" className="text-xs sm:text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-xs sm:text-sm">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-3 sm:space-y-4">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-center">Welcome back</CardTitle>
                <CardDescription className="text-center text-xs sm:text-sm">
                  Enter your credentials to access your account
                </CardDescription>
                <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signin-email" className="text-xs sm:text-sm">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                      className="text-xs sm:text-sm h-8 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signin-password" className="text-xs sm:text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        required
                        className="text-xs sm:text-sm h-8 sm:h-10 pr-8 sm:pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full text-xs sm:text-sm h-8 sm:h-10" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-3 sm:space-y-4">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-center">Create account</CardTitle>
                <CardDescription className="text-center text-xs sm:text-sm">
                  Enter your information to create your account
                </CardDescription>
                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="signup-name" className="text-xs sm:text-sm">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={signUpData.fullName}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, fullName: e.target.value }))}
                        required
                        className="text-xs sm:text-sm h-8 sm:h-10"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="signup-email" className="text-xs sm:text-sm">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="text-xs sm:text-sm h-8 sm:h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-role" className="text-xs sm:text-sm">Role</Label>
                    <Select value={signUpData.role} onValueChange={(value) => setSignUpData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student" className="text-xs sm:text-sm">Student</SelectItem>
                        <SelectItem value="teacher" className="text-xs sm:text-sm">Teacher</SelectItem>
                        <SelectItem value="admin" className="text-xs sm:text-sm">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-password" className="text-xs sm:text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className="text-xs sm:text-sm h-8 sm:h-10 pr-8 sm:pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full text-xs sm:text-sm h-8 sm:h-10" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Auth;