
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LoginFormProps {
  userType: "student" | "teacher" | "admin";
  onLogin: (credentials: { username: string; password: string }) => void;
}

const LoginForm = ({ userType, onLogin }: LoginFormProps) => {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // For demo purposes, accept any credentials
      onLogin(formData);
      toast({
        title: "Success",
        description: `Logged in successfully as ${userType}`,
      });
      navigate(`/${userType}/dashboard`);
      setIsLoading(false);
    }, 1000);
  };

  const getUserTypeColor = () => {
    switch (userType) {
      case "student": return "text-green-600";
      case "teacher": return "text-blue-600";
      case "admin": return "text-purple-600";
    }
  };

  const getButtonColor = () => {
    switch (userType) {
      case "student": return "bg-green-600 hover:bg-green-700";
      case "teacher": return "bg-blue-600 hover:bg-blue-700";
      case "admin": return "bg-purple-600 hover:bg-purple-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <GraduationCap className={`h-8 w-8 ${getUserTypeColor()}`} />
          </div>
          <CardTitle className="text-2xl">
            <span className={getUserTypeColor()}>
              {userType.charAt(0).toUpperCase() + userType.slice(1)}
            </span> Login
          </CardTitle>
          <CardDescription>
            Enter your credentials to access the {userType} portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className={`w-full ${getButtonColor()}`}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
