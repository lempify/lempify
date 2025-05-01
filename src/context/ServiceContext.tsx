import { createContext, useContext, useReducer, ReactNode, useRef, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

type ServiceEvent = {
    service: string;
    action: string;
};

type ServiceState = {
    events: Array<ServiceEvent & {timestamp: number}>;
};

type ServiceAction = {
    type: 'ADD_EVENT';
    payload: ServiceEvent;
};

const initialState: ServiceState = {
    events: [],
};

function serviceReducer(state: ServiceState, action: ServiceAction): ServiceState {
    switch (action.type) {
        case 'ADD_EVENT':
            return {
                ...state,
                events: [
                    ...state.events,
                    {
                        ...action.payload,
                        timestamp: Date.now(),
                    },
                ],
            };
        default:
            return state;
    }
}

const ServiceContext = createContext<{
    state: ServiceState;
    dispatch: React.Dispatch<ServiceAction>;
} | null>(null);

export function ServiceProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(serviceReducer, initialState);
    const isListenerSetup = useRef(false);
    let unlisten: () => void;

    useEffect(() => {
        if (isListenerSetup.current) return;

        const setupListener = async () => {
            try {
                unlisten = await listen<string>('service:sent', (event) => {
                    try {
                        const payload = JSON.parse(event.payload);
                        dispatch({
                            type: 'ADD_EVENT',
                            payload: {
                                service: payload.service,
                                action: payload.action,
                            },
                        });
                    } catch (error) {
                        console.error('[lempifyd] Error parsing service event:', error);
                    }
                });
                isListenerSetup.current = true;
            } catch (error) {
                console.error('[lempifyd] Error setting up service listener:', error);
            }
        };

        setupListener();

        return () => {
            if (unlisten) {
                unlisten();
            }
        };
    }, []);

    return (
        <ServiceContext.Provider value={{ state, dispatch }}>
            {children}
        </ServiceContext.Provider>
    );
}

export function useService() {
    const context = useContext(ServiceContext);
    if (!context) {
        throw new Error('useService must be used within a ServiceProvider');
    }
    return context;
} 