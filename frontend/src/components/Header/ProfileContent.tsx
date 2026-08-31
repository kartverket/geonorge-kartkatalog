"use client";

import { Avatar, Button, Divider, Heading } from "@kv-designsystem/react";
import {
  Buildings2Icon,
  LeaveIcon,
  PersonCircleIcon,
} from "@navikt/aksel-icons";
import { type Location, trackClick } from "@/posthog/posthog";
import styles from "./ProfileContent.module.css";

export function ProfileContent({ location }: { location: Location }) {
  return (
    <div className={styles.content}>
      <div className={styles.profiles}>
        <Heading data-size="2xs">Velg profil</Heading>
        <Button
          variant="tertiary"
          data-color="neutral"
          onClick={() => trackClick("personal-profile", location)}
        >
          <Avatar aria-hidden data-size="xs" />
          Frodo Baggins
        </Button>
        <Button
          variant="tertiary"
          data-color="neutral"
          onClick={() => trackClick("organization-profile", location)}
        >
          <Avatar aria-hidden data-size="xs" variant="square">
            <Buildings2Icon />
          </Avatar>
          Oslo kommune
        </Button>
      </div>
      <Divider />
      <div className={styles.actions}>
        <Button
          variant="tertiary"
          data-color="neutral"
          onClick={() => trackClick("my-page", location)}
        >
          <PersonCircleIcon aria-hidden />
          Min side
        </Button>
        <Button
          variant="tertiary"
          data-color="danger"
          onClick={() => trackClick("logout", location)}
        >
          <LeaveIcon aria-hidden />
          Logg ut
        </Button>
      </div>
    </div>
  );
}
