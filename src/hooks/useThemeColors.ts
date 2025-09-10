import { useTheme } from '../contexts/ThemeContext';
import { theme, categoryConfigs, priorityConfigs } from '../styles/theme';
import { darkTheme, darkCategoryConfigs, darkPriorityConfigs } from '../styles/darkTheme';

export const useThemeColors = () => {
  const { theme: currentTheme } = useTheme();
  const themeColors = currentTheme === 'dark' ? darkTheme : theme;
  const categories = currentTheme === 'dark' ? darkCategoryConfigs : categoryConfigs;
  const priorities = currentTheme === 'dark' ? darkPriorityConfigs : priorityConfigs;
  
  return {
    ...themeColors,
    currentTheme,
    categoryConfigs: categories,
    priorityConfigs: priorities
  };
};