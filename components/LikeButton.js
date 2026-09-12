"use client";

import { useState, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import styles from "./LikeButton.module.css";

export default function LikeButton({ slug }) {
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    try {
      const storedUser = localStorage.getItem(`liked_${slug}`);
      if (storedUser === "true") setHasLiked(true);
    } catch (e) {}

    fetch(`/api/likes/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && typeof data.likes === "number") {
          setLikes(data.likes);
        }
      })
      .catch(() => {
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
    if (hasLiked) return; // Only 1 like per person

    const nextLikes = likes + 1;

    // Optimistic UI update
    setLikes(nextLikes);
    setHasLiked(true);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);

    try {
      localStorage.setItem(`likes_total_${slug}`, nextLikes.toString());
      localStorage.setItem(`liked_${slug}`, "true");
    } catch (e) {}

    try {
      await fetch(`/api/likes/${slug}`, { method: "POST" });
    } catch (e) {
      console.error("Failed to post like:", e);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        onClick={handleLike}
        disabled={hasLiked}
        className={`${styles.likeBtn} ${hasLiked ? styles.liked : ""} ${animating ? styles.pop : ""}`}
        aria-label="Like this project"
        title={hasLiked ? "You liked this!" : "Click to like!"}
      >
        <ThumbsUp
          size={17}
          className={`${styles.icon} ${hasLiked ? styles.iconFilled : ""}`}
          fill={hasLiked ? "currentColor" : "none"}
        />
        <span className={styles.count}>{likes}</span>
      </button>
      <span className={styles.hint}>
        {hasLiked ? "Liked! Thanks for the support." : "Give a thumbs up if you enjoyed reading"}
      </span>
    </div>
  );
}
