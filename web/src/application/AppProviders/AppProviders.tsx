import ThemeProvider from '@components/ThemeProvider';
import { Toaster } from '@components/ui/toast';

type Props = {
  children: React.ReactNode;
};

// Context the whole app reads. main.tsx wraps the router in it, and @test-utils wraps every render, so a component
// finds the same providers in a test as in the app. The Toaster shows the toasts route actions add.
function AppProviders({ children }: Props) {
  return (
    <ThemeProvider>
      <Toaster>{children}</Toaster>
    </ThemeProvider>
  );
}

export default AppProviders;
