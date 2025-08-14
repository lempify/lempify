import { useAppConfig } from '../context/AppConfigContext';
import { useLempifyd } from '../context/LempifydContext';
import Install from './Install';
import { useEffect } from 'react';

export default function Installed({ children }: { children: React.ReactNode }) {
  const { config } = useAppConfig();
  const { emit } = useLempifyd();

  useEffect(() => {
    async function emitServices() {
      // Services
      emit('php', 'is_running');
      emit('nginx', 'is_running');
      emit('mysql', 'is_running');
      // Optional services
      emit('redis', 'is_running');
      emit('memcached', 'is_running');
      // Tools
      emit('composer', 'is_running');
      // Optional tools
      emit('wp-cli', 'is_running');
      emit('mailpit', 'is_running');
    }
    emitServices();
  }, []);

  if (!config.installed) {
    return <Install />;
  }

  return children;
}
