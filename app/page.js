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
              I build things that live half in software and half in the physical world. Lately that&apos;s meant
              wiring up a farm of 3D printers so they take jobs over the network, a robot that draws on walls
              with a pen, and small ML models that run on the booth computer instead of someone&apos;s cloud.
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
              src="/ashim-aryal-card.png"
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
            all projects ({projects.length}) →
          </Link>
        </div>

        <div className={styles.projectGrid}>
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* ── WRITING ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Writing</h2>
          <Link href="/blog" className={styles.viewAll}>
            all essays ({posts.length}) →
          </Link>
        </div>

        <div className={styles.postList}>
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.postItem}>
              <div className={styles.postHeader}>
                <span className={styles.postTitle}>{p.title}</span>
                <time className={styles.postDate}>{formatDate(p.date)}</time>
              </div>
              {p.excerpt && <p className={styles.postExcerpt}>{p.excerpt}</p>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
