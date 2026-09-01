import { Button, Card, Heading, Paragraph, Tag } from "@kv-designsystem/react";
import {
  ExternalLinkIcon,
  FileTextIcon,
  PencilBoardIcon,
  TasklistStartIcon,
} from "@navikt/aksel-icons";
import { formatDate } from "@/app/metadata/[uuid]/_utils/utils";
import type { ProduktarkItem } from "@/lib/schemas/produktark";
import type { ProduktspesifikasjonItem } from "@/lib/schemas/produktspesifikasjon";
import type { TegnereglerItem } from "@/lib/schemas/tegneregler";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./ProductDocumentation.module.css";

type ProductDocumentationProps = {
  tegneregler: TegnereglerItem | null;
  produktark: ProduktarkItem | null;
  produktspesifikasjon: ProduktspesifikasjonItem | null;
};

type DocumentationAction = {
  label: string;
  url: string;
};

type DocumentationCardBase = {
  title: string;
  status?: string | null;
  paragraph: string;
  icon: React.ReactNode;
  dateSubmitted?: string | null;
};

type ActionDocumentationCard = DocumentationCardBase & {
  kind: "actions";
  actions: DocumentationAction[];
};

type DocumentationCard = ActionDocumentationCard;

type ActionCardConfig = Omit<ActionDocumentationCard, "kind" | "actions"> & {
  actions: Array<DocumentationAction | null>;
};

const TEGNEREGLER_DESCRIPTION =
  "Tegneregler forklarer hvordan dataene skal visualiseres i kart, inkludert symboler, farger og utforming.";

const PRODUKTARK_DESCRIPTION =
  "Produktark gir en kortfattet oversikt over datasettets innhold, bruksområde og viktige egenskaper.";

const PRODUCT_SPECIFICATION_DESCRIPTION =
  "Produktspesifikasjon beskriver i detalje struktur, krav og innhold i datasettet, inkludert standarder og kvalitetskrav.";

export function ProductDocumentation({
  tegneregler,
  produktark,
  produktspesifikasjon,
}: ProductDocumentationProps) {
  const cards = [
    createTegnereglerCard(tegneregler),
    createProduktarkCard(produktark),
    createProduktspesifikasjonCard(produktspesifikasjon),
  ].filter(isDefined);

  return (
    <div className={styles.cardWrapper}>
      {cards.map((card) => (
        <DocumentationCard key={card.title} card={card} />
      ))}
    </div>
  );
}

function DocumentationCard({ card }: { card: DocumentationCard }) {
  return (
    <Card data-color="neutral" className={styles.card}>
      <div className={styles.cardBody}>
        <DocumentationCardBody card={card} />
      </div>
    </Card>
  );
}

function DocumentationCardBody({ card }: { card: DocumentationCard }) {
  return (
    <>
      <div className={styles.tagGroup}>
        {card.icon}
        <StatusTag status={card.status} />
      </div>
      <Heading data-size="md">{card.title}</Heading>
      <Paragraph data-size="md">{card.paragraph}</Paragraph>
      <div className={styles.cardButtonRow}>
        {card.actions.map((action, index) => (
          <Button
            key={action.label}
            asChild
            variant={index === 0 ? "primary" : "secondary"}
            data-color="neutral"
            className={styles.cardButton}
          >
            <a
              target="_blank"
              rel="noreferrer"
              href={action.url}
              onClick={() =>
                trackClick(
                  "open-documentation-card-link",
                  LOCATIONS.MetadataPageTabs,
                  {
                    cardTitle: card.title,
                    linkLabel: action.label,
                  },
                )
              }
            >
              <span className={styles.cardButtonContent}>
                <ExternalLinkIcon aria-hidden />
                <span>{action.label}</span>
              </span>
            </a>
          </Button>
        ))}
      </div>
      <Paragraph data-size="sm" className={styles.dateText}>
        {card.dateSubmitted
          ? `Dato publisert: ${formatDate(card.dateSubmitted)}`
          : null}
      </Paragraph>
    </>
  );
}

function StatusTag({ status }: { status?: string | null }) {
  if (!status) {
    return null;
  }

  return (
    <Tag
      data-color={
        status.toLocaleLowerCase() === "gyldig" ||
        status.toLocaleLowerCase() === "sosi godkjent"
          ? "accent"
          : "warning"
      }
      data-size="sm"
    >
      {status}
    </Tag>
  );
}

function createTegnereglerCard(
  tegneregler: TegnereglerItem | null,
): ActionDocumentationCard | null {
  return createActionCard({
    title: "Tegneregler",
    status: tegneregler?.status,
    paragraph: TEGNEREGLER_DESCRIPTION,
    icon: <PencilBoardIcon aria-hidden className={styles.icon} />,
    dateSubmitted: tegneregler?.dateSubmitted,
    actions: [
      createAction("Vis tegneregler", tegneregler?.documentreference),
      createAction("Vis digital kartografi", tegneregler?.cartographyFile),
      createAction("Se flere versjoner", tegneregler?.id),
    ],
  });
}

function createProduktarkCard(
  produktark: ProduktarkItem | null,
): ActionDocumentationCard | null {
  return createActionCard({
    title: "Produktark",
    status: produktark?.status,
    paragraph: PRODUKTARK_DESCRIPTION,
    icon: <FileTextIcon aria-hidden className={styles.icon} />,
    dateSubmitted: produktark?.dateSubmitted,
    actions: [
      createAction("Vis produktark", produktark?.documentreference),
      createAction("Se flere versjoner", produktark?.id),
    ],
  });
}

function createProduktspesifikasjonCard(
  produktspesifikasjon: ProduktspesifikasjonItem | null,
): ActionDocumentationCard | null {
  return createActionCard({
    title: "Produktspesifikasjon",
    status: produktspesifikasjon?.status,
    paragraph: PRODUCT_SPECIFICATION_DESCRIPTION,
    icon: <TasklistStartIcon aria-hidden className={styles.icon} />,
    dateSubmitted: produktspesifikasjon?.dateSubmitted,
    actions: [
      createAction(
        "Vis produktspesifikasjon",
        produktspesifikasjon?.documentreference,
      ),
      createAction("Vis datamodell", produktspesifikasjon?.applicationSchema),
      createAction(
        "Vis GML-skjema",
        produktspesifikasjon?.gmlApplicationSchema,
      ),
      createAction("Se flere versjoner", produktspesifikasjon?.id ?? null),
    ],
  });
}

function createAction(
  label: string,
  url?: string | null,
): DocumentationAction | null {
  if (!url) {
    return null;
  }

  return { label, url };
}

function createActionCard({
  actions,
  ...card
}: ActionCardConfig): ActionDocumentationCard | null {
  const definedActions = createActions(actions);

  if (definedActions.length === 0) {
    return null;
  }

  return {
    kind: "actions",
    ...card,
    actions: definedActions,
  };
}

function createActions(
  actions: Array<DocumentationAction | null>,
): DocumentationAction[] {
  return actions.filter(isDefined);
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}
