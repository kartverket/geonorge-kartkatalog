"use client";

import { Avatar, Button, Divider, Heading } from "@kv-designsystem/react";
import { LeaveIcon, PersonCircleIcon } from "@navikt/aksel-icons";
import { bffPath } from "@/lib/basePath";
import { type Location, trackClick } from "@/posthog/posthog";
import styles from "./ProfileContent.module.css";

export function ProfileContent({
  location,
  userName,
}: {
  location: Location;
  userName: string;
}) {
  return (
    <div className={styles.content}>
      <div className={styles.profiles}>
        <Heading data-size="2xs">Profil</Heading>
        <Button
          variant="tertiary"
          onClick={() => trackClick("personal-profile", location)}
        >
          <Avatar aria-hidden data-size="xs" />
          {userName}
        </Button>
      </div>
      <Divider />
      <div className={styles.actions}>
        <Button
          variant="tertiary"
          onClick={() => trackClick("my-page", location)}
        >
          <PersonCircleIcon aria-hidden />
          Min side
        </Button>
        <form
          action={`${bffPath}/auth/logout`}
          method="post"
          className={styles.logoutForm}
        >
          <Button
            type="submit"
            variant="tertiary"
            data-color="danger"
            onClick={() => trackClick("logout", location)}
          >
            <LeaveIcon aria-hidden />
            Logg ut
          </Button>
        </form>
      </div>
    </div>
  );
}
