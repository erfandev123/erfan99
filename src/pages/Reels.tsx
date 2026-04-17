import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, VolumeX, Play, X, ArrowLeft, ChevronUp, ChevronDown, Share2, Share, SendHorizontal, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { subscribeReels, toggleLike, toggleFavorite, incrementViewCount, addComment, getComments, toggleCommentLike } from '../services/postService';
import { Post, Comment } from '../types';
import { followUser, unfollowUser, isFollowing } from '../services/followService';
import { sendNotification } from '../services/notificationService';
import { sendMessage, subscribeConversations } from '../services/chatService';

import { ReelItem } from '../components/ReelItem';

export default function Reels() {
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { pushPage, currentUser, cachedReels, setCachedReels } = useAppStore();
  const reelsScrollY = useAppStore(state => state.reelsScrollY);
  const setReelsScrollY = useAppStore(state => state.setReelsScrollY);
  const reelsContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<any>(null);

  useEffect(() => {
    // Re-attach keyboard listener logic strictly for reels container
    const handleKeyDown = (e: KeyboardEvent) => {
      const c = reelsContainerRef.current;
      if (!c) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        c.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        c.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Restore scrolled position
    if (reelsContainerRef.current && reelsScrollY > 0 && !loading) {
      setTimeout(() => {
        if (reelsContainerRef.current) reelsContainerRef.current.scrollTo(0, reelsScrollY);
      }, 50);
    }
  }, [loading]); // Remove reelsScrollY from dep list to avoid jumping

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setReelsScrollY(top);
    }, 500); // Debounce to prevent lag
  }, [setReelsScrollY]);

  useEffect(() => {
    if (cachedReels.length > 0) {
      setReels(cachedReels);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeReels((fetchedReels) => {
      setReels(fetchedReels);
      setCachedReels(fetchedReels);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, setCachedReels]);

  if (loading) {
    return (
      <div className="h-full w-full bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-full w-full bg-white flex flex-col items-center justify-center text-gray-900 p-4">
        <Play className="w-16 h-16 mb-4 text-gray-300" />
        <h2 className="text-xl font-bold mb-2">No reels yet</h2>
        <p className="text-gray-500 text-center mb-6">Be the first to share a reel!</p>
        <button 
          onClick={() => pushPage('create')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-full transition-all active:scale-95 shadow-lg shadow-blue-100"
        >
          Create Reel
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white overflow-hidden relative">
      <div 
        id="global-reels-container"
        ref={reelsContainerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory hide-scrollbar overscroll-none"
      >
        {reels.map((reel) => (
          <ReelItem key={reel.id} reel={reel} />
        ))}
      </div>
    </div>
  );
}
