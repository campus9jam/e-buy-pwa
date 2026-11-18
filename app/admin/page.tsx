"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { DOWN_PAYMENT_PERCENT } from "@/lib/pricing";

interface Device {
  id: string;
  name: string;
  price: number;
  specs: string;
  image: string | null;
  category?: "bike" | "phone";
}

interface PaymentAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isActive: boolean;
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
  nin: string;
  address: string;
  guarantors: { name: string; phone: string; address: string }[];
  downPayment: number;
  vat: number;
  amountPaid: number;
  paymentProof: string | null;
  status: string;
  createdAt: string;
  paymentBankName?: string | null;
  paymentAccountNumber?: string | null;
  paymentAccountName?: string | null;
}

interface DeviceRequest {
  id: string;
  deviceName: string;
  notes: string | null;
  customerWhatsApp: string;
  status: string;
  createdAt: string;
}

type Tab = "accounts" | "inventory" | "orders" | "requests";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

function isAdmin(user: any): boolean {
  return user && (user.role === "admin" || user.role === "super-admin");
}

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("accounts");

  const [agentWhatsApp, setAgentWhatsApp] = useState("");
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);

  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [newAccount, setNewAccount] = useState({ bankName: "", accountNumber: "", accountName: "" });
  const [addingAccount, setAddingAccount] = useState(false);
  const [togglingAccountId, setTogglingAccountId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  const [devices, setDevices] = useState<Device[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deviceRequests, setDeviceRequests] = useState<DeviceRequest[]>([]);
  const [newDevice, setNewDevice] = useState({ name: "", price: "", specs: "", category: "bike" });
  const [newDeviceImage, setNewDeviceImage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [requestFilter, setRequestFilter] = useState<string>("pending");
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  useEffect(() => {
    const stored = localStorage.getItem("ebuy_user");
    if (stored) {
      try {
        const localUser = JSON.parse(stored);
        if (isAdmin(localUser)) {
          setAuthorized(true);
          setChecking(false);
          fetchAll();
          fetch("/api/auth/me").then((res) => res.json()).catch(() => {});
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
          fetchAll();
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

  const fetchAll = () => {
    fetchSettings();
    fetchAccounts();
    fetchDevices();
    fetchOrders();
    fetchDeviceRequests();
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setAgentWhatsApp(data.agentWhatsApp || "");
      }
    } catch {}
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/payment-accounts");
      if (res.ok) setAccounts(await res.json());
    } catch {}
  };

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      if (res.ok) setDevices(await res.json());
    } catch {}
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) return;
      setOrders(await res.json());
    } catch {}
  };

  const fetchDeviceRequests = async () => {
    try {
      const res = await fetch("/api/device-requests");
      if (!res.ok) return;
      setDeviceRequests(await res.json());
    } catch {}
  };

  // === Agent WhatsApp ===
  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWhatsApp(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentWhatsApp }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          showToast("Session expired. Please sign in again.", "error");
          setTimeout(() => router.push("/auth"), 1500);
          return;
        }
        showToast("Failed to save WhatsApp number.", "error");
        return;
      }
      showToast("Agent WhatsApp number updated!");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSavingWhatsApp(false);
    }
  };

  // === Payment accounts CRUD ===
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAccount(true);
    try {
      const res = await fetch("/api/payment-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      if (!res.ok) {
        if (res.status === 401) {
          showToast("Session expired. Please sign in again.", "error");
          setTimeout(() => router.push("/auth"), 1500);
          return;
        }
        showToast("Failed to add account.", "error");
        return;
      }
      showToast(`${newAccount.bankName} account added!`);
      setNewAccount({ bankName: "", accountNumber: "", accountName: "" });
      fetchAccounts();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setAddingAccount(false);
    }
  };

  const handleToggleAccount = async (account: PaymentAccount) => {
    setTogglingAccountId(account.id);
    try {
      const res = await fetch(`/api/payment-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !account.isActive }),
      });
      if (!res.ok) {
        showToast("Failed to update account.", "error");
        return;
      }
      showToast(account.isActive ? "Account deactivated." : "Account activated.");
      setAccounts((prev) => prev.map((a) => a.id === account.id ? { ...a, isActive: !a.isActive } : a));
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setTogglingAccountId(null);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Remove this payment account?")) return;
    setDeletingAccountId(id);
    try {
      const res = await fetch(`/api/payment-accounts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Failed to remove account.", "error");
        return;
      }
      showToast("Account removed.");
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setDeletingAccountId(null);
    }
  };

  // === Devices ===
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNewDeviceImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDevice.name,
          price: parseInt(newDevice.price),
          specs: newDevice.specs,
          image: newDeviceImage,
          category: newDevice.category,
        }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          showToast("Session expired. Please sign in again.", "error");
          setTimeout(() => router.push("/auth"), 1500);
          return;
        }
        showToast("Failed to add product.", "error");
        return;
      }
      showToast(`${newDevice.name} added to inventory!`);
      setNewDevice({ name: "", price: "", specs: "", category: "bike" });
      setNewDeviceImage(null);
      fetchDevices();
    } catch {
      showToast("Network error. Please try again.", "error");
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm("Remove this product from inventory?")) return;
    setDeletingDeviceId(id);
    try {
      const res = await fetch(`/api/devices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          showToast("Session expired. Please sign in again.", "error");
          setTimeout(() => router.push("/auth"), 1500);
          return;
        }
        showToast(data.error || "Failed to remove product.", "error");
        return;
      }
      showToast("Product removed from inventory.");
      setDevices((prev) => prev.filter((d) => d.id !== id));
      fetchDevices();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setDeletingDeviceId(null);
    }
  };

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
        showToast("Failed to remove image. Please try again.", "error");
        return;
      }
      showToast("Image removed.");
      setDevices((prev) => prev.map((d) => d.id === deviceId ? { ...d, image: null } : d));
      fetchDevices();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setRemovingImageId(null);
    }
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>, deviceId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result as string;
      try {
        const res = await fetch(`/api/devices/${deviceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageData }),
        });
        if (res.ok) {
          showToast("Image updated!");
          fetchDevices();
          setEditingDevice(null);
        } else {
          showToast("Failed to update image.", "error");
        }
      } catch {
        showToast("Network error.", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  // === Orders ===
  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        showToast("Failed to update order status.", "error");
        return;
      }
      showToast(`Order marked as ${status}.`);
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
      fetchOrders();
    } catch {
      showToast("Network error. Please try again.", "error");
    }
  };

  // === Device requests ===
  const handleUpdateRequestStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/device-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        showToast("Failed to update request.", "error");
        return;
      }
      showToast(`Request marked as ${status}.`);
      setDeviceRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    } catch {
      showToast("Network error. Please try again.", "error");
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Delete this device request?")) return;
    try {
      const res = await fetch(`/api/device-requests/${id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Failed to delete request.", "error");
        return;
      }
      showToast("Request deleted.");
      setDeviceRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      showToast("Network error. Please try again.", "error");
    }
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

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    verified: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    notified: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    fulfilled: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };

  const filteredOrders = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);
  const filteredRequests = requestFilter === "all" ? deviceRequests : deviceRequests.filter(r => r.status === requestFilter);
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const totalRevenue = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + (o.downPayment || 0), 0);
  const pendingRequestsCount = deviceRequests.filter(r => r.status === "pending").length;

  return (
    <>
      <Header />

      <div className="fixed top-20 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium slide-up ${
              toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? "✓ " : "⚠ "}{toast.message}
          </div>
        ))}
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Header with stats */}
        <div className="glass-card rounded-2xl p-6 fade-in">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-brand text-xl font-bold text-slate-900 dark:text-white">Admin Portal</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage inventory, payments & orders</p>
            </div>
            <button onClick={() => router.push("/")} className="text-xs text-primary font-medium hover:underline">
              ← Exit Admin
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-slate-900 dark:text-white">{devices.length}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Products</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-amber-500">{pendingCount}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Pending</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-500">₦{(totalRevenue / 1000).toFixed(0)}K</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Revenue</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-500">{pendingRequestsCount}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Requests</p>
            </div>
          </div>
        </div>

        {/* Tab Controller */}
        <div className="glass rounded-2xl p-2 flex space-x-1 fade-in overflow-x-auto">
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
            🏍️ Inventory
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition whitespace-nowrap ${activeTab === "orders" ? "btn-primary" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            📋 Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition whitespace-nowrap ${activeTab === "requests" ? "btn-primary" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            🔔 Requests ({deviceRequests.length})
          </button>
        </div>

        {/* Tab 1: Payment Accounts (multiple, rotating) */}
        {activeTab === "accounts" && (
          <div className="space-y-5 fade-in">
            {/* Agent WhatsApp */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Agent WhatsApp Number</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Customers are directed here after checkout.</p>
              <form onSubmit={handleSaveWhatsApp} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="+2348012345678"
                  value={agentWhatsApp}
                  onChange={(e) => setAgentWhatsApp(e.target.value)}
                  className={inputClass}
                />
                <button type="submit" disabled={savingWhatsApp} className="btn-primary px-5 rounded-xl text-sm disabled:opacity-50 whitespace-nowrap">
                  {savingWhatsApp ? "Saving..." : "Save"}
                </button>
              </form>
            </div>

            {/* Add new payment account */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Add Payment Account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Add multiple bank accounts — they'll shuffle automatically across checkouts to spread transactions and avoid confusion.
              </p>
              <form onSubmit={handleAddAccount} className="space-y-3">
                <input type="text" required placeholder="Bank Name" value={newAccount.bankName} onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })} className={inputClass} />
                <input type="text" required placeholder="Account Number" value={newAccount.accountNumber} onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })} className={inputClass} />
                <input type="text" required placeholder="Account Holder Name" value={newAccount.accountName} onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })} className={inputClass} />
                <button type="submit" disabled={addingAccount} className="btn-primary w-full py-3 rounded-xl text-sm disabled:opacity-50">
                  {addingAccount ? "Adding..." : "+ Add Account"}
                </button>
              </form>
            </div>

            {/* Account list */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Payment Accounts ({accounts.filter(a => a.isActive).length} active of {accounts.length})
              </h3>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div key={account.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{account.bankName}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${account.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                          {account.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{account.accountNumber}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{account.accountName}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleAccount(account)}
                        disabled={togglingAccountId === account.id}
                        className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition font-medium disabled:opacity-50"
                      >
                        {account.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        disabled={deletingAccountId === account.id}
                        className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition font-medium disabled:opacity-50"
                      >
                        {deletingAccountId === account.id ? "..." : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
                {accounts.length === 0 && (
                  <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">No payment accounts added yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Inventory Manager */}
        {activeTab === "inventory" && (
          <div className="space-y-5 fade-in">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Add New Product</h3>
              <form onSubmit={handleAddDevice} className="space-y-3">
                <input type="text" required placeholder="Product name (e.g., Jincheng 150)" value={newDevice.name} onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })} className={inputClass} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" required placeholder="Price (₦)" value={newDevice.price} onChange={(e) => setNewDevice({ ...newDevice, price: e.target.value })} className={inputClass} />
                  <select value={newDevice.category} onChange={(e) => setNewDevice({ ...newDevice, category: e.target.value })} className={inputClass}>
                    <option value="bike">Bike</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
                <input type="text" placeholder="Specs (e.g., 150cc | Manual | Petrol)" value={newDevice.specs} onChange={(e) => setNewDevice({ ...newDevice, specs: e.target.value })} className={inputClass} />
                <div>
                  <label className={labelClass}>Product Image (Thumbnail)</label>
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

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Current Stock ({devices.length})
              </h3>
              <div className="space-y-3">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center gap-4 glass rounded-xl p-3">
                    <div className="relative group flex-shrink-0">
                      {device.image ? (
                        <>
                          <div className="h-16 w-16 device-image-wrap flex items-center justify-center p-1">
                            <img src={device.image} alt={device.name} className="h-full w-full object-contain" />
                          </div>
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
                          📷 +
                        </button>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">
                        {device.name}
                        <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                          {device.category === "bike" ? "Bike" : "Phone"}
                        </span>
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{device.specs} • ₦{device.price.toLocaleString()}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      disabled={deletingDeviceId === device.id}
                      className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition flex-shrink-0 font-medium disabled:opacity-50"
                    >
                      {deletingDeviceId === device.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                ))}
                {devices.length === 0 && (
                  <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">No products in inventory yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Customer Orders & KYC */}
        {activeTab === "orders" && (
          <div className="space-y-4 fade-in">
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
                          <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-sm flex-shrink-0">🛍️</div>
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

                    <div className="glass rounded-lg p-3 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-400 font-medium">Down Payment ({DOWN_PAYMENT_PERCENT}%)</span>
                        <span className="font-bold text-amber-700 dark:text-amber-400">₦{order.downPayment?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>VAT</span>
                        <span>₦{(order.vat || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-200 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span>Total due at checkout</span>
                        <span>₦{(order.amountPaid || (order.downPayment || 0) + (order.vat || 0)).toLocaleString()}</span>
                      </div>
                    </div>

                    {order.paymentBankName && (
                      <div className="glass rounded-lg p-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Paid to:</span> {order.paymentBankName} • {order.paymentAccountNumber}
                      </div>
                    )}

                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pl-1">
                      <p>📞 {order.phone}</p>
                      <p>🆔 NIN: {order.nin || "N/A"}</p>
                      <p>📍 {order.address || "No address provided"}</p>
                      <p>📅 {new Date(order.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="glass rounded-lg p-3 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Guarantors ({order.guarantors?.length || 0}/3)
                      </p>
                      {order.guarantors && order.guarantors.length > 0 ? (
                        <ul className="space-y-1.5">
                          {order.guarantors.map((g, i) => (
                            <li key={i} className="text-xs text-slate-600 dark:text-slate-300">
                              <span className="font-semibold">{i + 1}. {g.name}</span>
                              <span className="block text-slate-500 dark:text-slate-400">📞 {g.phone}</span>
                              <span className="block text-slate-500 dark:text-slate-400">📍 {g.address}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500">No guarantors recorded for this order.</p>
                      )}
                    </div>

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

        {/* Tab 4: On-demand Device Requests */}
        {activeTab === "requests" && (
          <div className="space-y-4 fade-in">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["pending", "notified", "fulfilled", "all"].map((s) => (
                <button
                  key={s}
                  onClick={() => setRequestFilter(s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition whitespace-nowrap capitalize ${requestFilter === s ? "btn-primary" : "glass text-slate-600 dark:text-slate-300"}`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                {deviceRequests.length === 0 ? "No device requests yet." : "No requests with this status."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((req) => {
                  const cleanNumber = req.customerWhatsApp.replace(/[^0-9]/g, "");
                  const waLink = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Hi! We're reaching out about your request for ${req.deviceName} on E-Buy. `)}`;
                  return (
                    <div key={req.id} className="glass-card rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{req.deviceName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">📱 {req.customerWhatsApp}</p>
                          {req.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">📝 {req.notes}</p>}
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">📅 {new Date(req.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusColors[req.status] || statusColors.pending}`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-1 flex-wrap">
                        <a
                          href={waLink}
                          target="_blank"
                          className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-3 py-1.5 rounded-lg transition font-medium"
                        >
                          💬 Contact on WhatsApp
                        </a>
                        <button onClick={() => handleUpdateRequestStatus(req.id, "notified")} className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${req.status === "notified" ? "bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"}`}>Notified</button>
                        <button onClick={() => handleUpdateRequestStatus(req.id, "fulfilled")} className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${req.status === "fulfilled" ? "bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"}`}>Fulfilled</button>
                        <button onClick={() => handleDeleteRequest(req.id)} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition font-medium">Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
