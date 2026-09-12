"use client";

import Giscus from "@giscus/react";
import styles from "./GiscusComments.module.css";

export default function GiscusComments() {
  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Comments & Discussions</h3>
        <p className={styles.subtitle}>
          Sign in with GitHub to join the conversation, leave feedback, or react with emojis.
        </p>
      </div>

      <div className={styles.giscusWrapper}>
        <Giscus
          id="comments"
          repo="ashimaryal25/my-portfolio"
          repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "R_kgDON7uUbg"}
          category="General"
          categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "DIC_kwDON7uUbs4CnJ2q"}
          mapping="pathname"
          strict="0"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="bottom"
          theme="transparent_dark"
          lang="en"
          loading="lazy"
        />
      </div>
    </section>
  );
}
