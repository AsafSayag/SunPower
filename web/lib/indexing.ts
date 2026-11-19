// Search engines are blocked everywhere unless SITE_INDEXABLE=true is set.
// Set it only on the live sun-power.co.il deployment, never on a test environment.
export const INDEXABLE = process.env.SITE_INDEXABLE === "true";
