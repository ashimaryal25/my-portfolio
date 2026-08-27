import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getProjectBySlug, getAllProjects } from "@/lib/projects";
import config from "@/data/config";
import styles from "./page.module.css";

export async function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.frontmatter.title} · ${config.name}`,
    description: project.frontmatter.tagline,
  };
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { frontmatter, content } = project;

  return (
    <article className={`container ${styles.article}`}>
      <div className={styles.topNav}>
        <Link href="/projects" className={styles.backLink}>
          ← Projects
        </Link>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>{frontmatter.title}</h1>
        <p className={styles.tagline}>{frontmatter.tagline}</p>

        <div className={styles.metaRow}>
          {frontmatter.tech?.length > 0 && (
            <div className={styles.tech}>
              {frontmatter.tech.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className={styles.links}>
            {frontmatter.github && (
              <a
                href={frontmatter.github}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Source ↗
              </a>
            )}
            {frontmatter.live && (
              <a
                href={frontmatter.live}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Live Demo ↗
              </a>
            )}
          </div>
        </div>
      </header>

      <hr className="divider" />

      <div className={`prose ${styles.content}`}>
        <MDXRemote source={content} />
      </div>
    </article>
  );
}
