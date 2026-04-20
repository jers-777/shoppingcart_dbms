import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// ─── INITIAL DATA ──────────────────────────────────────────────────────────────
const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "Obsidian Wireless Earbuds",
    price: 4999,
    quantity: 2,
    category: "Electronics",
    seller: "seller",
    image: "🎧",
    desc: "Premium noise-cancelling with 40hr battery",
  },
  {
    id: 2,
    name: "Arctic Mechanical Keyboard",
    price: 8999,
    quantity: 12,
    category: "Electronics",
    seller: "seller",
    image: "⌨️",
    desc: "PBT keycaps, hot-swap switches, RGB underglow",
  },
  {
    id: 3,
    name: "Obsidian Smart Watch Pro",
    price: 14999,
    quantity: 1,
    category: "Wearables",
    seller: "seller",
    image: "⌚",
    desc: "AMOLED display, ECG, SpO2, GPS built-in",
  },
  {
    id: 4,
    name: "Phantom Laptop Stand",
    price: 2499,
    quantity: 8,
    category: "Accessories",
    seller: "seller",
    image: "💻",
    desc: "Aerospace aluminium, 6 height levels",
  },
  {
    id: 5,
    name: "Nebula RGB Mouse",
    price: 3299,
    quantity: 2,
    category: "Electronics",
    seller: "seller",
    image: "🖱️",
    desc: "25K DPI sensor, 11 programmable buttons",
  },
  {
    id: 6,
    name: "Glacier Desk Pad",
    price: 1299,
    quantity: 20,
    category: "Accessories",
    seller: "seller",
    image: "🖼️",
    desc: "900×400mm leather texture, stitched edges",
  },
  {
    id: 7,
    name: "Prism Monitor Light",
    price: 1899,
    quantity: 5,
    category: "Lighting",
    seller: "seller",
    image: "💡",
    desc: "Asymmetric 27W, no-glare screen bar",
  },
  {
    id: 8,
    name: "Void USB-C Hub",
    price: 3799,
    quantity: 3,
    category: "Accessories",
    seller: "seller",
    image: "🔌",
    desc: "14-in-1, 100W PD, 4K HDMI, SD slots",
  },
];

const USERS = {
  admin: { password: "admin123", role: "admin", label: "Admin" },
  seller: { password: "seller123", role: "seller", label: "Seller" },
  user: { password: "user123", role: "buyer", label: "Buyer" },
};

const ROLE_THEME = {
  admin: {
    primary: "#dc2626",
    accent: "#ef4444",
    glow: "rgba(220,38,38,0.25)",
    label: "Admin",
    gradient: "from-red-900/40 to-red-950/60",
  },
  seller: {
    primary: "#7c3aed",
    accent: "#8b5cf6",
    glow: "rgba(124,58,237,0.25)",
    label: "Seller",
    gradient: "from-violet-900/40 to-violet-950/60",
  },
  buyer: {
    primary: "#2563eb",
    accent: "#3b82f6",
    glow: "rgba(37,99,235,0.25)",
    label: "Buyer",
    gradient: "from-blue-900/40 to-blue-950/60",
  },
};

// ─── CONFETTI ──────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  useEffect(() => {
    const fetchData = async () => {
      // This pulls everything from your 'products' table
      const { data, error } = await supabase.from("products").select("*");

      if (error) {
        console.error("Fetch Error:", error);
      } else if (data && data.length > 0) {
        // If the database has items, use them instead of the hardcoded list
        setProducts(data);
      }
    };
    fetchData();
  }, []);
  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── HIGHLIGHT TEXT ────────────────────────────────────────────────────────────
