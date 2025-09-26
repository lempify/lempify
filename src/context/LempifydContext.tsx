/**
 * LempifydContext is a context that is used to manage the state of the lempifyd daemon.
 * It is used to emit events to the lempifyd daemon and to listen for events from the lempifyd daemon.
 */

import { listen } from '@tauri-apps/api/event';
import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from 'react';

import { useInvoke } from '../hooks/useInvoke';
import { InvokeStatus, ServiceTypes, ToolTypes } from '../types/service';
import { SERVICES, TOOLS } from '../constants';

type LempifydEvent = {
  name: string;
  action: string;
};

type LempifydResponse = {
  name: string;
  action: string;
  result: any;
};

type LempifydServices = Record<ServiceTypes, Status>;
type LempifydTools = Record<ToolTypes, Status>;

type LempifydState = {
  events: Array<LempifydEvent & { timestamp: number }>;
  responses: Array<LempifydResponse & { timestamp: number }>;
  services: LempifydServices;
  requiredServices: Array<Status>;
  tools: LempifydTools;
  requiredTools: Array<Status>;
  isAllServicesRunning: boolean;
  servicesCount: number;
  runningServicesCount: number;
  isServicesValid: boolean;
  isToolsValid: boolean;
};

type LempifydAction =
  | {
      type: 'ADD_EVENT';
      payload: LempifydEvent;
    }
  | {
      type: 'UPDATE_SERVICE_STATUS';
      payload: LempifydResponse;
    }
  | {
      type: 'SERVICE_ERROR';
      payload: {
        name: string;
        lastError: string;
      };
    }
  | {
      type: 'UPDATE_DEPENDENCY_KEYS';
      payload: Partial<Status> & {
        name: string;
      };
    };

export type Status = {
  name: string;
  isRequired: boolean;
  humanName: string;
  isRunning?: boolean;
  isInstalled?: boolean;
  version?: string;
  lastError: string;
  pendingAction?: boolean;
  dependencyType?: string;
  url?: string;
};

const initialState: LempifydState = {
  events: [],
  responses: [],
  services: { ...SERVICES },
  tools: { ...TOOLS },
  isAllServicesRunning: false,
  servicesCount: 0,
  requiredServices: [],
  requiredTools: [],
  runningServicesCount: 0,
  isServicesValid: false,
  isToolsValid: false,
};

function lempifydReducer(
  state: LempifydState,
  action: LempifydAction
): LempifydState {
  let updatedServices = state.services;
  let updatedTools = state.tools;

  const isService = action.payload.name in state.services;
  const isTool = action.payload.name in state.tools;

  const { name, ...update } = action.payload;

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
    case 'UPDATE_DEPENDENCY_KEYS':
      let updatedState = state;

      if (isService) {
        const newServices = {
          ...state.services,
          [name]: {
            ...state.services[name as ServiceTypes],
            ...update,
          },
        };
        updatedState = {
          ...state,
          services: newServices,
          requiredServices: Object.values(newServices).filter(
            service => service?.isRequired ?? false
          ),
        };
      }

      if (isTool) {
        const newTools = {
          ...state.tools,
          [name]: {
            ...state.tools[name as ToolTypes],
            ...update,
          },
        };
        updatedState = {
          ...state,
          tools: newTools,
          requiredTools: Object.values(newTools).filter(
            tool => tool?.isRequired ?? false
          ),
        };
      }

      return updatedState;

    case 'UPDATE_SERVICE_STATUS':
      if (action.payload.result.dependencyType === 'service') {
        updatedServices = {
          ...state.services,
          [action.payload.name]: {
            ...state.services[action.payload.name as ServiceTypes],
            ...action.payload.result,
          },
        };
      } else if (action.payload.result.dependencyType === 'tool') {
        updatedTools = {
          ...state.tools,
          [action.payload.name]: {
            ...state.tools[action.payload.name as ToolTypes],
            ...action.payload.result,
          },
        };
      }

      const tools = Object.values(updatedTools);
      const services = Object.values(updatedServices);

      const requiredServices = services.filter(
        service => service?.isRequired ?? false
      );
      const requiredTools = tools.filter(tool => tool?.isRequired ?? false);

      return {
        ...state,
        services: updatedServices,
        tools: updatedTools,
        isAllServicesRunning: services.every(
          service => service?.isRunning ?? false
        ),
        servicesCount: services.length,
        requiredServices,
        requiredTools,
        runningServicesCount: services.filter(
          service => service?.isRunning ?? false
        ).length,
        isServicesValid: requiredServices.every(
          service =>
            (service?.isRequired ?? false) && (service?.isRunning ?? false)
        ),
        isToolsValid: requiredTools.every(
          tool => (tool?.isRequired ?? false) && (tool?.isRunning ?? false)
        ),
      };
    case 'SERVICE_ERROR':
      if (action.payload.name in state.tools) {
        return {
          ...state,
          tools: {
            ...state.tools,
            [action.payload.name]: {
              ...state.tools[action.payload.name as ToolTypes],
              lastError: action.payload.lastError,
            },
          },
        };
      } else if (action.payload.name in state.services) {
        return {
          ...state,
          services: {
            ...state.services,
            [action.payload.name]: {
              ...state.services[action.payload.name as ServiceTypes],
              lastError: action.payload.lastError,
            },
          },
        };
      }
      return state;
    default:
      return state;
  }
}

