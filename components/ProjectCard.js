import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./ProjectCard.module.css";

export default function ProjectCard({ project }) {
  const { slug, title, tagline, tech = [], status, date, image } = project;

  return (
    <Link href={`/projects/${slug}`} className={styles.card}>
      {image && (
        <div className={styles.imageWrapper}>
          <img src={image} alt={title} className={styles.thumbnail} loading="lazy" />
        </div>
      )}

      <div className={styles.cardBody}>
        <div className={styles.top}>
          <div className={styles.metaLeft}>
            {status && <span className={styles.status}>{status}</span>}
            {date && <span className={styles.date}>{date}</span>}
          </div>
          <ArrowUpRight size={16} className={styles.arrow} aria-hidden="true" />
        </div>

        <div className={styles.main}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.tagline}>{tagline}</p>
        </div>

        {tech && tech.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.techStack}>
              {tech.map((t) => (
                <span key={t} className={styles.techChip}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
