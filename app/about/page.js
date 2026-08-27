import config from "@/data/config";
import styles from "./page.module.css";

export const metadata = {
  title: "About",
  description: `About ${config.name}, software developer.`,
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
            I&apos;m {config.name}, a software developer and student interested in systems, web development, and engineering.
          </p>
          <p>
            Most of my work spans full-stack web applications, system utilities, and hardware integrations. I enjoy building software that is fast, reliable, and solves real, practical problems.
          </p>
          <p>
            When working on projects, I often write about technical details, reverse-engineered protocols, and practical lessons learned along the way.
          </p>
        </div>

        <div className={styles.sectionBlock}>
          <h2 className={styles.subhead}>Stack & Tools</h2>
          <div className={styles.skillsGrid}>
            {Object.entries(config.skills).map(([category, items]) => (
              <div key={category} className={styles.skillItem}>
                <span className={styles.skillCat}>{category}:</span>
                <span className={styles.skillList}>{items.join(", ")}</span>
              </div>
            ))}
          </div>
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
