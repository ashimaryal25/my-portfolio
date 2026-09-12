import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getProjectBySlug, getAllProjects } from "@/lib/projects";
import config from "@/data/config";
import LikeButton from "@/components/LikeButton";
import GiscusComments from "@/components/GiscusComments";
import styles from "./page.module.css";

export async function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};

  const title = `${project.frontmatter.title} | ${config.name}`;
  const description = project.frontmatter.tagline;
  const url = `https://ashimaryal.com/projects/${slug}`;
  const image = project.frontmatter.image ? `https://ashimaryal.com${project.frontmatter.image}` : undefined;
  const keywords = [
    project.frontmatter.title,
    ...(project.frontmatter.keywords || []),
    ...(project.frontmatter.tech || []),
  ];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Ashim Aryal",
      type: "article",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { frontmatter, content } = project;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: frontmatter.title,
    headline: frontmatter.title,
    description: frontmatter.tagline,
    author: {
      "@type": "Person",
      name: config.name,
      url: "https://ashimaryal.com",
    },
    codeRepository: frontmatter.github || undefined,
    programmingLanguage: frontmatter.tech || undefined,
    keywords: [
      frontmatter.title,
      ...(frontmatter.keywords || []),
      ...(frontmatter.tech || []),
    ].join(", "),
    image: frontmatter.image ? `https://ashimaryal.com${frontmatter.image}` : undefined,
  };

  return (
    <article className={`container ${styles.article}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

      <LikeButton slug={slug} />

      <GiscusComments />
    </article>
  );
}
