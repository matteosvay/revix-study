import { Helmet } from "react-helmet-async";

const SITE_URL = "https://revix-study.lovable.app";
const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/a61684b8-0df9-4f28-919e-f358fcaf2cc8";

interface PageHeadProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  /** Set true to ask crawlers not to index this page. */
  noindex?: boolean;
  /** Optional JSON-LD blocks (already-serializable objects). */
  jsonLd?: Array<Record<string, unknown>>;
}

/**
 * Per-route head tags. Title/desc/canonical/og:* are unique per page so
 * Google and AI crawlers stop seeing duplicate metadata across routes.
 */
export function PageHead({
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd = [],
}: PageHeadProps) {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}