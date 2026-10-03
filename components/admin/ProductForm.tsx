"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product, Category, ProductVariation, ExtraTopping } from "@/types/menu";
import { createProduct, updateProduct } from "@/lib/admin-actions";
import { PRESET_FOOD_IMAGES, type PresetFoodImage } from "@/lib/preset-images";

interface ProductFormProps {
  initialProduct?: Product | null;
  categories: Category[];
  currencySymbol?: string;
}

export default function ProductForm({
  initialProduct,
  categories,
  currencySymbol = "$",
}: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(
    initialProduct?.name
      ? initialProduct.name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")
      : ""
  );
  const [categoryId, setCategoryId] = useState<string>(
    initialProduct?.category_id != null ? String(initialProduct.category_id) : (categories[0]?.id ? String(categories[0].id) : "")
  );
  const [price, setPrice] = useState<string>(
    initialProduct?.price != null ? String(initialProduct.price) : ""
  );
  const [imageUrl, setImageUrl] = useState(initialProduct?.image_url || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [sortOrder, setSortOrder] = useState<number>(initialProduct?.sort_order ?? 0);
  const [isAvailable, setIsAvailable] = useState<boolean>(initialProduct?.is_available ?? true);
  const [isActive, setIsActive] = useState<boolean>(initialProduct?.is_active ?? true);

  // Feature 2: Variations & Toppings
  const [variations, setVariations] = useState<ProductVariation[]>(initialProduct?.variations || []);
  const [extraToppings, setExtraToppings] = useState<ExtraTopping[]>(initialProduct?.extra_toppings || []);

  // Feature 7: Inventory Tracking
  const [trackInventory, setTrackInventory] = useState<boolean>(initialProduct?.track_inventory ?? false);
  const [stockQuantity, setStockQuantity] = useState<number>(initialProduct?.stock_quantity ?? 50);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(initialProduct?.low_stock_threshold ?? 5);

  // Custom upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);

  // Preset image filter tab
  const [activeImageTab, setActiveImageTab] = useState<string>("All");

  const imageCategories = ["All", "Pizza", "Burger", "Fries & Sides", "Drinks", "Dessert"];

  const filteredPresetImages = PRESET_FOOD_IMAGES.filter((img) =>
    activeImageTab === "All" ? true : img.category === activeImageTab
  );

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialProduct) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  const handleSelectPresetImage = (preset: PresetFoodImage) => {
    setImageUrl(preset.url);
    setUploadFileName(null);
    if (!name.trim()) {
      setName(preset.name);
      setSlug(
        preset.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  // Custom File Upload handler (converts to base64 DataURL with client resizing)
  const processImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size should be less than 5MB.");
      return;
    }

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  // Variations handlers
  const addVariation = () => {
    setVariations((prev) => [
      ...prev,
      { id: `var-${Date.now()}`, name: "Medium", price: parseFloat(price) || 0, is_default: prev.length === 0 },
    ]);
  };

  const updateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    setVariations((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === "is_default" && value === true) {
        copy.forEach((v, i) => {
          if (i !== index) v.is_default = false;
        });
      }
      return copy;
    });
  };

  const removeVariation = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const applyPizzaSizesPreset = () => {
    const baseP = parseFloat(price) || 800;
    setVariations([
      { id: "var-small", name: 'Small (8")', price: Math.round(baseP * 0.75), is_default: false },
      { id: "var-medium", name: 'Medium (10")', price: baseP, is_default: true },
      { id: "var-large", name: 'Large (12")', price: Math.round(baseP * 1.45), is_default: false },
      { id: "var-xl", name: 'Family / XL (14")', price: Math.round(baseP * 1.9), is_default: false },
    ]);
  };

  // Extra Toppings handlers
  const addTopping = () => {
    setExtraToppings((prev) => [
      ...prev,
      { id: `top-${Date.now()}`, name: "Extra Cheese", price: 150 },
    ]);
  };

  const updateTopping = (index: number, field: keyof ExtraTopping, value: any) => {
    setExtraToppings((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeTopping = (index: number) => {
    setExtraToppings((prev) => prev.filter((_, i) => i !== index));
  };

  const applyToppingsPreset = () => {
    setExtraToppings([
      { id: "top-cheese", name: "Extra Mozzarella Cheese", price: 150 },
      { id: "top-olives", name: "Black Olives", price: 80 },
      { id: "top-mushrooms", name: "Fresh Mushrooms", price: 100 },
      { id: "top-jalapenos", name: "Spicy Jalapeños", price: 80 },
      { id: "top-chicken", name: "Extra Grilled Chicken", price: 180 },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!categoryId) {
      setErrorMessage("Please select a category.");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMessage("Please enter a valid price (0.00 or higher).");
      return;
    }

    const formData = new FormData();
    formData.set("name", name);
    formData.set("slug", slug);
    formData.set("category_id", categoryId);
    formData.set("price", price);
    formData.set("image_url", imageUrl);
    formData.set("description", description);
    formData.set("sort_order", sortOrder.toString());
    formData.set("is_available", isAvailable ? "true" : "false");
    formData.set("is_active", isActive ? "true" : "false");

    // Feature 2: Variations & Extra Toppings
    formData.set("variations", JSON.stringify(variations));
    formData.set("extra_toppings", JSON.stringify(extraToppings));

    // Feature 7: Inventory Management
    formData.set("track_inventory", trackInventory ? "true" : "false");
    formData.set("stock_quantity", stockQuantity.toString());
    formData.set("low_stock_threshold", lowStockThreshold.toString());

    startTransition(async () => {
      let res;
      if (initialProduct?.id) {
        res = await updateProduct(Number(initialProduct.id), { error: null, success: false }, formData);
      } else {
        res = await createProduct({ error: null, success: false }, formData);
      }

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        router.push("/admin/products");
        router.refresh();
      }
    });
  };

  return (
    <div>
      {/* ─── Back Button & Header ──────────────────────── */}
      <div style={{ marginBottom: "20px" }}>
        <Link
          href="/admin/products"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "#64748b",
            textDecoration: "none",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back to Products</span>
        </Link>

        <h1
          style={{
            fontSize: "24px",
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
            margin: "0 0 4px",
          }}
        >
          {initialProduct ? `Edit Product: ${initialProduct.name}` : "Add New Menu Product"}
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Fill in details, upload your custom photo or pick from preset food photos.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "5px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
          {/* ─── LEFT COLUMN: PRODUCT DETAILS ────────────── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              General Information
            </h2>

            {/* Name */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Truffle Mushroom &amp; Garlic Pizza"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Slug */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. truffle-mushroom-pizza"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#64748b",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Category & Price */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Category *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="" disabled>Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Price ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 14.99"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Description &amp; Ingredients
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="San Marzano tomato sauce, fresh mozzarella, wild mushrooms, white truffle oil, rosemary..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Sort Order & Availability Toggles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", alignItems: "center" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Sort Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "14px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#1e293b", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#16a34a" }}
                  />
                  <span>In Stock (Available)</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#1e293b", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#ef4444" }}
                  />
                  <span>Visible on Menu</span>
                </label>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: CUSTOM UPLOAD & PRESET GALLERY ─── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                Product Image &amp; Photos
              </h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Upload a custom image from your computer, or pick from our high-res presets.
              </p>
            </div>

            {/* ─── CUSTOM FILE UPLOAD / DRAG & DROP ──────── */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? "2px dashed #ef4444" : "1px dashed #cbd5e1",
                background: isDragging ? "#fef2f2" : "#f8fafc",
                borderRadius: "5px",
                padding: "20px 16px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: "none" }}
              />

              <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: isDragging ? "#ef4444" : "#64748b" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>

              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                Click to Upload Custom Image
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                or drag &amp; drop file here (PNG, JPG, WEBP up to 5MB)
              </div>
              {uploadFileName && (
                <div style={{ marginTop: "6px", fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                  ✓ Selected: {uploadFileName}
                </div>
              )}
            </div>

            {/* Custom URL Input fallback */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}>
                Or Enter Image URL
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="url"
                  value={imageUrl.startsWith("data:") ? "" : imageUrl}
                  onChange={(e) => {
                    setUploadFileName(null);
                    setImageUrl(e.target.value);
                  }}
                  placeholder={imageUrl.startsWith("data:") ? "Custom file uploaded" : "https://images.unsplash.com/..."}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl("");
                      setUploadFileName(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "5px",
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      color: "#64748b",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Active Selected Image Preview */}
            <div
              style={{
                width: "100%",
                height: "170px",
                borderRadius: "5px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name || "Product preview"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div style={{ textAlign: "center", color: "#94a3b8" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 6px" }}>
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                    <circle cx="9" cy="9" r="2"></circle>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                  </svg>
                  <div style={{ fontSize: "12px" }}>No photo selected yet</div>
                </div>
              )}
            </div>

            {/* ─── PRESET PHOTO GALLERY PICKER ──────────── */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Or Choose from Preset Gallery
                </span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  1-Click Select
                </span>
              </div>

              {/* Category tabs for presets */}
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  flexWrap: "wrap",
                  marginBottom: "10px",
                }}
              >
                {imageCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveImageTab(cat)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "5px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: activeImageTab === cat ? "1px solid #fecaca" : "1px solid #e2e8f0",
                      background: activeImageTab === cat ? "#fef2f2" : "#ffffff",
                      color: activeImageTab === cat ? "#dc2626" : "#64748b",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid of food photo thumbnails */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(75px, 1fr))",
                  gap: "6px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  padding: "4px",
                  border: "1px solid #f1f5f9",
                  borderRadius: "5px",
                  background: "#fafafa",
                }}
              >
                {filteredPresetImages.map((preset) => {
                  const isSelected = imageUrl === preset.url;
                  return (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => handleSelectPresetImage(preset)}
                      title={preset.name}
                      style={{
                        position: "relative",
                        aspectRatio: "1",
                        borderRadius: "5px",
                        overflow: "hidden",
                        border: isSelected ? "2px solid #ef4444" : "1px solid #e2e8f0",
                        padding: 0,
                        cursor: "pointer",
                        background: "#fff",
                        boxShadow: isSelected ? "0 0 0 2px rgba(239, 68, 68, 0.2)" : "none",
                      }}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            top: "3px",
                            right: "3px",
                            width: "16px",
                            height: "16px",
                            borderRadius: "5px",
                            background: "#ef4444",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ─── FEATURE 2: PIZZA SIZES & VARIATIONS ─────────── */}
        <div
          style={{
            marginTop: "24px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
              paddingBottom: "14px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Pizza Sizes &amp; Portion Variations
                </h2>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                Optional. Configure Small, Medium, Large sizes. Menu displays &quot;From {currencySymbol}&quot; and prompts customer to select.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={applyPizzaSizesPreset}
                style={{
                  padding: "6px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ⚡ Add Pizza Sizes (S / M / L / XL)
              </button>
              <button
                type="button"
                onClick={addVariation}
                style={{
                  padding: "6px 14px",
                  borderRadius: "5px",
                  border: "1px solid #ef4444",
                  background: "#fef2f2",
                  color: "#ef4444",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Add Size
              </button>
            </div>
          </div>

          {variations.length === 0 ? (
            <div
              style={{
                padding: "20px",
                background: "#f8fafc",
                borderRadius: "5px",
                border: "1px dashed #cbd5e1",
                textAlign: "center",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              No size variations set. The single base price ({currencySymbol}{price || "0"}) will be used. Click <strong>&quot;⚡ Add Pizza Sizes&quot;</strong> to set standard pizza sizes quickly.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 100px 40px",
                  gap: "12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  padding: "0 8px",
                }}
              >
                <span>Size / Variation Name</span>
                <span>Price ({currencySymbol})</span>
                <span style={{ textAlign: "center" }}>Default</span>
                <span></span>
              </div>

              {variations.map((v, idx) => (
                <div
                  key={v.id || idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 140px 100px 40px",
                    gap: "12px",
                    alignItems: "center",
                    padding: "8px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "5px",
                  }}
                >
                  <input
                    type="text"
                    value={v.name}
                    placeholder="e.g. Medium (10 inch)"
                    onChange={(e) => updateVariation(idx, "name", e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "5px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                    }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={v.price}
                    placeholder="Price"
                    onChange={(e) => updateVariation(idx, "price", parseFloat(e.target.value) || 0)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "5px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "12px" }}>
                      <input
                        type="radio"
                        name="default_variation"
                        checked={!!v.is_default}
                        onChange={() => updateVariation(idx, "is_default", true)}
                        style={{ accentColor: "#ef4444" }}
                      />
                      <span style={{ fontSize: "11px", color: "#475569" }}>Default</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariation(idx)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Remove variation"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── FEATURE 2: EXTRA TOPPINGS / ADD-ONS ─────────── */}
        <div
          style={{
            marginTop: "24px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
              paddingBottom: "14px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
                <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Extra Toppings &amp; Crust Add-ons
                </h2>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                Optional add-ons (extra cheese, mushrooms, jalapenos) customers can select for an additional fee.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={applyToppingsPreset}
                style={{
                  padding: "6px 12px",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ⚡ Add Pizza Toppings Preset
              </button>
              <button
                type="button"
                onClick={addTopping}
                style={{
                  padding: "6px 14px",
                  borderRadius: "5px",
                  border: "1px solid #f59e0b",
                  background: "#fffbeb",
                  color: "#b45309",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Add Topping
              </button>
            </div>
          </div>

          {extraToppings.length === 0 ? (
            <div
              style={{
                padding: "20px",
                background: "#f8fafc",
                borderRadius: "5px",
                border: "1px dashed #cbd5e1",
                textAlign: "center",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              No extra toppings configured. Click <strong>&quot;⚡ Add Pizza Toppings Preset&quot;</strong> to insert cheese, olives, mushrooms, etc.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 40px",
                  gap: "12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  padding: "0 8px",
                }}
              >
                <span>Topping / Add-on Name</span>
                <span>Extra Cost ({currencySymbol})</span>
                <span></span>
              </div>

              {extraToppings.map((top, idx) => (
                <div
                  key={top.id || idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 140px 40px",
                    gap: "12px",
                    alignItems: "center",
                    padding: "8px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "5px",
                  }}
                >
                  <input
                    type="text"
                    value={top.name}
                    placeholder="e.g. Extra Mozzarella Cheese"
                    onChange={(e) => updateTopping(idx, "name", e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "5px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                    }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={top.price}
                    placeholder="Price"
                    onChange={(e) => updateTopping(idx, "price", parseFloat(e.target.value) || 0)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "5px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeTopping(idx)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Remove topping"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── FEATURE 7: INVENTORY & STOCK TRACKING ───────── */}
        <div
          style={{
            marginTop: "24px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Inventory &amp; Stock Tracking
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Automatically decrement stock when customers place orders. Get low stock alerts.
                </p>
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
              <input
                type="checkbox"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "#3b82f6" }}
              />
              <span>Track Inventory</span>
            </label>
          </div>

          {trackInventory && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px", padding: "16px", background: "#f8fafc", borderRadius: "5px", border: "1px solid #e2e8f0" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Current Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 50"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ fontSize: "11px", color: "#64748b" }}>Decremented automatically with every completed order.</span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 5"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "5px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ fontSize: "11px", color: "#64748b" }}>Triggers amber warning badge in admin dashboard when stock falls below this.</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── Bottom Actions Bar ──────────────────────────── */}
        <div
          style={{
            marginTop: "24px",
            padding: "16px 24px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Link
            href="/admin/products"
            style={{
              padding: "10px 18px",
              borderRadius: "5px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#475569",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: "10px 24px",
              borderRadius: "5px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1,
              boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
            }}
          >
            {isPending ? "Saving..." : initialProduct ? "Update Product" : "Save Product to Menu"}
          </button>
        </div>
      </form>
    </div>
  );
}
