/** External dependencies */
import { useState } from "react";
/** Internal dependencies */
import ServicesService from "./ServicesService";
import { useServices } from "../context/ServicesProvider";

const Services = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { servicesValues, servicesStatuses } = useServices();
  const isAllSystemsGo = !Boolean(servicesStatuses.inactive.length);

  return (
    <>
      <span className="text-neutral-700 dark:text-neutral-300 text-sm">
        <button onClick={() => setIsOpen(!isOpen)}>
          {isAllSystemsGo ? 'All Services Running' : `${servicesStatuses.inactive.length} ${servicesStatuses.inactive.length === 1 ? 'Service' : 'Services'} Down`}{" "}
          <span className={`inline-block w-2 h-2 ${isAllSystemsGo ? 'text-green-500' : 'text-red-500'}`} >{isOpen ? '▵' : '▿'}</span>
        </button>
      </span>
      <ul className={`absolute top-full right-0 bg-neutral-100 dark:bg-neutral-900 border-t border-b border-l border-neutral-300 dark:border-neutral-700 p-2 divide-x-1 divide-neutral-200 dark:divide-neutral-700 ${isOpen ? 'block' : 'hidden'}`}>
        {servicesValues.map(service => (
          <ServicesService
            key={service.name}
            service={service}
          />
        ))}
      </ul>
    </>
  );
};

export default Services;