import { useLempifyd } from '../context/LempifydContext';

export default function Dashboard() {
  const {
    emit,
    state: {
      events,
      requiredServices,
      tools,
      runningServicesCount,
      servicesCount,
      isServicesValid,
      isToolsValid,
    },
    isActionPending,
  } = useLempifyd();
  return (
    <pre>
      {JSON.stringify(
        {
          requiredServices,
          tools,
          runningServicesCount,
          servicesCount,
          isServicesValid,
          isToolsValid,
        },
        null,
        2
      )}
    </pre>
  );
}
