import { useLempifyd } from '../context/LempifydContext';

export default function Dashboard() {
  const {
    state: {
      requiredServices,
      tools,
      runningServicesCount,
      servicesCount,
      isServicesValid,
      isToolsValid,
    },
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
