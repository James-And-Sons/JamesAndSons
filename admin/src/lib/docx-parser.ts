import mammoth from "mammoth";
import TurndownService from "turndown";

export interface ParsedFaqItem {
  q: string;
  a: string;
}

export interface ParsedCitationItem {
  label: string;
  url: string;
}

export interface ParsedBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDesc: string;
  geoTakeaway: string | null;
  featuredImg: string | null;
  faq: ParsedFaqItem[];
  citations: ParsedCitationItem[];
  isDraft: boolean;
}

function createTurndownService() {
  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    strongDelimiter: "**",
  });

  // Preserve product shortcodes like [product:slug] or [product:12-light-black-chandelier-jc03]
  turndownService.addRule("productShortcode", {
    filter: (node) => {
      const text = node.textContent || "";
      return /^\[product:[\w-]+\]$/i.test(text.trim());
    },
    replacement: (content) => `\n\n${content.trim()}\n\n`,
  });

  // Preserve image tags with proper markdown syntax
  turndownService.addRule("imagesWithCap", {
    filter: "img",
    replacement: (content, node: any) => {
      const alt = node.getAttribute("alt") || "";
      const src = node.getAttribute("src") || "";
      const title = node.getAttribute("title") || "";
      const titleSuffix = title ? ` "${title}"` : "";
      return `![${alt}](${src}${titleSuffix})`;
    },
  });

  return turndownService;
}

