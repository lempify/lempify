/** Internal dependencies */
import ServicesService from "./ServicesService";
import { useServiceManager } from "../hooks/useServiceManager";

const Services = () => {
  const { install, start, stop, refresh, servicesValues, servicesStatuses } = useServiceManager();
  const isAllSystemsGo = !Boolean(servicesStatuses.inactive.length);

  return (
    <ul className="inline">
      {/* {isAllSystemsGo ? (
        <div className="text-green-500">All systems go!</div>
      ) : (
        <div className="text-red-500">Some systems are not running!</div>
      )} */}
        {servicesValues.map(service => (
          <ServicesService
            key={service.name}
            service={service}
            icon={service.name}
            onInstall={() => install(service.name)}
            onStart={() => start(service.name)}
            onStop={() => stop(service.name)}
            fetchStatus={() => refresh(service.name)}
          />
        ))}
    </ul>
  );
};

export default Services;