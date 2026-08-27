import { getAllPosts } from "@/lib/posts";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Writing & Engineering Logs",
  description: "Technical essays on hardware protocols, ML classifiers, and dual-agent workflows.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="container">
      <section className={styles.section}>
        <div className={styles.header}>
          <h1 className={styles.title}>Writing</h1>
          <p className={styles.subtitle}>
            Notes from building things, including what worked and what did not.
          </p>
        </div>

        <div className={styles.postList}>
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.postItem}>
              <div className={styles.postHeader}>
                <h2 className={styles.postTitle}>{post.title}</h2>
                <time className={styles.postDate}>{new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</time>
              </div>
              {post.excerpt && <p className={styles.postExcerpt}>{post.excerpt}</p>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
