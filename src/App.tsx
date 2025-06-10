
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/layout/Layout';


function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <Layout />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;