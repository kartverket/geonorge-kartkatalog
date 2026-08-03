"use client";
import { Card, Heading } from "@kv-designsystem/react";
import { EnvelopeClosedIcon } from "@navikt/aksel-icons";
import type { Contact } from "@/lib/schemas/product";
import styles from "./ContactInfoCard.module.css";

type ContactInfoCardProps = {
  contactMetadata: Contact | null;
  contactOwner: Contact | null;
  contactPublisher: Contact | null;
};

export function ContactInfoCard({
  contactMetadata,
  contactOwner,
  contactPublisher,
}: ContactInfoCardProps) {
  const contactRows = [
    { title: "Metadatakontakt", email: contactMetadata?.email ?? null },
    { title: "Faglig kontakt", email: contactOwner?.email ?? null },
    { title: "Teknisk kontakt", email: contactPublisher?.email ?? null },
  ];
  return (
    <Card data-color="info" className={styles.card}>
      <Heading data-size="xs">Ta kontakt med dataeier</Heading>
      <div className={styles.contacts}>
        {contactRows.map((row) => (
          <div key={row.title} className={styles.contact}>
            <p className={styles.contactTitle}>{row.title}</p>
            <p className={styles.contactEmail}>
              <EnvelopeClosedIcon aria-hidden />
              {row.email ? (
                <a href={`mailto:${row.email}`}>{row.email}</a>
              ) : (
                "-"
              )}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
