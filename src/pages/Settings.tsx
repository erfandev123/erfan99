import React, { useState } from 'react';
import { User, Bell, Lock, Shield, Palette, HelpCircle, ChevronRight, Moon, Globe, EyeOff, Activity, LogOut } from 'lucide-react';
import { useAppStore } from '../store';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Edit Profile');
  const { setIsAuthenticated } = useAppStore();
  const tabs = [
    { name: 'Edit Profile', icon: User },
    { name: 'Notifications', icon: Bell },
    { name: 'Privacy', icon: Lock },
    { name: 'Security', icon: Shield },
    { name: 'Theme', icon: Palette },
    { name: 'Help', icon: HelpCircle },
  ];

  return (
    <div className="h-full w-full bg-[#fafafa] flex justify-center p-0 md:p-8 overflow-y-auto">
      <div className="w-full max-w-[1000px] bg-white md:rounded-3xl md:shadow-sm md:border border-gray-100 flex flex-col md:flex-row overflow-hidden min-h-full md:min-h-[600px]">
        
        {/* Settings Sidebar */}
        <div className="w-full md:w-[280px] border-r border-gray-100 bg-gray-50/50 p-4 flex flex-col">
          <h2 className="text-2xl font-black text-gray-900 mb-6 px-2">Settings</h2>
          <div className="space-y-1 flex-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-white shadow-sm border border-gray-200 text-blue-600 font-bold' 
                      : 'text-gray-700 hover:bg-gray-100 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span>{tab.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="w-full flex items-center space-x-3 p-3 rounded-xl text-red-500 hover:bg-red-50 font-bold transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-6 md:p-10 bg-white">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">{activeTab}</h3>
          
          {activeTab === 'Edit Profile' && (
            <div className="max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center space-x-4 mb-8">
                <img src="https://picsum.photos/seed/myprofile/80/80" alt="Profile" className="w-20 h-20 rounded-full object-cover border border-gray-200" />
                <div>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-4 py-2 rounded-lg transition-colors text-sm">Change Photo</button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                  <input type="text" defaultValue="Reeta" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                  <input type="text" defaultValue="@reeta_official" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bio</label>
                  <textarea defaultValue="Digital creator & artist 🎨" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"></textarea>
                </div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm active:scale-95">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Privacy' && (
            <div className="max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {[
                { icon: Lock, title: 'Private Account', desc: 'Only approved followers can see your posts.' },
                { icon: Activity, title: 'Activity Status', desc: 'Show when you are active together.' },
                { icon: EyeOff, title: 'Story Hidden', desc: 'Hide your story from specific people.' },
                { icon: Globe, title: 'Public Search', desc: 'Allow your profile to appear in search engines.' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <item.icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Theme' && (
            <div className="max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-blue-500 rounded-2xl p-4 cursor-pointer relative">
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="w-full h-32 bg-gray-100 rounded-xl mb-3 flex flex-col p-2 space-y-2">
                    <div className="w-full h-4 bg-white rounded-md"></div>
                    <div className="w-3/4 h-4 bg-white rounded-md"></div>
                  </div>
                  <h4 className="font-bold text-center text-gray-900">Light Mode</h4>
                </div>
                <div className="border-2 border-gray-200 rounded-2xl p-4 cursor-pointer hover:border-gray-300 transition-colors">
                  <div className="w-full h-32 bg-gray-900 rounded-xl mb-3 flex flex-col p-2 space-y-2">
                    <div className="w-full h-4 bg-gray-800 rounded-md"></div>
                    <div className="w-3/4 h-4 bg-gray-800 rounded-md"></div>
                  </div>
                  <h4 className="font-bold text-center text-gray-900">Dark Mode</h4>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'Notifications' && (
            <div className="max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h4 className="font-bold text-gray-900 mb-4">Push Notifications</h4>
              {[
                { title: 'Likes', desc: 'When someone likes your post' },
                { title: 'Comments', desc: 'When someone comments on your post' },
                { title: 'New Followers', desc: 'When someone starts following you' },
                { title: 'Direct Messages', desc: 'When you receive a new message' },
                { title: 'Mentions', desc: 'When someone mentions you' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer">
                  <div>
                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <div className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">Password</h4>
                    <p className="text-sm text-gray-500">Change your password</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500">Add extra security to your account</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">Login Activity</h4>
                    <p className="text-sm text-gray-500">See where you're logged in</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Help' && (
            <div className="max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <div className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">Help Center</h4>
                    <p className="text-sm text-gray-500">Find answers to your questions</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">Report a Problem</h4>
                    <p className="text-sm text-gray-500">Let us know if something is broken</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">Privacy and Security Help</h4>
                    <p className="text-sm text-gray-500">Learn how to protect your account</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function IconForTab({ tab, className }: { tab: string, className: string }) {
  if (tab === 'Notifications') return <Bell className={className} />;
  if (tab === 'Security') return <Shield className={className} />;
  if (tab === 'Help') return <HelpCircle className={className} />;
  return null;
}
