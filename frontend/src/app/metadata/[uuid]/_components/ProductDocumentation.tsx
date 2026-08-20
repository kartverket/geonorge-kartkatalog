import { Card, Heading, Paragraph, Tag } from "@kv-designsystem/react";
import {
  FileTextIcon,
  PencilBoardIcon,
  TasklistStartIcon,
} from "@navikt/aksel-icons";
import { formatDate } from "@/app/metadata/[uuid]/_utils/utils";
import type { TegnereglerItem } from "@/lib/schemas/tegneregler";
import styles from "./ProductDocumentation.module.css";

type DocumentationCard = {
  title: string;
  status?: string | null;
  paragraph: string;
  icon: React.ReactNode;
  url?: string;
  dateSubmitted?: string | null;
};

export function ProductDocumentation({
  tegneregler,
  productSpecificationUrl,
}: {
  tegneregler: TegnereglerItem | null;
  productSpecificationUrl?: string | null;
}) {
  const cardContent: DocumentationCard[] = [
    ...(tegneregler?.documentreference
      ? [
          {
            title: "Tegneregler",
            status: tegneregler.status,
            paragraph:
              "Tegneregler forklarer hvordan dataene skal visualiseres i kart, inkludert symboler, farger og utforming.",
            icon: <PencilBoardIcon aria-hidden className={styles.icon} />,
            url: tegneregler?.documentreference,
            dateSubmitted: tegneregler?.dateSubmitted,
          },
        ]
      : []),

    {
      title: "Produktark",
      paragraph:
        "Produktark gir en kortfattet oversikt over datasettets innhold, bruksområde og viktige egenskaper.",
      icon: <FileTextIcon aria-hidden className={styles.icon} />,
    },

    ...(productSpecificationUrl
      ? [
          {
            title: "Produktspesifikasjon",
            paragraph:
              "Produktspesifikasjon beskriver i detalje struktur, krav og innhold i datasettet, inkludert standarder og kvalitetskrav.",
            icon: <TasklistStartIcon aria-hidden className={styles.icon} />,
            url: productSpecificationUrl,
          },
        ]
      : []),
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
    status?: string | null;
    paragraph: string;
    icon: React.ReactNode;
    url?: string;
    dateSubmitted?: string | null;
  };
}) {
  return (
    <Card asChild data-color="neutral" className={styles.card}>
      <a target="_blank" rel="noreferrer" href={content.url}>
        <div className={styles.tagGroup}>
          {content.icon}
          {content.status ? (
            <Tag
              data-color={
                content.status.toLocaleLowerCase() === "gyldig"
                  ? "accent"
                  : "warning"
              }
              data-size="sm"
            >
              {content.status}
            </Tag>
          ) : null}
        </div>
        <Heading data-size="md">{content.title}</Heading>
        <Paragraph data-size="md">{content.paragraph}</Paragraph>
        <Paragraph data-size="sm">
          {content.dateSubmitted
            ? `Dato publisert: ${formatDate(content.dateSubmitted)}`
            : null}
        </Paragraph>
      </a>
    </Card>
  );
}
