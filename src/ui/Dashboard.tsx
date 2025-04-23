import { Fragment } from "react";
import RouteHeader from "./RouteHeader";

export default function Dashboard() {
    return (
        <Fragment>
            <RouteHeader title="Dashboard" description="Welcome to Lempify" />
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold">Coming soon...</h2>
                </div>
            </div>
        </Fragment>
    );
}