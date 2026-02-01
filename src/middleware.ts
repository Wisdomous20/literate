// import { withAuth } from "next-auth/middleware";

// export default withAuth({
//   pages: {
//     signIn: "/auth/login",
//   },
// });

// export const config = {
//   matcher: ["/dashboard/:path*", 
//     "/profile/:path*"],
// };

import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
});

export const config = {
  matcher: [
    // "/dashboard/:path*",  // Comment out to view dashboard without auth
    "/profile/:path*"
  ],
};