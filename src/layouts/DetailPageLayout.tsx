import React, { ReactNode } from 'react';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DetailPageLayoutProps {
  title: string;
  breadcrumbs: string[];
  children: ReactNode;
}

const DetailPageLayout = ({ title, breadcrumbs, children }: DetailPageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center gap-2 text-[#1E3A8A]">
        <h1 className="text-2xl font-bold">{title}</h1>
        <span className="text-gray-500">/</span>
        <div className="flex items-center gap-2">
          <Home size={18} />
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span>{crumb}</span>
              {index < breadcrumbs.length - 1 && (
                <span className="text-gray-500">/</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-6">
          <h2 className="text-xl font-semibold text-white">{breadcrumbs[breadcrumbs.length - 1]}</h2>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DetailPageLayout;