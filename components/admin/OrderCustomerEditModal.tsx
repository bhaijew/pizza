"use client";

import { useState, useEffect, useTransition } from "react";
import type { Order } from "@/types/menu";
import { updateOrderCustomerDetails } from "@/lib/admin-actions";
import {
  X,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Check,
  RefreshCw,
} from "lucide-react";

export interface OrderCustomerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess?: (updatedOrder: Order) => void;
}

export default function OrderCustomerEditModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: OrderCustomerEditModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!order) return;

    let initialAddress = order.delivery_address || "";
    if (!initialAddress && order.notes?.includes("[DELIVERY:")) {
      const match = order.notes.match(/\[DELIVERY:\s*Address:\s*([^|]+)/i);
      if (match) initialAddress = match[1].trim();
    }

    setCustomerName(order.customer_name || "");
    setCustomerPhone(order.customer_phone || "");
    setDeliveryAddress(initialAddress);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleSave = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const res = await updateOrderCustomerDetails({
          orderId: order.id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryAddress: deliveryAddress.trim(),
        });

        if (res.success && res.order) {
          setSuccessMsg("Customer details updated successfully!");
          if (onSuccess) {
            onSuccess(res.order);
          }
          setTimeout(() => {
            onClose();
          }, 600);
        } else {
          setErrorMsg(res.error || "Failed to update customer details.");
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "#ffffff",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #334155",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "rgba(234, 88, 12, 0.2)",
                border: "1px solid rgba(234, 88, 12, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fb923c",
              }}
            >
              <User size={15} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "-0.2px" }}>
                Edit Customer Details
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                Order #{order.order_number || order.id}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#cbd5e1",
              borderRadius: "6px",
              padding: "5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "18px" }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: "14px",
                padding: "10px 12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                color: "#dc2626",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                marginBottom: "14px",
                padding: "10px 12px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "6px",
                color: "#16a34a",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Customer Name */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#475569",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                <User size={12} style={{ color: "#ea580c" }} />
                Customer Name:
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ali Khan"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0f172a",
                  background: "#ffffff",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#475569",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                <Phone size={12} style={{ color: "#ea580c" }} />
                Phone / WhatsApp Number:
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 03001234567"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  color: "#0f172a",
                  background: "#ffffff",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            {/* Delivery Address */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#475569",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                <MapPin size={12} style={{ color: "#ea580c" }} />
                Delivery Address:
              </label>
              <textarea
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g. House #14, Street 2, Sector G-10/4, Islamabad"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0f172a",
                  background: "#ffffff",
                  boxSizing: "border-box",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "12px 18px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: "#ea580c",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 800,
              cursor: isPending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 2px rgba(234, 88, 12, 0.3)",
            }}
          >
            {isPending ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={13} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
