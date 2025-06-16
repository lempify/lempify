import { FormEvent, useEffect, useState } from "react";

import Page from "./Page";
import Loader from "./Loader";
import FormFields from "./FormFields";

import { useInvoke } from "../hooks/useInvoke";
import settingsFields from "../utils/settings-fields";
import { useAppConfig } from "../context/AppConfigContext";

import { Site } from "../types";
import { cornerTopRight, pageSection } from "./css";

const defaultPayload = {
    mysql_host: "localhost",
    mysql_user: "root",
    mysql_password: "root",
    mysql_port: 3306
};

export default function Dashboard() {
    const { config, dispatch } = useAppConfig();
    const [formValues, setFormValues] = useState(config?.settings ?? defaultPayload);
    const { invoke, invokeStatus } = useInvoke();

    useEffect(() => {
        if (config?.settings) {
            setFormValues({
                mysql_host: config.settings.mysql_host,
                mysql_user: config.settings.mysql_user,
                mysql_password: config.settings.mysql_password,
                mysql_port: config.settings.mysql_port
            });
        }
    }, [config]);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            const { error } = await invoke<Site>("update_settings", {
                settings: formValues
            });
            dispatch({
                type: "set_settings", config: {
                    ...config,
                    settings: {
                        ...config.settings,
                        ...formValues
                    }
                }
            });
            if (error) {
                console.error("Failed to create site:", error);
            }
        } catch (err) {
            console.error("Failed to create site:", err);
        }
    }

    return (
        <Page title="Settings" description="Manage your settings">
            <div className={`${pageSection} ${cornerTopRight}`}>
                <div className="flex flex-col gap-2">
                    <h2 className="text-4xl text-[var(--lempify-primary)] to-[var(--lempify-primary-700)] mb-8">MySQL</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-10 mb-10">
                            {settingsFields.map((field) => (
                                <div className={field.wrapperClassName ?? ''} key={field.name}>
                                    <FormFields
                                        {...field}
                                        key={field.name}
                                        value={formValues[field.name as keyof typeof formValues]}
                                        onChange={(value, fieldName = field.name) => {
                                            setFormValues({
                                                ...formValues,
                                                [fieldName]: field.type === "number" ? Number(value) : value
                                            });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">Save</button>
                    </form>
                    <Loader isVisible={invokeStatus === 'pending'} />
                </div>
            </div>
        </Page>
    );
}