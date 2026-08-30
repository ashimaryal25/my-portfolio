import Link from "next/link";
import Image from "next/image";
import { getAllProjects } from "@/lib/projects";
import { getAllPosts } from "@/lib/posts";
import config from "@/data/config";
import HeroConsole from "@/components/HeroConsole";
import ProjectCard from "@/components/ProjectCard";
import styles from "./page.module.css";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function HomePage() {
  const projects = getAllProjects();
  const posts = getAllPosts();

  return (
    <div className="container">
      {/* ── INTRO / BIO ── */}
      <section className={styles.intro}>
        <div className={styles.introTop}>
          <div className={styles.introCopy}>
            <h1 className={styles.name}>{config.name}</h1>
            <p className={styles.bio}>
              Software developer and student at Gettysburg College. I build full-stack web applications, backend tools, and networked systems with Next.js, Node, and Python.
            </p>
            <div className={styles.contactLinks}>
              <a href={config.github} target="_blank" rel="noopener noreferrer">
                GitHub ↗
              </a>
              <span className={styles.sep}>/</span>
              <a href={config.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn ↗
              </a>
              <span className={styles.sep}>/</span>
              <a href={`mailto:${config.email}`}>
                {config.email}
              </a>
            </div>
          </div>

          <figure className={styles.cardPortrait}>
            <Image
              src="/ashim-card-v14.png"
              alt="Ashim Aryal trading card made with CardifyBooth"
              width={600}
              height={960}
              priority
            />
            <figcaption>Made with CardifyBooth.</figcaption>
          </figure>
        </div>

        {/* ── Interactive Systems Console ── */}
        <div className={styles.consoleContainer}>
          <HeroConsole />
        </div>
      </section>

      <hr className="divider" />

      {/* ── SYSTEMS & PROJECTS ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Systems & Projects</h2>
          <Link href="/projects" className={styles.viewAll}>
            All ({projects.length}) →
          </Link>
        </div>

        <div className={styles.grid}>
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* ── WRITING / LOGS ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Writing</h2>
          <Link href="/blog" className={styles.viewAll}>
            All ({posts.length}) →
          </Link>
        </div>

        <div className={styles.postList}>
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.postItem}>
              <div className={styles.postMeta}>
                <span className={styles.postDate}>{formatDate(post.date)}</span>
                <span className={styles.postReadTime}>{post.readTime} min read</span>
              </div>
              <div className={styles.postMain}>
                <h3 className={styles.postTitle}>{post.title}</h3>
                <p className={styles.postExcerpt}>{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
