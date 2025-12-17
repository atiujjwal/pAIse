export const getGoogleAuthURL = () => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};

export const getGoogleUser = async (code: string) => {
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    grant_type: "authorization_code",
  };

  try {
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(values as any),
    });

    const { access_token, id_token } = await tokenRes.json();

    const userRes = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: { Authorization: `Bearer ${id_token}` },
      }
    );

    return await userRes.json();
  } catch (error) {
    console.error("Google Fetch Error:", error);
    throw new Error("Failed to fetch Google user");
  }
};