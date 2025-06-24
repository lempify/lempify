import RouteHeader from "./RouteHeader";

const DASHBOARD_DESCRIPTION = "Welcome to Lempify. This is the dashboard for your Lempify instance. Here you can manage your sites, users, and settings.";


export default function Dashboard() {
   

    return (
        <>
            <RouteHeader title="Dashboard" description={DASHBOARD_DESCRIPTION} />

            <div className="flex flex-col">
                Coming soon...
            </div>
        </>
    );
}