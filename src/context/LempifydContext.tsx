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
import {
  InvokeStatus,
  ServiceTypes,
  ToolTypes,
} from '../types/service';
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
  tools: LempifydTools;
  isAllServicesRunning: boolean;
  servicesCount: number;
  runningServicesCount: number;
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
      type: 'SET_PENDING_ACTION';
      payload: {
        name: string;
        pending: boolean;
      };
    };

export type Status = {
  name: string;
  isRequired: boolean;
  humanName: string;
  isRunning?: boolean;
  isInstalled?: boolean;
  version?: string;
  lastError?: string;
  pendingAction?: boolean;
  formulaeType?: string;
  url?: string;
};

const initialState: LempifydState = {
  events: [],
  responses: [],
  services: { ...SERVICES },
  tools: { ...TOOLS },
  isAllServicesRunning: false,
  servicesCount: 0,
  runningServicesCount: 0,
};

function lempifydReducer(
  state: LempifydState,
  action: LempifydAction
): LempifydState {
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
    case 'UPDATE_SERVICE_STATUS':
      let updatedServices = state.services;
      let updatedTools = state.tools;

      if (action.payload.result.formulaeType === 'service') {
        updatedServices = {
          ...state.services,
          [action.payload.name]: {
            ...state.services[action.payload.name as ServiceTypes],
            ...action.payload.result,
          },
        };
      } else if (action.payload.result.formulaeType === 'tool') {
        updatedTools = {
          ...state.tools,
          [action.payload.name]: {
            ...state.tools[action.payload.name as ToolTypes],
            ...action.payload.result,
          },
        };
      }

      return {
        ...state,
        services: updatedServices,
        tools: updatedTools,
        isAllServicesRunning: Object.values(updatedServices).every(
          service => service?.isRunning ?? false
        ),
        servicesCount: Object.values(updatedServices).length,
        runningServicesCount: Object.values(updatedServices).filter(
          service => service?.isRunning ?? false
        ).length,
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
    case 'SET_PENDING_ACTION':
      const isService = action.payload.name in state.services;
      const isTool = action.payload.name in state.tools;

      if (isService) {
        return {
          ...state,
          services: {
            ...state.services,
            [action.payload.name as ServiceTypes]: {
              ...state.services[action.payload.name as ServiceTypes],
              pendingAction: action.payload.pending,
            },
          },
        };
      } else if (isTool) {
        return {
          ...state,
          tools: {
            ...state.tools,
            [action.payload.name as ToolTypes]: {
              ...state.tools[action.payload.name as ToolTypes],
              pendingAction: action.payload.pending,
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

            // Remove pending action first
            dispatch({
              type: 'SET_PENDING_ACTION',
              payload: {
                name,
                pending: false,
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

  const emit = async (name: string, action: string) => {
    try {
      dispatch({
        type: 'SET_PENDING_ACTION',
        payload: {
          name,
          pending: true,
        },
      });
      await invoke('lempifyd', {
        name,
        action,
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
