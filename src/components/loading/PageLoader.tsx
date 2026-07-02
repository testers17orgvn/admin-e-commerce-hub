import { useLoadingSettings } from '@/hooks/useLoadingSettings';
import { AppLoader } from './AppLoader';

export function PageLoader() {
  const { settings } = useLoadingSettings();
  return <AppLoader settings={settings} fullScreen />;
}
