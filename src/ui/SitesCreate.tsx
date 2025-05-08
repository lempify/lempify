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
import { corderTopRight } from "./css";

/**
 * Constants
 */
const defaultPayload = {
  domain: "",
  ssl: true,
  type: "php",
};

const SiteCreate = ({ onRefresh }: { onRefresh: () => void }) => {
  const { invoke, invokeStatus } = useInvoke();
  const [formValues, setFormValues] = useState<Record<string, any>>({ ...defaultPayload });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const { data, error } = await invoke<string>("create_site", {
        payload: {
          domain: formValues.domain,
          _site_type: formValues.type,
          ssl: formValues.ssl
        }
      });
      if (error) {
        console.error("Failed to create site:", error);
      }
      if (data === formValues.domain) {
        setFormValues({ ...defaultPayload });
      }
    } catch (err) {
      console.error("Failed to create site:", err);
    } finally {
      onRefresh();
    }
  }

  return (
    <div id="create-site" className={`
      p-10 w-full 
      border border-neutral-200 dark:border-neutral-700 
      relative
      ${corderTopRight}
      `}>
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

export default SiteCreate;