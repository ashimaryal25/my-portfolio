import Link from "next/link";
import config from "@/data/config";
import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.copyright}>
          © {year} {config.name}
        </span>
        <div className={styles.links}>
          <a href={config.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <span className={styles.sep}>•</span>
          <a href={config.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <span className={styles.sep}>•</span>
          <a href={`mailto:${config.email}`}>
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
