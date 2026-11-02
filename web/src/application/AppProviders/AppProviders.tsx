import ThemeProvider from '@components/ThemeProvider';

type Props = {
  children: React.ReactNode;
};

// Context the whole app reads. main.tsx wraps the router in it, and @test-utils wraps every render, so a component
// finds the same providers in a test as in the app.
function AppProviders({ children }: Props) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

export default AppProviders;
