import { Link } from 'react-router-dom'; // Import Link for internal navigation
import AuthButtons from '@/components/auth/AuthButtons';
import { buttonVariants } from '@/components/ui/button'; // Import buttonVariants for consistent styling
import { cn } from '@/lib/utils'; // Assuming cn utility is available
import { useAuth } from '@/components/auth/auth_model'; // Import useAuth hook

const Navbar = () => {
  // Destructure setForceScrollBlogPreview from useAuth, and add setForceScrollTrackScore
  const { setForceScrollBlogPreview, setForceScrollTrackScore } = useAuth();

  const handleBlogPreviewClick = () => {
    // Increment the state to force the Dashboard's useEffect to re-run, even if the hash doesn't change
    setForceScrollBlogPreview(prev => prev + 1);
  };

  // Handler for the Track Score button
  const handleTrackScoreClick = () => {
    // Increment a new state to force the Dashboard's useEffect to re-run for Track Score
    setForceScrollTrackScore(prev => prev + 1);
  };

  return (
    <>
      <style>
        {`
        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animated-gradient {
          background: linear-gradient(90deg, #e0f2f7, #bbdefb, #e0f2f7); /* Light blue gradient */
          background-size: 200% 200%;
          animation: gradient-animation 10s ease infinite;
        }
        `}
      </style>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animated-gradient">
        <div className="flex h-14 items-center px-4">
          {/* All Navigation Links and Auth Buttons (Right Side) */}
          {/* Combined previous "Navigation Links (Left Side)" and "Auth Buttons (Right Side)" */}
          <div className="flex flex-1 justify-end items-center space-x-4">
            <Link
              to="/dashboard"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-sm font-medium transition-colors text-black hover:bg-blue-100 hover:text-black" // Professional black text with subtle blue hover
              )}
            >
              Home
            </Link>
            <Link // Blog Preview button
              to="/dashboard#live-blog-preview" // Still navigate to the hash
              onClick={handleBlogPreviewClick} // Add onClick handler
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-sm font-medium transition-colors text-black hover:bg-blue-100 hover:text-black"
              )}
            >
              Blog Preview
            </Link>
            {/* Track Score button with specific ID and handler */}
            <Link
              to="/dashboard#track-score" // Navigate to the dashboard with the #track-score hash
              onClick={handleTrackScoreClick} // Add onClick handler for track score
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-sm font-medium transition-colors text-black hover:bg-blue-100 hover:text-black"
              )}
            >
              Track Score
            </Link>
            <a
              href="https://forage.ai/blog/"
              target="_blank" // Opens in a new tab
              rel="noopener noreferrer" // Recommended for security when using target="_blank"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-sm font-medium transition-colors text-black hover:bg-blue-100 hover:text-black" // Professional black text with subtle blue hover
              )}
            >
              Forage AI Knowledge Hub
            </a>
            {/* Auth Buttons - now part of the same right-aligned flex container */}
            <AuthButtons />
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
