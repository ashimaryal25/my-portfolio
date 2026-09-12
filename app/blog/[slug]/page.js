import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import config from "@/data/config";
import LikeButton from "@/components/LikeButton";
import GiscusComments from "@/components/GiscusComments";
import styles from "./page.module.css";

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const title = `${post.frontmatter.title} | ${config.name}`;
  const description = post.frontmatter.excerpt;
  const url = `https://ashimaryal.com/blog/${slug}`;
  const keywords = [
    post.frontmatter.title,
    ...(post.frontmatter.keywords || []),
    ...(post.frontmatter.tags || []),
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
      publishedTime: post.frontmatter.date,
      authors: [config.name],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost =
    currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  const { frontmatter, content } = post;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: frontmatter.title,
    description: frontmatter.excerpt,
    datePublished: frontmatter.date,
    author: {
      "@type": "Person",
      name: config.name,
      url: "https://ashimaryal.com",
    },
    keywords: [
      frontmatter.title,
      ...(frontmatter.keywords || []),
      ...(frontmatter.tags || []),
    ].join(", "),
  };

  return (
    <article className={`container ${styles.article}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={styles.topNav}>
        <Link href="/blog" className={styles.backLink}>
          ← Writing
        </Link>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>{frontmatter.title}</h1>
        <div className={styles.meta}>
          {frontmatter.date && <time>{formatDate(frontmatter.date)}</time>}
          {frontmatter.readTime && (
            <>
              <span className={styles.metaSep}>•</span>
              <span>{frontmatter.readTime} min read</span>
            </>
          )}
        </div>
      </header>

      <div className={`prose ${styles.content}`}>
        <MDXRemote source={content} />
      </div>

      <LikeButton slug={slug} />

      <hr className="divider" />

      <footer className={styles.footer}>
        <div className={styles.postNav}>
          {prevPost ? (
            <Link href={`/blog/${prevPost.slug}`} className={styles.navLink}>
              <span className={styles.navDirection}>Previous</span>
              <span className={styles.navTitle}>{prevPost.title}</span>
            </Link>
          ) : <div />}

          {nextPost && (
            <Link href={`/blog/${nextPost.slug}`} className={`${styles.navLink} ${styles.navNext}`}>
              <span className={styles.navDirection}>Next</span>
              <span className={styles.navTitle}>{nextPost.title}</span>
            </Link>
          )}
        </div>
      </footer>

      <GiscusComments />
    </article>
  );
}
