import { ThemeProvider } from '@/components/theme-provider';
import Layout from '@/components/layout/Layout';
import { Toaster } from 'sonner'; // ✅ Make sure this matches the toast() you're calling

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <Layout />
      <Toaster position="top-right" richColors /> {/* optional props */}
    </ThemeProvider>
  );
}

export default App;