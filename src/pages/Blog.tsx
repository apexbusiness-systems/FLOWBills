import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/ui/footer";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Calendar, Clock, Tag } from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  url: string;
  title: string;
  publicationDate: string;
  keywords: string[];
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const response = await fetch("/sitemap-news.xml");
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");

      const urlElements = xml.getElementsByTagName("url");
      const postsData: BlogPost[] = [];

      for (let i = 0; i < urlElements.length; i++) {
        const urlElement = urlElements[i];
        const loc = urlElement.getElementsByTagName("loc")[0]?.textContent;
        const newsElement = urlElement.getElementsByTagNameNS(
          "http://www.google.com/schemas/sitemap-news/0.9",
          "news"
        )[0];

        if (newsElement && loc) {
          const title =
            newsElement.getElementsByTagNameNS(
              "http://www.google.com/schemas/sitemap-news/0.9",
              "title"
            )[0]?.textContent || "";
          const publicationDate =
            newsElement.getElementsByTagNameNS(
              "http://www.google.com/schemas/sitemap-news/0.9",
              "publication_date"
            )[0]?.textContent || "";
          const keywordsText =
            newsElement.getElementsByTagNameNS(
              "http://www.google.com/schemas/sitemap-news/0.9",
              "keywords"
            )[0]?.textContent || "";
          const keywords = keywordsText
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);

          postsData.push({
            url: loc,
            title,
            publicationDate,
            keywords,
          });
        }
      }

      // Sort by date, newest first
      postsData.sort(
        (a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
      );

      setPosts(postsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      setLoading(false);
    }
  };

  // Generate schema.org Article markup
  useEffect(() => {
    if (posts.length === 0) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "FlowBills Blog",
      description:
        "Latest insights on invoice automation, AI, and accounts payable best practices for oil & gas",
      url: "https://flowbills.ca/blog",
      blogPost: posts.map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        url: post.url,
        datePublished: post.publicationDate,
        author: {
          "@type": "Organization",
          name: "FlowBills",
        },
        publisher: {
          "@type": "Organization",
          name: "FlowBills",
          logo: {
            "@type": "ImageObject",
            url: "https://flowbills.ca/icons/og-image.png",
          },
        },
        keywords: post.keywords.join(", "),
      })),
    };

    let schemaScript = document.getElementById("blog-schema") as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement("script") as HTMLScriptElement;
      schemaScript.id = "blog-schema";
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schema);

    return () => {
      const script = document.getElementById("blog-schema");
      if (script) {
        script.remove();
      }
    };
  }, [posts]);

  const getSlugFromUrl = (url: string): string => {
    const parts = url.split("/");
    return parts[parts.length - 1] || "blog-post";
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const calculateReadTime = (title: string): number => {
    // Estimate: average blog post ~800 words, 200 words/min
    return Math.ceil(800 / 200);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <BreadcrumbNav className="mb-4" />

        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
            <p className="text-xl text-muted-foreground">
              Latest insights on invoice automation, AI, and accounts payable best practices for the
              oil & gas industry
            </p>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No blog posts available yet. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <time dateTime={post.publicationDate}>
                        {formatDate(post.publicationDate)}
                      </time>
                      <span className="mx-2">•</span>
                      <Clock className="h-4 w-4" />
                      <span>{calculateReadTime(post.title)} min read</span>
                    </div>
                    <CardTitle className="text-2xl mb-2 hover:text-primary transition-colors">
                      <a href={post.url}>{post.title}</a>
                    </CardTitle>
                    <CardDescription className="text-base">
                      Read about the latest developments and insights from FlowBills
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.keywords.slice(0, 5).map((keyword, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          <Tag className="h-3 w-3" />
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" asChild>
                      <a href={post.url}>Read Article</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {posts.length > 0 && (
            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground">
                Showing {posts.length} {posts.length === 1 ? "post" : "posts"}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
