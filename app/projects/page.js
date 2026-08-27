import { getAllProjects } from "@/lib/projects";
import ProjectCard from "@/components/ProjectCard";
import styles from "./page.module.css";

export const metadata = {
  title: "Projects & Systems",
  description: "A log of physical computing builds, offline ML tools, and local infrastructure.",
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className="container">
      <section className={styles.section}>
        <div className={styles.header}>
          <h1 className={styles.title}>Projects & Systems</h1>
          <p className={styles.subtitle}>
            Hardware, local software, and the small tools built around them.
          </p>
        </div>

        <div className={styles.grid}>
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
