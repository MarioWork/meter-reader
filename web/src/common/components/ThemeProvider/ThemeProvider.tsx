import { ThemeContext } from '@hooks/useTheme';
import { useThemeChoice } from './hooks/useThemeChoice';

type Props = {
  children: React.ReactNode;
};

// Light, dark or the device's setting, remembered between visits. public/theme-init.js applies the stored choice
// before the first paint; from then on this keeps the page in step. Read it with useTheme (@hooks/useTheme).
function ThemeProvider({ children }: Props) {
  const themeChoice = useThemeChoice();

  return <ThemeContext value={themeChoice}>{children}</ThemeContext>;
}

export default ThemeProvider;
