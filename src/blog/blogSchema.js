// Build JSON-LD structured data for a blog post, used client-side via SEOHead.
// The server injects the same schema into the initial HTML for crawlers; this
// keeps it correct during client-side SPA navigation too.

const SITE = "https://automationpaths.com";

export function buildPostSchema(post) {
  if (!post) return [];
  const url = post.canonical_url || `${SITE}/blog/${post.slug}`;
  const image = post.og_image || post.featured_image || `${SITE}/og-default.svg`;

  const sameAs = [post.author_linkedin, post.author_twitter, post.author_url].filter(Boolean);
  const author = {
    "@type": "Person",
    name: post.author_name || "Riazul Islam",
    url: post.author_url || SITE,
  };
  if (post.author_title) author.jobTitle = post.author_title;
  if (post.author_bio) author.description = post.author_bio;
  if (post.author_credentials) author.knowsAbout = post.author_credentials;
  if (post.author_avatar) author.image = post.author_avatar;
  if (sameAs.length) author.sameAs = sameAs;

  const article = {
    "@context": "https://schema.org",
    "@type": post.schema_type || "BlogPosting",
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || "",
    image: [image],
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author,
    publisher: {
      "@type": "Organization",
      name: "Automation Paths",
      logo: { "@type": "ImageObject", url: `${SITE}/favicon.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
  if (post.keywords || post.focus_keyword) article.keywords = post.keywords || post.focus_keyword;
  if (post.word_count) article.wordCount = post.word_count;

  const breadcrumbItems = [
    { name: "Home", item: SITE },
    { name: "Blog", item: `${SITE}/blog` },
  ];
  if (post.category?.name) {
    breadcrumbItems.push({ name: post.category.name, item: `${SITE}/blog/category/${post.category.slug}` });
  }
  breadcrumbItems.push({ name: post.title, item: url });

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  };

  return [article, breadcrumb];
}
