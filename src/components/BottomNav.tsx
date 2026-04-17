import React from 'react';
import { Home, PlaySquare, PlusSquare, MessageCircle, User, Bell } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';

export default function BottomNav() {
  const { currentPage, pushPage, currentUser, notificationCount, messageCount, setViewingUser } = useAppStore();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'reels', icon: PlaySquare, label: 'Reels' },
    { id: 'create', icon: PlusSquare, label: 'Create' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', badge: messageCount + notificationCount },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] flex items-center justify-around px-2 py-1 z-50 pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'profile') setViewingUser(null);
              pushPage(item.id as any);
            }}
            className="flex flex-col items-center justify-center w-[20%] py-2 relative group touch-manipulation"
          >
            {isActive && (
              <motion.div 
                layoutId="nav-indicator"
                className="absolute inset-0 bg-blue-50/80 rounded-2xl -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            {item.id === 'profile' ? (
              <img 
                src={currentUser?.avatar || "https://picsum.photos/seed/myprofile/32/32"} 
                className={`w-7 h-7 rounded-full object-cover relative z-10 transition-all duration-300 ${isActive ? 'border-[2px] border-blue-600 scale-105 shadow-md shadow-blue-200' : 'border-transparent opacity-80'}`} 
                alt="Profile" 
              />
            ) : (
              <Icon 
                className={`w-6 h-6 relative z-10 transition-all duration-300 ${isActive ? 'text-blue-600 stroke-[2.5px] scale-110 drop-shadow-sm' : 'text-gray-400'}`} 
              />
            )}
            <span className={`text-[10px] mt-1 font-bold transition-all duration-300 ${isActive ? 'text-blue-600 opacity-100 scale-100' : 'text-gray-400 opacity-0 scale-75 absolute -bottom-5'}`}>
              {item.label}
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <div className="absolute top-1 right-[20%] bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center border-2 border-white z-20 px-1 shadow-sm">
                {item.badge > 99 ? '99+' : item.badge}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
