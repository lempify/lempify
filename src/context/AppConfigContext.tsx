/**
 * AppConfigContext for managing app config which reads from config.json
 */

import { createContext, useContext, useState, ReactNode, useEffect, useReducer } from "react";
import { useInvoke } from "../hooks/useInvoke";

type AppConfig = {
    trusted: boolean;
    sites: any[];
};

type AppConfigContextType = {
    config: AppConfig;
    dispatch: React.Dispatch<any>;
};

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const AppConfigProvider = ({ children }: { children: ReactNode }) => {
    const { invoke } = useInvoke();
    const [config, dispatch] = useReducer(appConfigReducer, { trusted: false, sites: [] });

    useEffect(() => {
        const fetchConfig = async () => {
            const { data, error } = await invoke("get_config");
            if (error) {
                console.error(error);
            } else {
                dispatch({ type: "set_config", config: data as AppConfig });
            }
        };
        fetchConfig();
    }, []);

    return (
        <AppConfigContext.Provider value={{ config, dispatch }}>
            {children}
        </AppConfigContext.Provider>
    );
};

export const appConfigReducer = (state: AppConfig, action: any): AppConfig => {
    switch (action.type) {
        case "set_trusted":
            return { ...state, trusted: action.trusted };
        case "set_sites":
            return { ...state, sites: action.sites };
        case "set_config":
            return action.config;
        default:
            return state;
    }
};

export const useAppConfig = () => {
    const context = useContext(AppConfigContext);
    if (!context) throw new Error("useAppConfig must be used within a AppConfigProvider");
    return context;
};