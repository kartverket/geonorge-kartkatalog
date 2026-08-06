import { Card, Heading, Paragraph, Tag } from "@kv-designsystem/react";
import {
  FileTextIcon,
  PencilBoardIcon,
  TasklistStartIcon,
} from "@navikt/aksel-icons";
import styles from "./ProductDocumentation.module.css";

type DocumentationCard = {
  title: string;
  paragraph: string;
  icon: React.ReactNode;
  url?: string;
};

export function ProductDocumentation({
  cartographySheetUrl,
}: {
  cartographySheetUrl: string | null;
}) {
  const cardContent: DocumentationCard[] = [
    ...(cartographySheetUrl
      ? [
          {
            title: "Tegneregler",
            paragraph:
              "Tegneregler forklarer hvordan dataene skal visualiseres i kart, inkludert symboler, farger og utforming.",
            icon: <PencilBoardIcon aria-hidden className={styles.icon} />,
            url: cartographySheetUrl,
          },
        ]
      : []),

    {
      title: "Produktark",
      paragraph:
        "Produktark gir en kortfattet oversikt over datasettets innhold, bruksområde og viktige egenskaper.",
      icon: <FileTextIcon aria-hidden className={styles.icon} />,
    },

    {
      title: "Produktspesifikasjon",
      paragraph:
        "Produktspesifikasjon beskriver i detalje struktur, krav og innhold i datasettet, inkludert standarder og kvalitetskrav.",
      icon: <TasklistStartIcon aria-hidden className={styles.icon} />,
    },
  ];

  return (
    <div className={styles.cardWrapper}>
      {cardContent.map((card) => (
        <ButtonCard key={card.title} content={card} />
      ))}
    </div>
  );
}

function ButtonCard({
  content,
}: {
  content: {
    title: string;
    paragraph: string;
    icon: React.ReactNode;
    url?: string;
  };
}) {
  return (
    <Card asChild data-color="neutral" className={styles.card}>
      <a target="_blank" rel="noreferrer" href={content.url}>
        <div className={styles.tagGroup}>
          {content.icon}
          <Tag data-color="accent" data-size="sm">
            Gyldig
          </Tag>
        </div>
        <Heading data-size="md">{content.title}</Heading>
        <Paragraph data-size="md">{content.paragraph}</Paragraph>
        <Paragraph data-size="sm">Dato publisert</Paragraph>
      </a>
    </Card>
  );
}
