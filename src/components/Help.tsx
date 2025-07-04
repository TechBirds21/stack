import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const Help = () => {
  const [isOpen, setIsOpen] = useState(false);

  const helpTopics = [
    {
      title: "Getting Started",
      content: "Welcome to Home & Own! This admin panel helps you manage properties, users, and listings efficiently."
    },
    {
      title: "Navigation",
      content: "Use the sidebar menu to access different sections. The dashboard provides an overview of key metrics."
    },
    {
      title: "Managing Properties",
      content: "Add, edit, or remove properties through the Listing Management section. You can manage property details, images, and availability."
    },
    {
      title: "User Management",
      content: "Handle user accounts, permissions, and roles through the Manage Users section."
    },
    {
      title: "Support",
      content: "For additional support, contact our team at support@homeandown.com"
    }
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors cursor-pointer"
        aria-label="Open Help"
      >
        <HelpCircle size={24} />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 relative overflow-hidden">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Help Center</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors cursor-pointer p-2"
                aria-label="Close Help"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {helpTopics.map((topic, index) => (
                <div key={index} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {topic.content}
                  </p>
                </div>
              ))}
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Need More Help?
                </h3>
                <p className="text-blue-600">
                  Our support team is available 24/7 to assist you with any questions or concerns.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Help;