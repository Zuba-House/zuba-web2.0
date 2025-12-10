import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const VendorDashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <Topbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <main 
        className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}
        style={{ marginTop: '70px', padding: '20px' }}
      >
        {children}
      </main>
    </div>
  );
};

export default VendorDashboardLayout;

