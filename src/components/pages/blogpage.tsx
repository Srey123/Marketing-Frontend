// src/pages/BlogDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // To get the 'id' from the URL
import { useToast } from '@/hooks/use-toast'; // For toast notifications
import { Loader2 } from 'lucide-react'; // For loading spinner

import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown
import rehypeRaw from 'rehype-raw'; // Import rehypeRaw to allow raw HTML in Markdown (if needed)

interface BlogDetails {
    id: string;
    topic: string;
    blog_content: string;
    seo_score: number | null; // Changed to allow null to explicitly show if backend sends null
    iterations: number | null; // Changed to allow null
    generated_at: string;
    user_id: string;
}

const BlogDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Get the blog ID from the URL
    const [blog, setBlog] = useState<BlogDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchBlogDetails = async () => {
            if (!id) {
                setError("No blog ID provided.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            setBlog(null);

            try {
                const response = await fetch(`http://localhost:8005/api/blogs/${id}`);
                const data = await response.json();

                // --- DEBUG LOG START ---
                console.log("[BlogDetailPage Debug] Raw API response data:", data);
                if (data && data.blog) {
                    console.log("[BlogDetailPage Debug] Blog object from API:", data.blog);
                    console.log("[BlogDetailPage Debug] SEO Score from API:", data.blog.seo_score);
                    console.log("[BlogDetailPage Debug] Iterations from API:", data.blog.iterations);
                }
                // --- DEBUG LOG END ---


                if (response.ok && data.success) {
                    setBlog(data.blog);
                    toast({
                        title: "Blog Loaded",
                        description: `"${data.blog.topic}" has been loaded.`,
                    });
                } else {
                    setError(data.message || "Failed to fetch blog details.");
                    toast({
                        title: "Error",
                        description: data.message || "Could not load blog details.",
                        variant: "destructive",
                    });
                }
            } catch (err) {
                console.error("Network error fetching blog:", err);
                setError("Network error. Could not connect to backend.");
                toast({
                    title: "Network Error",
                    description: "Failed to connect to the server.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlogDetails();
    }, [id, toast]); // Re-fetch whenever the ID in the URL changes

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
                <p className="mt-4 text-lg font-medium">Loading blog...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-red-600">
                <p className="text-xl font-semibold">Error: {error}</p>
                <p className="mt-2 text-md">Please try again or check the URL.</p>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
                <p className="text-xl font-semibold">Blog not found.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8 max-w-4xl bg-card rounded-lg shadow-lg my-8">
            <h1 className="text-4xl font-bold text-primary mb-4">{blog.topic}</h1>
            <div className="flex items-center text-sm text-muted-foreground mb-6">
                <p className="mr-4">Generated: {new Date(blog.generated_at).toLocaleString()}</p>
                {blog.seo_score !== null && <p className="mr-4">SEO Score: {blog.seo_score}</p>}
                {blog.iterations !== null && <p>Iterations: {blog.iterations}</p>}
            </div>
            {/* Replaced dangerouslySetInnerHTML with ReactMarkdown for proper Markdown rendering */}
            <div className="prose prose-lg max-w-none mb-8 text-foreground enhanced-markdown-content">
                <style>{`
                    /* Ensure 'Inter' font is available or linked globally for best results */
                    body {
                        font-family: 'Inter', sans-serif;
                    }

                    /* Styles specific to markdown content within this CardContent */
                    .enhanced-markdown-content h1,
                    .enhanced-markdown-content h2,
                    .enhanced-markdown-content h3,
                    .enhanced-markdown-content h4,
                    .enhanced-markdown-content h5,
                    .enhanced-markdown-content h6 {
                        font-family: 'Inter', sans-serif; /* Consistent font for all headings */
                        color: #2d3748; /* Dark text for all headings */
                        margin-top: 2.5rem; /* More space above headings */
                        margin-bottom: 1.2rem; /* Clear space below headings */
                        line-height: 1.2;
                        padding-bottom: 0.5em; /* Space for border */
                        border-bottom: 1px solid #e2e8f0; /* Light border for separation */
                        position: relative; /* For potential future embellishments */
                        font-weight: 700; /* All section headings will be bold */
                        font-size: 1.8em; /* All section headings will be h3-like size */
                    }

                    .enhanced-markdown-content p {
                        margin-bottom: 1.8rem; /* Significant space between paragraphs to act as sections */
                        line-height: 1.8; /* Improved readability for body text */
                        color: #4a5568; /* Slightly softer paragraph text for contrast */
                        font-size: 1.05rem; /* Slightly larger body text */
                    }

                    .enhanced-markdown-content a {
                        color: #4c51bf; /* Vibrant link color */
                        text-decoration: underline;
                        transition: color 0.2s ease-in-out;
                        font-weight: 500;
                    }

                    .enhanced-markdown-content a:hover {
                        color: #6b46c1; /* Darker hover color */
                    }

                    .enhanced-markdown-content ul,
                    .enhanced-markdown-content ol {
                        margin-bottom: 1.8rem; /* Consistent spacing for lists */
                        padding-left: 1.8em;
                        color: #4a5568;
                        font-size: 1.05rem;
                    }

                    .enhanced-markdown-content li {
                        margin-bottom: 0.6rem;
                        line-height: 1.7;
                    }

                    .enhanced-markdown-content blockquote {
                        border-left: 5px solid #6366f1; /* More prominent border */
                        padding-left: 1.5em;
                        margin: 2rem 0; /* More vertical margin */
                        color: #6a768f;
                        font-style: italic;
                        background-color: #f8f8fa; /* Light background for blockquotes */
                        padding-top: 1em;
                        padding-bottom: 1em;
                        border-radius: 0.3em;
                    }

                    .enhanced-markdown-content code {
                        background-color: #edf2f7; /* Light background for inline code */
                        padding: 0.2em 0.4em;
                        border-radius: 0.3em;
                        font-family: 'Fira Mono', 'Consolas', monospace; /* Monospaced font for code */
                        font-size: 0.9em;
                        color: #3182ce; /* Blue color for inline code */
                    }

                    .enhanced-markdown-content pre {
                        background-color: #2d3748; /* Dark background for code blocks */
                        color: #e2e8f0;
                        padding: 1.2em;
                        border-radius: 0.5em;
                        overflow-x: auto; /* Ensure code blocks are scrollable */
                        margin-top: 2rem;
                        margin-bottom: 2rem;
                        font-family: 'Fira Mono', 'Consolas', monospace;
                        font-size: 0.95em;
                    }
                `}</style>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        // Render all H1 and H2 markdown as H3 HTML elements
                        h1: ({ node, ...props }) => <h3 {...props} />,
                        h2: ({ node, ...props }) => <h3 {...props} />,
                        // Other headings (h3, h4, h5, h6) will naturally be rendered as h3
                        // due to the general CSS selector above, applying the desired styling.
                    }}
                >
                    {blog.blog_content}
                </ReactMarkdown>
            </div>

            {/* Optional: Add more actions here, e.g., an "Edit" button, "Share" button */}
        </div>
    );
};

export default BlogDetailPage;
