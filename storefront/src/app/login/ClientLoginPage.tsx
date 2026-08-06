"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, signup } from "./actions";
import { signInWithSocial } from "./social-actions";

type Props = {
  searchParams: { message?: string; next?: string };
  referer?: string;
};

export default function ClientLoginPage({ searchParams, referer }: Props) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState<"personal" | "business">(
    "personal",
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(
    searchParams.message || null,
  );
  const [loading, setLoading] = useState(false);

  // Form Field States (Preserve input on failure)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [gstin, setGstin] = useState("");

  // Inline validation states
  const [emailError, setEmailError] = useState<string | null>(null);

  let nextUrl = searchParams.next || "/";
  const authPages = ["/login", "/forgot-password", "/update-password", "/auth"];

  if (authPages.some((page) => nextUrl.includes(page))) {
    nextUrl = "/";
  } else if (
    !searchParams.next &&
    referer &&
    !authPages.some((page) => referer.includes(page))
  ) {
    try {
      nextUrl = new URL(referer).pathname + new URL(referer).search;
    } catch {
      nextUrl = "/";
    }
  }

  // Real-time password check indicators
  const isLengthValid = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordStrong = isLengthValid && hasUppercase && hasNumber;

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validations before submission
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (!isLogin && !isPasswordStrong) {
      setLocalError("Please satisfy all password complexity requirements.");
      return;
    }

    setLoading(true);
    setLocalError(null);
    setLocalSuccess(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    formData.set("nextUrl", nextUrl);
    formData.set("accountType", accountType);
    if (accountType === "personal") {
      formData.set("firstName", firstName);
      formData.set("lastName", lastName);
    } else {
      formData.set("companyName", companyName);
      formData.set("contactName", contactName);
      formData.set("gstin", gstin);
    }

    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { error: passkeyErr } = await (
        supabase.auth as any
      ).signInWithPasskey();
      const res = (
        isLogin ? await login(formData) : await signup(formData)
      ) as any;
      if (res && res.error) {
        const errLower = res.error.toLowerCase();
        // If login failed, clear password but keep email
        if (isLogin) {
          setPassword("");
        }

        if (
          errLower.includes("already") ||
          errLower.includes("registered") ||
          errLower.includes("exists")
        ) {
          setLocalError("already_exists");
        } else if (
          errLower.includes("invalid") ||
          errLower.includes("credentials") ||
          errLower.includes("not found") ||
          errLower.includes("combination")
        ) {
          // Unified Error to prevent user enumeration
          setLocalError("Invalid email or password.");
        } else {
          setLocalError(res.error);
        }
        setLoading(false);
      } else if (res && res.success) {
        if (!isLogin) {
          if (
            typeof window !== "undefined" &&
            typeof window.trackMetaEvent === "function"
          ) {
            window.trackMetaEvent(
              "CompleteRegistration",
              {
                status: "success",
                content_name: accountType,
              },
              {
                email: email,
                firstName: firstName || null,
                lastName: lastName || null,
              },
            );
          }
        }
        if (res.message) {
          setLocalSuccess(res.message);
        }
        if (res.next) {
          window.location.href = res.next;
        }
      }
    } catch (err: any) {
      setLocalError(
        err.message || "An unexpected authentication error occurred.",
      );
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "stretch",
        paddingTop: "64px",
        background: "var(--obsidian)",
      }}
    >
      {/* ── Left Panel – Brand (Desktop Only) ── */}
      <div
        style={{
          display: "none",
          width: "42%",
          background: "var(--void)",
          borderRight: "1px solid var(--border)",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "32px",
          padding: "80px 60px",
          position: "relative",
          overflow: "hidden",
        }}
        className="auth-left-panel"
      >
        <svg
          viewBox="0 0 200 320"
          style={{
            position: "absolute",
            top: "-10%",
            right: "-10%",
            width: "70%",
            opacity: 0.06,
          }}
          stroke="var(--gold)"
          fill="none"
        >
          <line x1="100" y1="0" x2="100" y2="320" strokeWidth="0.8" />
          <ellipse cx="100" cy="80" rx="80" ry="12" strokeWidth="0.5" />
          <ellipse cx="100" cy="140" rx="60" ry="10" strokeWidth="0.5" />
          <ellipse cx="100" cy="200" rx="40" ry="8" strokeWidth="0.5" />
        </svg>
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div
            className="hero-eyebrow"
            style={{ justifyContent: "center", marginBottom: "24px" }}
          >
            Est. 1987
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "52px",
              fontWeight: 300,
              color: "var(--cream)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
              marginBottom: "20px",
            }}
          >
            James{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-light)" }}>
              &amp;
            </em>{" "}
            Sons
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--text-muted)",
              lineHeight: 1.8,
              maxWidth: "280px",
              margin: "0 auto",
            }}
          >
            India's premier source for bespoke luxury chandeliers — serving
            architects, hospitality groups, and discerning homes since 1987.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "40px",
            position: "relative",
            zIndex: 1,
            marginTop: "16px",
          }}
        >
          {[
            ["500+", "Designs"],
            ["230+", "B2B Partners"],
            ["18", "States"],
          ].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "30px",
                  fontWeight: 300,
                  color: "var(--gold-light)",
                }}
              >
                {n}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  letterSpacing: "0.15em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  marginTop: "4px",
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Form Panel (Responsive) ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "clamp(40px, 8vw, 80px) 24px",
          position: "relative",
        }}
      >
        {/* Toggle (Desktop Position) */}
        <div
          className="hidden md:flex"
          style={{
            position: "absolute",
            top: "24px",
            right: "40px",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
            }}
          >
            {isLogin ? "New here?" : "Have an account?"}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setLocalError(null);
              setLocalSuccess(null);
              setPassword("");
            }}
            disabled={loading}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--gold)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {isLogin ? "Create Account →" : "Sign In →"}
          </button>
        </div>

        <div style={{ maxWidth: "440px", width: "100%", margin: "0 auto" }}>
          <div style={{ marginBottom: "40px" }}>
            <div className="section-label">
              {isLogin ? "Returning Client" : "New Account"}
            </div>
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(32px, 5vw, 44px)",
                fontWeight: 300,
                color: "var(--cream)",
                lineHeight: 1.1,
                marginTop: "8px",
              }}
            >
              {isLogin ? "Welcome " : "Join the "}
              <em>{isLogin ? "Back" : "Family"}</em>
            </h2>
          </div>

          {/* Account Exists Graceful Fallback Banner */}
          {localError === "already_exists" && (
            <div
              style={{
                background: "rgba(196, 160, 90, 0.08)",
                border: "1px solid rgba(196, 160, 90, 0.3)",
                color: "var(--cream)",
                padding: "20px",
                borderRadius: "12px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                marginBottom: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "var(--gold-light)",
                }}
              >
                <i
                  className="ti ti-alert-triangle"
                  style={{ fontSize: "18px" }}
                />
                <span
                  style={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Account Exists
                </span>
              </div>
              <p
                style={{
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                An account with this email already exists. Would you like to log
                in instead or reset your password?
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setLocalError(null);
                    setLocalSuccess(null);
                    setPassword("");
                  }}
                  style={{
                    padding: "8px 16px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    background: "var(--gold)",
                    color: "black",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Log In
                </button>
                <a
                  href={`/forgot-password?email=${encodeURIComponent(email)}`}
                  style={{
                    padding: "8px 16px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    border: "1px solid var(--border)",
                    color: "var(--cream)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    textDecoration: "none",
                    minHeight: "44px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Reset Password
                </a>
              </div>
            </div>
          )}

          {localError && localError !== "already_exists" && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#f87171",
                padding: "14px 16px",
                borderRadius: "12px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <i
                className="ti ti-alert-triangle"
                style={{ fontSize: "16px", color: "#f87171" }}
              />
              <span>{localError}</span>
            </div>
          )}

          {localSuccess && (
            <div
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                color: "#34d399",
                padding: "14px 16px",
                borderRadius: "12px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <i
                className="ti ti-circle-check"
                style={{ fontSize: "16px", color: "#34d399" }}
              />
              <span>{localSuccess}</span>
            </div>
          )}

          <div
            style={{
              marginBottom: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={handlePasskeySignIn}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                width: "100%",
                padding: "14px",
                background: "rgba(201, 126, 106, 0.1)",
                border: "1px solid rgba(201, 126, 106, 0.4)",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                textTransform: "uppercase",
                color: "#C97E6A",
                borderRadius: "12px",
                cursor: "pointer",
                letterSpacing: "0.15em",
                opacity: loading ? 0.6 : 1,
                minHeight: "44px",
                fontWeight: "bold",
              }}
            >
              <span>🔑</span> Sign in with Passkey / Touch ID
            </button>
            <button
              type="button"
              onClick={() => signInWithSocial("google", nextUrl)}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                width: "100%",
                padding: "16px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                textTransform: "uppercase",
                color: "var(--cream)",
                borderRadius: "12px",
                cursor: "pointer",
                letterSpacing: "0.15em",
                opacity: loading ? 0.6 : 1,
                minHeight: "44px",
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                ></path>
              </svg>
              Continue with Google
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "0.5px",
                  background: "var(--border)",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  color: "var(--text-dim)",
                  letterSpacing: "0.15em",
                }}
              >
                Or via email
              </span>
              <div
                style={{
                  flex: 1,
                  height: "0.5px",
                  background: "var(--border)",
                }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <fieldset
              disabled={loading}
              style={{
                border: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <input type="hidden" name="nextUrl" value={nextUrl} />

              {/* Account Type Toggle (Signup only) */}
              {!isLogin && (
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      marginBottom: "12px",
                    }}
                  >
                    I am purchasing for
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    {(["personal", "business"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAccountType(type)}
                        style={{
                          padding: "14px 12px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "9px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          border:
                            accountType === type
                              ? "1px solid var(--gold)"
                              : "1px solid var(--border)",
                          background:
                            accountType === type
                              ? "rgba(196,160,90,0.08)"
                              : "transparent",
                          color:
                            accountType === type
                              ? "var(--gold)"
                              : "var(--text-muted)",
                          borderRadius: "12px",
                          minHeight: "44px",
                        }}
                      >
                        {type === "personal" ? "🏠 Personal" : "🏢 Business"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fields */}
              {!isLogin && accountType === "personal" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <AuthInput
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                  <AuthInput
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              )}

              {!isLogin && accountType === "business" && (
                <>
                  <AuthInput
                    id="companyName"
                    label="Company / Firm Name"
                    name="companyName"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    autoComplete="organization"
                  />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <AuthInput
                      id="contactName"
                      label="Contact Person"
                      name="contactName"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      autoComplete="name"
                    />
                    <AuthInput
                      id="gstin"
                      label="GSTIN (Optional)"
                      name="gstin"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                    />
                  </div>
                </>
              )}

              <AuthInput
                id="email"
                label="Email Address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                autoComplete="username"
                error={emailError}
              />

              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <AuthInput
                  id="password"
                  label="Password"
                  name="password"
                  type="password"
                  required={isLogin}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />

                {/* Live Password Validation Requirements Panel on Signup */}
                {!isLogin && (
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      marginTop: "4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Password Strength:
                    </div>
                    {[
                      { text: "At least 8 characters", valid: isLengthValid },
                      {
                        text: "One uppercase letter (A-Z)",
                        valid: hasUppercase,
                      },
                      { text: "One number (0-9)", valid: hasNumber },
                    ].map((req, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "11px",
                          color: req.valid ? "var(--green)" : "var(--text-dim)",
                          transition: "all 0.2s",
                        }}
                      >
                        <i
                          className={`ti ${req.valid ? "ti-circle-check-filled text-[#10b981]" : "ti-circle text-white/20"}`}
                          style={{ fontSize: "14px" }}
                        />
                        <span
                          style={{
                            textDecoration: req.valid ? "line-through" : "none",
                            color: req.valid
                              ? "var(--text-muted)"
                              : "var(--text-dim)",
                          }}
                        >
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {isLogin && (
                  <div style={{ textAlign: "right" }}>
                    <a
                      href="/forgot-password"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        color: "var(--text-muted)",
                        textDecoration: "none",
                        textTransform: "uppercase",
                        minHeight: "44px",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      Forgot Password?
                    </a>
                  </div>
                )}
              </div>

              {isLogin && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    margin: "4px 0",
                  }}
                >
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="remember"
                    defaultChecked
                    style={{
                      accentColor: "var(--gold)",
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                    }}
                  />
                  <label
                    htmlFor="rememberMe"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Remember Me
                  </label>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn-primary"
                style={{
                  marginTop: "8px",
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  letterSpacing: "0.2em",
                  cursor: "pointer",
                  minHeight: "44px",
                }}
              >
                {loading
                  ? isLogin
                    ? "Signing In..."
                    : "Creating Account..."
                  : isLogin
                    ? "Sign In"
                    : "Create Account"}
              </button>

              {/* Mobile Toggle */}
              <div
                className="md:hidden"
                style={{ textAlign: "center", marginTop: "8px" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {isLogin ? "New here? " : "Have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setLocalError(null);
                    setLocalSuccess(null);
                    setPassword("");
                  }}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--gold)",
                    background: "transparent",
                    border: "none",
                    textTransform: "uppercase",
                    padding: 0,
                    minHeight: "44px",
                  }}
                >
                  {isLogin ? "Create Account →" : "Sign In →"}
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .auth-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function AuthInput({
  label,
  name,
  type = "text",
  required = false,
  value,
  onChange,
  onBlur,
  autoComplete,
  error,
  id,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  error?: string | null;
  id: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        position: "relative",
        width: "100%",
      }}
    >
      <label
        htmlFor={id}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "0.15em",
          color: "var(--text-muted)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative", width: "100%" }}>
        <input
          id={id}
          name={name}
          type={inputType}
          required={required}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
          style={{
            background: "var(--surface)",
            border: error ? "1px solid #f87171" : "1px solid var(--border)",
            borderBottom: error
              ? "1px solid #f87171"
              : "1px solid var(--border-gold)",
            color: "var(--text)",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            padding: "14px 16px",
            paddingRight: isPassword ? "48px" : "16px",
            outline: "none",
            transition: "all 0.2s",
            width: "100%",
            borderRadius: "12px",
            boxSizing: "border-box",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "0",
              top: "0",
              bottom: "0",
              width: "48px",
              height: "100%",
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              outline: "none",
              zIndex: 2,
              borderRadius: "0 12px 12px 0",
            }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <i
              className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`}
              style={{ fontSize: "18px" }}
            />
          </button>
        )}
      </div>
      {error && (
        <span
          id={`${id}-error`}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "#f87171",
            marginTop: "2px",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
