"use client";

import { LOCATIONS } from "@/posthog/posthog";
import styles from "./HeaderProfile.module.css";
import { ProfileContent } from "./ProfileContent";

export function HeaderProfile() {
  return (
    <div id="header-profile-panel" className={styles.panel}>
      <div className={styles.inner}>
        <ProfileContent location={LOCATIONS.HeaderProfile} />
      </div>
    </div>
  );
}
