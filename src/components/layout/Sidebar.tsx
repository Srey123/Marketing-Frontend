"use client";

import type { BlogHistoryItem } from "@/components/auth/auth_model";
import { useAuth } from "@/components/auth/auth_model";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BookText } from "lucide-react";

const Sidebar = () => {
  const { isLoggedIn, blogHistory } = useAuth();

  return (
    <aside className="sticky top-0 h-screen w-64 bg-background border-r p-4 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <nav className="space-y-4">
          {/* --- Your site-logo.svg Image (using <img> tag) --- */}
          <div className="flex justify-center items-center py-4">
            <img src="/site-logo.svg" alt="Site Logo" />
            <span className="sr-only">Site Logo</span>
          </div>
          {/* --- END SVG Image --- */}

          {/* Blog History Section */}
          {isLoggedIn && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
                My History
              </h3>
              {blogHistory.length > 0 ? (
                <ul className="space-y-1">
                  {blogHistory.map((blog: BlogHistoryItem) => (
                    <li key={blog.id}>
                      <Link
                        to={`/dashboard/blog/${blog.id}`}
                        className={cn(
                          buttonVariants({ variant: "ghost" }),
                          "w-full justify-start text-left items-center px-3 py-2 text-sm overflow-hidden whitespace-nowrap text-ellipsis group"
                        )}
                        title={blog.topic}
                      >
                        <BookText className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                        {/* Display SEO score before topic with parentheses */}
                        {blog.seo_score !== undefined && blog.seo_score !== null ? (
                          <span className="text-xs font-semibold text-green-600 mr-1.5 min-w-[30px] text-right">
                            ({blog.seo_score.toFixed(1)})
                          </span>
                        ) : null}
                        <span className="flex-grow">{blog.topic}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground px-3 py-2">
                  No blogs saved yet. Generate one!
                </p>
              )}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
