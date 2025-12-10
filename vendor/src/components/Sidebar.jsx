import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RxDashboard } from 'react-icons/rx';
import { RiProductHuntLine } from 'react-icons/ri';
import { IoBagCheckOutline } from 'react-icons/io5';
import { FaMoneyBillWave, FaTag, FaStore, FaChartLine, FaCog } from 'react-icons/fa';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', icon: RxDashboard, label: 'Dashboard' },
    { path: '/products', icon: RiProductHuntLine, label: 'Products' },
    { path: '/orders', icon: IoBagCheckOutline, label: 'Orders' },
    { path: '/finance/earnings', icon: FaMoneyBillWave, label: 'Finance' },
    { path: '/coupons', icon: FaTag, label: 'Coupons' },
    { path: '/store/profile', icon: FaStore, label: 'Store' },
    { path: '/analytics', icon: FaChartLine, label: 'Analytics' },
    { path: '/settings/account', icon: FaCog, label: 'Settings' }
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-[#0b2735] text-white z-50 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0 overflow-hidden'
      }`}
    >
      <div className="p-4">
        <h2 className="text-xl font-bold text-[#efb291]">Vendor Panel</h2>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-[#1a3d52] ${
                isActive ? 'bg-[#1a3d52] border-l-4 border-[#efb291]' : ''
              }`}
            >
              <Icon className="text-[#efb291]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

