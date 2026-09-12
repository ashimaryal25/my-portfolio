"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import styles from "./LikeButton.module.css";

export default function LikeButton({ slug }) {
  const [likes, setLikes] = useState(0);
  const [userLikes, setUserLikes] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    try {
      const storedUser = localStorage.getItem(`likes_user_${slug}`);
      if (storedUser) setUserLikes(parseInt(storedUser, 10));
    } catch (e) {}

    fetch(`/api/likes/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && typeof data.likes === "number") {
          setLikes(data.likes);
        }
      })
      .catch(() => {
        // Fallback to local
        try {
          const storedTotal = localStorage.getItem(`likes_total_${slug}`);
          if (storedTotal) setLikes(parseInt(storedTotal, 10));
        } catch (e) {}
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleLike = async () => {
    if (userLikes >= 10) return; // max 10 claps per visitor

    const nextLikes = likes + 1;
    const nextUserLikes = userLikes + 1;

    // Optimistic UI update
    setLikes(nextLikes);
    setUserLikes(nextUserLikes);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);

    try {
      localStorage.setItem(`likes_total_${slug}`, nextLikes.toString());
      localStorage.setItem(`likes_user_${slug}`, nextUserLikes.toString());
    } catch (e) {}

    try {
      await fetch(`/api/likes/${slug}`, { method: "POST" });
    } catch (e) {
      console.error("Failed to post like:", e);
    }
  };

  const hasLiked = userLikes > 0;

  return (
    <div className={styles.wrapper}>
      <button
        onClick={handleLike}
        className={`${styles.likeBtn} ${hasLiked ? styles.liked : ""} ${animating ? styles.pop : ""}`}
        aria-label="Like this project"
        title={userLikes >= 10 ? "You reached the max likes!" : "Click to like!"}
      >
        <Heart
          size={18}
          className={`${styles.icon} ${hasLiked ? styles.iconFilled : ""}`}
          fill={hasLiked ? "currentColor" : "none"}
        />
        <span className={styles.count}>{likes}</span>
        {userLikes > 0 && <span className={styles.userBadge}>+{userLikes}</span>}
      </button>
      <span className={styles.hint}>
        {userLikes === 0 ? "Like this project" : userLikes >= 10 ? "Thanks for all the love!" : "Tap again to add more love"}
      </span>
    </div>
  );
}
