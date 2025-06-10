// src/components/auth/LoginModal.tsx
// (Adjust path as necessary based on where your LoginModal component is located)

import  { useState } from 'react';
// Assuming you have shadcn/ui components or similar for dialog/modal
// You might need to install and configure these if you haven't already.
// Example for Shadcn UI components:
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast'; // Import useToast hook

// 1. Define the interface for the props your LoginModal expects
interface LoginModalProps {
  isOpen: boolean; // Controls whether the modal is visible
  onClose: () => void; // Function to call when the modal needs to be closed
  onLogin: (userId: string, userName: string) => void; // Function to call on successful login, pass user ID AND user Name
}

// 2. Define your LoginModal functional component with these props
const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false); // New state for loading indicator
  const { toast } = useToast(); // Initialize toast

  const handleLogin = async (event?: React.FormEvent) => { // Make event optional for Enter key handling
    event?.preventDefault(); // Prevent default form submission if triggered by form

    setErrorMessage(''); // Clear previous errors
    setLoading(true); // Start loading

    // Basic client-side validation
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      setLoading(false); // Stop loading on validation error
      return;
    }

    try {
      const response = await fetch('http://localhost:8005/api/login', { // Adjust your API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Assuming your backend returns both 'user_id' and 'user_name' on successful login.
        // If 'data.user_name' is missing, 'email' is used as a fallback.
        onLogin(data.user_id, data.user_name || email); // Call the onLogin prop with user ID and Name

        // --- ADDED: Successful login toast ---
        toast({
          title: "Login Successful",
          description: `Welcome, ${data.user_name || email}!`,
          variant: "default", // Assuming a 'success' variant is available
        });
        // --- END ADDED ---

        // onClose(); // Modal is usually closed by AuthModalProvider's login success path
        setEmail(''); // Clear form
        setPassword('');
      } else {
        setErrorMessage(data.message || data.error || 'Login failed. Please check your credentials.');
        toast({ // Added toast for failed login
          title: "Login Failed",
          description: data.message || data.error || 'Invalid credentials or server error.',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login API call error:', error);
      setErrorMessage('Network error or server unavailable.');
      toast({ // Added toast for network errors
        title: "Network Error",
        description: "Could not connect to the server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false); // Always stop loading
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // If Enter key is pressed and not already loading, trigger login
    if (event.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  return (
    // The Dialog component itself provides the backdrop and centering
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl border-gray-200">
        <DialogHeader className="text-center">
          <DialogTitle className="text-3xl font-extrabold text-gray-900 mb-2">Welcome!</DialogTitle>
          <DialogDescription className="text-gray-600 text-base">
            Log in to your account to continue generating content.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} onKeyDown={handleKeyDown} className="grid gap-6 py-4"> {/* Added onKeyDown to form */}
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading} // Disable input while loading
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-70 transition duration-200"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading} // Disable input while loading
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-70 transition duration-200"
              required
            />
          </div>
          {errorMessage && (
            <p className="text-red-600 text-sm text-center font-medium animate-fade-in">{errorMessage}</p>
          )}
          <Button
            type="submit" // Use type="submit" for form submission
            disabled={loading}
            className="w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out
                       bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300
                       disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
