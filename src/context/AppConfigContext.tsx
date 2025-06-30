/**
 * AppConfigContext for managing app config which reads from config.json
 */

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useReducer,
  useState,
} from 'react';

import { useInvoke } from '../hooks/useInvoke';
import { Site } from '../types';

type AppConfig = {
  trusted: boolean;
  sites: Site[];
  settings?: {
    mysql_host: string;
    mysql_user: string;
    mysql_password: string;
    mysql_port: number;
  };
};

type AppConfigContextType = {
  config: AppConfig;
  dispatch: React.Dispatch<any>;
  loading: boolean;
  error: string | null;
};

const AppConfigContext = createContext<AppConfigContextType | undefined>(
  undefined
);

const defaultConfig: AppConfig = {
  trusted: false,
  sites: [],
  settings: {
    mysql_host: 'localhost',
    mysql_user: 'root',
    mysql_password: 'root',
    mysql_port: 3306,
  },
};

export const AppConfigProvider = ({ children }: { children: ReactNode }) => {
  const { invoke } = useInvoke();
  const [config, dispatch] = useReducer(appConfigReducer, { ...defaultConfig });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      const { data, error } = await invoke('get_config');
      if (error) {
        console.error(error);
        setError(error);
      } else {
        dispatch({ type: 'set_config', config: data as AppConfig });
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  return (
    <AppConfigContext.Provider value={{ config, dispatch, loading, error }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const appConfigReducer = (state: AppConfig, action: any): AppConfig => {
  switch (action.type) {
    case 'set_trusted':
      return { ...state, trusted: action.trusted };
    case 'set_sites':
      return { ...state, sites: action.sites };
    case 'set_config':
      return action.config;
    case 'set_settings':
      return { ...state, settings: action.config.settings };
    default:
      return state;
  }
};

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (!context)
    throw new Error('useAppConfig must be used within a AppConfigProvider');
  return context;
};
