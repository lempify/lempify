import { useState } from "react";
import { useInvoke } from "../hooks/useInvoke";

const defaultPayload = {
  name: "",
  ssl: false,
  laravel: false,
  wordpress: false,
};

const SiteCreate = ({ onRefresh }: { onRefresh: () => void }) => {
  const [payload, setPayload] = useState({ ...defaultPayload });
  const { invoke, invokeStatus } = useInvoke();

  const [result, setResult] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      const { data, error } = await invoke<string>("create_site", { payload });
      if (error) {
        throw error;
      }
      if (data) {
        setResult(data);
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to create site:", err);
    } finally {
      setPayload({ ...defaultPayload });
    }
  };

  return (
    <div className="mb-10 p-10 w-full border border-neutral-200 dark:border-neutral-700 rounded-lg">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl text-[var(--lempify-primary)] to-[var(--lempify-primary-700)]">Create New Site</h2>
      </div>
      <input
        type="url"
        placeholder="lempify.local"
        className="border border-neutral-200 placeholder:text-neutral-300 placeholder:italic focus:border-neutral-300 outline-none dark:border-neutral-700 w-full mb-4 px-4 py-3"
        value={payload.name}
        onChange={(e) => setPayload({ ...payload, name: e.target.value })}
      />
      <div className="flex items-center gap-2 mb-4 text-sm">
        <label className="mr-4">
          <input
            type="checkbox"
            className="form-checkbox rounded text-pink-500 mr-2"
            checked={payload.ssl}
            onChange={(e) => setPayload({ ...payload, ssl: e.target.checked })}
          /><span>SSL?</span>
        </label>
        <label className="mr-4">
          <input
            type="checkbox"
            className="form-checkbox rounded text-pink-500 mr-2"
            checked={payload.laravel}
            onChange={(e) => setPayload({ ...payload, laravel: e.target.checked })}
          /><span>Laravel?</span>
        </label>
        <label>
          <input
            type="checkbox"
            className="form-checkbox rounded text-pink-500 mr-2"
            checked={payload.wordpress}
            onChange={(e) => setPayload({ ...payload, wordpress: e.target.checked })}
          />
          <span>WordPress?</span>
        </label>
      </div>
      <button
        onClick={handleCreate}
        className="bg-[var(--lempify-primary)] hover:bg-[var(--lempify-primary-700)] text-white px-4 py-2 rounded disabled:opacity-50 disabled:bg-neutral-400"
        disabled={!payload.name || invokeStatus === "pending"}
      >
        {invokeStatus === "pending" ? "Creating..." : "Create Site"}
      </button>
      {invokeStatus === "success" && result && (
        <p className="mt-2 text-green-600">
          🚀 Created:{" "}
          <a href={`http://${result}`} target="_blank" rel="noopener noreferrer">
            {result}
          </a>
        </p>
      )}
      {invokeStatus === "error" && (
        <p className="mt-2 text-red-600">❌ Something went wrong</p>
      )}
    </div>
  );
};

export default SiteCreate;