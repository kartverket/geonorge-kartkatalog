import { configure } from '@kartverket/geonorge-web-components';

export function initializeGeonorge() {
  configure({
    kartkatalogApiUrl: process.env.API_BASE || 'https://kartkatalog.geonorge.no/api',
    kartkatalogUrl: process.env.NEXT_PUBLIC_KARTKATALOG_URL || 'https://kartkatalog.geonorge.no',
    geonorgeUrl: process.env.NEXT_PUBLIC_GEONORGE_URL || 'https://www.geonorge.no',
    nedlastingUrl: process.env.NEXT_PUBLIC_NEDLASTING_URL || 'https://nedlasting.geonorge.no'
  });
}