import React, { useState, useRef, useEffect } from 'react';
import { Upload, Video, Image as ImageIcon, Music, Type, Smile, X, Camera, FlipHorizontal, Zap, Timer, Settings2, CheckCircle2, ArrowLeft, UserPlus, ChevronRight, MapPin } from 'lucide-react';
import { useAppStore } from '../store';

import { createPost } from '../services/postService';
import { findUserByUsername } from '../services/userService';
import { sendNotification } from '../services/notificationService';
import { uploadStory } from '../services/storyService';

export default function Create() {
  const { setCurrentPage, currentUser } = useAppStore();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'reel' | 'story'>('reel');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleUpload = async () => {
    if (!currentUser || !file) return;
    setLoading(true);
    try {
      if (mode === 'reel') {
        const post = await createPost(currentUser.uid, currentUser, caption, [file], 'reel') as any;
        
        // Mentions Notification
        const mentionMatches = caption.match(/@(\w+)/g);
        if (mentionMatches) {
          const uniqueMentions = Array.from(new Set(mentionMatches.map(m => m.substring(1)))) as string[];
          uniqueMentions.forEach(async (username) => {
            const mentionedUser = await findUserByUsername(username);
            if (mentionedUser && mentionedUser.uid !== currentUser.uid) {
              await sendNotification(mentionedUser.uid, 'mention', currentUser, post.id, post.id, post.media?.[0], caption, currentUser.name, currentUser.avatar);
            }
          });
        }
        
        setCurrentPage('reels');
      } else {
        await uploadStory(currentUser.uid, currentUser.name, currentUser.avatar, file);
        setCurrentPage('home');
      }
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    
    if (isMobile && !file) {
      const startCamera = async () => {
        try {
          const constraints = {
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: true
          };
          
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          currentStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err: any) {
          console.error("Camera access error:", err);
          // Fallback to basic constraints
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            currentStream = fallbackStream;
            if (videoRef.current) {
              videoRef.current.srcObject = fallbackStream;
            }
          } catch (fallbackErr) {
            console.error("Fallback camera access error:", fallbackErr);
          }
        }
      };
      
      startCamera();
    }
    
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isMobile, file]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* TikTok-like Camera View */}
        {!file ? (
          <div className="relative flex-1 overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent pt-safe">
              <button onClick={() => setCurrentPage('home')} className="p-2 text-white"><X className="w-7 h-7" /></button>
              <button className="flex items-center space-x-2 bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full text-white font-semibold text-sm">
                <Music className="w-4 h-4" />
                <span>Add Sound</span>
              </button>
              <div className="flex flex-col space-y-4 items-center">
                <button className="flex flex-col items-center text-white"><FlipHorizontal className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">Flip</span></button>
                <button className="flex flex-col items-center text-white"><Zap className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">Flash</span></button>
                <button className="flex flex-col items-center text-white"><Timer className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">Timer</span></button>
                <button className="flex flex-col items-center text-white"><Settings2 className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">Filters</span></button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-safe">
              <div className="flex space-x-8 mb-6 text-white/80 font-bold text-sm">
                <button className="hover:text-white">15s</button>
                <button className="hover:text-white">60s</button>
                <button className="hover:text-white">3m</button>
                <button className="text-white border-b-2 border-white pb-1">Photo</button>
              </div>
              
              <div className="flex items-center justify-between w-full px-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-600 overflow-hidden relative">
                    <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleChange} />
                    <img src="https://picsum.photos/seed/gallery/100/100" className="w-full h-full object-cover" alt="Gallery" />
                  </div>
                  <span className="text-white text-[11px] font-bold mt-2">Upload</span>
                </div>
                
                <button 
                  className={`w-20 h-20 rounded-full border-4 border-white/50 flex items-center justify-center transition-transform active:scale-95 ${recording ? 'bg-red-500' : 'bg-white/20'}`}
                  onClick={() => setRecording(!recording)}
                >
                  <div className={`w-16 h-16 bg-white rounded-full transition-all ${recording ? 'scale-50 rounded-md' : ''}`}></div>
                </button>
                
                <div className="flex flex-col items-center opacity-0">
                  <div className="w-10 h-10"></div>
                  <span className="text-white text-[11px] font-bold mt-2">Effects</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Post Details View (After selecting media) */
          <div className="flex-1 bg-white flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 pt-safe">
              <button onClick={() => setFile(null)}><ArrowLeft className="w-6 h-6 text-gray-900" /></button>
              <h2 className="font-bold text-lg">New {mode === 'reel' ? 'Reel' : 'Story'}</h2>
              <button onClick={handleUpload} disabled={loading} className="text-blue-500 font-bold disabled:opacity-50">
                {loading ? 'Sharing...' : 'Share'}
              </button>
            </div>
            <div className="p-4 flex space-x-4 border-b border-gray-100">
              <div className="w-16 h-24 bg-black rounded-lg overflow-hidden shrink-0">
                {file?.type.startsWith('video') ? (
                  <video src={previewUrl || ''} className="w-full h-full object-cover" />
                ) : (
                  <img src={previewUrl || ''} className="w-full h-full object-cover" alt="Preview" />
                )}
              </div>
              <textarea 
                placeholder="Write a caption..." 
                className="flex-1 resize-none outline-none text-sm pt-2"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              ></textarea>
            </div>
            <div className="p-4 space-y-4">
              <button className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3 text-gray-700">
                  <UserPlus className="w-5 h-5" />
                  <span className="font-medium">Tag people</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3 text-gray-700">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">Add location</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3 text-gray-700">
                  <Music className="w-5 h-5" />
                  <span className="font-medium">Add music</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#f0f2f5] flex flex-col items-center overflow-y-auto pb-20">
      
      {/* Header */}
      <div className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[900px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentPage('home')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-900">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Create new {mode}</h1>
          </div>
          <div className="flex items-center bg-gray-100 rounded-full p-1">
            <button 
              onClick={() => setMode('reel')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${mode === 'reel' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Reel
            </button>
            <button 
              onClick={() => setMode('story')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${mode === 'story' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Story
            </button>
          </div>
          {file && (
            <button onClick={handleUpload} disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-full transition-colors shadow-sm active:scale-95 disabled:opacity-50">
              {loading ? 'Sharing...' : `Share ${mode === 'reel' ? 'Reel' : 'Story'}`}
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-[900px] mt-8 px-4 flex flex-col md:flex-row gap-6">
        
        {/* Upload Area */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px] relative">
          {!file ? (
            <div 
              className={`flex-1 flex flex-col items-center justify-center p-8 transition-all duration-300 ${dragActive ? 'bg-blue-50/50 border-2 border-dashed border-blue-400 scale-[0.99]' : 'bg-white hover:bg-gray-50'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-32 h-32 mb-8 relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full animate-pulse opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-95 transition-transform duration-300">
                  <Video className="w-10 h-10 text-gray-700" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Drag videos here</h2>
              <p className="text-gray-500 mb-8 text-center font-medium text-[15px]">Videos must be less than 60 seconds.</p>
              
              <label className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 px-8 rounded-2xl cursor-pointer transition-colors shadow-sm active:scale-95 flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Select from computer</span>
                <input type="file" accept="video/*" className="hidden" onChange={handleChange} />
              </label>
            </div>
          ) : (
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden group">
              <button 
                onClick={() => setFile(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md transition-all z-10 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
              >
                <X className="w-5 h-5" />
              </button>
              {/* Video preview */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-0"></div>
              {file.type.startsWith('video') ? (
                <video src={previewUrl || ''} className="w-full h-full object-cover" autoPlay loop muted />
              ) : (
                <img src={previewUrl || ''} className="w-full h-full object-cover opacity-60" alt="Preview" />
              )}
              <div className="absolute inset-0 flex items-center justify-center text-white flex-col z-10">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/30 shadow-2xl">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <p className="font-bold text-lg drop-shadow-md px-8 text-center truncate w-full">{file.name}</p>
                <p className="text-white/70 font-medium text-sm mt-1">Ready to share</p>
              </div>
            </div>
          )}
        </div>

        {/* Details Area */}
        <div className="w-full md:w-[350px] bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-fit overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center space-x-3 bg-white">
              <img 
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=random`} 
                alt="Profile" 
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-100" 
              />
              <div>
                <span className="font-bold text-[16px] text-gray-900 block leading-tight">{currentUser?.name || 'User'}</span>
                <span className="text-[13px] text-gray-500 font-medium">New {mode === 'reel' ? 'Reel' : 'Story'}</span>
              </div>
            </div>
          
          <div className="p-5">
            <textarea 
              placeholder="Write a catchy caption..." 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full h-40 resize-none focus:outline-none text-[15px] text-gray-800 placeholder-gray-400 font-medium leading-relaxed bg-gray-50 rounded-2xl p-4 border border-transparent focus:border-blue-200 transition-colors"
            ></textarea>
            
            <div className="flex items-center justify-between mt-3 border-b border-gray-100 pb-5">
              <button className="text-gray-400 hover:text-yellow-500 transition-colors p-2 hover:bg-yellow-50 rounded-full">
                <Smile className="w-6 h-6" />
              </button>
              <span className="text-xs text-gray-400 font-bold bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">{caption.length}/2200</span>
            </div>

            <div className="mt-5 space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl transition-colors group border border-gray-100 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                    <Music className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <span className="font-bold text-[15px] text-gray-700 group-hover:text-gray-900 transition-colors">Add Audio</span>
                </div>
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl transition-colors group border border-gray-100 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-gray-100 rounded-full group-hover:bg-green-100 transition-colors">
                    <ImageIcon className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors" />
                  </div>
                  <span className="font-bold text-[15px] text-gray-700 group-hover:text-gray-900 transition-colors">Add Cover</span>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
