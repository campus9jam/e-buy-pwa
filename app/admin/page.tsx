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

function isAdmin(user: any): boolean {
  return user && (user.role === "admin" || user.role === "super-admin");
}

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
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [editImageData, setEditImageData] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ebuy_user");
    if (stored) {
      try {
        const localUser = JSON.parse(stored);
        if (isAdmin(localUser)) {
          setAuthorized(true);
          setChecking(false);
          fetchSettings();
          fetchDevices();
          fetchOrders();
          fetch("/api/auth/me")
            .then((res) => res.json())
            .then((data) => { if (!data.user) console.log("Cookie not yet set"); })
            .catch(() => {});
          return;
        }
      } catch {}
    }

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user && isAdmin(data.user)) {
          localStorage.setItem("ebuy_user", JSON.stringify(data.user));
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
    if (!res.ok) return;
    const data = await res.json();
    setOrders(data);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      alert("Session expired. Please sign in again.");
      router.push("/auth");
      return;
    }
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
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newDevice.name,
        price: parseInt(newDevice.price),
        specs: newDevice.specs,
        image: newDeviceImage,
      }),
    });
    if (!res.ok) {
      alert("Session expired. Please sign in again.");
      router.push("/auth");
      return;
    }
    setNewDevice({ name: "", price: "", specs: "" });
    setNewDeviceImage(null);
    fetchDevices();
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm("Remove this device from inventory?")) return;
    await fetch(`/api/devices/${id}`, { method: "DELETE" });
    fetchDevices();
  };

  // === Remove image from existing device ===
  const handleRemoveImage = async (deviceId: string) => {
    if (!confirm("Remove the image from this device?")) return;
    setRemovingImageId(deviceId);
    try {
      const res = await fetch(`/api/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: null }),
      });
      if (!res.ok) {
        alert("Failed to remove image. Please try again.");
        return;
      }
      fetchDevices();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setRemovingImageId(null);
    }
  };

  // === Update device image ===
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>, deviceId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result as string;
      setEditImageData(imageData);
      // Immediately save to server
      try {
        const res = await fetch(`/api/devices/${deviceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageData }),
        });
        if (res.ok) {
          fetchDevices();
          setEditingDevice(null);
          setEditImageData(null);
        }
      } catch {}
    };
    reader.readAsDataURL(file);
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
          <div className="glass rounded-2xl px-8 py-6 text-center">
            <div className="animate-pulse text-primary text-sm font-medium">Verifying access...</div>
          </div>
        </div>
      </>
    );
  }

  if (!authorized) return null;

  const inputClass = "w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition";
  const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";
  const glassPanel = "glass-card rounded-2xl p-6";

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    verified: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const filteredOrders = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);

  // Stats
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const totalRevenue = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + (o.downPayment || 0), 0);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Header with stats */}
        <div className="glass-card rounded-2xl p-6 fade-in">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Portal</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage inventory, payments & orders</p>
            </div>
            <button onClick={() => router.push("/")} className="text-xs text-primary font-medium hover:underline">
              ← Exit Admin
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{devices.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Devices</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-500">₦{(totalRevenue / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Revenue</p>
            </div>
          </div>
        </div>

        {/* Tab Controller */}
        <div className="glass rounded-2xl p-2 flex space-x-1 fade-in">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition whitespace-nowrap ${activeTab === "accounts" ? "btn-primary" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            💳 Payment
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition whitespace-nowrap ${activeTab === "inventory" ? "btn-primary" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            📱 Inventory
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition whitespace-nowrap ${activeTab === "orders" ? "btn-primary" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            📋 Orders ({orders.length})
          </button>
        </div>

        {/* Tab 1: Payment Account Settings */}
        {activeTab === "accounts" && (
          <div className="glass-card rounded-2xl p-6 fade-in">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Payment Account Settings</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Active Monnify bank account for customer down payments.
            </p>
            <form onSubmit={handleSaveSettings} className="space-y-3">
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
              <button type="submit" disabled={savingSettings} className="btn-primary w-full py-3 rounded-xl text-sm disabled:opacity-50">
                {savingSettings ? "Saving..." : settingsSaved ? "✓ Saved!" : "Update Settings 💾"}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Inventory Manager */}
        {activeTab === "inventory" && (
          <div className="space-y-5 fade-in">
            {/* Add New Device */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Add New Device</h3>
              <form onSubmit={handleAddDevice} className="space-y-3">
                <input type="text" required placeholder="Phone name (e.g., Tecno Spark 30)" value={newDevice.name} onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })} className={inputClass} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" required placeholder="Price (₦)" value={newDevice.price} onChange={(e) => setNewDevice({ ...newDevice, price: e.target.value })} className={inputClass} />
                  <input type="text" placeholder="Specs (e.g., 8GB RAM)" value={newDevice.specs} onChange={(e) => setNewDevice({ ...newDevice, specs: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Device Image (Thumbnail)</label>
                  <div className="flex gap-3 items-start">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="flex-1 text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-slate-700 file:text-primary dark:file:text-blue-400 hover:file:bg-blue-100 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/80 dark:bg-slate-800/80"
                    />
                    {newDeviceImage && (
                      <img src={newDeviceImage} alt="Preview" className="h-20 w-20 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                    )}
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full py-3 rounded-xl text-sm">
                  + Add Device
                </button>
              </form>
            </div>

            {/* Device List */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Current Stock ({devices.length})
              </h3>
              <div className="space-y-3">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center gap-4 glass rounded-xl p-3">
                    {/* Thumbnail with remove/edit image */}
                    <div className="relative group flex-shrink-0">
                      {device.image ? (
                        <>
                          <div className="h-16 w-16 device-image-wrap flex items-center justify-center p-1">
                            <img src={device.image} alt={device.name} className="h-full w-full object-contain" />
                          </div>
                          {/* Remove image button */}
                          <button
                            onClick={() => handleRemoveImage(device.id)}
                            disabled={removingImageId === device.id}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-md transition disabled:opacity-50"
                            title="Remove image"
                          >
                            {removingImageId === device.id ? "⏳" : "✕"}
                          </button>
                        </>
                      ) : editingDevice === device.id ? (
                        <label className="h-16 w-16 device-image-wrap flex items-center justify-center cursor-pointer text-slate-400 hover:text-primary transition">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleEditImageUpload(e, device.id)}
                          />
                          <span className="text-xs text-center">📷 Upload</span>
                        </label>
                      ) : (
                        <button
                          onClick={() => setEditingDevice(device.id)}
                          className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-slate-700 transition text-xs"
                        >
                          📱 +
                        </button>
                      )}
                    </div>

                    {/* Device info */}
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">{device.name}</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{device.specs} • ₦{device.price.toLocaleString()}</p>
                    </div>

                    {/* Delete device button */}
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition flex-shrink-0 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {devices.length === 0 && (
                  <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">No devices in inventory yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Customer Orders & KYC */}
        {activeTab === "orders" && (
          <div className="space-y-4 fade-in">
            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["all", "pending", "verified", "completed", "rejected"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition whitespace-nowrap capitalize ${statusFilter === s ? "btn-primary" : "glass text-slate-600 dark:text-slate-300"}`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                {orders.length === 0 ? "No orders yet." : "No orders with this status."}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="glass-card rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {order.deviceImage ? (
                          <div className="h-12 w-12 device-image-wrap flex items-center justify-center p-1 flex-shrink-0">
                            <img src={order.deviceImage} alt={order.deviceName} className="h-full w-full object-contain" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-sm flex-shrink-0">📱</div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{order.customerName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{order.deviceName} • ₦{order.devicePrice?.toLocaleString() || "N/A"}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[order.status] || statusColors.pending}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Down payment info */}
                    <div className="glass rounded-lg p-3 flex justify-between text-xs">
                      <span className="text-amber-700 dark:text-amber-400 font-medium">Down Payment (30%)</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400">₦{order.downPayment?.toLocaleString() || 0}</span>
                    </div>

                    {/* KYC details */}
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pl-1">
                      <p>📞 {order.phone}</p>
                      <p>🆔 NIN: {order.nin || "N/A"}</p>
                      <p>🏦 BVN: {order.bvn || "N/A"}</p>
                      <p>📍 {order.address || "No address provided"}</p>
                      <p>📅 {new Date(order.createdAt).toLocaleString()}</p>
                    </div>

                    {/* Payment proof preview */}
                    {order.paymentProof && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-primary font-medium hover:underline">View payment receipt</summary>
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
                      <button onClick={() => handleUpdateOrderStatus(order.id, "verified")} className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${order.status === "verified" ? "bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"}`}>✓ Verify</button>
                      <button onClick={() => handleUpdateOrderStatus(order.id, "completed")} className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${order.status === "completed" ? "bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"}`}>✓ Complete</button>
                      <button onClick={() => handleUpdateOrderStatus(order.id, "rejected")} className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${order.status === "rejected" ? "bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"}`}>✗ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
