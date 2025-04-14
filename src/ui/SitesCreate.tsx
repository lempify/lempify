import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const CreateSiteForm = ({ onRefresh }: { onRefresh: () => void }) => {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "creating" | "success" | "error">("idle");
  const [result, setResult] = useState<string | null>(null);

  const handleCreate = async () => {
    setStatus("creating");
    try {
      const domain = await invoke<string>("create_site", { payload: { name } });
      setResult(domain);
      setStatus("success");
      onRefresh();
    } catch (err) {
      console.error("Failed to create site:", err);
      setStatus("error");
    }
  };

  return (
    <div className="mb-20 w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl text-[var(--lempify-accent)] to-[var(--lempify-secondary)]">Create New Site</h2>
        <button onClick={onRefresh} className="btn">Refresh</button>
      </div>
      <input
        type="text"
        placeholder="my-awesome-site"
        className="px-4 py-3 border border-neutral-300 dark:border-neutral-700 w-full mb-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        onClick={handleCreate}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={!name || status === "creating"}
      >
        {status === "creating" ? "Creating..." : "Create Site"}
      </button>
      {status === "success" && result && (
        <p className="mt-2 text-green-600">
          🚀 Created:{" "}
          <a href={`http://${result}`} target="_blank" rel="noopener noreferrer">
            {result}
          </a>
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-red-600">❌ Something went wrong</p>
      )}
    </div>
  );
};

export default CreateSiteForm;