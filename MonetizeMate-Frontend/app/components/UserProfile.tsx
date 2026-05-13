import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { User, LogOut, Clock, Compass, BarChart3, Brain, Calendar } from "lucide-react";

interface User {
  name: string;
  email: string;
}

interface UserProfileProps {
  user: User;
  onLogout: () => void;
  onBack: () => void; 
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);

  const recentActivities = [
    {
      id: "1",
      type: "strategy",
      title: "Strategy Analysis Completed",
      description: "Subscription model recommended",
      date: "2024-12-15",
      time: "2:30 PM",
      status: "completed",
      icon: Compass
    },
    {
      id: "2",
      type: "prediction",
      title: "Revenue Forecast Generated",
      description: "6-month prediction analysis",
      date: "2024-12-14",
      time: "11:15 AM",
      status: "completed",
      icon: Brain
    },
    {
      id: "3",
      type: "analysis",
      title: "API Usage Analysis",
      description: "Weekly performance review",
      date: "2024-12-13",
      time: "4:45 PM",
      status: "completed",
      icon: BarChart3
    }
  ];

  const getInitials = (fullName: string) => {
    const name = (fullName || '').trim();
    if (!name) return '';
    const parts = name.split(/\s+/);
    if (parts.length === 1) {
      // If only one name, use up to first two letters
      return parts[0].slice(0, 2).toUpperCase();
    }
    // Use first letter of first and last part
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="w-10 h-10 rounded-full border-blue-300 text-blue-700 hover:bg-blue-50 p-0"
        >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs text-blue-700">{getInitials(user.name)}</span>
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm text-blue-700">{getInitials(user.name)}</span>
            </div>
            <div>
              <p className="text-blue-900 font-medium">{user.name}</p>
              <p className="text-blue-600 text-sm">{user.email}</p>
            </div>
          </div>
          
          <Separator className="mb-4" />
          
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-blue-900 font-medium">Recent Activity</h3>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {recentActivities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-blue-900 text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-blue-600 text-xs mb-1">{activity.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          <Calendar className="w-3 h-3 mr-1" />
                          {activity.date}
                        </Badge>
                        <span className="text-blue-500 text-xs">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <Separator className="mb-4" />
          
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}