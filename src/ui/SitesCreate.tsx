/**
 * External imports
 */
import { FormEvent, useState } from "react";

/**
 * Internal imports
 */
// Components
import FormFields from "./FormFields";
// Hooks
import { useInvoke } from "../hooks/useInvoke";

// Constants
import siteCreateFields from "../utils/site-create-fields";
import Loader from "./Loader";
import { cornerTopRight, pageSection } from "./css";
import { useAppConfig } from "../context/AppConfigContext";
import { Site } from "../types";

/**
 * Constants
 */
const defaultPayload = {
  domain: "",
  ssl: true,
  type: "vanilla",
};

export default function SiteCreate({ onRefresh }: { onRefresh: () => void }) {
  const { invoke, invokeStatus } = useInvoke();
  const [formValues, setFormValues] = useState<Record<string, any>>({ ...defaultPayload });
  const { config, dispatch } = useAppConfig();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const { data, error } = await invoke<Site>("create_site", {
        payload: {
          domain: formValues.domain,
          site_type: formValues.type,
          ssl: formValues.ssl
        }
      });
      if (error) {
        console.error("Failed to create site:", error);
      }
      if (data?.domain === formValues.domain) {
        setFormValues({ ...defaultPayload });
        dispatch({ type: "set_sites", sites: [...config.sites, data] });
      }
    } catch (err) {
      console.error("Failed to create site:", err);
    } finally {
      onRefresh();
    }
  }

  return (
    <div id="create-site" className={`${pageSection} ${cornerTopRight}`}>
      <h2 className="text-4xl text-[var(--lempify-primary)] to-[var(--lempify-primary-700)] mb-8">Create New Site</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-10 mb-10">
          {siteCreateFields.map((field) => (
            <div className={field.wrapperClassName ?? ''} key={field.name}>
              <FormFields
                {...field}
                key={field.name}
                value={formValues[field.name]}
                onChange={(value, fieldName = field.name) => setFormValues({ ...formValues, [fieldName]: value })}
              />
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={formValues?.domain === ""}
          className="bg-[var(--lempify-primary)] hover:bg-[var(--lempify-primary-700)] text-white px-4 py-2 rounded disabled:opacity-50 disabled:bg-neutral-400"
        >
          Submit form
        </button>
      </form>
      <Loader isVisible={invokeStatus === 'pending'} />
    </div>
  );
};