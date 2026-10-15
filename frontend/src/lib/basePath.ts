// setter basepath dersom den finnes i env
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const bffPath = `${basePath}/bff`;

// Brukes for å skjule brødsmulesti ev. annet som dukker opp
export const isBeta = basePath === "/beta";
