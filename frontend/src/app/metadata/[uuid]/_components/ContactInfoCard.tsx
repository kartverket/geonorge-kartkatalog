"use client";
import { Card, Heading } from "@kv-designsystem/react";
import { EnvelopeClosedIcon } from "@navikt/aksel-icons";
import type { Contact } from "@/lib/schemas/product";
import styles from "./ContactInfoCard.module.css";

export function ContactInfoCard({
  contactMetadata,
  contactOwner,
  contactPublisher,
}: {
  contactMetadata: Contact | null;
  contactOwner: Contact | null;
  contactPublisher: Contact | null;
}) {
  return (
    <Card data-color="info" className={styles.card}>
      <Heading data-size={"xs"}>Ta kontakt med dataeier</Heading>
      <div className={styles.contacts}>
        <div className={styles.contact}>
          <p className={styles.contactTitle}>Metadatakontakt</p>
          <p className={styles.contactEmail}>
            <EnvelopeClosedIcon />
            {contactMetadata?.email}
          </p>
        </div>
        <div className={styles.contact}>
          <p className={styles.contactTitle}>Faglig kontakt</p>
          <p className={styles.contactEmail}>
            <EnvelopeClosedIcon />
            {contactOwner?.email}
          </p>
        </div>
        <div className={styles.contact}>
          <p className={styles.contactTitle} data-size={"xs"}>
            Teknisk kontakt
          </p>
          <p className={styles.contactEmail}>
            <EnvelopeClosedIcon />
            {contactPublisher?.email}
          </p>
        </div>
      </div>
    </Card>
  );
}
