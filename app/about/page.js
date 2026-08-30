import config from "@/data/config";
import styles from "./page.module.css";

export const metadata = {
  title: "About",
  description: `About ${config.name}, student and developer at Gettysburg College.`,
};

export default function AboutPage() {
  return (
    <div className="container">
      <section className={styles.section}>
        <div className={styles.header}>
          <h1 className={styles.title}>About</h1>
        </div>

        <div className={styles.bio}>
          <p>
            I&apos;m {config.name}, a student at Gettysburg College. I enjoy building software that solves practical problems, from full-stack web applications and backend systems to developer utilities and hardware integrations. I&apos;m currently looking for software engineering internships.
          </p>
        </div>

        <div className={styles.sectionBlock}>
          <h2 className={styles.subhead}>Contact</h2>
          <p className={styles.contactText}>
            Feel free to reach out via email at{" "}
            <a href={`mailto:${config.email}`} className={styles.link}>
              {config.email}
            </a>
            , or connect on{" "}
            <a href={config.github} target="_blank" rel="noopener noreferrer" className={styles.link}>
              GitHub
            </a>{" "}
            and{" "}
            <a href={config.linkedin} target="_blank" rel="noopener noreferrer" className={styles.link}>
              LinkedIn
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