function Highlight({ text, query }) {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark
        style={{
          background: "rgba(251,191,36,0.4)",
          color: "#fbbf24",
          borderRadius: "3px",
          padding: "0 2px",
        }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ShopSystem() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState(() => {
    try {
      const s = localStorage.getItem("shop_products");
      return s ? JSON.parse(s) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("shop"); // shop | add | dashboard
  const [checkout, setCheckout] = useState(null); // null | open
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [payMethod, setPayMethod] = useState("upi");
  const [confetti, setConfetti] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [salesHistory, setSalesHistory] = useState(() => {
    try {
      const s = localStorage.getItem("shop_sales");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("shop_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("shop_sales", JSON.stringify(salesHistory));
  }, [salesHistory]);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const theme = user ? ROLE_THEME[user.role] : ROLE_THEME.buyer;

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
  const totalStock = products.reduce((s, p) => s + p.quantity, 0);
  const lowStock = products.filter((p) => p.quantity < 3).length;

  const addToCart = (product) => {
    if (product.quantity < 1) return notify("Out of stock!", "error");
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      if (ex) {
        if (ex.qty >= product.quantity) {
          notify("Max stock reached!", "error");
          return prev;
        }
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    notify(`${product.name} added to cart`);
  };

  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((i) => i.id !== id));
  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id !== id) return i;
          const nq = i.qty + delta;
          if (nq < 1) return null;
          const prod = products.find((p) => p.id === id);
          if (prod && nq > prod.quantity) {
            notify("Max stock!", "error");
            return i;
          }
          return { ...i, qty: nq };
        })
        .filter(Boolean),
    );
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutStep(1);
    setCheckout("open");
  };

  const handlePayment = async () => {
    const orderTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

    // SAVE SALE TO SUPABASE
    const { error } = await supabase.from("sales").insert([
      {
        total: orderTotal,
        items: cart,
        pay_method: payMethod,
      },
    ]);

    if (error) return alert("Database Error: " + error.message);

    // Local UI cleanup
    setCheckoutStep(3);
    setConfetti(true);
    setTimeout(() => {
      setCart([]);
      setCheckout(null);
      setCheckoutStep(1);
      setConfetti(false);
    }, 4000);
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    notify("Product deleted");
  };

  const saveProduct = async (prod) => {
    if (editProduct) {
      // UPDATE existing product in Supabase
      const { error } = await supabase
        .from("products")
        .update({
          name: prod.name,
          price: Number(prod.price),
          quantity: Number(prod.quantity),
          category: prod.category,
          image: prod.image,
          desc_text: prod.desc, // Use 'desc_text' to match your DB column
        })
        .eq("id", prod.id);

      if (error) return notify("Update failed: " + error.message, "error");
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? prod : p)));
      setEditProduct(null);
    } else {
      // INSERT new product into Supabase
      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            name: prod.name,
            price: Number(prod.price),
            quantity: Number(prod.quantity),
            category: prod.category,
            image: prod.image,
            desc_text: prod.desc, // Use 'desc_text' to match your DB column
            seller: user.username,
          },
        ])
        .select();

      if (error) {
        console.error("Supabase Error:", error);
        return notify("Save failed: " + error.message, "error");
      }

      if (data) setProducts((prev) => [...prev, data[0]]);
      notify("Product stored in Supabase!");
    }
    setView("shop");
  };

  if (!user) return <LoginScreen onLogin={(u) => setUser(u)} theme={theme} />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060912",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0d1117; } ::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 3px; }
        @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.7} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .card-hover { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .card-hover:hover { transform: translateY(-6px) scale(1.01); }
        .btn-press:active { transform: scale(0.96); }
        .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); }
        .pulse-badge { animation: pulse-ring 1.8s ease-in-out infinite; }
        .slide-up { animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .fade-in { animation: fadeIn 0.3s ease both; }
        input, select, textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #e2e8f0; padding: 10px 14px; font-family: inherit; font-size: 14px; outline: none; transition: border-color 0.2s; width: 100%; }
        input:focus, select:focus, textarea:focus { border-color: ${theme.primary}; box-shadow: 0 0 0 3px ${theme.glow}; }
        input::placeholder { color: #4a5568; }
        select option { background: #1a1f2e; }
        label { font-size: 12px; font-weight: 500; color: #94a3b8; margin-bottom: 6px; display: block; letter-spacing: 0.05em; text-transform: uppercase; }
      `}</style>

      <Confetti active={confetti} />

      {/* NOTIFICATION */}
      {notification && (
        <div
          className="fade-in"
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 1000,
            background:
              notification.type === "error"
                ? "rgba(220,38,38,0.9)"
                : "rgba(16,185,129,0.9)",
            backdropFilter: "blur(16px)",
            borderRadius: 12,
            padding: "12px 20px",
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {notification.type === "error" ? "⚠️ " : "✓ "}
          {notification.msg}
        </div>
      )}

      {/* NAVBAR */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: `rgba(6,9,18,0.85)`,
          backdropFilter: "blur(24px)",
          borderBottom: `1px solid ${theme.primary}30`,
          padding: "0 40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            height: 64,
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ◆ LJR_cart
          </div>
          {/* ROLE BADGE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: `${theme.primary}20`,
              border: `1px solid ${theme.primary}40`,
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 13,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: theme.accent,
                boxShadow: `0 0 8px ${theme.accent}`,
              }}
            />
            <span style={{ color: theme.accent, fontWeight: 600 }}>
              {theme.label}
            </span>
            <span style={{ color: "#64748b" }}>· {user.username}</span>
          </div>

          {/* NAV LINKS */}
          {(user.role === "admin" || user.role === "seller") && (
            <NavBtn
              label="Shop"
              active={view === "shop"}
              theme={theme}
              onClick={() => setView("shop")}
            />
          )}
          {user.role === "admin" && (
            <NavBtn
              label="Dashboard"
              active={view === "dashboard"}
              theme={theme}
              onClick={() => setView("dashboard")}
            />
          )}
          {(user.role === "seller" || user.role === "admin") && (
            <NavBtn
              label="+ Product"
              active={view === "add"}
              theme={theme}
              onClick={() => {
                setEditProduct(null);
                setView("add");
              }}
            />
          )}

          {/* CART */}
          {user.role === "buyer" && (
            <button
              className="btn-press"
              onClick={handleCheckout}
              style={{
                position: "relative",
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                border: "none",
                borderRadius: 12,
                padding: "10px 18px",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              🛒 Cart
              {cartCount > 0 && (
                <span
                  style={{
                    background: "#fff",
                    color: theme.primary,
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          )}

          <button
            className="btn-press"
            onClick={() => {
              setUser(null);
              setCart([]);
              setView("shop");
            }}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "8px 14px",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* VIEWS */}
      {view === "dashboard" && user.role === "admin" && (
        <AdminDashboard
          products={products}
          totalValue={totalValue}
          totalStock={totalStock}
          lowStock={lowStock}
          salesHistory={salesHistory}
          onDelete={deleteProduct}
          onEdit={(p) => {
            setEditProduct(p);
            setView("add");
          }}
          theme={theme}
        />
      )}
      {view === "add" && (
        <ProductForm
          initial={editProduct}
          onSave={saveProduct}
          onCancel={() => setView("shop")}
          theme={theme}
          categories={categories.filter((c) => c !== "All")}
        />
      )}
      {view === "shop" && (
        <ShopView
          products={filteredProducts}
          allProducts={products}
          search={search}
          setSearch={setSearch}
          categories={categories}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          user={user}
          theme={theme}
          onAddToCart={addToCart}
          onDelete={deleteProduct}
          onEdit={(p) => {
            setEditProduct(p);
            setView("add");
          }}
          cart={cart}
          onCartOpen={handleCheckout}
        />
      )}

      {/* CHECKOUT DRAWER */}
      {checkout && (
        <CheckoutDrawer
          cart={cart}
          total={cartTotal}
          step={checkoutStep}
          setStep={setCheckoutStep}
          payMethod={payMethod}
          setPayMethod={setPayMethod}
          onClose={() => setCheckout(null)}
          onPay={handlePayment}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          theme={theme}
        />
      )}

      {/* EDIT MODAL */}
      {editProduct && view === "add" && null}
    </div>
  );
}

// ─── NAV BUTTON ───────────────────────────────────────────────────────────────
function NavBtn({ label, active, theme, onClick }) {
  return (
    <button
      onClick={onClick}
      className="btn-press"
      style={{
        background: active ? `${theme.primary}20` : "transparent",
        border: active
          ? `1px solid ${theme.primary}40`
          : "1px solid transparent",
        borderRadius: 10,
        padding: "8px 16px",
        color: active ? theme.accent : "#94a3b8",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [hoveredRole, setHoveredRole] = useState(null);

  const handleLogin = () => {
    const u = USERS[username];
    if (!u || u.password !== password) {
      setError("Invalid credentials");
      return;
    }
    onLogin({ username, role: u.role, label: u.label });
  };

  const roles = [
    {
      key: "admin",
      label: "Admin",
      icon: "⚡",
      hint: "admin / admin123",
      color: "#dc2626",
    },
    {
      key: "seller",
      label: "Seller",
      icon: "🏪",
      hint: "seller / seller123",
      color: "#7c3aed",
    },
    {
      key: "buyer",
      label: "Buyer",
      icon: "🛍️",
      hint: "user / user123",
      color: "#2563eb",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060912",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: 24,
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@700&display=swap'); * { box-sizing: border-box; } @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} } @keyframes slideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>

      {/* BG ORBS */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "20%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "20%",
          right: "20%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          animation: "slideUp 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
          width: "100%",
          maxWidth: 500,
        }}
      >
        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontSize: 48,
              marginBottom: 12,
              animation: "float 3s ease-in-out infinite",
            }}
          >
            ◆
          </div>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 36,
              fontWeight: 700,
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            LJR_cart
          </div>
          <div style={{ color: "#475569", fontSize: 14, marginTop: 6 }}>
            Premium Commerce Platform
          </div>
        </div>

        {/* ROLE CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {roles.map((r) => (
            <button
              key={r.key}
              onClick={() => {
                setUsername(r.key === "buyer" ? "user" : r.key);
                setPassword(
                  r.key === "buyer"
                    ? "user123"
                    : r.key === "seller"
                      ? "seller123"
                      : "admin123",
                );
                setError("");
              }}
              onMouseEnter={() => setHoveredRole(r.key)}
              onMouseLeave={() => setHoveredRole(null)}
              style={{
                background:
                  hoveredRole === r.key
                    ? `${r.color}20`
                    : "rgba(255,255,255,0.03)",
                border: `1px solid ${hoveredRole === r.key ? r.color + "50" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 14,
                padding: "14px 10px",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.25s",
                color: "#e2e8f0",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{r.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: r.color }}>
                {r.label}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  marginTop: 3,
                  lineHeight: 1.3,
                }}
              >
                {r.hint}
              </div>
            </button>
          ))}
        </div>

        {/* FORM */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: 28,
            backdropFilter: "blur(24px)",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 11,
                color: "#64748b",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 8,
                display: "block",
              }}
            >
              Username
            </label>
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="admin / seller / user"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#e2e8f0",
                padding: "12px 16px",
                fontSize: 15,
                outline: "none",
                width: "100%",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 11,
                color: "#64748b",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 8,
                display: "block",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#e2e8f0",
                padding: "12px 16px",
                fontSize: 15,
                outline: "none",
                width: "100%",
                fontFamily: "inherit",
              }}
            />
          </div>
          {error && (
            <div
              style={{
                color: "#ef4444",
                fontSize: 13,
                marginBottom: 14,
                textAlign: "center",
              }}
            >
              ⚠️ {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              border: "none",
              borderRadius: 12,
              padding: "13px",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.target.style.opacity = "1")}
          >
            Enter Platform →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SHOP VIEW ────────────────────────────────────────────────────────────────
function ShopView({
  products,
  allProducts,
  search,
  setSearch,
  categories,
  categoryFilter,
  setCategoryFilter,
  user,
  theme,
  onAddToCart,
  onDelete,
  onEdit,
  cart,
  onCartOpen,
}) {
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div style={{ width: "100%", padding: "32px 40px" }}>
      {/* SEARCH + FILTER */}
      <div
        style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}
      >
        <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 16,
              color: "#475569",
            }}
          >
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or category…"
            style={{
              paddingLeft: 40,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${search ? theme.primary + "60" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 14,
              color: "#e2e8f0",
              padding: "12px 16px 12px 40px",
              fontSize: 15,
              outline: "none",
              width: "100%",
              fontFamily: "inherit",
              boxShadow: search ? `0 0 0 3px ${theme.glow}` : "none",
              transition: "all 0.2s",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ×
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="btn-press"
              style={{
                background:
                  categoryFilter === cat
                    ? `${theme.primary}30`
                    : "rgba(255,255,255,0.04)",
                border: `1px solid ${categoryFilter === cat ? theme.primary + "60" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10,
                padding: "8px 14px",
                color: categoryFilter === cat ? theme.accent : "#94a3b8",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: categoryFilter === cat ? 600 : 400,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* EMPTY STATE */}
      {products.length === 0 && (
        <div
          style={{ textAlign: "center", padding: "80px 20px" }}
          className="fade-in"
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔭</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              marginBottom: 8,
              color: "#94a3b8",
            }}
          >
            No items found
          </div>
          <div style={{ color: "#475569", marginBottom: 24 }}>
            Try adjusting your search or filters
          </div>
          <button
            onClick={() => {
              setSearch("");
              setCategoryFilter("All");
            }}
            className="btn-press"
            style={{
              background: `${theme.primary}20`,
              border: `1px solid ${theme.primary}40`,
              borderRadius: 10,
              padding: "10px 24px",
              color: theme.accent,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 20,
        }}
      >
        {products.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            index={i}
            search={search}
            user={user}
            theme={theme}
            onAddToCart={onAddToCart}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* FLOATING CART SUMMARY (buyer) */}
      {user.role === "buyer" && cart.length > 0 && (
        <div
          className="slide-up"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(6,9,18,0.95)",
            backdropFilter: "blur(24px)",
            border: `1px solid ${theme.primary}40`,
            borderRadius: 20,
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px ${theme.primary}20`,
            zIndex: 90,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Cart Total</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
              ₹{cartTotal.toLocaleString("en-IN")}
            </div>
          </div>
          <button
            onClick={onCartOpen}
            className="btn-press"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              border: "none",
              borderRadius: 12,
              padding: "10px 22px",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Checkout →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PRODUCT IMAGE ────────────────────────────────────────────────────────────
function ProductImage({ image, name }) {
  const [err, setErr] = useState(false);
  const isUrl = image && (image.startsWith("http") || image.startsWith("/"));
  return (
    <div
      style={{
        height: 140,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}
    >
      {isUrl && !err ? (
        <img
          src={image}
          alt={name}
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span style={{ fontSize: 64 }}>{err ? "📦" : image}</span>
      )}
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  index,
  search,
  user,
  theme,
  onAddToCart,
  onDelete,
  onEdit,
}) {
  const isLowStock = product.quantity < 3;
  const isOutOfStock = product.quantity === 0;
  const canEdit =
    user.role === "admin" ||
    (user.role === "seller" && product.seller === user.username);

  return (
    <div
      className="card-hover"
      style={{
        animation: `slideUp 0.4s ${index * 0.05}s both cubic-bezier(0.34,1.56,0.64,1)`,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${theme.primary}40`;
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${theme.primary}20, inset 0 1px 0 rgba(255,255,255,0.08)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* STOCK BADGE */}
      {isLowStock && !isOutOfStock && (
        <div
          className="pulse-badge"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: "#f87171",
            zIndex: 2,
          }}
        >
          🔥 High Demand
        </div>
      )}
      {isOutOfStock && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(100,116,139,0.2)",
            border: "1px solid rgba(100,116,139,0.3)",
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: "#94a3b8",
            zIndex: 2,
          }}
        >
          Sold Out
        </div>
      )}

      {/* IMAGE AREA */}
      <ProductImage image={product.image} name={product.name} />

      {/* CONTENT */}
      <div style={{ padding: "18px 18px 16px" }}>
        <div
          style={{
            fontSize: 11,
            color: "#64748b",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 6,
          }}
        >
          {product.category}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#e2e8f0",
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          <Highlight text={product.name} query={search} />
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          {product.desc}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
              ₹{product.price.toLocaleString("en-IN")}
            </div>
            <div
              style={{
                fontSize: 12,
                color: isLowStock ? "#f87171" : "#475569",
                marginTop: 2,
              }}
            >
              {product.quantity} in stock
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {canEdit && (
              <>
                <IconBtn
                  icon="✏️"
                  title="Edit"
                  onClick={() => onEdit(product)}
                  color="#7c3aed"
                />
                <IconBtn
                  icon="🗑"
                  title="Delete"
                  onClick={() => onDelete(product.id)}
                  color="#dc2626"
                />
              </>
            )}
            {user.role === "buyer" && (
              <button
                className="btn-press"
                onClick={() => onAddToCart(product)}
                disabled={isOutOfStock}
                style={{
                  background: isOutOfStock
                    ? "rgba(100,116,139,0.15)"
                    : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 16px",
                  color: isOutOfStock ? "#64748b" : "#fff",
                  cursor: isOutOfStock ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
              >
                {isOutOfStock ? "Sold Out" : "+ Cart"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ icon, title, onClick, color }) {
  return (
    <button
      className="btn-press"
      title={title}
      onClick={onClick}
      style={{
        background: `${color}18`,
        border: `1px solid ${color}30`,
        borderRadius: 9,
        width: 34,
        height: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: 14,
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${color}28`;
        e.currentTarget.style.borderColor = `${color}50`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${color}18`;
        e.currentTarget.style.borderColor = `${color}30`;
      }}
    >
      {icon}
    </button>
  );
}

// ─── PRODUCT FORM ──────────────────────────────────────────────────────────────
function ProductForm({ initial, onSave, onCancel, theme, categories }) {
  const emojis = [
    "📦",
    "🎧",
    "⌨️",
    "🖱️",
    "💻",
    "⌚",
    "💡",
    "🔌",
    "📱",
    "🎮",
    "🖼️",
    "🔋",
    "📷",
    "🎙️",
    "🖨️",
  ];
  const isUrl = (v) =>
    v &&
    (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/"));
  const [form, setForm] = useState(
    initial || {
      name: "",
      price: "",
      quantity: "",
      category: categories[0] || "Electronics",
      desc: "",
      image: "📦",
      seller: "seller",
    },
  );
  const [imgTab, setImgTab] = useState(
    initial && isUrl(initial.image) ? "url" : "emoji",
  );
  const [urlInput, setUrlInput] = useState(
    initial && isUrl(initial.image) ? initial.image : "",
  );
  const [imgError, setImgError] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleUrlChange = (v) => {
    setUrlInput(v);
    setImgError(false);
    if (isUrl(v)) set("image", v);
  };

  const handleTabSwitch = (tab) => {
    setImgTab(tab);
    setImgError(false);
    if (tab === "emoji") set("image", emojis[0]);
    else {
      set("image", urlInput && isUrl(urlInput) ? urlInput : "");
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.price || !form.quantity) return;
    onSave({
      ...form,
      price: Number(form.price),
      quantity: Number(form.quantity),
      id: form.id || Date.now(),
    });
  };

  const previewIsUrl = isUrl(form.image);

  return (
    <div
      style={{ maxWidth: 720, margin: "40px auto", padding: "0 40px" }}
      className="slide-up"
    >
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: 32,
          backdropFilter: "blur(24px)",
        }}
      >
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 28,
            color: theme.accent,
          }}
        >
          {initial ? "✏️ Edit Product" : "✦ New Product"}
        </h2>

        {/* IMAGE SECTION */}
        <div style={{ marginBottom: 24 }}>
          <label>Product Image</label>

          {/* TAB SWITCHER */}
          <div
            style={{
              display: "flex",
              gap: 0,
              marginBottom: 16,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 12,
              padding: 4,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {[
              ["emoji", "😀 Emoji Icon"],
              ["url", "🔗 Image URL"],
            ].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => handleTabSwitch(tab)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  border: "none",
                  borderRadius: 9,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.2s",
                  background:
                    imgTab === tab
                      ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
                      : "transparent",
                  color: imgTab === tab ? "#fff" : "#64748b",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* PREVIEW + INPUT SIDE BY SIDE */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {/* LIVE PREVIEW */}
            <div
              style={{
                flexShrink: 0,
                width: 96,
                height: 96,
                borderRadius: 16,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${theme.primary}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                fontSize: 52,
              }}
            >
              {previewIsUrl && !imgError ? (
                <img
                  src={form.image}
                  alt="preview"
                  onError={() => setImgError(true)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 15,
                  }}
                />
              ) : imgError ? (
                <span style={{ fontSize: 28 }}>❌</span>
              ) : (
                form.image || "📦"
              )}
            </div>

            <div style={{ flex: 1 }}>
              {imgTab === "emoji" ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {emojis.map((e) => (
                    <button
                      key={e}
                      onClick={() => set("image", e)}
                      style={{
                        width: 38,
                        height: 38,
                        fontSize: 20,
                        background:
                          form.image === e
                            ? `${theme.primary}30`
                            : "rgba(255,255,255,0.05)",
                        border: `1px solid ${form.image === e ? theme.primary + "70" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 9,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        transform:
                          form.image === e ? "scale(1.12)" : "scale(1)",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <input
                    value={urlInput}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com/product.jpg"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${imgError ? "#ef4444" : urlInput && isUrl(urlInput) && !imgError ? "#10b981" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 12,
                      color: "#e2e8f0",
                      padding: "10px 14px",
                      fontSize: 14,
                      outline: "none",
                      width: "100%",
                      fontFamily: "inherit",
                      marginBottom: 8,
                    }}
                  />
                  {imgError && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#ef4444",
                        marginBottom: 6,
                      }}
                    >
                      ⚠️ Could not load image — check the URL
                    </div>
                  )}
                  {urlInput && isUrl(urlInput) && !imgError && (
                    <div style={{ fontSize: 12, color: "#10b981" }}>
                      ✓ Image URL looks good
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: "#475569",
                      marginTop: 6,
                      lineHeight: 1.5,
                    }}
                  >
                    Paste a direct link to a .jpg, .png, .webp, or any hosted
                    image. Try images from Unsplash, Pexels, or your own CDN.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <FormField
          label="Product Name"
          value={form.name}
          onChange={(v) => set("name", v)}
          placeholder="e.g. Premium Wireless Earbuds"
        />
        <FormField
          label="Description"
          value={form.desc}
          onChange={(v) => set("desc", v)}
          placeholder="Short product description…"
          multiline
        />

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <FormField
            label="Price (₹)"
            value={form.price}
            onChange={(v) => set("price", v)}
            placeholder="0"
            type="number"
          />
          <FormField
            label="Quantity"
            value={form.quantity}
            onChange={(v) => set("quantity", v)}
            placeholder="0"
            type="number"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label>Category</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#e2e8f0",
              padding: "10px 14px",
              fontSize: 14,
              outline: "none",
              width: "100%",
              fontFamily: "inherit",
            }}
          >
            {[
              ...categories,
              "Electronics",
              "Wearables",
              "Accessories",
              "Lighting",
            ]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            className="btn-press"
            onClick={onCancel}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: 13,
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            className="btn-press"
            onClick={handleSubmit}
            style={{
              flex: 2,
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              border: "none",
              borderRadius: 12,
              padding: 13,
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {initial ? "Save Changes" : "Add Product"} →
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline,
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label>{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#e2e8f0",
            padding: "10px 14px",
            fontSize: 14,
            outline: "none",
            width: "100%",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#e2e8f0",
            padding: "10px 14px",
            fontSize: 14,
            outline: "none",
            width: "100%",
            fontFamily: "inherit",
          }}
        />
      )}
    </div>
  );
}

// ─── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
function AdminDashboard({
  products,
  totalValue,
  totalStock,
  lowStock,
  salesHistory,
  onDelete,
  onEdit,
  theme,
}) {
  const [activeTab, setActiveTab] = useState("inventory");

  const totalRevenue = salesHistory.reduce((s, o) => s + o.total, 0);
  const totalOrders = salesHistory.length;
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Sales by category
  const catSales = {};
  salesHistory.forEach((order) => {
    order.items.forEach((item) => {
      catSales[item.category] = (catSales[item.category] || 0) + item.subtotal;
    });
  });
  const maxCatSale = Math.max(1, ...Object.values(catSales));
  const catColors = {
    Electronics: "#3b82f6",
    Wearables: "#8b5cf6",
    Accessories: "#10b981",
    Lighting: "#f59e0b",
  };

  // Sales over last 7 days
  const now = Date.now();
  const dayMs = 86400000;
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const dayStart = now - (6 - i) * dayMs;
    const dayEnd = dayStart + dayMs;
    const label = new Date(dayStart).toLocaleDateString("en-IN", {
      weekday: "short",
    });
    const revenue = salesHistory
      .filter((o) => {
        const t = new Date(o.timestamp).getTime();
        return t >= dayStart && t < dayEnd;
      })
      .reduce((s, o) => s + o.total, 0);
    return { label, revenue };
  });
  const maxDay = Math.max(1, ...last7.map((d) => d.revenue));

  const inventoryStats = [
    {
      label: "Total Products",
      value: products.length,
      icon: "📦",
      color: "#3b82f6",
    },
    {
      label: "Inventory Value",
      value: `₹${(totalValue / 1000).toFixed(0)}K`,
      icon: "💰",
      color: "#10b981",
    },
    { label: "Total Stock", value: totalStock, icon: "📊", color: "#8b5cf6" },
    { label: "Low Stock Items", value: lowStock, icon: "⚠️", color: "#ef4444" },
  ];

  const analyticsStats = [
    {
      label: "Total Revenue",
      value: `₹${(totalRevenue / 1000).toFixed(1)}K`,
      icon: "💸",
      color: "#10b981",
    },
    { label: "Total Orders", value: totalOrders, icon: "🧾", color: "#3b82f6" },
    {
      label: "Avg Order Value",
      value: `₹${avgOrder.toLocaleString("en-IN")}`,
      icon: "📈",
      color: "#8b5cf6",
    },
    {
      label: "Categories Sold",
      value: Object.keys(catSales).length,
      icon: "🏷️",
      color: "#f59e0b",
    },
  ];

  const tabs = [
    { key: "inventory", label: "📦 Inventory" },
    { key: "analytics", label: "📊 Analytics" },
  ];

  return (
    <div style={{ width: "100%", padding: "32px 40px" }} className="fade-in">
      {/* HEADER + TABS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: theme.accent,
          }}
        >
          ⚡ Master Dashboard
        </h1>
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 4,
            gap: 4,
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="btn-press"
              style={{
                padding: "8px 20px",
                border: "none",
                borderRadius: 9,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.2s",
                background:
                  activeTab === t.key
                    ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
                    : "transparent",
                color: activeTab === t.key ? "#fff" : "#64748b",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── INVENTORY TAB ── */}
      {activeTab === "inventory" && (
        <div className="fade-in">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {inventoryStats.map((s, i) => (
              <div
                key={i}
                className="slide-up"
                style={{
                  animation: `slideUp 0.4s ${i * 0.08}s both`,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${s.color}25`,
                  borderRadius: 18,
                  padding: "20px 22px",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: s.color,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 16,
                color: "#94a3b8",
              }}
            >
              Stock Health Overview
            </h3>
            {products.map((p) => {
              const pct = Math.min(100, (p.quantity / 20) * 100);
              const color =
                p.quantity === 0
                  ? "#ef4444"
                  : p.quantity < 3
                    ? "#f59e0b"
                    : "#10b981";
              return (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>
                      {p.image} {p.name}
                    </span>
                    <span style={{ fontSize: 12, color, fontWeight: 600 }}>
                      {p.quantity} units
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: color,
                        borderRadius: 3,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8" }}>
                All Products ({products.length})
              </h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {[
                      "Product",
                      "Category",
                      "Price",
                      "Qty",
                      "Value",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 18px",
                          textAlign: "left",
                          color: "#64748b",
                          fontWeight: 500,
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.03)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "12px 18px",
                          color: "#e2e8f0",
                          fontWeight: 500,
                        }}
                      >
                        {p.image} {p.name}
                      </td>
                      <td style={{ padding: "12px 18px", color: "#64748b" }}>
                        {p.category}
                      </td>
                      <td style={{ padding: "12px 18px", color: "#e2e8f0" }}>
                        ₹{p.price.toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <span
                          style={{
                            color: p.quantity < 3 ? "#f87171" : "#94a3b8",
                            fontWeight: p.quantity < 3 ? 600 : 400,
                          }}
                        >
                          {p.quantity < 3 && "🔥 "}
                          {p.quantity}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 18px",
                          color: "#10b981",
                          fontWeight: 600,
                        }}
                      >
                        ₹{(p.price * p.quantity).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <IconBtn
                            icon="✏️"
                            title="Edit"
                            onClick={() => onEdit(p)}
                            color="#7c3aed"
                          />
                          <IconBtn
                            icon="🗑"
                            title="Delete"
                            onClick={() => onDelete(p.id)}
                            color="#dc2626"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === "analytics" && (
        <div className="fade-in">
          {/* ANALYTICS STAT CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 28,
            }}
          >
            {analyticsStats.map((s, i) => (
              <div
                key={i}
                className="slide-up"
                style={{
                  animation: `slideUp 0.4s ${i * 0.08}s both`,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${s.color}25`,
                  borderRadius: 18,
                  padding: "20px 22px",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: s.color,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              marginBottom: 24,
            }}
          >
            {/* 7-DAY REVENUE CHART */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20,
                padding: "22px 24px",
              }}
            >
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#94a3b8",
                  marginBottom: 20,
                }}
              >
                Revenue — Last 7 Days
              </h3>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 10,
                  height: 120,
                }}
              >
                {last7.map((d, i) => {
                  const h = Math.max(4, Math.round((d.revenue / maxDay) * 100));
                  const isToday = i === 6;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        height: "100%",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: "#475569",
                          fontWeight: 600,
                        }}
                      >
                        {d.revenue > 0
                          ? `₹${Math.round(d.revenue / 1000)}K`
                          : ""}
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: `${h}%`,
                          minHeight: 4,
                          background: isToday
                            ? `linear-gradient(180deg, ${theme.accent}, ${theme.primary})`
                            : "rgba(255,255,255,0.12)",
                          borderRadius: "6px 6px 3px 3px",
                          transition: "height 0.6s ease",
                          boxShadow: isToday
                            ? `0 0 12px ${theme.glow}`
                            : "none",
                        }}
                      />
                      <div
                        style={{
                          fontSize: 10,
                          color: isToday ? theme.accent : "#475569",
                          fontWeight: isToday ? 600 : 400,
                        }}
                      >
                        {d.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SALES BY CATEGORY */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20,
                padding: "22px 24px",
              }}
            >
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#94a3b8",
                  marginBottom: 20,
                }}
              >
                Revenue by Category
              </h3>
              {Object.keys(catSales).length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  No sales recorded yet
                </div>
              ) : (
                Object.entries(catSales)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, rev]) => {
                    const pct = Math.round((rev / maxCatSale) * 100);
                    const color = catColors[cat] || "#8b5cf6";
                    return (
                      <div key={cat} style={{ marginBottom: 14 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 5,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              color: "#94a3b8",
                              fontWeight: 500,
                            }}
                          >
                            {cat}
                          </span>
                          <span
                            style={{ fontSize: 12, color, fontWeight: 700 }}
                          >
                            ₹{rev.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div
                          style={{
                            height: 8,
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${color}cc, ${color})`,
                              borderRadius: 4,
                              transition:
                                "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* RECENT SALES TABLE */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8" }}>
                Recent Sales
              </h3>
              {salesHistory.length > 0 && (
                <span style={{ fontSize: 12, color: "#475569" }}>
                  {salesHistory.length} order
                  {salesHistory.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {salesHistory.length === 0 ? (
              <div style={{ padding: "48px 22px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
                <div style={{ color: "#475569", fontSize: 14 }}>
                  No orders yet. Sales will appear here after buyers checkout.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {["Order ID", "Items", "Payment", "Total", "Time"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: "12px 18px",
                              textAlign: "left",
                              color: "#64748b",
                              fontWeight: 500,
                              fontSize: 11,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory.slice(0, 20).map((order) => (
                      <tr
                        key={order.id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.03)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td
                          style={{
                            padding: "12px 18px",
                            color: "#64748b",
                            fontFamily: "monospace",
                            fontSize: 11,
                          }}
                        >
                          #{String(order.id).slice(-6)}
                        </td>
                        <td
                          style={{
                            padding: "12px 18px",
                            color: "#e2e8f0",
                            maxWidth: 280,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                            }}
                          >
                            {order.items.map((item) => (
                              <span
                                key={item.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  background: "rgba(255,255,255,0.06)",
                                  borderRadius: 6,
                                  padding: "3px 8px",
                                  fontSize: 11,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.image} {item.name}{" "}
                                <span style={{ color: "#64748b" }}>
                                  ×{item.qty}
                                </span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <span
                            style={{
                              background: "rgba(16,185,129,0.12)",
                              border: "1px solid rgba(16,185,129,0.25)",
                              borderRadius: 6,
                              padding: "3px 10px",
                              fontSize: 11,
                              color: "#10b981",
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            {order.payMethod}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px 18px",
                            color: "#10b981",
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          ₹{order.total.toLocaleString("en-IN")}
                        </td>
                        <td
                          style={{
                            padding: "12px 18px",
                            color: "#475569",
                            fontSize: 12,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(order.timestamp).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CHECKOUT DRAWER ───────────────────────────────────────────────────────────
function CheckoutDrawer({
  cart,
  total,
  step,
  setStep,
  payMethod,
  setPayMethod,
  onClose,
  onPay,
  onUpdateQty,
  onRemove,
  theme,
}) {
  const steps = ["Summary", "Payment", "Success"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      {/* BACKDROP */}
      <div
        onClick={step < 3 ? onClose : undefined}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
        }}
      />

      {/* DRAWER */}
      <div
        className="slide-up"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "100%",
          maxWidth: 460,
          background: "#0d1117",
          borderLeft: `1px solid ${theme.primary}30`,
          display: "flex",
          flexDirection: "column",
          boxShadow: `-20px 0 60px rgba(0,0,0,0.6)`,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                color: "#fff",
              }}
            >
              {step === 3 ? "🎉 Order Placed!" : "Checkout"}
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
              Step {Math.min(step, 3)} of 3 · {steps[Math.min(step, 3) - 1]}
            </div>
          </div>

          {/* STEP INDICATORS */}
          <div style={{ display: "flex", gap: 8 }}>
            {steps.map((s, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background:
                    i + 1 <= step ? theme.accent : "rgba(255,255,255,0.15)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>

          {step < 3 && (
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "none",
                borderRadius: 8,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#94a3b8",
                fontSize: 18,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* STEP 1: CART SUMMARY */}
          {step === 1 && (
            <div className="fade-in">
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: 14,
                    marginBottom: 16,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14,
                    padding: "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 32,
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 10,
                    }}
                  >
                    {item.image}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#e2e8f0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#fff",
                        marginTop: 3,
                      }}
                    >
                      ₹{(item.price * item.qty).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={() => onUpdateQty(item.id, -1)}
                        style={{
                          width: 28,
                          height: 28,
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          fontSize: 16,
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          minWidth: 20,
                          textAlign: "center",
                        }}
                      >
                        {item.qty}
                      </span>
                      <button
                        onClick={() => onUpdateQty(item.id, 1)}
                        style={{
                          width: 28,
                          height: 28,
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          fontSize: 16,
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => onRemove(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: 11,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 2: PAYMENT */}
          {step === 2 && (
            <div className="fade-in">
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    marginBottom: 14,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Payment Method
                </div>
                {[
                  {
                    key: "upi",
                    label: "UPI Payment",
                    icon: "📲",
                    sub: "Instant · Google Pay, PhonePe, BHIM",
                  },
                  {
                    key: "cod",
                    label: "Cash on Delivery",
                    icon: "💵",
                    sub: "Pay when delivered",
                  },
                  {
                    key: "card",
                    label: "Credit / Debit Card",
                    icon: "💳",
                    sub: "Visa, Mastercard, RuPay",
                  },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setPayMethod(m.key)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background:
                        payMethod === m.key
                          ? `${theme.primary}15`
                          : "rgba(255,255,255,0.03)",
                      border: `1px solid ${payMethod === m.key ? theme.primary + "50" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 14,
                      padding: "14px 16px",
                      cursor: "pointer",
                      marginBottom: 10,
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: payMethod === m.key ? theme.accent : "#e2e8f0",
                        }}
                      >
                        {m.label}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}
                      >
                        {m.sub}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: `2px solid ${payMethod === m.key ? theme.accent : "#374151"}`,
                        background:
                          payMethod === m.key ? theme.accent : "transparent",
                        transition: "all 0.2s",
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* ORDER SUMMARY */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: "16px",
                }}
              >
                {cart.map((i) => (
                  <div
                    key={i.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ color: "#94a3b8" }}>
                      {i.name} × {i.qty}
                    </span>
                    <span style={{ color: "#e2e8f0", fontWeight: 500 }}>
                      ₹{(i.price * i.qty).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                    marginTop: 10,
                    paddingTop: 10,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#e2e8f0" }}>
                    Total
                  </span>
                  <span
                    style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}
                  >
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div
              className="fade-in"
              style={{ textAlign: "center", paddingTop: 40 }}
            >
              <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#10b981",
                  marginBottom: 10,
                }}
              >
                Payment Successful!
              </h2>
              <p style={{ color: "#64748b", marginBottom: 24 }}>
                Your order has been confirmed and will be delivered soon.
              </p>
              <div
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 16,
                  padding: "16px 20px",
                  display: "inline-block",
                  marginBottom: 24,
                }}
              >
                <div
                  style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}
                >
                  Amount Paid
                </div>
                <div
                  style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}
                >
                  ₹{total.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  via {payMethod.toUpperCase()}
                </div>
              </div>
              <div style={{ color: "#475569", fontSize: 13 }}>
                This window will close automatically…
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        {step < 3 && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Order Total
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {step === 2 && (
                <button
                  className="btn-press"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: 13,
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                className="btn-press"
                onClick={step === 1 ? () => setStep(2) : onPay}
                style={{
                  flex: 2,
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  border: "none",
                  borderRadius: 12,
                  padding: 13,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                {step === 1
                  ? "Continue to Payment →"
                  : `Pay ₹${total.toLocaleString("en-IN")}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
