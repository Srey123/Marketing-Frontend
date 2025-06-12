"use client";

import type { BlogHistoryItem } from "@/components/auth/auth_model";
import { useAuth } from "@/components/auth/auth_model";

import { Link } from "react-router-dom";

import { BookText, ChevronDown } from "lucide-react"; // Import ChevronDown for collapse/expand indicator
import  { useMemo } from "react"; // Import useMemo for performance optimization

// Define an interface for the grouped history structure
interface GroupedBlogHistoryItem {
  topic: string;
  latestBlog: BlogHistoryItem; // The most recent blog for this topic
  allBlogs: BlogHistoryItem[]; // All blogs for this topic, sorted by generated_at DESC
}

const Sidebar = () => {
  const { isLoggedIn, blogHistory } = useAuth();

  // Memoize the grouped history to avoid re-calculating on every render
  const groupedBlogHistory: GroupedBlogHistoryItem[] = useMemo(() => {
    const groups: { [topic: string]: BlogHistoryItem[] } = {};

    // Group blogs by topic. Since blogHistory is already sorted by generated_at DESC,
    // the first item added to a group will be the latest.
    blogHistory.forEach(blog => {
      if (!groups[blog.topic]) {
        groups[blog.topic] = [];
      }
      groups[blog.topic].push(blog);
    });

    // Convert the grouped object into an array of GroupedBlogHistoryItem
    const result: GroupedBlogHistoryItem[] = Object.keys(groups).map(topic => ({
      topic: topic,
      latestBlog: groups[topic][0], // The first item is the most recent due to initial sorting
      allBlogs: groups[topic],
    }));

    // Optionally, sort the topics themselves if a specific order is desired,
    // but typically the most recent overall topics would appear first if the initial
    // blogHistory was globally sorted. We'll sort by the latestBlog's generated_at.
    result.sort((a, b) => new Date(b.latestBlog.generated_at).getTime() - new Date(a.latestBlog.generated_at).getTime());

    return result;
  }, [blogHistory]);

  return (
    <aside className="sticky top-0 h-screen w-64 bg-background border-r p-4 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <nav className="space-y-4">
          {/* --- Your site-logo.svg Image (using <img> tag) --- */}
          <div className="flex justify-center items-center py-4">
            <img
              src="/site-logo.svg"
              alt="Site Logo"
              className="h-16 w-auto"
            />
            <span className="sr-only">Site Logo</span>
          </div>
          {/* --- END SVG Image --- */}

          {/* Blog History Section */}
          {isLoggedIn && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
                My History
              </h3>
              {groupedBlogHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3 py-2">
                  No blogs saved yet. Generate one!
                </p>
              ) : (
                <ul className="space-y-1">
                  {groupedBlogHistory.map((group) => (
                    <li key={group.topic}> {/* Key by topic */}
                      {/* Use <details> and <summary> for collapsible behavior */}
                      <details className="group">
                        <summary className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 ease-in-out bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200">
                          <span className="font-medium truncate flex-grow flex items-center">
                            {/* Display SEO score and topic for the latest blog in the group */}
                            {group.latestBlog.seo_score !== undefined && group.latestBlog.seo_score !== null ? (
                              <span className="text-xs font-semibold text-green-600 mr-1.5 min-w-[30px] text-right">
                                ({group.latestBlog.seo_score.toFixed(1)})
                              </span>
                            ) : null}
                            <BookText className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                            <span className="flex-grow">{group.topic}</span>
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 transform transition-transform duration-200 group-open:rotate-180" />
                        </summary>
                        <div className="pl-6 pr-2 py-1 space-y-1 bg-white border-l border-b border-r rounded-b-lg">
                          {/* List all blogs under this topic, skipping the first one as it's in the summary */}
                          {group.allBlogs.map((blog,) => (
                            <Link
                              key={blog.id} // Key by individual blog ID
                              to={`/dashboard/blog/${blog.id}`}
                              className="w-full flex items-center justify-start px-3 py-2 text-sm text-gray-600 hover:text-blue-700 hover:bg-gray-50 transition-colors duration-200 rounded-md" // Professional link styling
                              title={`${blog.topic} (Generated: ${new Date(blog.generated_at).toLocaleDateString()})`}
                            >
                              <span className="mr-2 h-4 w-4" /> {/* Spacer for alignment */}
                              {blog.seo_score !== undefined && blog.seo_score !== null ? (
                                <span className="text-xs font-semibold text-gray-600 mr-1.5 min-w-[30px] text-right">
                                  ({blog.seo_score.toFixed(1)})
                                </span>
                              ) : null}
                              <span className="flex-grow font-medium">
                                {new Date(blog.generated_at).toLocaleDateString()}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
