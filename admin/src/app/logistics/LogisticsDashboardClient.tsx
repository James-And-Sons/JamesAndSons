'use client';

import { useState, useTransition } from 'react';
import { 
  approveReturnRequestAction, 
  rejectReturnRequestAction, 
  createPickupLocationAction, 
  submitNDRAction 
} from './actions';

interface ReturnItem {
  id: string;
  orderNumber: string;
  customerName: string;
  reason: string;
  status: string;
  adminNote: string;
  awbNumber: string;
  shipmentId: string;
  labelUrl: string;
  fulfillmentError: string;
  createdAt: string;
  items: { name: string; sku: string; quantity: number; price: number }[];
}

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  awbNumber: string;
  trackingNumber: string;
  fulfillmentError: string;
  shippingAddress: string;
  updatedAt: string;
}

export default function LogisticsDashboardClient({
  returns,
  orders,
  walletBalance,
  pickupLocations,
  connectionStatus
}: {
  returns: ReturnItem[];
  orders: OrderItem[];
  walletBalance: number;
  pickupLocations: any[];
  connectionStatus: string;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'returns' | 'warehouses' | 'ndr'>('overview');
  const [isPending, startTransition] = useTransition();

  // Return actions state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);

  // New location form state
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // NDR form state
  const [selectedNDROrder, setSelectedNDROrder] = useState<OrderItem | null>(null);
  const [ndrDate, setNdrDate] = useState('');
  const [ndrRemarks, setNdrRemarks] = useState('');

  const handleApproveReturn = (requestId: string) => {
    startTransition(async () => {
      const res = await approveReturnRequestAction(requestId);
      if (res.success) {
        alert('Return request approved and Shiprocket shipment created successfully!');
      } else {
        alert(`Failed to approve: ${res.error}`);
      }
    });
  };

  const handleRejectReturn = (requestId: string) => {
    if (!rejectionNote.trim()) {
      alert('Please provide a reason note for rejecting the return request.');
      return;
    }
    startTransition(async () => {
      const res = await rejectReturnRequestAction(requestId, rejectionNote);
      if (res.success) {
        setRejectingId(null);
        setRejectionNote('');
        alert('Return request rejected.');
      } else {
        alert(`Failed to reject: ${res.error}`);
      }
    });
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPickupLocationAction({
        pickup_location: locationName,
        name: contactPerson,
        email,
        phone,
        address,
        city,
        state,
        pin_code: pincode,
        country: 'India'
      });
      if (res.success) {
        alert('Pickup warehouse location registered successfully on Shiprocket!');
        setShowAddLocation(false);
        // Clear inputs
        setLocationName('');
        setContactPerson('');
        setEmail('');
        setPhone('');
        setAddress('');
        setCity('');
        setState('');
        setPincode('');
      } else {
        alert(`Failed to add location: ${res.message}`);
      }
    });
  };

  const handleScheduleReattempt = () => {
    if (!selectedNDROrder) return;
    if (!ndrDate) {
      alert('Please select a deferred re-delivery date.');
      return;
    }
    startTransition(async () => {
      const res = await submitNDRAction(selectedNDROrder.trackingNumber || selectedNDROrder.awbNumber, ndrDate, ndrRemarks || 'Admin rescheduled via NDR panel');
      if (res.success) {
        alert('Delivery re-attempt request submitted to Shiprocket!');
        setSelectedNDROrder(null);
        setNdrDate('');
        setNdrRemarks('');
      } else {
        alert(`Action failed: ${res.message || 'Check if shipment is eligible for NDR reattempt'}`);
      }
    });
  };

  // NDR eligibility filtering
  const ndrOrders = orders.filter(o => o.fulfillmentError?.includes('AWB') || o.status === 'PROCESSING' || o.status === 'SHIPPED');

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-6 font-mono text-[11px] uppercase tracking-wider">
        {(['overview', 'returns', 'warehouses', 'ndr'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-accent text-accent font-bold' 
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {tab === 'ndr' ? 'NDR Queue' : tab === 'warehouses' ? 'Pickup Warehouses' : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Wallet Balance widget */}
            <div className="premium-card p-6 rounded-lg bg-gradient-to-br from-surface to-surface/90 border border-border flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] tracking-widest text-muted uppercase">Shiprocket Wallet Balance</span>
                <span className={`text-[12px] ${connectionStatus === 'CONNECTED' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  ● {connectionStatus}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-[32px] text-accent font-normal m-0">
                  ₹{walletBalance.toLocaleString('en-IN')}
                </h3>
                {walletBalance < 500 && connectionStatus === 'CONNECTED' && (
                  <p className="font-mono text-[9px] text-[#f59e0b] uppercase tracking-wider mt-2 m-0">
                    ⚠ Warning: Low Balance. Label generation will fail.
                  </p>
                )}
              </div>
              <p className="font-mono text-[9px] text-muted mt-3 m-0">
                Top-ups must be made in the Shiprocket Console.
              </p>
            </div>

            {/* Outbound Shipments KPI */}
            <div className="premium-card p-6 rounded-lg flex flex-col justify-between">
              <span className="font-mono text-[9px] tracking-widest text-muted uppercase">Active Outbound Orders</span>
              <div className="mt-4">
                <h3 className="font-serif text-[32px] text-primary font-normal m-0">
                  {orders.filter(o => o.status === 'SHIPPED' || o.status === 'PROCESSING').length}
                </h3>
              </div>
              <p className="font-mono text-[9px] text-muted mt-3 m-0">Out of {orders.length} total active orders</p>
            </div>

            {/* Returns KPI */}
            <div className="premium-card p-6 rounded-lg flex flex-col justify-between">
              <span className="font-mono text-[9px] tracking-widest text-muted uppercase">Pending Return Requests</span>
              <div className="mt-4">
                <h3 className="font-serif text-[32px] text-[#f59e0b] font-normal m-0">
                  {returns.filter(r => r.status === 'PENDING').length}
                </h3>
              </div>
              <p className="font-mono text-[9px] text-muted mt-3 m-0">{returns.length} registered requests total</p>
            </div>
          </div>

          {/* Simple simulated charts/analytics in CSS */}
          <div className="premium-card p-6 rounded-lg space-y-4">
            <h3 className="font-serif text-[18px] text-primary font-normal m-0">Logistics Performance Metrics</h3>
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between font-mono text-[10px] text-muted mb-1 uppercase tracking-wider">
                  <span>Successful Deliveries</span>
                  <span>{orders.length ? Math.round((orders.filter(o => o.status === 'DELIVERED').length / orders.length) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full" 
                    style={{ width: `${orders.length ? (orders.filter(o => o.status === 'DELIVERED').length / orders.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-mono text-[10px] text-muted mb-1 uppercase tracking-wider">
                  <span>Return Rate (RTO / Exchanges)</span>
                  <span>{orders.length ? Math.round((returns.length / orders.length) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full" 
                    style={{ width: `${orders.length ? (returns.length / orders.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Returns Queue Tab */}
      {activeTab === 'returns' && (
        <div className="premium-card rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-surface-muted/40">
            <h2 className="font-serif text-[18px] text-primary font-normal m-0">Exchanges &amp; Returns Approval</h2>
          </div>

          <table className="w-full text-left border-collapse">
            <thead className="border-b border-border bg-surface-muted/20 font-mono text-[9px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3">Fulfillment Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono text-[12px]">
              {returns.map(r => (
                <>
                  <tr key={r.id} className="hover:bg-surface-muted/20 cursor-pointer" onClick={() => setExpandedReturnId(expandedReturnId === r.id ? null : r.id)}>
                    <td className="px-6 py-4 font-bold text-accent">{r.orderNumber}</td>
                    <td className="px-6 py-4">{r.customerName}</td>
                    <td className="px-6 py-4 truncate max-w-[200px]">{r.reason}</td>
                    <td className="px-6 py-4">
                      {r.status === 'APPROVED' ? (
                        <span className="status-pill status-paid">
                          <span className="dot bg-emerald-500" /> APPROVED
                        </span>
                      ) : r.status === 'REJECTED' ? (
                        <span className="status-pill status-pending bg-rose-950/20 text-rose-400 border-rose-500/30">
                          <span className="dot bg-rose-500" /> REJECTED
                        </span>
                      ) : (
                        <span className="status-pill status-processing">
                          <span className="dot bg-amber-500" /> PENDING
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApproveReturn(r.id)}
                            disabled={isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-sm disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingId(r.id)}
                            disabled={isPending}
                            className="bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/30 font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-sm disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === 'APPROVED' && r.labelUrl && (
                        <a
                          href={r.labelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block border border-accent text-accent hover:bg-accent/10 font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-sm"
                        >
                          Download Label
                        </a>
                      )}
                      {r.status === 'APPROVED' && !r.labelUrl && r.fulfillmentError && (
                        <button
                          onClick={() => handleApproveReturn(r.id)}
                          disabled={isPending}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-sm disabled:opacity-50"
                        >
                          Retry Sync AWB
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Row containing Return Request Details */}
                  {expandedReturnId === r.id && (
                    <tr>
                      <td colSpan={5} className="px-8 py-4 bg-surface-muted/30 border-t border-b border-border/60">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-[11px] text-primary">
                          <div>
                            <p className="font-bold text-accent uppercase tracking-wider mb-2">Request Details</p>
                            <p><strong>Created At:</strong> {new Date(r.createdAt).toLocaleString()}</p>
                            <p><strong>Reason Note:</strong> {r.reason}</p>
                            {r.adminNote && <p className="text-[#f87171]"><strong>Admin Rejection Note:</strong> {r.adminNote}</p>}
                            {r.fulfillmentError && (
                              <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 p-3 rounded mt-2">
                                <strong>Logistics Warning:</strong> {r.fulfillmentError}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-accent uppercase tracking-wider mb-2">Return Items</p>
                            <ul className="list-disc pl-4 space-y-1">
                              {r.items.map((item, idx) => (
                                <li key={idx}>
                                  {item.name} (SKU: {item.sku}) &times; {item.quantity} - ₹{item.price}
                                </li>
                              ))}
                            </ul>
                            {r.shipmentId && (
                              <p className="mt-3">
                                <strong>Shiprocket Shipment ID:</strong> {r.shipmentId} <br />
                                <strong>AWB Number:</strong> {r.awbNumber || 'Assigning...'}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Reject Modal-in-place */}
                  {rejectingId === r.id && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-rose-950/10 border-t border-border">
                        <div className="flex flex-col gap-3 font-mono">
                          <label className="text-rose-400 text-[11px] uppercase tracking-wider">Provide rejection note</label>
                          <textarea
                            value={rejectionNote}
                            onChange={e => setRejectionNote(e.target.value)}
                            placeholder="Reason for rejecting this return..."
                            className="w-full bg-background border border-border text-primary text-[12px] p-3 focus:outline-none focus:border-rose-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRejectReturn(r.id)}
                              disabled={isPending}
                              className="bg-rose-700 hover:bg-rose-800 text-white font-mono text-[9px] uppercase tracking-wider px-4 py-2 rounded-sm"
                            >
                              Confirm Rejection
                            </button>
                            <button
                              onClick={() => setRejectingId(null)}
                              className="bg-transparent border border-border text-muted hover:text-primary font-mono text-[9px] uppercase tracking-wider px-4 py-2 rounded-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}

              {returns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted font-mono text-[10px] uppercase tracking-widest">
                    No return requests registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pickup Locations Tab */}
      {activeTab === 'warehouses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-[18px] text-primary font-normal m-0">Registered Warehouse Sites</h2>
            <button
              onClick={() => setShowAddLocation(!showAddLocation)}
              className="bg-accent text-black hover:bg-accent-hover font-mono text-[9px] uppercase tracking-wider px-4 py-2 font-bold rounded-sm"
            >
              {showAddLocation ? 'Hide Form' : '+ Add Pickup Location'}
            </button>
          </div>

          {/* Add warehouse form */}
          {showAddLocation && (
            <form onSubmit={handleAddLocation} className="premium-card p-6 rounded-lg space-y-4 font-mono text-[12px]">
              <h3 className="font-serif text-[15px] text-primary font-normal uppercase tracking-wider m-0">Register New Pickup Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Pickup Location Name ID</label>
                  <input required placeholder="e.g. Aligarh Primary Warehouse" value={locationName} onChange={e => setLocationName(e.target.value)} className="w-full bg-background border border-border text-primary px-3 py-2 focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Contact Person Name</label>
                  <input required placeholder="e.g. Vishal Kumar" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full bg-background border border-border text-primary px-3 py-2 focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Email ID</label>
                  <input required type="email" placeholder="e.g. operations@jamesandsons.in" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background border border-border text-primary px-3 py-2 focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Contact Phone</label>
                  <input required placeholder="e.g. 9999999999" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-background border border-border text-primary px-3 py-2 focus:outline-none focus:border-accent" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Street Address</label>
                  <input required placeholder="e.g. Building B-24, Phase 2, Industrial Area" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-background border border-border text-primary px-3 py-2 focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">City</label>
                  <input required placeholder="Aligarh" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-background border border-border text-primary px-3 py-2 focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">State</label>
                  <input required placeholder="Uttar Pradesh" value={state} onChange={e => setState(e.target.value)} className="w-full bg-background border border-border text-primary px-3 py-2 focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Pincode</label>
                  <input required placeholder="202001" maxLength={6} value={pincode} onChange={e => setPincode(e.target.value)} className="w-full bg-background border border-border text-primary px-3 py-2 focus:outline-none focus:border-accent" />
                </div>
              </div>
              <button disabled={isPending} type="submit" className="bg-accent text-black font-bold uppercase px-6 py-2.5 rounded-sm hover:bg-accent-hover transition-all">
                {isPending ? 'Registering...' : 'Register Location'}
              </button>
            </form>
          )}

          {/* Locations list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pickupLocations.map((loc: any, idx: number) => (
              <div key={idx} className="premium-card p-6 rounded-lg space-y-3 font-mono text-[11px] relative">
                <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
                  <span className="font-bold text-accent text-[12px] uppercase">{loc.pickup_location}</span>
                  {loc.status === 'active' && (
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Active</span>
                  )}
                </div>
                <p><strong>Contact:</strong> {loc.name}</p>
                <p><strong>Phone:</strong> {loc.phone}</p>
                <p><strong>Email:</strong> {loc.email}</p>
                <p><strong>Address:</strong> {loc.address}, {loc.city}, {loc.state} - {loc.pin_code}</p>
              </div>
            ))}

            {pickupLocations.length === 0 && (
              <div className="col-span-2 premium-card p-8 text-center text-muted font-mono text-[10px] uppercase tracking-widest">
                No active pickup locations retrieved. Check your Shiprocket credentials.
              </div>
            )}
          </div>
        </div>
      )}

      {/* NDR Queue Tab */}
      {activeTab === 'ndr' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Shipments table */}
          <div className="lg:col-span-2 premium-card rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-surface-muted/40">
              <h3 className="font-serif text-[18px] text-primary font-normal m-0">Shipments &amp; Delivery Tracking</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-border bg-surface-muted/20 font-mono text-[9px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">AWB / Courier Code</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-[12px]">
                {ndrOrders.map(o => (
                  <tr key={o.id} className={`hover:bg-surface-muted/20 ${selectedNDROrder?.id === o.id ? 'bg-surface-muted/40 border-l-2 border-accent' : ''}`}>
                    <td className="px-6 py-4 font-bold text-accent">{o.orderNumber}</td>
                    <td className="px-6 py-4">{o.customerName}</td>
                    <td className="px-6 py-4">{o.trackingNumber || o.awbNumber || 'No AWB assigned'}</td>
                    <td className="px-6 py-4">
                      <span className="status-pill status-processing">
                        <span>{o.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedNDROrder(o)}
                        className="border border-accent text-accent hover:bg-accent/10 font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-sm"
                      >
                        Reschedule
                      </button>
                    </td>
                  </tr>
                ))}
                {ndrOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted font-mono text-[10px] uppercase tracking-widest">
                      No active shipments in the pipeline.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Reschedule NDR Form */}
          <div className="premium-card p-6 rounded-lg space-y-4 font-mono text-[12px]">
            <h3 className="font-serif text-[16px] text-primary font-normal uppercase tracking-wider m-0">Logistics Re-attempt</h3>
            {selectedNDROrder ? (
              <div className="space-y-4">
                <div className="bg-surface-muted p-4 rounded border border-border">
                  <p><strong>Order Number:</strong> {selectedNDROrder.orderNumber}</p>
                  <p><strong>Customer:</strong> {selectedNDROrder.customerName}</p>
                  <p><strong>AWB Code:</strong> {selectedNDROrder.trackingNumber || selectedNDROrder.awbNumber}</p>
                </div>

                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Deferred Delivery Date</label>
                  <input
                    type="date"
                    value={ndrDate}
                    onChange={e => setNdrDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-background border border-border text-primary px-3 py-2 focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Reattempt Instructions / Notes</label>
                  <textarea
                    value={ndrRemarks}
                    onChange={e => setNdrRemarks(e.target.value)}
                    placeholder="Provide courier directions (e.g. Gate open, deliver between 10am-4pm, customer was offline)..."
                    className="w-full bg-background border border-border text-primary text-[12px] p-3 focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={isPending}
                    onClick={handleScheduleReattempt}
                    className="flex-1 bg-accent text-black font-bold uppercase py-2.5 rounded-sm hover:bg-accent-hover text-center"
                  >
                    {isPending ? 'Scheduling...' : 'Request Re-attempt'}
                  </button>
                  <button
                    onClick={() => setSelectedNDROrder(null)}
                    className="border border-border text-muted hover:text-primary px-4 py-2.5 rounded-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted py-8 font-mono text-[10px] uppercase tracking-wider italic">
                Select an active shipment from the queue to schedule a delivery re-attempt.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
