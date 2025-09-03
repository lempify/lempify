import { useLempifyd } from '../context/LempifydContext';

export default function Dashboard() {
  const {
    emit,
    state: {
      events,
      services,
      tools,
      runningServicesCount,
      runningToolsCount,
      requiredServicesCount,
      requiredToolsCount,
      servicesCount,
      toolsCount,
      isServicesValid,
      isToolsValid,
    },
    isActionPending,
  } = useLempifyd();
  return (
    <pre>
      {JSON.stringify(
        {
        //   events,
        //   services,
        //   tools,
          runningServicesCount,
          runningToolsCount,
          requiredServicesCount,
          requiredToolsCount,
          servicesCount,
          toolsCount,
          isServicesValid,
          isToolsValid,
        },
        null,
        2
      )}
    </pre>
  );
}
