"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  type ReviewOrderDetails,
  submitOrderReview,
} from "@/lib/review-actions";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Phone,
} from "lucide-react";

const StarIcon = ({
  size = 36,
  color = "#f59e0b",
  fill = "none",
  style,
}: {
  size?: number;
  color?: string;
  fill?: string;
  style?: React.CSSProperties;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

interface CustomerReviewClientProps {
  initialOrder: ReviewOrderDetails;
}

const COMPLAINT_TAGS = [
  "❄️ Food Arrived Cold",
  "⏳ Late Delivery",
  "🍽️ Missing / Wrong Item",
  "🧂 Taste / Salt Issue",
  "🛵 Rider Behavior",
  "📦 Damaged Packaging",
  "🥩 Under/Over Cooked",
];

const SUGGESTED_PRAISES = [
  "Super hot and fresh pizza! The crust was crispy, toppings generous, and fast delivery. 10/10 highly recommended! ⭐⭐⭐⭐⭐",
  "Best taste in town! Amazing quality and wonderful experience. Definitely ordering again! ⭐⭐⭐⭐⭐",
  "Excellent service and delicious food. Everyone at home loved it! Keep up the great work! ⭐⭐⭐⭐⭐",
];

export default function CustomerReviewClient({ initialOrder }: CustomerReviewClientProps) {
  const [rating, setRating] = useState<number>(initialOrder.existingRating || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [copiedReview, setCopiedReview] = useState(false);
  const [submitted, setSubmitted] = useState(initialOrder.alreadyReviewed);
  const [submissionResult, setSubmissionResult] = useState<{
    isNegative?: boolean;
    googleReviewUrl?: string;
    message?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeRating = hoverRating || rating;

  // Toggle complaint tag
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Handle star selection
  const handleSelectRating = (selected: number) => {
    setRating(selected);
    // If 4 or 5 stars, auto-submit positive rating to database immediately
    if (selected >= 4 && !submitted) {
      startTransition(async () => {
        const res = await submitOrderReview({
          orderNumber: initialOrder.orderNumber,
          rating: selected,
          tags: ["Positive Experience"],
          feedback: "5-Star Customer Rating",
        });
        if (res.success) {
          setSubmitted(true);
          setSubmissionResult({
            isNegative: false,
            googleReviewUrl: res.googleReviewUrl || initialOrder.googleReviewUrl,
            message: res.message,
          });
        }
      });
    }
  };

  // Handle submit for 1-3 stars negative complaint
  const handleSubmitNegativeReview = () => {
    if (rating === 0) return;
    startTransition(async () => {
      const res = await submitOrderReview({
        orderNumber: initialOrder.orderNumber,
        rating,
        tags: selectedTags,
        feedback: feedbackText,
      });

      if (res.success) {
        setSubmitted(true);
        setSubmissionResult({
          isNegative: true,
          message: res.message,
        });
      }
    });
  };

  // Handle copy suggested review text
  const handleCopyReview = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedReview(true);
      setTimeout(() => setCopiedReview(false), 3000);
    }
  };

  const curr = initialOrder.currencySymbol || "Rs.";
  const isPositive = rating >= 4;
  const isNegative = rating > 0 && rating <= 3;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #09090b 0%, #18181b 100%)",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      {/* Container Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#18181b",
          border: "1px solid #27272a",
          borderRadius: "5px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Top Restaurant Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #27272a 0%, #1f1f23 100%)",
            borderBottom: "1px solid #333338",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          {initialOrder.shopLogo ? (
            <img
              src={initialOrder.shopLogo}
              alt={initialOrder.shopName}
              style={{
                width: 48,
                height: 48,
                borderRadius: "5px",
                objectFit: "cover",
                border: "2px solid #ea580c",
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "5px",
                background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 22,
                color: "#ffffff",
              }}
            >
              🍕
            </div>
          )}

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#ffffff" }}>
              {initialOrder.shopName}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <span
                style={{
                  background: "#ea580c",
                  color: "#ffffff",
                  fontSize: 10,
                  fontWeight: 900,
                  padding: "2px 6px",
                  borderRadius: "5px",
                  letterSpacing: "0.5px",
                }}
              >
                ORDER #{initialOrder.orderNumber}
              </span>
              <span style={{ fontSize: 12, color: "#a1a1aa" }}>
                Total: {curr} {initialOrder.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: "28px 24px" }}>
          {/* Greeting */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 6px", color: "#ffffff" }}>
              How was your meal, {initialOrder.customerName}?
            </h2>
            <p style={{ fontSize: 13, color: "#a1a1aa", margin: 0 }}>
              Tap a star below to rate your food & delivery experience
            </p>
          </div>

          {/* 5-Star Interactive Selector */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= activeRating;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleSelectRating(star)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    transition: "transform 0.15s ease",
                    transform: isFilled ? "scale(1.15)" : "scale(1)",
                  }}
                  title={`Rate ${star} Star${star > 1 ? "s" : ""}`}
                >
                  <StarIcon
                    size={42}
                    color={isFilled ? "#f59e0b" : "#3f3f46"}
                    fill={isFilled ? "#f59e0b" : "transparent"}
                    style={{
                      filter: isFilled ? "drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))" : "none",
                      transition: "all 0.2s ease",
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Dynamic Emotion Badge based on rating */}
          <div style={{ textAlign: "center", minHeight: 32, marginBottom: 24 }}>
            {activeRating === 1 && (
              <span style={{ fontSize: 14, fontWeight: 800, color: "#ef4444" }}>
                😡 Very Disappointed
              </span>
            )}
            {activeRating === 2 && (
              <span style={{ fontSize: 14, fontWeight: 800, color: "#f97316" }}>
                🙁 Needs Big Improvement
              </span>
            )}
            {activeRating === 3 && (
              <span style={{ fontSize: 14, fontWeight: 800, color: "#eab308" }}>
                😐 Average Experience
              </span>
            )}
            {activeRating === 4 && (
              <span style={{ fontSize: 14, fontWeight: 800, color: "#22c55e" }}>
                😊 Good & Tasty Meal!
              </span>
            )}
            {activeRating === 5 && (
              <span style={{ fontSize: 14, fontWeight: 900, color: "#10b981" }}>
                🤩 Loved It! Exceptional Pizza & Service!
              </span>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* BRANCH 1: POSITIVE EXPERIENCE (4 - 5 STARS) -> GOOGLE REVIEW BOOSTER */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {isPositive && (
            <div
              style={{
                background: "#1c221e",
                border: "1px solid #22c55e",
                borderRadius: "5px",
                padding: "20px",
                textAlign: "center",
                boxShadow: "0 4px 20px rgba(34, 197, 94, 0.15)",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "5px",
                  background: "#22c55e",
                  color: "#000000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <Sparkles size={24} />
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 6px", color: "#ffffff" }}>
                You made our day! 🎉
              </h3>
              <p style={{ fontSize: 13, color: "#d1d5db", margin: "0 0 18px", lineHeight: 1.4 }}>
                Would you mind sharing your love on <strong>Google Maps</strong>? It takes only 10 seconds and helps local food lovers find us!
              </p>

              {/* Suggested Praise Template with 1-Click Copy */}
              <div
                style={{
                  background: "#121413",
                  border: "1px dashed #3f3f46",
                  borderRadius: "5px",
                  padding: "12px",
                  marginBottom: 18,
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase" }}>
                    Suggested 5-Star Review (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyReview(SUGGESTED_PRAISES[0])}
                    style={{
                      background: copiedReview ? "#22c55e" : "#27272a",
                      color: copiedReview ? "#000000" : "#ffffff",
                      border: "none",
                      borderRadius: "5px",
                      padding: "3px 8px",
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {copiedReview ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedReview ? "Copied!" : "Copy Text"}</span>
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#d4d4d8", fontStyle: "italic" }}>
                  &ldquo;{SUGGESTED_PRAISES[0]}&rdquo;
                </p>
              </div>

              {/* Big Google Review Redirect CTA */}
              <a
                href={submissionResult?.googleReviewUrl || initialOrder.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 900,
                  padding: "14px 20px",
                  borderRadius: "5px",
                  textDecoration: "none",
                  boxShadow: "0 4px 15px rgba(234, 88, 12, 0.4)",
                  transition: "transform 0.15s ease",
                }}
              >
                <span>🌟 Post Directly on Google Reviews</span>
                <ExternalLink size={16} />
              </a>

              <div style={{ marginTop: 12, fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <ShieldCheck size={13} color="#22c55e" />
                <span>Redirects safely to official Google Business profile</span>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* BRANCH 2: NEGATIVE EXPERIENCE (1 - 3 STARS) -> REPUTATION GUARD     */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {isNegative && (
            <div
              style={{
                background: "#221717",
                border: "1px solid #ef4444",
                borderRadius: "5px",
                padding: "20px",
                boxShadow: "0 4px 20px rgba(239, 68, 68, 0.15)",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "5px",
                    background: "#ef4444",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: "#ffffff" }}>
                    We are truly sorry to hear this!
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#fca5a5" }}>
                    Your feedback is kept private and sent straight to store management.
                  </p>
                </div>
              </div>

              {!submitted ? (
                <>
                  {/* Selectable Complaint Chips */}
                  <div style={{ marginTop: 16, marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#f87171", textTransform: "uppercase", marginBottom: 8 }}>
                      What went wrong? (Select all that apply)
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {COMPLAINT_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            style={{
                              background: isSelected ? "#ef4444" : "#2d1c1c",
                              color: isSelected ? "#ffffff" : "#fca5a5",
                              border: `1px solid ${isSelected ? "#ef4444" : "#452626"}`,
                              borderRadius: "5px",
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Private Feedback Textarea */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", marginBottom: 6 }}>
                      Specific Details / Message to Manager:
                    </label>
                    <textarea
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Please let us know what happened so we can investigate and fix it..."
                      style={{
                        width: "100%",
                        background: "#121413",
                        border: "1px solid #452626",
                        borderRadius: "5px",
                        padding: "10px 12px",
                        color: "#ffffff",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                        resize: "none",
                      }}
                    />
                  </div>

                  {/* Submit Privately Button */}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSubmitNegativeReview}
                    style={{
                      width: "100%",
                      background: "#ef4444",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 900,
                      padding: "12px",
                      borderRadius: "5px",
                      border: "none",
                      cursor: isPending ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                    }}
                  >
                    <span>{isPending ? "Sending Red Alert..." : "🚨 Send Privately to Management"}</span>
                  </button>

                  <div style={{ marginTop: 10, textAlign: "center", fontSize: 11, color: "#9ca3af" }}>
                    🛡️ <strong>Reputation Guard:</strong> This will not be posted publicly on Google.
                  </div>
                </>
              ) : (
                /* Submitted Confirmation Screen */
                <div style={{ textAlign: "center", padding: "16px 8px" }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "5px",
                      background: "#22c55e",
                      color: "#000000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px",
                    }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 900, color: "#ffffff", margin: "0 0 6px" }}>
                    Manager WhatsApp Alert Sent!
                  </h4>
                  <p style={{ fontSize: 13, color: "#d1d5db", margin: 0, lineHeight: 1.4 }}>
                    Your complaint has been forwarded directly to restaurant management. A manager will contact you at <strong>{initialOrder.customerPhone || "your phone"}</strong> to make this right!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            background: "#111113",
            borderTop: "1px solid #27272a",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#71717a",
          }}
        >
          <span>Powered by SoleWhat Reputation Guard</span>
          <Link
            href={initialOrder.shopSlug ? `/${initialOrder.shopSlug}` : "/"}
            style={{ color: "#ea580c", textDecoration: "none", fontWeight: 700 }}
          >
            Back to Store ➔
          </Link>
        </div>
      </div>
    </div>
  );
}
