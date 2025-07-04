import React, { useState } from 'react';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, List } from 'lucide-react';
import DetailPageLayout from '../../layouts/DetailPageLayout';

const EmailToUsers = () => {
  const [emailType, setEmailType] = useState<'all' | 'specific'>('all');
  const [formData, setFormData] = useState({
    emailTo: '',
    subject: '',
    content: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      ...formData,
      emailType
    });
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
        formattedText = `_${selectedText}_`;
        break;
      case 'list':
        formattedText = `\n- ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  return (
    <DetailPageLayout
      title="Manage Users"
      breadcrumbs={['Email to Users']}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Email To <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-6">
            <label className="flex items-center">
              <input
                type="radio"
                checked={emailType === 'all'}
                onChange={() => setEmailType('all')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2">All Users</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={emailType === 'specific'}
                onChange={() => setEmailType('specific')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2">Specific Users</span>
            </label>
          </div>
          {emailType === 'specific' && (
            <input
              type="text"
              name="emailTo"
              value={formData.emailTo}
              onChange={handleInputChange}
              placeholder="Enter email addresses separated by commas"
              className="mt-2 w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleFormatClick('bold')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Bold"
              >
                <Bold size={20} />
              </button>
              <button
                type="button"
                onClick={() => handleFormatClick('italic')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Italic"
              >
                <Italic size={20} />
              </button>
              <button
                type="button"
                onClick={() => handleFormatClick('list')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Bullet List"
              >
                <List size={20} />
              </button>
              <div className="border-l border-gray-300 mx-2" />
              <button
                type="button"
                onClick={() => handleFormatClick('align-left')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Align Left"
              >
                <AlignLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => handleFormatClick('align-center')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Align Center"
              >
                <AlignCenter size={20} />
              </button>
              <button
                type="button"
                onClick={() => handleFormatClick('align-right')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Align Right"
              >
                <AlignRight size={20} />
              </button>
            </div>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              className="w-full h-64 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              (Salutation will be automatically added)
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Formatting Guide:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>**text**</strong> - Makes text bold</li>
                <li><em>_text_</em> - Makes text italic</li>
                <li>- text - Creates a bullet point</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors uppercase"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors uppercase"
          >
            Submit
          </button>
        </div>
      </form>
    </DetailPageLayout>
  );
};

export default EmailToUsers;