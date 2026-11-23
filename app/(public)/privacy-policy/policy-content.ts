// Content for the public Privacy Policy page. Statements here are limited to
// data practices confirmed in the code audit; do not add retention periods,
// deletion timelines, encryption or compliance claims without confirmation.

export const BUSINESS_NAME = "TESTIO HOSPITALITY SERVICES";
export const BUSINESS_ADDRESS =
  "No:334-11-4, Thennampalayam Extension, Nallur Village, Tiruppur – 641604";
export const CONTACT_EMAIL = "testio24x7india@gmail.com";
export const WEBSITE_URL = "https://www.testiofood.com";
export const APP_NAME = "Testio Customer";
export const APP_PACKAGE = "com.wnradvisory.testio.customer";
export const LAST_UPDATED = "23 November 2026";

export type PolicyBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "emailLine"; lead: string }
  | { kind: "internalLink"; lead: string; label: string; href: string }
  | { kind: "contact" };

export type PolicySection = {
  title: string;
  blocks: PolicyBlock[];
};

export const SECTIONS: PolicySection[] = [
  {
    title: "1. Introduction",
    blocks: [
      {
        kind: "p",
        text: `${BUSINESS_NAME} ("Testio", "we", "us" or "our") is a partnership firm. We run the website ${WEBSITE_URL} and the ${APP_NAME} mobile app (Android package ${APP_PACKAGE}). Through them, customers can find nearby home cooks, place orders, and receive their food by pickup or delivery.`,
      },
      {
        kind: "p",
        text: "This Privacy Policy explains what personal information we collect, why we collect it, who it is shared with, and the choices you have. By using our website or app, you agree to the practices described here. If you do not agree, please do not use them.",
      },
    ],
  },
  {
    title: "2. Information We Collect",
    blocks: [
      { kind: "p", text: "We collect the following information when you use our website or app." },
      {
        kind: "ul",
        items: [
          "Phone number: needed to create your account and log in with a one-time password (OTP) sent by SMS. Only Indian mobile numbers are supported.",
          "Profile details: your name, email address and profile photo. These are optional. A profile photo can be added through the app.",
          "Delivery addresses: the address you type, its label (such as Home or Work) and the map location of that address.",
          "Location: if you give permission, we use your device location to show cooks near you and to help fill in an address. We ask for location only while you are using the website or app, and we do not track your location in the background.",
          "Order information: the dishes in your cart and orders, pickup time, pickup or delivery choice, order status, amounts, payment status and payment reference numbers, and any reason you give for cancelling.",
          "Reviews and ratings: the rating and comment you give a cook or delivery partner.",
          "Referral code: if you enter one.",
          "Push notification details: if you allow notifications in the app, a notification token for your device and the device type (Android or iOS), so we can send order updates.",
          "Support messages: anything you send us when you contact us for help.",
          "Technical details: like most online services, our servers and service providers receive basic technical details, such as your IP address and browser or device type, when your device connects to them.",
        ],
      },
      {
        kind: "p",
        text: "Our website and app do not ask you for card, UPI or bank details. When you pay online, you enter those details on the payment provider's own screen.",
      },
    ],
  },
  {
    title: "3. How We Use Your Information",
    blocks: [
      { kind: "p", text: "We use your information to:" },
      {
        kind: "ul",
        items: [
          "create your account and verify it with an OTP;",
          "show cooks and dishes near you, and help you save and choose delivery addresses;",
          "take, confirm and manage your orders, including pickup, delivery, payments and refunds;",
          "send you order updates and notifications;",
          "let cooks and delivery partners complete your order (see Section 5);",
          "show reviews and ratings on the platform;",
          "respond to your questions and support requests;",
          "keep the service safe and prevent misuse, for example by limiting repeated OTP requests; and",
          "meet our legal obligations.",
        ],
      },
      {
        kind: "p",
        text: "We have not added advertising or analytics tools of our own to our website or app, and we do not use your information for advertising.",
      },
    ],
  },
  {
    title: "4. Cookies and Similar Technologies",
    blocks: [
      { kind: "p", text: "On our website we use only what is needed to make the service work." },
      {
        kind: "ul",
        items: [
          "Sign-in cookies: when you log in, cookies from our authentication provider (Supabase) keep you signed in and let us protect pages that need an account.",
          "Browser local storage: keeps your signed-in account details (such as your phone number) and your cart (the cook, dishes and quantities) on your device.",
          "Browser session storage: temporarily keeps your phone number between the login steps, the page to return to after login, a dish you picked before logging in, and the location you chose or allowed for browsing. This is cleared when you close the tab.",
        ],
      },
      {
        kind: "p",
        text: "The mobile app does not use browser cookies. It keeps your sign-in session and basic profile details on your device so you stay logged in.",
      },
      {
        kind: "p",
        text: "We do not set advertising or analytics cookies ourselves. You can clear cookies and site data in your browser settings at any time, but you may then be signed out and your cart may be emptied.",
      },
    ],
  },
  {
    title: "5. Sharing of Information",
    blocks: [
      { kind: "p", text: "We share information only as needed to run the service." },
      {
        kind: "ul",
        items: [
          "Cooks: the cook who receives your order can see your name (or your phone number if you have not added a name), your phone number, and your order details such as dishes and pickup time.",
          "Delivery partners: for delivery orders, the delivery partner assigned to your order can see your name, phone number, profile photo (if you added one), delivery address and location, and the items in your order.",
          "Other people on the platform: reviews and ratings you submit may be shown to other users, including on a cook's page.",
          "Phone calls: if you call a cook from the app, the cook will see your number as in any normal phone call.",
          "Service providers: companies that help us run the service, listed in Section 9, receive the information they need to do their job.",
          "Legal reasons: we may disclose information if the law requires it or to protect the rights and safety of our users or Testio.",
        ],
      },
    ],
  },
  {
    title: "6. Data Storage and Security",
    blocks: [
      {
        kind: "p",
        text: "Your account details, addresses, orders and reviews are stored with our backend service provider, Supabase. Profile photos are stored in the same service.",
      },
      {
        kind: "p",
        text: "We take reasonable steps to protect your information, and your account is protected by sign-in with an OTP. Please keep your OTP private and do not share it with anyone.",
      },
      {
        kind: "p",
        text: "Please note that profile photos are stored in a location that can be opened by anyone who has the photo's web address. If you prefer not to have this, do not upload a profile photo.",
      },
      {
        kind: "p",
        text: "No method of storing or sending information over the internet is completely secure, so we cannot guarantee absolute security.",
      },
    ],
  },
  {
    title: "7. Data Retention",
    blocks: [
      {
        kind: "p",
        text: "We keep your personal information for as long as we need it to provide the service to you and to meet our legal obligations.",
      },
    ],
  },
  {
    title: "8. User Rights and Data Deletion",
    blocks: [
      { kind: "p", text: "You have control over your information:" },
      {
        kind: "ul",
        items: [
          "You can view and update your name, email address and profile photo in your profile.",
          "You can remove saved addresses in the app.",
          "You can turn off location permission or notification permission at any time in your device or browser settings.",
          "You can ask us to give you access to the personal information we hold about you, correct it, or delete it.",
        ],
      },
      {
        kind: "emailLine",
        lead: "To make a request, email us at",
      },
      {
        kind: "internalLink",
        lead: "To request deletion of your account, see our",
        label: "Account Deletion page",
        href: "/delete-account",
      },
      {
        kind: "p",
        text: "We may need to keep some information where we are required to do so by law.",
      },
    ],
  },
  {
    title: "9. Third-Party Services",
    blocks: [
      {
        kind: "p",
        text: "We use the following services to run our website and app. Each of them handles information under its own terms and privacy policy.",
      },
      {
        kind: "ul",
        items: [
          "Supabase: database, user sign-in, file storage and backend functions.",
          "An SMS service provider: sends the OTP to your phone number.",
          "Razorpay: processes online payments. It may receive your name, phone number, email address and the order amount, along with the payment details you enter on its screen.",
          "Google Maps Platform (Maps, Places and Geocoding): used in the app to show maps, search for addresses and turn a map location into an address. The app may also open Google Maps or Apple Maps to guide you to a cook.",
          "Mapbox: used on the website to show maps, search for addresses, turn a map location into an address and draw routes when you track an order. This can include the location of your delivery address.",
          "OpenStreetMap Nominatim: used on the website as a backup to turn a map location into an address.",
          "Expo push notifications and Google Firebase Cloud Messaging: deliver notifications to your device in the app, using your notification token and the notification text.",
        ],
      },
      {
        kind: "p",
        text: "Our website and app may contain links or open other apps that we do not control. We are not responsible for how those services handle your information.",
      },
    ],
  },
  {
    title: "10. Children's Privacy",
    blocks: [
      {
        kind: "p",
        text: "Our website and app are not meant for children under 18, and we do not knowingly collect personal information from them. If you believe a child has given us personal information, please contact us so we can look into it.",
      },
    ],
  },
  {
    title: "11. Changes to This Privacy Policy",
    blocks: [
      {
        kind: "p",
        text: `We may update this Privacy Policy from time to time. When we do, we will change the "Last Updated" date at the top of this page. Please check this page now and then. If you keep using our website or app after a change, it means you accept the updated policy.`,
      },
    ],
  },
  {
    title: "12. Contact Us",
    blocks: [
      {
        kind: "p",
        text: "If you have any questions about this Privacy Policy or how we handle your information, please contact us.",
      },
      { kind: "contact" },
    ],
  },
];
