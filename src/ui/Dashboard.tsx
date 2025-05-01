import { Fragment, useEffect } from "react";
import RouteHeader from "./RouteHeader";
import { useService } from "../context/ServiceContext";

export default function Dashboard() {
    const { state, dispatch } = useService();

    useEffect(() => {
        console.log('[lempifyd] State:', state);
    }, [state]);
    
    return (
        <Fragment>
            <pre>{JSON.stringify(state, null, 2)}</pre>
            <RouteHeader title="Dashboard" description="Welcome to Lempify" />
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold">Coming soon...</h2>
                </div>
            </div>
        </Fragment>
    );
}