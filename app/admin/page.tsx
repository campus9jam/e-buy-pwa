"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

interface Device {
  id: string;
  name: string;
  price: number;
  specs: string;
}

interface Settings {
  bankName: string;
  accountNumber: string;
  accountName: string;
  agentWhatsApp: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"accounts" | "inventory">("accounts");
  const [settings, setSettings] = useState<Settings>({
    bankName: "",
    accountNumber: "",
    accountName: "",
    agentWhatsApp: "",
  });
  const [devices, setDevices] = useState<Device[]>([]);
  const [newDevice, setNewDevice] = useState({ name: "", price: "", specs: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("ebuy_user");
    if (!user || JSON.parse(user).role !== "admin") {
      alert("Access Denied: You must sign in with an Administrator role to access the Admin Portal.");
      router.push("/auth");
      return;
    }
    setAuthorized(true);
    fetchSettings();
    fetchDevices();
  }, [router]);

  const fetchSettings = async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data);
  };

  const fetchDevices = async () => {
    const res = await fetch("/api/devices");
    const data = await res.json();
    setDevices(data);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const adminSecret = localStorage.getItem("ebuy_admin_secret") || "";
    await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": adminSecret,
      },
      body: JSON.stringify(settings),
    });
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminSecret = localStorage.getItem("ebuy_admin_secret") || "";
    await fetch("/api/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": adminSecret,
      },
      body: JSON.stringify({
        name: newDevice.name,
        price: parseInt(newDevice.price),
        specs: newDevice.specs,
      }),
    });
    setNewDevice({ name: "", price: "", specs: "" });
    fetchDevices();
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm("Are you sure you want to remove this device?")) return;
    const adminSecret = localStorage.getItem("ebuy_admin_secret") || "";
    await fetch(`/api/devices/${id}`, {
      method: "DELETE",
      headers: { "x-admin-secret": adminSecret },
    });
    fetchDevices();
  };

  if (!authorized) return null;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:p-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 fade-in">
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Admin Management Portal</h2>
              <p className="text-xs text-slate-500">
                Manage dynamic Monnify accounts &amp; device inventory.
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="text-xs text-primary font-medium hover:underline"
            >
              Exit Admin
            </button>
          </div>

          {/* Tab Controller */}
          <div className="flex space-x-2 border-b pb-3">
            <button
              onClick={() => setActiveTab("accounts")}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition ${
                activeTab === "accounts"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              Monnify Account Settings
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition ${
                activeTab === "inventory"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              Inventory Manager
            </button>
          </div>

          {/* Tab 1: Monnify Accounts Config */}
          {activeTab === "accounts" && (
            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  required
                  value={settings.bankName}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  value={settings.accountNumber}
                  onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.accountName}
                  onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agent WhatsApp Number (Format: +234...)
                </label>
                <input
                  type="text"
                  required
                  value={settings.agentWhatsApp}
                  onChange={(e) => setSettings({ ...settings, agentWhatsApp: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={savingSettings}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm transition"
              >
                {savingSettings ? "Saving..." : settingsSaved ? "✓ Saved!" : "Update Active Account Settings 💾"}
              </button>
            </form>
          )}

          {/* Tab 2: Inventory Manager */}
          {activeTab === "inventory" && (
            <div className="space-y-4">
              {/* Add Device Form */}
              <form onSubmit={handleAddDevice} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Add New Device</h3>
                <input
                  type="text"
                  required
                  placeholder="Phone name (e.g., Tecno Spark 30)"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    required
                    placeholder="Price (₦)"
                    value={newDevice.price}
                    onChange={(e) => setNewDevice({ ...newDevice, price: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Specs (e.g., 8GB RAM)"
                    value={newDevice.specs}
                    onChange={(e) => setNewDevice({ ...newDevice, specs: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-primaryHover transition"
                >
                  + Add Phone
                </button>
              </form>

              {/* Device List */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
                  Current Device Stock
                </h3>
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{device.name}</span>
                        <span className="text-slate-500 block">
                          ₦{device.price.toLocaleString()} &bull; {device.specs}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
