/** Internal dependencies */
import ServicesService from "./ServicesService";
import { useServiceManager } from "../hooks/useServiceManager";

const Services = () => {
  const { install, start, stop, refresh, servicesValues, servicesStatuses } = useServiceManager();
  const isAllSystemsGo = !Boolean(servicesStatuses.inactive.length);

  return (
    <>
      <span className="text-neutral-500 dark:text-neutral-300 text-sm">Services <span className={`inline-block w-2 h-2 rounded-full ${isAllSystemsGo ? 'bg-green-500' : 'bg-red-500'}`} /></span>
      <ul className="hidden group-hover/services-status:block absolute top-full right-0 bg-neutral-100 dark:bg-neutral-900 border-t border-b border-l border-neutral-300 dark:border-neutral-700 p-2">
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
    </>
  );
};

export default Services;