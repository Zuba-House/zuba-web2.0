import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiMenu2Line } from 'react-icons/ri';

const Topbar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <header 
      className="fixed top-0 right-0 h-16 bg-white shadow-sm z-40 flex items-center justify-between px-6"
      style={{ left: isSidebarOpen ? '256px' : '0', transition: 'left 0.3s' }}
    >
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="p-2 hover:bg-gray-100 rounded"
      >
        <RiMenu2Line className="text-2xl" />
      </button>
      <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;

