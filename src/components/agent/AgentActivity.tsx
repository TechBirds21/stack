import React from 'react';
import { Users, Calendar, MessageCircle, BarChart3, Clock } from 'lucide-react';

interface AgentActivityProps {
  stats: any;
}

const AgentActivity: React.FC<AgentActivityProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#061D58] mb-4 flex items-center">
        <Clock className="mr-2 h-5 w-5" />
        Today's Activity
      </h3>
      
      {stats?.todayContacts && stats.todayContacts.length > 0 ? (
        <div className="space-y-3 mb-6">
          {stats.todayContacts.slice(0, 3).map((contact: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  contact.booking_date ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {contact.booking_date ? 
                    <Calendar className="h-4 w-4 text-blue-600" /> : 
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  }
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {contact.name || `${contact.users?.first_name} ${contact.users?.last_name}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {contact.email || contact.users?.email}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                contact.booking_date ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {contact.booking_date ? 'Tour Request' : 'New Inquiry'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 mb-6">
          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="font-medium">No activity today</p>
          <p className="text-sm">New inquiries and bookings will appear here</p>
        </div>
      )}

      {/* Recent Activity */}
      <div className="pt-4 border-t">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
          <BarChart3 className="mr-2 h-4 w-4" />
          Recent Activity
        </h4>
        {stats?.recentContacts && stats.recentContacts.length > 0 ? (
          <div className="space-y-3">
            {stats.recentContacts.slice(0, 3).map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    activity.booking_date ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {activity.booking_date ? 
                      <Calendar className="h-3 w-3 text-blue-600" /> : 
                      <MessageCircle className="h-3 w-3 text-green-600" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.name || `${activity.users?.first_name} ${activity.users?.last_name}`}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activity.booking_date ? 'Requested a property tour' : 'Sent a property inquiry'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <BarChart3 className="h-8 w-8 mx-auto mb-1 text-gray-300" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentActivity;