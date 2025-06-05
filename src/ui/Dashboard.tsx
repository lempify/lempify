import RouteHeader from "./RouteHeader";

const DASHBOARD_DESCRIPTION = "Welcome to Lempify. This is the dashboard for your Lempify instance. Here you can manage your sites, users, and settings.";

export default function Dashboard() {
    
    return (
        <>
            <RouteHeader title="Dashboard" description={DASHBOARD_DESCRIPTION} />
            <div className="flex flex-col">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold">Coming soon...</h2>
                </div>
            </div>
        </>
    );
}