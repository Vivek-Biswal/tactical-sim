# Firebase sign-in

The existing `/login` page supports Google, email/password sign-in, account creation, and password reset. It retains the website's cream, olive, and topographic design. Authentication uses the existing Firebase AuthProvider and observes Firebase session state. Passwords are passed to Firebase only and are never stored in browser storage by this app.

## Configure

1. In Firebase Console, open Authentication > Sign-in method and enable Google (choose a support email) and Email/Password.
2. In Authentication > Settings > Authorized domains, add the frontend hostname (for example `tactical-sim.vercel.app`) and `localhost` for development. Enter hostnames only, without protocols, ports, or paths.
3. Set the Firebase web-app values from Project settings > Your apps in the frontend environment. Required: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. `NEXT_PUBLIC_FIREBASE_APP_ID` is recommended web-app configuration, but is not required for Auth. See `.env.local.example` for all fields. These are public web configuration; never use a service-account private key here.
4. For local development create root `.env.local` and restart the dev server. For Vercel set Production environment variables and redeploy. Production builds bake in NEXT_PUBLIC values.

## Behavior and scope

- The homepage Login and Start training buttons open `/login` directly, without the old demo role modal. The login card uses Sign in/Create account tabs, Google sign-in, an email form and password visibility. Account roles are assigned by administrators through signed Firebase claims; there is no privileged self-assignment selector.
- Authenticate with Google or email. New email accounts are signed in immediately and start as Commanders unless an administrator has assigned another signed role.
- Forgot password sends Firebase's reset email; Firebase completes the password change through its hosted action handler.
- Existing Firebase sessions persist through the SDK and sign-out uses Firebase.
- Saved redirects are limited to local paths permitted by the signed account role. Configured signed-out users see a loading/redirect state without protected page content. Accounts cannot use another role's workspace by editing local storage or the URL.
- When Firebase configuration is absent, sign-in controls are disabled with an honest unavailable message. Unconfigured localhost can open clearly labeled local map practice; deployed account pages do not grant demo privileges.
- The backend verifies Firebase ID tokens for exercise endpoints and checks signed account roles independently of the UI. Instructor operations require the Instructor account, creating UID and room key. See [account roles](account-roles.md) for provisioning, refresh and token-revocation limitations.
- Firestore's pre-existing optional user-profile sync can fail without blocking authentication. Firebase Authentication does not require a Firestore database.

## Verify after deployment

Check both homepage entry buttons, desktop and mobile layouts, and password visibility/account-creation/reset states. Create an email account, reload to confirm session persistence, sign out, sign in with the same email, request a reset email, and complete Google sign-in. Visit a protected route after sign-out and confirm `/login` redirects back after authentication. Check incorrect-password errors and Google popup cancellation. Live provider success requires a configured Firebase project and user interaction.
