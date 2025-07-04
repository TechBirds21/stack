import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bold, Italic, Underline, List, Link, AlignLeft, AlignCenter, AlignRight, Save, Send, Calendar } from 'lucide-react';
import DetailPageLayout from '../../layouts/DetailPageLayout';
import { Notification } from '../../types';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const AddNotification = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    targetAudience: 'all' as 'all' | 'buyers' | 'sellers' | 'agents' | 'specific',
    targetUsers: [] as string[],
    scheduledAt: '',
    template: '',
  });

  const templates = [
    {
      id: 'welcome',
      name: 'Welcome Message',
      title: 'Welcome to Home & Own!',
      content: `Dear {{user_name}},

Welcome to Home & Own! We're excited to have you join our community of property enthusiasts.

Here's what you can do with your account:
• Browse thousands of properties
• Save your favorite listings
• Schedule property tours
• Connect with verified agents
• Get market insights and updates

If you have any questions, our support team is here to help.

Best regards,
The Home & Own Team`
    },
    {
      id: 'property_alert',
      name: 'Property Alert',
      title: 'New Property Match Found!',
      content: `Hi {{user_name}},

Great news! We found a new property that matches your search criteria:

🏠 {{property_name}}
📍 {{property_location}}
💰 {{property_price}}
🛏️ {{property_bedrooms}} bedrooms, {{property_bathrooms}} bathrooms

This property just came on the market and matches your preferences. Don't miss out!

[View Property] [Schedule Tour]

Happy house hunting!
Home & Own Team`
    },
    {
      id: 'market_update',
      name: 'Market Update',
      title: 'Weekly Market Update',
      content: `Hello {{user_name}},

Here's your weekly market update for {{city_name}}:

📈 Market Trends:
• Average price: {{avg_price}}
• New listings this week: {{new_listings}}
• Properties sold: {{sold_properties}}
• Market trend: {{trend_direction}}

🔥 Hot Neighborhoods:
• {{hot_area_1}}
• {{hot_area_2}}
• {{hot_area_3}}

Stay informed and make smart property decisions!

Best regards,
Home & Own Market Team`
    },
    {
      id: 'promotional',
      name: 'Promotional Offer',
      title: 'Special Offer Just for You!',
      content: `Dear {{user_name}},

🎉 Limited Time Offer! 🎉

We're offering exclusive benefits for our valued members:

✅ Free property valuation
✅ Priority access to new listings
✅ Reduced commission rates
✅ Complimentary market analysis

This offer is valid until {{offer_expiry}}. Don't miss out!

[Claim Offer Now]

Terms and conditions apply.

Home & Own Team`
    },
    {
      id: 'appointment',
      name: 'Appointment Reminder',
      title: 'Property Tour Reminder',
      content: `Hi {{user_name}},

This is a friendly reminder about your upcoming property tour:

🏠 Property: {{property_name}}
📅 Date: {{tour_date}}
⏰ Time: {{tour_time}}
📍 Address: {{property_address}}
👤 Agent: {{agent_name}}

Please arrive 5 minutes early. If you need to reschedule, contact us at least 2 hours before the appointment.

Looking forward to showing you this amazing property!

Best regards,
{{agent_name}}
Home & Own`
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title,
        content: template.content,
        template: templateId,
      }));
    }
  };

  const handleFormatClick = (format: string) => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let formattedText = '';

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'list':
        formattedText = `\n• ${selectedText}`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  const handleSubmit = async (e: React.FormEvent, action: 'save' | 'send' | 'schedule') => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const notificationData: Omit<Notification, 'id' | 'createdAt' | 'analytics'> = {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      targetAudience: formData.targetAudience,
      targetUsers: formData.targetUsers,
      status: action === 'save' ? 'draft' : action === 'send' ? 'sent' : 'scheduled',
      template: formData.template,
      createdBy: user.id,
      ...(action === 'schedule' && formData.scheduledAt && { scheduledAt: formData.scheduledAt }),
      ...(action === 'send' && { sentAt: new Date().toISOString() }),
    };

    const response = await apiService.createNotification(notificationData);

    if (response.success) {
      if (action === 'send' && response.data) {
        await apiService.sendNotification(response.data.id);
      }
      navigate('/dashboard/notifications');
    }

    setLoading(false);
  };

  return (
    <DetailPageLayout
      title="Notifications Management"
      breadcrumbs={['Notifications', 'Create Notification']}
    >
      <form className="p-6 space-y-6">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Template (Optional)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:border-blue-500 ${
                  formData.template === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <h3 className="font-medium text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-3">{template.content.substring(0, 100)}...</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter notification title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <select
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="all">All Users</option>
                <option value="buyers">Buyers Only</option>
                <option value="sellers">Sellers Only</option>
                <option value="agents">Agents Only</option>
                <option value="specific">Specific Users</option>
              </select>
            </div>

            {formData.targetAudience === 'specific' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Users (Email addresses, comma-separated)
                </label>
                <textarea
                  value={formData.targetUsers.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    targetUsers: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                  }))}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="user1@example.com, user2@example.com"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule for Later (Optional)
              </label>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          {/* Content Editor */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Content <span className="text-red-500">*</span>
              </label>
              
              {/* Formatting Toolbar */}
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleFormatClick('bold')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Bold"
                >
                  <Bold size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatClick('italic')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Italic"
                >
                  <Italic size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatClick('underline')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Underline"
                >
                  <Underline size={18} />
                </button>
                <div className="border-l border-gray-300 mx-2" />
                <button
                  type="button"
                  onClick={() => handleFormatClick('list')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Bullet List"
                >
                  <List size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatClick('link')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Link"
                >
                  <Link size={18} />
                </button>
                <div className="border-l border-gray-300 mx-2" />
                <button
                  type="button"
                  onClick={() => handleFormatClick('align-left')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Align Left"
                >
                  <AlignLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatClick('align-center')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Align Center"
                >
                  <AlignCenter size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatClick('align-right')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Align Right"
                >
                  <AlignRight size={18} />
                </button>
              </div>

              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="w-full h-64 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter your notification content here..."
                required
              />
            </div>

            {/* Variables Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Available Variables:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div><code>{"{{user_name}}"}</code> - User's full name</div>
                <div><code>{"{{property_name}}"}</code> - Property name</div>
                <div><code>{"{{property_location}}"}</code> - Property location</div>
                <div><code>{"{{property_price}}"}</code> - Property price</div>
                <div><code>{"{{agent_name}}"}</code> - Agent name</div>
                <div><code>{"{{city_name}}"}</code> - City name</div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Preview:</h4>
              <div className="bg-white p-4 rounded border">
                <h5 className="font-semibold text-gray-900 mb-2">{formData.title || 'Notification Title'}</h5>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {formData.content || 'Notification content will appear here...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/dashboard/notifications')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'save')}
            disabled={loading}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            Save as Draft
          </button>

          {formData.scheduledAt && (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'schedule')}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Calendar size={18} />
              Schedule
            </button>
          )}

          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'send')}
            disabled={loading}
            className="px-6 py-3 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={18} />
            {loading ? 'Sending...' : 'Send Now'}
          </button>
        </div>
      </form>
    </DetailPageLayout>
  );
};

export default AddNotification;