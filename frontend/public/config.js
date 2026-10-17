window.APP_CONFIG = {
    // The URL of your backend API
    apiBaseUrl: (window.location.hostname === "mrdietplan.in" || window.location.hostname === "www.mrdietplan.in")
        ? "https://mrdietplan.in/api"
        : "/api/controllers",

    // Your production Google Client ID
    googleClientId: "785889991022-6jfg7dqe45cfecf1n0e3kubor89lof3p.apps.googleusercontent.com",

    // Pricing (Aligned with component expectations)
    planStarterPrice: 499,
    planPremiumPrice: 799,
    planElitePrice: 2499,
    originalPriceStarter: 1499,
    originalPricePremium: 1899,
    originalPriceElite: 5999,

    // Development & Support Tools
    enableDummyData: false,
    enableRegenerate: false,

    // Feature Flags
    enableGenerationTimer: true,
    timerMinHours: 0.01,
    timerMaxHours: 0.02, 
};
