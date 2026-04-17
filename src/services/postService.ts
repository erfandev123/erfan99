import { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  serverTimestamp, 
  increment, 
  updateDoc,
  deleteDoc,
  where,
  runTransaction,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { Post, Comment, Notification, User } from '../types';
import { uploadMedia } from './githubStorage';
import { sendNotification } from './notificationService';
import { collection as usersCol, getDocs as getUsers, where as whereUser } from 'firebase/firestore';

const detectMentions = async (text: string, actor: User, postId: string, postMedia: string | null, targetId: string) => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  if (!matches) return;

  const usernames = matches.map(m => m.slice(1));
  for (const username of usernames) {
    try {
      const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const targetUser = snap.docs[0];
        await sendNotification(targetUser.id, 'mention', actor, targetId, postId, postMedia, `mentioned you: "${text.substring(0, 50)}..."`);
      }
    } catch (e) {
      console.error("Mention detection error:", e);
    }
  }
};

export const getPost = async (postId: string) => {
  try {
    const postSnap = await getDoc(doc(db, 'posts', postId));
    if (postSnap.exists()) {
      return { id: postSnap.id, ...postSnap.data() } as Post;
    }
    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const createPost = async (userId: string, user: User, text: string, files: File[], type: 'post' | 'reel' = 'post') => {
  try {
    const mediaUrls = await Promise.all(files.map(file => uploadMedia(file, type === 'reel' ? 'reels' : 'posts')));

    const postData = {
      authorId: userId,
      authorName: user.name,
      authorAvatar: user.avatar,
      text,
      media: mediaUrls,
      type,
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'posts'), postData);
    
    // Detect mentions in post text
    await detectMentions(text, user, docRef.id, mediaUrls[0] || null, docRef.id);
    
    // Increment user post count
    await updateDoc(doc(db, 'users', userId), {
      postsCount: increment(1)
    });

    return { id: docRef.id, ...postData };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const deletePost = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) throw new Error('Post not found');
    if (postSnap.data().authorId !== userId) throw new Error('Unauthorized');

    await deleteDoc(postRef);
    
    // Decrement user post count
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().postsCount > 0) {
      await updateDoc(userRef, {
        postsCount: increment(-1)
      });
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updatePost = async (postId: string, userId: string, text: string) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) throw new Error('Post not found');
    if (postSnap.data().authorId !== userId) throw new Error('Unauthorized');

    await updateDoc(postRef, { text, updatedAt: serverTimestamp() });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getFeed = async (pageSize: number = 10, lastDoc: any = null, userId?: string) => {
  let q;
  
  if (userId) {
    // If userId is provided, we might hit index issues with orderBy
    // For now, we fetch and sort client-side if we can't guarantee index
    q = query(collection(db, 'posts'), where('authorId', '==', userId), limit(pageSize * 2));
  } else {
    q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(pageSize));
  }

  if (lastDoc && !userId) {
    q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
  }
  
  const querySnapshot = await getDocs(q);
  let posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Post));
  
  if (userId) {
    posts.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
    posts = posts.slice(0, pageSize);
  }

  return {
    posts,
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
  };
};

export const subscribeFeed = (callback: (posts: Post[]) => void, pageSize: number = 20) => {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(pageSize));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    callback(posts);
  }, (error) => {
    console.error("Feed subscription error:", error);
  });
};

