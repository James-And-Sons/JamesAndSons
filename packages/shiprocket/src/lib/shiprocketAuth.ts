let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;

export interface IShiprocketConfig {
  email?: string;
  password?: string;
}

export async function getShiprocketToken(
  config: IShiprocketConfig = {},
): Promise<string | null> {
  const now = Date.now();

  if (cachedToken && now < tokenExpiryTime - 5 * 60 * 1000) {
    return cachedToken;
  }

  const email = config.email || process.env.SHIPROCKET_EMAIL;
  const password = config.password || process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    console.error("CRITICAL: Shiprocket credentials missing.");
    return null;
  }

  try {
    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    if (data && data.token) {
      cachedToken = data.token;
      tokenExpiryTime = Date.now() + 9 * 24 * 60 * 60 * 1000; // 9 days
      return cachedToken;
    }
    return null;
  } catch (err) {
    console.error("Shiprocket Auth Failure:", err);
    return null;
  }
}
