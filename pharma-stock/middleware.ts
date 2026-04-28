import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

enum Route {
  Signals = "/signals",
  AskAboutStock = "/ask-about-stock",
  Auth = "/auth",
  SignIn = "/auth/login",
  Home = "/",
  Admin = "/admin",
  AdminApi = "/api/admin",
  SignalsApi = "/api/signals",
  DailyVideo = "/daily-video",
  EliteApplications = "/elite-group",
  //Pricing = "/subscription",
}

const PROTECTED_ROUTES = [
  Route.Signals,
  Route.AskAboutStock,
  Route.Admin,
  Route.SignalsApi,
  Route.DailyVideo,
  Route.EliteApplications,
];

//const SUBSCRIBED_ROUTES = [Route.Signals, Route.SignalsApi, Route.DailyVideo];

const LANGUAGES = ["en", "ar"];
const LANGUAGE_COOKIE_NAME = "preferred_language";

const ADMIN_API_ROUTES = ["/api/admin"];
export default withAuth(
  async function middleware(request: NextRequest) {
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host");
    const baseUrl = `${protocol}://${host}`;
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      const pathname = request.nextUrl.pathname;
      const isAuth = !!token;
      const userRole = token?.role;

      // Handle admin API routes
      if (ADMIN_API_ROUTES.some((route) => pathname.startsWith(route))) {
        if (!isAuth || userRole !== "admin") {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.next();
      }

      // Extract the language from the URL (assumes the language comes first in the path)
      const langPrefix = pathname.split("/")[1];

      // Check for malformed URLs with repeated segments
      if (
        pathname.includes("/auth/ar/auth") ||
        pathname.includes("/auth/en/auth")
      ) {
        // Redirect to the home page with the correct language prefix
        return NextResponse.redirect(
          new URL("/" + langPrefix + Route.Home, baseUrl),
        );
      }

      // Handle direct access to /ar/auth or /en/auth (which are 404 pages)
      if (pathname === "/ar/auth" || pathname === "/en/auth") {
        return NextResponse.redirect(
          new URL("/" + langPrefix + Route.SignIn, baseUrl),
        );
      }

      // Check if the path starts with a supported language
      if (!pathname.startsWith("/api") && !pathname.startsWith("/admin")) {
        if (!LANGUAGES.includes(langPrefix)) {
          // If no language, redirect to default language (e.g., "en")

          const languageCookie = request.cookies.get(LANGUAGE_COOKIE_NAME);
          const preferredLanguage = languageCookie
            ? languageCookie.value
            : "ar";

          // Redirect to the preferred language
          const preferredLangUrl = new URL(
            `${preferredLanguage}${pathname}`,
            baseUrl, // Use origin instead of request.url
          );

          console.log(preferredLangUrl.href + " " + baseUrl);
          return NextResponse.redirect(preferredLangUrl);
        }
      }

      const isAuthRoute = pathname.startsWith("/" + langPrefix + Route.Auth);
      const isProtected = PROTECTED_ROUTES.some(
        (route) =>
          pathname.startsWith("/" + langPrefix + route) ||
          pathname.startsWith(route),
      );
      const isAdminRoute = pathname.startsWith(Route.Admin);
      /*  const isSubscribedRoute = SUBSCRIBED_ROUTES.some(
        (route) =>
          pathname.startsWith("/" + langPrefix + route) ||
          pathname.startsWith(route)
      ); */

      // Check for auth route loops - if the path contains multiple language prefixes
      const pathSegments = pathname.split("/");
      const languagePrefixCount = pathSegments.filter((segment) =>
        LANGUAGES.includes(segment),
      ).length;
      if (languagePrefixCount > 1) {
        // Redirect to the home page with the correct language prefix
        return NextResponse.redirect(
          new URL("/" + langPrefix + Route.Home, baseUrl),
        );
      }

      if (isAuthRoute && isAuth) {
        return NextResponse.redirect(
          new URL("/" + langPrefix + Route.Home, baseUrl),
        );
      }

      if (!isAuth && isProtected) {
        const lang = langPrefix;

        if (isAdminRoute && (!isAuth || userRole !== "admin")) {
          return NextResponse.redirect(new URL("/en" + Route.Home, baseUrl));
        }

        const loginUrl = new URL("/" + lang + Route.SignIn, baseUrl);
        loginUrl.searchParams.set(
          "message",
          `${
            langPrefix === "ar"
              ? "يرجى تسجيل الدخول للوصول إلى هذه الصفحة."
              : "Please log in to access this page"
          }`,
        );
        return NextResponse.redirect(loginUrl);
      }

      /*  if (isAuth && isSubscribedRoute && userRole !== "admin") {
        // Check subscription status
        try {
          const response = await fetch(
            new URL("/api/subscriptions/status", baseUrl),
            {
              headers: {
                Cookie: request.headers.get("cookie") || "",
                "Cache-Control": "no-cache",
              },
            }
          );

          // Check if the response is OK before trying to parse JSON
          if (!response.ok) {
            console.error(
              `Subscription status check failed: ${response.status}`
            );
            // If we can't verify subscription, redirect to pricing
            const pricingUrl = new URL(
              "/" + langPrefix + Route.Pricing,
              baseUrl
            );
            pricingUrl.searchParams.set(
              "message",
              `${
                langPrefix === "ar"
                  ? "يرجى الاشتراك للوصول إلى هذه الصفحة"
                  : "Please subscribe to access this page"
              }`
            );
            return NextResponse.redirect(pricingUrl);
          }

          const subscriptionData = await response.json();

          if (!subscriptionData.isActive) {
            const pricingUrl = new URL(
              "/" + langPrefix + Route.Pricing,
              baseUrl
            );
            pricingUrl.searchParams.set(
              "message",
              `${
                langPrefix === "ar"
                  ? "يرجى الاشتراك للوصول إلى هذه الصفحة"
                  : "Please subscribe to access this page"
              }`
            );
            return NextResponse.redirect(pricingUrl);
          }
        } catch (error) {
          console.error("Error checking subscription status:", error);
          // If there's an error checking subscription, allow access to avoid blocking users
          return NextResponse.next();
        }
      } */

      if (isAdminRoute && isAuth && userRole === "admin") {
        return NextResponse.next();
      }
      if (
        (isAdminRoute || pathname.startsWith(Route.AdminApi)) &&
        (!isAuth || userRole !== "admin")
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Middleware error:", error);
      // Instead of redirecting to error page, redirect to login page with the correct language
      const langPrefix = request.nextUrl.pathname.split("/")[1] || "ar";
      return NextResponse.redirect(
        new URL("/" + langPrefix + Route.SignIn, baseUrl),
      );
    }
  },
  {
    callbacks: {
      authorized: () => {
        return true; // Let the middleware handle the authorization
      },
    },
  },
);

export const config = {
  matcher: [
    // "/((?!_next|api|static|public|.*\\..*).*)", // Match all routes except those that begin with `_next`, `api`, or serve static files
    //  "/api/:path*", // Explicitly include API routes for middleware processing
    "/((?!_next|api/auth|static|webmail|public|.*\\..*).*)",
    "/api/((?!auth).*)*",
    "/admin/:path*",
  ],
};
