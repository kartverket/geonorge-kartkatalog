import Link from "next/link";
import type { Metadata } from "next";
import getData from "../../../mocks/getData.json";
import styles from "./page.module.css";

type Props = { params: Promise<{ uuid: string }> };

export const metadata: Metadata = {
  title: `${getData.Title} · Geonorge`,
  description: getData.Abstract.slice(0, 160),
};

const formatDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("nb-NO", { dateStyle: "long" }) : "-";

export default async function DatasetPage({ params }: Props) {
  const { uuid } = await params;
  const d = getData;

  const thumb =
    d.Thumbnails.find((t) => t.Type === "medium")?.URL ?? d.Thumbnails[0]?.URL;

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Tilbake til søk
      </Link>

      <header className={styles.header}>
        {thumb && <img src={thumb} alt="" className={styles.thumb} />}
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>
            {d.Organization} · {d.TypeTranslated}
          </p>
          <h1 className={styles.title}>{d.Title}</h1>
          {d.EnglishTitle && d.EnglishTitle !== d.Title && (
            <p className={styles.subtitle}>{d.EnglishTitle}</p>
          )}
          <span className={styles.badge}>{d.DataAccess}</span>
        </div>
      </header>

      <section className={styles.section}>
        <h2>Beskrivelse</h2>
        <p className={styles.abstract}>{d.Abstract}</p>
      </section>

      <section className={styles.section}>
        <h2>Nøkkelinformasjon</h2>
        <dl className={styles.facts}>
          <div>
            <dt>UUID</dt>
            <dd>
              <code>{uuid}</code>
            </dd>
          </div>
          <div>
            <dt>Tema</dt>
            <dd>{d.TopicCategory}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{d.Status}</dd>
          </div>
          <div>
            <dt>Oppdateringsfrekvens</dt>
            <dd>{d.MaintenanceFrequency}</dd>
          </div>
          <div>
            <dt>Målestokk</dt>
            <dd>1:{d.ResolutionScale}</dd>
          </div>
          <div>
            <dt>Romlig omfang</dt>
            <dd>{d.SpatialScope}</dd>
          </div>
          <div>
            <dt>Språk</dt>
            <dd>{d.DatasetLanguage}</dd>
          </div>
          <div>
            <dt>Publisert</dt>
            <dd>{formatDate(d.DatePublished)}</dd>
          </div>
          <div>
            <dt>Sist oppdatert</dt>
            <dd>{formatDate(d.DateUpdated)}</dd>
          </div>
          <div>
            <dt>Metadata oppdatert</dt>
            <dd>{formatDate(d.DateMetadataUpdated)}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.section}>
        <h2>Nedlasting og distribusjon</h2>
        {d.DistributionFormatsGrouped.map((group) => (
          <div key={group.Protocol} className={styles.distGroup}>
            <h3>{group.ProtocolName}</h3>
            <p className={styles.muted}>{group.ProtocolDescription}</p>
            <ul className={styles.tagList}>
              {group.Formats.map((f) => (
                <li key={f.FormatName} className={styles.tag}>
                  {f.FormatName}
                </li>
              ))}
            </ul>
            <ul className={styles.linkList}>
              {group.URL.map((u) => (
                <li key={u}>
                  <a
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {u}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {d.Distributions?.RelatedViewServices?.length > 0 && (
        <section className={styles.section}>
          <h2>Relaterte tjenester</h2>
          <ul className={styles.services}>
            {d.Distributions.RelatedViewServices.map((s) => (
              <li key={s.Uuid} className={styles.serviceItem}>
                <a
                  href={s.GetCapabilitiesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.Title}
                </a>
                <span className={styles.badge}>{s.Protocol}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <h2>Nøkkelord</h2>
        <ul className={styles.tagList}>
          {d.KeywordsTheme.map((k) => (
            <li key={k.KeywordValue} className={styles.tag}>
              {k.KeywordValue}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Bruksbetingelser</h2>
        <dl className={styles.facts}>
          <div>
            <dt>Tilgang</dt>
            <dd>{d.Constraints.AccessConstraints}</dd>
          </div>
          <div>
            <dt>Sikkerhet</dt>
            <dd>{d.Constraints.SecurityConstraints}</dd>
          </div>
          <div>
            <dt>Bruk</dt>
            <dd>{d.Constraints.UseConstraints}</dd>
          </div>
          <div>
            <dt>Lisens</dt>
            <dd>
              <a
                href={d.Constraints.OtherConstraintsLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {d.Constraints.OtherConstraintsLinkText}
              </a>
            </dd>
          </div>
          <div>
            <dt>Bruksbegrensninger</dt>
            <dd>{d.Constraints.UseLimitations}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.section}>
        <h2>Kontakt</h2>
        <p>
          {d.ContactOwner.Name} ({d.ContactOwner.Organization}) ·{" "}
          <a href={`mailto:${d.ContactOwner.Email}`}>{d.ContactOwner.Email}</a>
        </p>
      </section>

      <section className={styles.section}>
        <h2>Metadata og dokumentasjon</h2>
        <ul className={styles.linkList}>
          <li>
            <a
              href={d.MetadataXmlUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Metadata som XML
            </a>
          </li>
          <li>
            <a
              href={d.ProductSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Produktark
            </a>
          </li>
          <li>
            <a
              href={d.ProductSpecificationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Produktspesifikasjon
            </a>
          </li>
          {d.LegendDescriptionUrl && (
            <li>
              <a
                href={d.LegendDescriptionUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Tegneregler
              </a>
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