export async function parseDocxToBlogPost(
  buffer: Buffer,
): Promise<ParsedBlogPost> {
  const turndownService = createTurndownService();

  // Extract raw text for clean metadata regex scanning
  const rawTextResult = await mammoth.extractRawText({ buffer });
  const rawText = rawTextResult.value || "";

  // Extract HTML for body content conversion
  const htmlResult = await mammoth.convertToHtml({ buffer });
  const rawHtml = htmlResult.value || "";

  // Convert HTML to GFM Markdown
  let fullMarkdown = turndownService.turndown(rawHtml);

  // Helper regex to extract metadata fields from top of document or key-value format
  const extractField = (pattern: RegExp): string | null => {
    const match = rawText.match(pattern);
    return match && match[1] ? match[1].trim() : null;
  };

  const titleField = extractField(/(?:Title|Heading)\s*:\s*(.+)/i);
  const slugField = extractField(/Slug\s*:\s*(.+)/i);
  const metaTitleField = extractField(/Meta\s*Title\s*:\s*(.+)/i);
  const metaDescField = extractField(/Meta\s*(?:Desc|Description)\s*:\s*(.+)/i);
  const excerptField = extractField(/(?:Excerpt|Summary)\s*:\s*(.+)/i);
  const featuredImgField = extractField(
    /(?:Featured\s*Img|Featured\s*Image|Banner)\s*:\s*(.+)/i,
  );
  const geoTakeawayField = extractField(
    /(?:Geo\s*Takeaway|Geographic\s*Takeaway|Geo\s*Summary)\s*:\s*(.+)/i,
  );
  const statusField = extractField(/(?:Status|Is\s*Draft)\s*:\s*(.+)/i);

  // Parse FAQs
  const faq: ParsedFaqItem[] = [];
  const faqBlockMatch = rawText.match(
    /(?:FAQ|Frequently\s*Asked\s*Questions)\s*:?\s*([\s\S]*?)(?=\n\s*(?:Citations|References|Sources)\s*:?|\n\s*(?:Title|Slug|Meta)|\n\s*$)/i,
  );

  if (faqBlockMatch && faqBlockMatch[1]) {
    const faqText = faqBlockMatch[1];
    // Pattern 1: Q: ... A: ...
    const qAndAPairs = [
      ...faqText.matchAll(
        /(?:Q|Question)\s*:\s*([\s\S]+?)\n\s*(?:A|Answer)\s*:\s*([\s\S]+?)(?=(?:\n\s*(?:Q|Question)\s*:)|$)/gi,
      ),
    ];
    for (const match of qAndAPairs) {
      if (match[1] && match[2]) {
        faq.push({
          q: match[1].trim().replace(/\r?\n|\r/g, " "),
          a: match[2].trim().replace(/\r?\n|\r/g, " "),
        });
      }
    }
  }

  // Parse Citations
  const citations: ParsedCitationItem[] = [];
  const citationsBlockMatch = rawText.match(
    /(?:Citations|References|Sources)\s*:?\s*([\s\S]*?)(?=\n\s*(?:Title|Slug|Meta)|\n\s*$)/i,
  );
  if (citationsBlockMatch && citationsBlockMatch[1]) {
    const citationsText = citationsBlockMatch[1];
    const lines = citationsText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    for (const line of lines) {
      // Formats: "Label | URL" or "[Label](URL)" or "Label: URL"
      const mdLinkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
      const pipeMatch = line.match(/(.*?)\s*\|\s*(https?:\/\/\S+)/);
      const colonMatch = line.match(/(.*?)\s*:\s*(https?:\/\/\S+)/);

      if (mdLinkMatch) {
        citations.push({
          label: mdLinkMatch[1].trim(),
          url: mdLinkMatch[2].trim(),
        });
      } else if (pipeMatch) {
        citations.push({
          label: pipeMatch[1].trim(),
          url: pipeMatch[2].trim(),
        });
      } else if (colonMatch) {
        citations.push({
          label: colonMatch[1].trim(),
          url: colonMatch[2].trim(),
        });
      } else if (line.startsWith("http://") || line.startsWith("https://")) {
        citations.push({ label: "Reference Source", url: line.trim() });
      }
    }
  }

  // Clean Markdown content by removing metadata key-value header lines
  let bodyContent = fullMarkdown
    .replace(/^Title\s*:\s*.+$/gim, "")
    .replace(/^Slug\s*:\s*.+$/gim, "")
    .replace(/^Meta\s*Title\s*:\s*.+$/gim, "")
    .replace(/^Meta\s*(?:Desc|Description)\s*:\s*.+$/gim, "")
    .replace(/^(?:Excerpt|Summary)\s*:\s*.+$/gim, "")
    .replace(/^(?:Featured\s*Img|Featured\s*Image|Banner)\s*:\s*.+$/gim, "")
    .replace(
      /^(?:Geo\s*Takeaway|Geographic\s*Takeaway|Geo\s*Summary)\s*:\s*.+$/gim,
      "",
    )
    .replace(/^(?:Status|Is\s*Draft)\s*:\s*.+$/gim, "")
    .trim();

  // Determine Title: from titleField, or first # H1 in body, or first line of rawText
  let title = titleField;
  if (!title) {
    const h1Match = bodyContent.match(/^#\s+(.+)$/m);
    if (h1Match) {
      title = h1Match[1].trim();
      // Remove the top H1 header from body content to avoid duplication
      bodyContent = bodyContent.replace(/^#\s+.+$/m, "").trim();
    } else {
      const firstLine = rawText
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.length > 0);
      title = firstLine || "Untitled Editorial Post";
    }
  }

  // Determine Slug
  const slug =
    slugField ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  // Determine Excerpt
  const cleanBodyForExcerpt = bodyContent
    .replace(/#+\s+/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[product:.*?\]/g, "")
    .replace(/[\*\_\`]/g, "")
    .replace(/\r?\n|\r/g, " ")
    .trim();

  const excerpt =
    excerptField ||
    (cleanBodyForExcerpt.length > 180
      ? cleanBodyForExcerpt.substring(0, 177) + "..."
      : cleanBodyForExcerpt);

  // Determine Meta Title & Desc
  const metaTitle = metaTitleField || `${title} | James & Sons`;
  const metaDesc = metaDescField || excerpt;

  // Determine Featured Image
  let featuredImg = featuredImgField || null;
  if (!featuredImg) {
    const imgMatch = bodyContent.match(/!\[.*?\]\((https?:\/\/\S+?)\)/);
    if (imgMatch) {
      featuredImg = imgMatch[1];
    }
  }

  // Determine Status (isDraft)
  const isDraft = statusField
    ? statusField.toLowerCase() === "draft" ||
      statusField.toLowerCase() === "true"
    : false;

  return {
    title,
    slug,
    excerpt,
    content: bodyContent,
    metaTitle,
    metaDesc,
    geoTakeaway: geoTakeawayField || null,
    featuredImg,
    faq,
    citations,
    isDraft,
  };
}
