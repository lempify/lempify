import { invoke } from "@tauri-apps/api/core";

export default async function startPhp() {
  try {
    await invoke("control_service", {
      service: "php",
      action: "start",
    });
    console.log("🟢 Command sent");
  } catch (e) {
    console.error("❌ Command failed:", e);
  }
}
