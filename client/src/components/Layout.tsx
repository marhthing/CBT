
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  userType: "student" | "teacher" | "admin";
}

const Layout = ({ children, title, userType }: LayoutProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In a real app, you'd clear authentication tokens here
    navigate("/");
  };

  const getUserTypeColor = () => {
    switch (userType) {
      case "student": return "bg-green-600";
      case "teacher": return "bg-blue-600";
      case "admin": return "bg-purple-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={`${getUserTypeColor()} text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8" />
              <span className="text-xl font-bold">CBT Portal</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="capitalize font-medium">{userType} Dashboard</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-white border-white hover:bg-white hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;
