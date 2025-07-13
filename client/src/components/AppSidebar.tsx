import { Home, FileText, Upload, Users, Code, LogOut, BarChart3, Settings, GraduationCap } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { FileDown } from "lucide-react";

const AppSidebar = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getMenuItems = () => {
    switch (profile?.role) {
      case 'student':
        return [
          { title: 'Dashboard', url: '/student/dashboard', icon: Home },
          { title: 'Take Test', url: '/student/take-test', icon: FileText },
          { title: 'View Results', url: '/student/results', icon: BarChart3 },
        ];
      case 'teacher':
        return [
          { title: 'Dashboard', url: '/teacher/dashboard', icon: Home },
          { title: 'Upload Questions', url: '/teacher/upload-questions', icon: Upload },
          { title: 'Manage Questions', url: '/teacher/manage-questions', icon: FileText },
        ];
      case 'admin':
        return [
          { title: 'Dashboard', url: '/admin/dashboard', icon: Home },
          { title: 'Generate Test Code', url: '/admin/generate-test-code', icon: Code },
          { title: 'Upload Questions', url: '/admin/upload-questions', icon: Upload },
          { title: 'Manage Questions', url: '/admin/manage-all-questions', icon: Users },
          { title: 'Teacher Assignments', url: '/admin/manage-teacher-assignments', icon: FileText },
          { title: 'Export Results', url: '/admin/export-results', icon: FileDown },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-4 py-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">SURE FOUNDATION</h1>
            <p className="text-xs text-gray-500 truncate">Comprehensive School</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="hidden lg:block">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

          {profile?.role === 'admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/manage-test-batches"
                             className={({ isActive }) =>
                              `flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-blue-100 text-blue-600 font-medium'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`
                            }>
                      <Settings className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">Manage Test Batches</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-2">
          <div className="text-sm text-gray-600 hidden lg:block">
            <p className="font-medium truncate">{profile?.full_name || 'User'}</p>
            <p className="text-xs truncate">{profile?.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;