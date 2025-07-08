import React from 'react';
import { Users, Calendar, MessageCircle, BarChart3 } from 'lucide-react';

interface AgentActivityProps {
  stats: any;
}

const AgentActivity: React.FC<AgentActivityProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#061D58] mb-4">Today's Activity</h3>
      {stats?.todayContacts && stats.todayContacts.length > 0 ? (
        <div className="space-y-3">
          {stats.todayContacts.slice(0, 3).map((contact: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  {contact.name || `${contact.users?.first_name} ${contact.users?.last_name}`}
                </p>
                <p className="text-sm text-gray-600">
                  {contact.email || contact.users?.email}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                contact.booking_date ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {contact.booking_date ? 'Tour' : 'Inquiry'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No activity today</p>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-semibold text-gray-800 mb-3">Recent Activity</h4>
        {stats?.recentContacts && stats.recentContacts.length > 0 ? (
          <div className="space-y-3">
            {stats.recentContacts.slice(0, 3).map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    activity.booking_date ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {activity.booking_date ? 
                      <Calendar className="h-4 w-4 text-blue-600" /> : 
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.name || `${activity.users?.first_name} ${activity.users?.last_name}`}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activity.booking_date ? 'Requested a tour' : 'Sent an inquiry'}
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