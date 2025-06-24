/** External dependencies */
import { useEffect, useState } from "react";
/** Internal dependencies */
import HeaderServicesItem from "./HeaderServicesItem";
import { useLempifyd } from "../context/LempifydContext";


const HeaderServices = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { emit, state } = useLempifyd();

  useEffect(() => {
    async function giddyUp() {
      emit("php", "is_running");
      emit("nginx", "is_running");
      emit("mysql", "is_running");
    }
    giddyUp();
  }, []);

  return (
    <>
      <span className="text-neutral-700 dark:text-neutral-300 text-sm">
        <button onClick={() => setIsOpen(!isOpen)}>
          {state.isAllServicesRunning ? 'All Services Running' : `${state.servicesCount - state.runningServicesCount} ${state.runningServicesCount === 1 ? 'Service' : 'Services'} Down`}{" "}
          <span className={`inline-block w-2 h-2 ${state.isAllServicesRunning ? 'text-green-500' : 'text-red-500'}`} >{isOpen ? '▵' : '▿'}</span>
        </button>
      </span>
      <ul className={`grid grid-cols-3 absolute top-full right-0 bg-neutral-100 dark:bg-neutral-900 border-t border-b border-l border-neutral-300 dark:border-neutral-700 divide-x-1 divide-neutral-200 dark:divide-neutral-700 ${isOpen ? 'block' : 'hidden'}`}>
        {state.services && Object.entries(state.services).map(([serviceKey, service]) => (
          <HeaderServicesItem
            key={serviceKey}
            service={service}
            emit={emit}
          />
        ))}
      </ul>
    </>
  );
};

export default HeaderServices;