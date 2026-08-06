"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

interface Device {
  id: string;
  name: string;
  price: number;
  specs: string;
  image: string | null;
}

interface Settings {
  bankName: string;
  accountNumber: string;
  accountName: string;
  agentWhatsApp: string;
}

interface Order {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceSpecs: string;
  deviceImage: string | null;
  devicePrice: number;
  customerName: string;
  phone: string;
  bvn: string;
  nin: string;
  address: string;
  downPayment: number;
  paymentProof: string | null;
  status: string;
  createdAt: string;
}

type Tab = "accounts" | "inventory" | "orders";

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [settings, setSettings] = useState<Settings>({
    bankName: "",
    accountNumber: "",
    accountName: "",
    agentWhatsApp: "",
  });
  const [devices, setDevices] = useState<Device[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [newDevice, setNewDevice] = useState({ name: "", price: "", specs: "" });
  const [newDeviceImage, setNewDeviceImage] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user && (data.user.role === "admin" || data.user.role === "super-admin")) {
          setAuthorized(true);
          fetchSettings();
          fetchDevices();
          fetchOrders();
        } else {
          router.push("/auth");
        }
        setChecking(false);
      })
      .catch(() => {
        router.push("/auth");
        setChecking(false);
      });
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

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNewDeviceImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newDevice.name,
        price: parseInt(newDevice.price),
        specs: newDevice.specs,
        image: newDeviceImage,
      }),
    });
    setNewDevice({ name: "", price: "", specs: "" });
    setNewDeviceImage(null);
    fetchDevices();
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm("Remove this device from inventory?")) return;
    await fetch(`/api/devices/${id}`, { method: "DELETE" });
    fetchDevices();
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchOrders();
  };

  if (checking) {
    return (
      <>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500">Verifying access...</p>
        </div>
      </>
    );
  }

  if (!authorized) return null;

  const inputClass = "w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none";
  const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";
  const cardClass = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl";

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    verified: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const filteredOrders = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6 fade-in">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Management Portal</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage payment accounts, inventory & customer orders.
              </p>
            </div>
            <button onClick={() => router.push("/")} className="text-xs text-primary font-medium hover:underline">
              Exit Admin
            </button>
          </div>

          {/* Tab Controller */}
          <div className="flex space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab("accounts")}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === "accounts" ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
            >
              💳 Payment Account
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === "inventory" ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
            >
              📱 Inventory
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === "orders" ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
            >
              📋 Orders ({orders.length})
            </button>
          </div>

          {/* Tab 1: Payment Account Settings */}
          {activeTab === "accounts" && (
            <form onSubmit={handleSaveSettings} className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Update the active Monnify bank account. Changes take effect immediately for all customers.
              </p>
              <div>
                <label className={labelClass}>Bank Name</label>
                <input type="text" required value={settings.bankName} onChange={(e) => setSettings({ ...settings, bankName: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input type="text" required value={settings.accountNumber} onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Account Holder Name</label>
                <input type="text" required value={settings.accountName} onChange={(e) => setSettings({ ...settings, accountName: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Agent WhatsApp Number (Format: +234...)</label>
                <input type="text" required value={settings.agentWhatsApp} onChange={(e) => setSettings({ ...settings, agentWhatsApp: e.target.value })} className={inputClass} />
              </div>
              <button type="submit" disabled={savingSettings} className="w-full bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-primaryHover disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm transition">
                {savingSettings ? "Saving..." : settingsSaved ? "✓ Saved!" : "Update Active Account Settings 💾"}
              </button>
            </form>
          )}

          {/* Tab 2: Inventory Manager */}
          {activeTab === "inventory" && (
            <div className="space-y-4">
              <form onSubmit={handleAddDevice} className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Add New Device</h3>
                <input type="text" required placeholder="Phone name (e.g., Tecno Spark 30)" value={newDevice.name} onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })} className={inputClass} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" required placeholder="Price (₦)" value={newDevice.price} onChange={(e) => setNewDevice({ ...newDevice, price: e.target.value })} className={inputClass} />
                  <input type="text" placeholder="Specs (e.g., 8GB RAM)" value={newDevice.specs} onChange={(e) => setNewDevice({ ...newDevice, specs: e.target.value })} className={inputClass} />
                </div>
                {/* Image Upload */}
                <div>
                  <label className={labelClass}>Device Image (Thumbnail)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-slate-800 file:text-primary dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                  />
                  {newDeviceImage && (
                    <img src={newDeviceImage} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                  )}
                </div>
                <button type="submit" className="w-full bg-primary text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-primaryHover transition">
                  + Add Phone
                </button>
              </form>

              {/* Device List with thumbnails */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Current Device Stock ({devices.length})</h3>
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div key={device.id} className={`flex items-center gap-3 p-3 ${cardClass} rounded-lg`}>
                      {/* Thumbnail */}
                      {device.image ? (
                        <img src={device.image} alt={device.name} className="h-12 w-12 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-lg flex-shrink-0">
                          📱
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">{device.name}</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{device.specs} • ₦{device.price.toLocaleString()}</p>
                      </div>
                      <button onClick={() => handleDeleteDevice(device.id)} className="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 px-2.5 py-1.5 rounded transition flex-shrink-0">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Customer Orders & KYC */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {/* Status Filter */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {["all", "pending", "verified", "completed", "rejected"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition whitespace-nowrap capitalize ${statusFilter === s ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
                  >
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                  {orders.length === 0 ? "No orders yet." : "No orders with this status."}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className={`${cardClass} p-4 space-y-2`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {/* Device thumbnail in order */}
                          {order.deviceImage ? (
                            <img src={order.deviceImage} alt={order.deviceName} className="h-10 w-10 object-cover rounded-lg flex-shrink-0" />
                          ) : (
                            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-sm flex-shrink-0">📱</div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{order.customerName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{order.deviceName} • ₦{order.devicePrice?.toLocaleString() || "N/A"}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[order.status] || statusColors.pending}`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Down payment info */}
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-2 rounded-lg flex justify-between text-xs">
                        <span className="text-amber-700 dark:text-amber-400 font-medium">Down Payment (30%)</span>
                        <span className="font-bold text-amber-700 dark:text-amber-400">₦{order.downPayment?.toLocaleString() || 0}</span>
                      </div>

                      {/* KYC details */}
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                        <p>📞 {order.phone}</p>
                        <p>🆔 NIN: {order.nin || "N/A"}</p>
                        <p>🏦 BVN: {order.bvn || "N/A"}</p>
                        <p>📍 {order.address || "No address provided"}</p>
                        <p>📅 {new Date(order.createdAt).toLocaleString()}</p>
                      </div>

                      {/* Payment proof preview */}
                      {order.paymentProof && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-primary font-medium">View payment receipt</summary>
                          {order.paymentProof.startsWith("data:image") ? (
                            <img src={order.paymentProof} alt="Payment proof" className="mt-2 rounded-lg max-h-48 w-auto border border-slate-200 dark:border-slate-700" />
                          ) : order.paymentProof.startsWith("data:application/pdf") ? (
                            <a href={order.paymentProof} download="receipt.pdf" className="mt-2 inline-block text-primary hover:underline">Download PDF receipt</a>
                          ) : (
                            <p className="mt-1 text-slate-400">Receipt uploaded</p>
                          )}
                        </details>
                      )}

                      {/* Status update buttons */}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleUpdateOrderStatus(order.id, "verified")} className={`text-xs px-2.5 py-1 rounded transition ${order.status === "verified" ? "bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"}`}>✓ Verify</button>
                        <button onClick={() => handleUpdateOrderStatus(order.id, "completed")} className={`text-xs px-2.5 py-1 rounded transition ${order.status === "completed" ? "bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"}`}>✓ Complete</button>
                        <button onClick={() => handleUpdateOrderStatus(order.id, "rejected")} className={`text-xs px-2.5 py-1 rounded transition ${order.status === "rejected" ? "bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"}`}>✗ Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