export const toggleLike = async (postId: string, userId: string) => {
  const likeRef = doc(db, 'posts', postId, 'likes', userId);
  const postRef = doc(db, 'posts', postId);

  try {
    const likeDoc = await getDoc(likeRef);
    if (likeDoc.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(postRef, { likesCount: increment(-1) });
      return false;
    } else {
      await setDoc(likeRef, { createdAt: serverTimestamp() });
      await updateDoc(postRef, { likesCount: increment(1) });
      return true;
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const addComment = async (postId: string, userId: string, user: User, text: string, parentId?: string | null) => {
  try {
    const commentData = {
      authorId: userId,
      authorName: user.name,
      authorAvatar: user.avatar,
      text,
      createdAt: serverTimestamp(),
      parentId: parentId || null,
    };

    const docRef = await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
    await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });

    // Detect mentions in comment
    const postSnap = await getDoc(doc(db, 'posts', postId));
    const postMedia = postSnap.data()?.media?.[0] || null;
    await detectMentions(text, user, postId, postMedia, docRef.id);

    return { id: docRef.id, ...commentData };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getComments = async (postId: string) => {
  const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
};

export const deleteComment = async (postId: string, commentId: string) => {
  try {
    await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
    await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(-1) });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const toggleCommentLike = async (postId: string, commentId: string, userId: string) => {
  const likeRef = doc(db, 'posts', postId, 'comments', commentId, 'likes', userId);
  const commentRef = doc(db, 'posts', postId, 'comments', commentId);

  try {
    const likeDoc = await getDoc(likeRef);
    if (likeDoc.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(commentRef, { likesCount: increment(-1) });
      return false;
    } else {
      await setDoc(likeRef, { createdAt: serverTimestamp() });
      await updateDoc(commentRef, { likesCount: increment(1) });
      return true;
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const toggleFavorite = async (postId: string, userId: string) => {
  const favRef = doc(db, 'users', userId, 'favorites', postId);
  const postRef = doc(db, 'posts', postId);

  try {
    const favDoc = await getDoc(favRef);
    if (favDoc.exists()) {
      await deleteDoc(favRef);
      await updateDoc(postRef, { favoritesCount: increment(-1) });
      return false;
    } else {
      await setDoc(favRef, { createdAt: serverTimestamp() });
      await updateDoc(postRef, { favoritesCount: increment(1) });
      return true;
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getSavedPosts = async (userId: string) => {
  try {
    const favsSnap = await getDocs(collection(db, 'users', userId, 'favorites'));
    const postIds = favsSnap.docs.map(d => d.id);
    if (postIds.length === 0) return [];
    
    const posts = await Promise.all(
      postIds.map(async id => {
        const pSnap = await getDoc(doc(db, 'posts', id));
        return pSnap.exists() ? { id: pSnap.id, ...pSnap.data() } as Post : null;
      })
    );
    return posts.filter(p => p !== null) as Post[];
  } catch(e) {
    console.error(e);
    return [];
  }
};

const viewedReelsCache = new Set<string>();

export const incrementViewCount = async (postId: string, userId: string) => {
  if (!userId || viewedReelsCache.has(`${postId}_${userId}`)) return;
  const viewRef = doc(db, 'posts', postId, 'views', userId);
  const postRef = doc(db, 'posts', postId);

  try {
    const viewDoc = await getDoc(viewRef);
    if (!viewDoc.exists()) {
      await setDoc(viewRef, { createdAt: serverTimestamp() });
      await updateDoc(postRef, { viewsCount: increment(1) });
    }
    viewedReelsCache.add(`${postId}_${userId}`);
  } catch (error: any) {
    console.error("Error incrementing view count:", error);
  }
};

export const subscribeUserPosts = (userId: string, callback: (posts: Post[]) => void) => {
  // We remove orderBy to avoid index requirement, and sort client-side
  const q = query(collection(db, 'posts'), where('authorId', '==', userId), limit(50));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Post))
      .sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    callback(posts);
  }, (error) => {
    console.error("User posts subscription error:", error);
  });
};

export const subscribeReels = (callback: (reels: Post[]) => void, pageSize: number = 50) => {
  const q = query(collection(db, 'posts'), where('type', '==', 'reel'), limit(pageSize));
  return onSnapshot(q, (snapshot) => {
    let reels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    
    // Randomize reels order
    for (let i = reels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [reels[i], reels[j]] = [reels[j], reels[i]];
    }
    
    callback(reels);
  }, (error) => {
    console.error("Reels subscription error:", error);
  });
};

export const searchPosts = async (searchTerm: string) => {
  const q = query(
    collection(db, 'posts'),
    orderBy('text'),
    where('text', '>=', searchTerm),
    where('text', '<=', searchTerm + '\uf8ff'),
    limit(20)
  );
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  } catch (e) {
    console.error("Search error:", e);
    return [];
  }
};

export const getUserTotalLikes = async (userId: string) => {
  try {
    const q = query(collection(db, 'posts'), where('authorId', '==', userId));
    const querySnapshot = await getDocs(q);
    let totalLikes = 0;
    querySnapshot.forEach((doc) => {
      totalLikes += doc.data().likesCount || 0;
    });
    return totalLikes;
  } catch (error) {
    console.error("Error getting total likes:", error);
    return 0;
  }
};