const LempifydContext = createContext<{
  state: LempifydState;
  dispatch: React.Dispatch<LempifydAction>;
} | null>(null);

export function LempifydProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(lempifydReducer, initialState);
  const { invoke } = useInvoke();
  let unlisten: () => void;
  let unlistenResponse: () => void;

  useEffect(() => {
    const setupListener = async () => {
      try {
        // Listen for sent commands
        unlisten = await listen<string>('lempifyd:send', event => {
          try {
            const payload = JSON.parse(event.payload);
            // Add pending action
            dispatch({
              type: 'ADD_EVENT',
              payload: {
                name: payload.name,
                action: payload.action,
              },
            });
          } catch (error) {
            invoke('log', {
              message: `[lempifyd] Error parsing service event: ${error}`,
            });
          }
        });

        // Listen for responses
        unlistenResponse = await listen<string>('lempifyd:response', event => {
          // Log to file in release builds
          invoke('log', {
            message: `[lempifyd] Response received: ${event.payload}`,
          });

          try {
            const payload = JSON.parse(event.payload);
            let name = payload.name as ServiceTypes;

            dispatch({
              type: 'UPDATE_DEPENDENCY_KEYS',
              payload: {
                name,
                pendingAction: false,
              },
            });

            if (payload.result.error) {
              dispatch({
                type: 'SERVICE_ERROR',
                payload: {
                  name,
                  lastError: payload.result.error || 'Unknown error',
                },
              });
              return;
            }
            dispatch({
              type: 'UPDATE_SERVICE_STATUS',
              payload,
            });
          } catch (error) {
            invoke('log', {
              message: `[lempifyd] Error parsing response: ${error}`,
            });
          }
        });

        return () => {
          unlisten();
          unlistenResponse();
        };
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
    <LempifydContext.Provider value={{ state, dispatch }}>
      {children}
    </LempifydContext.Provider>
  );
}

/**
 * useLempifyd is a hook that is used to emit events to the lempifyd daemon and to listen for events from the lempifyd daemon.
 * It is used to manage the state of the lempifyd daemon.
 *
 * @returns {Object} - An object containing the state, dispatch, requests, and getLatestResponse functions.
 * @example
 * ```tsx
 * const { emit, state } = useLempifyd();
 * emit("php", "isInstalled");
 * ```
 */
export function useLempifyd(): {
  emit: (name: string, action: string) => Promise<void>;
  state: LempifydState;
  emitStatus: InvokeStatus;
  dispatch: React.Dispatch<LempifydAction>;
  isActionPending: boolean;
} {
  const context = useContext(LempifydContext);
  if (!context) {
    throw new Error('useLempifyd must be used within a LempifydProvider');
  }

  const { invoke, invokeStatus } = useInvoke();
  const { state, dispatch } = context;

  const emit = async (
    name: string,
    action: string,
    args: Record<string, unknown> = {}
  ) => {
    try {
      dispatch({
        type: 'UPDATE_DEPENDENCY_KEYS',
        payload: {
          name,
          pendingAction: true,
        },
      });
      await invoke('lempifyd', {
        name,
        action,
        args,
      });
    } catch (error) {
      console.error('[lempifyd] Error emitting event:', error);
    }
  };
  return {
    emit,
    state,
    emitStatus: invokeStatus,
    dispatch,
    isActionPending: Object.values(state.services).some(
      service => service?.pendingAction ?? false
    ),
  };
}
