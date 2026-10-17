const fs = require("fs");
const path = require("path");

const sharpModulePath = process.argv[2];
if (!sharpModulePath) {
  throw new Error("Pass the absolute path to the bundled sharp module.");
}
const sharp = require(sharpModulePath);

const outputDir = __dirname;

const palette = {
  bg: "#f8fafc",
  ink: "#0f172a",
  muted: "#475569",
  line: "#64748b",
  frontend: "#dbeafe",
  frontendStroke: "#2563eb",
  backend: "#dcfce7",
  backendStroke: "#16a34a",
  data: "#fef3c7",
  dataStroke: "#d97706",
  external: "#f3e8ff",
  externalStroke: "#9333ea",
  admin: "#ffe4e6",
  adminStroke: "#e11d48",
  neutral: "#ffffff",
  neutralStroke: "#94a3b8",
  logical: "#dc2626",
};

const esc = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function svgStart(width, height, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.10"/>
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${palette.line}"/>
    </marker>
    <marker id="logicalArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${palette.logical}"/>
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="${palette.bg}"/>
  <style>
    text { font-family: "Segoe UI", Arial, sans-serif; fill: ${palette.ink}; }
    .title { font-size: 44px; font-weight: 700; }
    .subtitle { font-size: 22px; fill: ${palette.muted}; }
    .panel-title { font-size: 28px; font-weight: 700; }
    .node-title { font-size: 25px; font-weight: 700; }
    .node-line { font-size: 20px; fill: ${palette.muted}; }
    .edge-label { font-size: 18px; font-weight: 600; fill: ${palette.muted}; }
    .entity-title { font-size: 26px; font-weight: 700; }
    .entity-field { font-size: 19px; }
    .entity-key { font-size: 17px; font-weight: 700; fill: ${palette.muted}; }
  </style>`;
}

function heading(title, subtitle, width) {
  return `<text class="title" x="${width / 2}" y="62" text-anchor="middle">${esc(title)}</text>
  <text class="subtitle" x="${width / 2}" y="98" text-anchor="middle">${esc(subtitle)}</text>`;
}

function panel(x, y, w, h, title, fill, stroke) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${fill}" fill-opacity="0.45" stroke="${stroke}" stroke-width="3"/>
  <text class="panel-title" x="${x + 28}" y="${y + 44}">${esc(title)}</text>`;
}

function box({ x, y, w, h, title, lines = [], fill = palette.neutral, stroke = palette.neutralStroke }) {
  const lineMarkup = lines.map((line, index) =>
    `<text class="node-line" x="${x + w / 2}" y="${y + 73 + index * 28}" text-anchor="middle">${esc(line)}</text>`
  ).join("\n");
  return `<g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
    <text class="node-title" x="${x + w / 2}" y="${y + 39}" text-anchor="middle">${esc(title)}</text>
    ${lineMarkup}
  </g>`;
}

function route(points, label = "", options = {}) {
  const { dashed = false, bidirectional = false, labelX, labelY } = options;
  const color = dashed ? palette.logical : palette.line;
  const marker = dashed ? "logicalArrow" : "arrow";
  const pointString = points.map(([x, y]) => `${x},${y}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const lx = labelX ?? (first[0] + last[0]) / 2;
  const ly = labelY ?? (first[1] + last[1]) / 2 - 10;
  return `<polyline points="${pointString}" fill="none" stroke="${color}" stroke-width="4" ${dashed ? 'stroke-dasharray="14 10"' : ""} marker-end="url(#${marker})" ${bidirectional ? `marker-start="url(#${marker})"` : ""}/>
  ${label ? `<rect x="${lx - Math.max(55, label.length * 5.2)}" y="${ly - 22}" width="${Math.max(110, label.length * 10.4)}" height="31" rx="8" fill="${palette.bg}" fill-opacity="0.94"/><text class="edge-label" x="${lx}" y="${ly}" text-anchor="middle">${esc(label)}</text>` : ""}`;
}

function entity({ x, y, w, title, fields, fill, stroke }) {
  const headerHeight = 56;
  const rowHeight = 27;
  const h = headerHeight + 18 + fields.length * rowHeight;
  const fieldMarkup = fields.map((field, index) => {
    const yPos = y + headerHeight + 27 + index * rowHeight;
    const keyMatch = field.match(/\[(PK|FK|UK|FK,UK)\]$/);
    const clean = keyMatch ? field.slice(0, keyMatch.index).trim() : field;
    const key = keyMatch ? keyMatch[1] : "";
    return `<text class="entity-field" x="${x + 20}" y="${yPos}">${esc(clean)}</text>${key ? `<text class="entity-key" x="${x + w - 18}" y="${yPos}" text-anchor="end">${esc(key)}</text>` : ""}`;
  }).join("\n");
  return {
    h,
    svg: `<g filter="url(#shadow)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <path d="M ${x} ${y + headerHeight} H ${x + w}" stroke="${stroke}" stroke-width="3"/>
      <text class="entity-title" x="${x + w / 2}" y="${y + 37}" text-anchor="middle">${esc(title)}</text>
      ${fieldMarkup}
    </g>`,
  };
}

function codeArchitectureSvg() {
  const width = 2400;
  const height = 1480;
  const elements = [svgStart(width, height, "Mr Diet Plan code architecture"), heading("Mr Diet Plan — Code Architecture", "React + PHP + MySQL with admin-selectable OpenAI and Gemini providers", width)];

  elements.push(panel(50, 145, 680, 1260, "Frontend — React, Vite, Tailwind", palette.frontend, palette.frontendStroke));
  elements.push(panel(805, 145, 760, 1260, "Backend — PHP Controllers & Services", palette.backend, palette.backendStroke));
  elements.push(panel(1640, 145, 710, 1260, "Data & External Services", palette.data, palette.dataStroke));

  const nodes = {
    browser: { x: 105, y: 230, w: 250, h: 105, title: "Browser", lines: ["User / Admin"] },
    app: { x: 405, y: 230, w: 270, h: 105, title: "App.tsx", lines: ["Routes & providers"] },
    user: { x: 100, y: 440, w: 270, h: 150, title: "User pages", lines: ["Auth & profiles", "Dashboard & diet", "Checkout & tracking"] },
    admin: { x: 410, y: 440, w: 270, h: 150, title: "Admin pages", lines: ["Users & analytics", "Settings & coupons", "Transactions"] },
    modules: { x: 100, y: 700, w: 580, h: 155, title: "Feature modules & hooks", lines: ["Diet dashboard • Period tracker", "Notifications • Check-ins"] },
    apiClient: { x: 160, y: 980, w: 460, h: 145, title: "src/lib/api.ts", lines: ["Central API client", "Cache-busting & JSON requests"] },
    proxy: { x: 990, y: 230, w: 390, h: 110, title: "Vite /api proxy", lines: ["Development routing"] },
    publicApi: { x: 850, y: 445, w: 310, h: 190, title: "User controllers", lines: ["auth • profiles", "subscriptions • payment", "diet • timers • period"] },
    adminApi: { x: 1210, y: 445, w: 310, h: 190, title: "Admin controllers", lines: ["users • settings", "analytics • coupons", "transactions • CMS"] },
    generator: { x: 850, y: 760, w: 310, h: 135, title: "generate_plan.php", lines: ["Plan generation", "Meal substitution"] },
    aiService: { x: 1210, y: 760, w: 310, h: 135, title: "AI service", lines: ["Prompt building", "Response parsing"] },
    db: { x: 1010, y: 1060, w: 350, h: 135, title: "config/db.php", lines: ["PDO bootstrap", "Shared database access"] },
    mysql: { x: 1840, y: 235, w: 320, h: 145, title: "MySQL", lines: ["mrdietweb", "18 live tables"] },
    openai: { x: 1710, y: 535, w: 260, h: 130, title: "OpenAI API", lines: ["Current AI provider"] },
    gemini: { x: 2020, y: 535, w: 260, h: 130, title: "Gemini API", lines: ["Admin-selectable"] },
    oauth: { x: 1710, y: 785, w: 260, h: 125, title: "Google OAuth", lines: ["Authentication"] },
    payments: { x: 2020, y: 785, w: 260, h: 125, title: "Payments", lines: ["Cashfree / Razorpay"] },
    oneSignal: { x: 1710, y: 1035, w: 260, h: 125, title: "OneSignal", lines: ["Push notifications"] },
    cron: { x: 2020, y: 1035, w: 260, h: 125, title: "Cron jobs", lines: ["Scheduled reminders"] },
  };

  elements.push(route([[355, 282], [405, 282]]));
  elements.push(route([[540, 335], [540, 390], [235, 390], [235, 440]]));
  elements.push(route([[540, 335], [540, 440]]));
  elements.push(route([[235, 590], [235, 700]]));
  elements.push(route([[545, 590], [545, 700]]));
  elements.push(route([[390, 855], [390, 980]]));
  elements.push(route([[620, 1052], [760, 1052], [760, 285], [990, 285]], "/api requests", { labelX: 770, labelY: 680 }));
  elements.push(route([[1185, 340], [1185, 395], [1005, 395], [1005, 445]]));
  elements.push(route([[1185, 340], [1185, 395], [1365, 395], [1365, 445]]));
  elements.push(route([[1005, 635], [1005, 760]]));
  elements.push(route([[1160, 827], [1210, 827]], "AI call"));
  elements.push(route([[1005, 635], [1005, 1000], [1185, 1000], [1185, 1060]]));
  elements.push(route([[1365, 635], [1365, 1000], [1185, 1000], [1185, 1060]]));
  elements.push(route([[1360, 1127], [1595, 1127], [1595, 307], [1840, 307]], "SQL / PDO", { labelX: 1595, labelY: 690 }));
  elements.push(route([[1520, 827], [1600, 827], [1600, 600], [1710, 600]], "Current"));
  elements.push(route([[1520, 827], [1600, 827], [1600, 700], [2150, 700], [2150, 665]], "Admin-selectable", { dashed: true, labelX: 1950, labelY: 725 }));
  elements.push(route([[1160, 540], [1580, 540], [1580, 847], [1710, 847]], "OAuth"));
  elements.push(route([[1160, 570], [1570, 570], [1570, 847], [2020, 847]], "Payments", { labelX: 1830, labelY: 825 }));
  elements.push(route([[1160, 600], [1550, 600], [1550, 1097], [1710, 1097]], "Push", { labelX: 1575, labelY: 990 }));
  elements.push(route([[2150, 1035], [2150, 975], [1970, 975], [1970, 1097]], "Triggers"));

  Object.values(nodes).forEach((node) => elements.push(box(node)));
  elements.push(`</svg>`);
  return elements.join("\n");
}

function systemArchitectureSvg() {
  const width = 2400;
  const height = 1660;
  const elements = [svgStart(width, height, "Mr Diet Plan runtime system architecture"), heading("Mr Diet Plan — Runtime Architecture", "Development and production request paths", width)];

  elements.push(panel(55, 150, 2290, 280, "Client layer", palette.frontend, palette.frontendStroke));
  elements.push(panel(55, 500, 1090, 520, "Local development", palette.backend, palette.backendStroke));
  elements.push(panel(1255, 500, 1090, 520, "Production deployment", palette.admin, palette.adminStroke));
  elements.push(panel(55, 1090, 2290, 490, "Data, background jobs & integrations", palette.data, palette.dataStroke));

  const nodes = {
    user: { x: 120, y: 235, w: 280, h: 115, title: "Website user", lines: ["Customer browser"] },
    admin: { x: 460, y: 235, w: 280, h: 115, title: "Administrator", lines: ["Admin browser"] },
    spa: { x: 880, y: 220, w: 450, h: 145, title: "React SPA", lines: ["Routes • pages • feature modules", "Central API client"] },
    storage: { x: 1530, y: 235, w: 390, h: 115, title: "Browser storage", lines: ["Session • user • public config"] },
    vite: { x: 160, y: 620, w: 340, h: 135, title: "Vite :8080", lines: ["Frontend dev server"] },
    proxy: { x: 610, y: 620, w: 340, h: 135, title: "/api proxy", lines: ["Forwards API requests"] },
    phpDev: { x: 385, y: 835, w: 340, h: 135, title: "PHP :8000", lines: ["Controllers & services"] },
    apache: { x: 1350, y: 620, w: 340, h: 135, title: "Apache / HTTPS", lines: ["Web server"] },
    staticBuild: { x: 1800, y: 600, w: 340, h: 135, title: "React dist", lines: ["Compiled static assets"] },
    phpProd: { x: 1575, y: 835, w: 340, h: 135, title: "PHP API", lines: ["Production controllers"] },
    mysql: { x: 980, y: 1190, w: 420, h: 150, title: "MySQL database", lines: ["Users • profiles • plans", "Settings • payments • logs"] },
    cron: { x: 120, y: 1220, w: 330, h: 130, title: "Cron scheduler", lines: ["Reminder processing"] },
    notifications: { x: 520, y: 1220, w: 330, h: 130, title: "Notification service", lines: ["Push orchestration"] },
    ai: { x: 1520, y: 1190, w: 350, h: 150, title: "AI provider", lines: ["OpenAI or Gemini", "Admin-selected"] },
    payment: { x: 1950, y: 1190, w: 330, h: 150, title: "Payment gateways", lines: ["Cashfree • Razorpay"] },
    oneSignal: { x: 520, y: 1420, w: 330, h: 110, title: "OneSignal API", lines: ["Push delivery"] },
    oauth: { x: 1520, y: 1420, w: 350, h: 110, title: "Google OAuth", lines: ["Identity verification"] },
  };

  elements.push(route([[260, 350], [260, 390], [810, 390], [810, 255], [880, 255]]));
  elements.push(route([[740, 292], [820, 292], [820, 330], [880, 330]]));
  elements.push(route([[1330, 292], [1530, 292]], "Read / write", { bidirectional: true }));
  elements.push(route([[1080, 365], [1080, 465], [330, 465], [330, 620]], "Development"));
  elements.push(route([[1080, 365], [1080, 465], [1520, 465], [1520, 620]], "Production"));
  elements.push(route([[500, 687], [610, 687]]));
  elements.push(route([[780, 755], [780, 800], [555, 800], [555, 835]]));
  elements.push(route([[1690, 687], [1800, 667]]));
  elements.push(route([[1520, 755], [1520, 800], [1745, 800], [1745, 835]]));
  elements.push(route([[555, 970], [555, 1050], [1190, 1050], [1190, 1190]], "PDO"));
  elements.push(route([[1745, 970], [1745, 1050], [1190, 1050], [1190, 1190]], "PDO"));
  elements.push(route([[725, 1285], [980, 1285]], "Reads settings"));
  elements.push(route([[450, 1285], [520, 1285]]));
  elements.push(route([[685, 1350], [685, 1420]], "Push"));
  elements.push(route([[1400, 1265], [1520, 1265]], "Generation"));
  elements.push(route([[1400, 1305], [1900, 1305], [1950, 1265]], "Transactions", { labelX: 1735, labelY: 1330 }));
  elements.push(route([[1695, 1340], [1695, 1420]], "Login"));

  Object.values(nodes).forEach((node) => elements.push(box(node)));
  elements.push(`</svg>`);
  return elements.join("\n");
}

function databaseErSvg() {
  const width = 3000;
  const height = 2670;
  const elements = [svgStart(width, height, "Mr Diet Plan database ER diagram"), heading("Mr Diet Plan — Database ER Diagram", "Live local schema: mrdietweb • solid = enforced FK • dashed red = logical relation without FK", width)];

  const definitions = {
    notificationPreferences: { x: 50, y: 170, w: 480, title: "NOTIFICATION_PREFERENCES", fields: ["id : int [PK]", "user_id : int [FK,UK]", "onesignal_player_id : varchar", "water_reminder_enabled : bool", "meal_reminder_enabled : bool", "period_reminder_enabled : bool"] },
    notificationLogs: { x: 600, y: 170, w: 430, title: "NOTIFICATION_LOGS", fields: ["id : int [PK]", "user_id : int [FK]", "type : varchar", "sent_date : date", "sent_time : time"] },
    users: { x: 1160, y: 150, w: 570, title: "USERS", fields: ["id : int [PK]", "email : varchar [UK]", "password : varchar", "name : varchar", "google_id : varchar [UK]", "is_admin : bool", "referral_code : varchar [UK]", "referred_by : int [FK]"] },
    withdrawals: { x: 1850, y: 170, w: 470, title: "WITHDRAWALS", fields: ["id : int [PK]", "user_id : int [FK]", "amount : decimal", "status : enum", "transaction_id : varchar"] },
    withdrawalRequests: { x: 2440, y: 170, w: 500, title: "WITHDRAWAL_REQUESTS", fields: ["id : int [PK]", "user_id : int", "amount : decimal", "status : enum", "transaction_id : varchar"] },
    health: { x: 370, y: 680, w: 500, title: "HEALTH_METRICS", fields: ["id : int [PK]", "profile_id : int [FK,UK]", "bmi : decimal", "target_calories : int", "calculated_calories : int", "updated_by_admin : bool"] },
    profiles: { x: 1080, y: 650, w: 650, title: "PROFILES", fields: ["id : int [PK]", "user_id : int [FK,UK]", "name : varchar", "age / gender : value", "height / weight / bmi : decimal", "goal / activity_level : varchar", "extended_data : longtext", "cycle_length / period_duration : int", "last_period_start : date"] },
    settings: { x: 2440, y: 650, w: 500, title: "SETTINGS", fields: ["id : int [PK]", "setting_key : varchar [UK]", "setting_value : text", "created_at : timestamp", "updated_at : timestamp"] },
    period: { x: 50, y: 1130, w: 570, title: "PERIOD_LOGS", fields: ["id : int [PK]", "user_id : int [FK]", "profile_id : int [FK]", "log_date : date", "is_period_day : bool", "flow_level : varchar", "symptoms : longtext", "mood / notes : text"] },
    subscriptions: { x: 1040, y: 1170, w: 650, title: "SUBSCRIPTIONS", fields: ["id : int [PK]", "user_id : int [FK]", "profile_id : int [FK]", "plan_type / plan_days : value", "start_date / end_date : date", "amount : decimal", "payment_method / status : varchar", "transaction_id : varchar", "status : enum"] },
    referrals: { x: 1830, y: 1110, w: 580, title: "REFERRAL_EARNINGS", fields: ["id : int [PK]", "user_id : int [FK]", "referred_user_id : int [FK]", "subscription_id : int [FK]", "amount : decimal", "status : enum", "description : text", "is_admin_adjustment : bool"] },
    coupons: { x: 2450, y: 1110, w: 480, title: "COUPONS", fields: ["id : int [PK]", "code : varchar [UK]", "discount_type : enum", "discount_value : decimal", "used_count : int", "is_active : bool"] },
    dailyPlans: { x: 690, y: 1740, w: 560, title: "DAILY_DIET_PLANS", fields: ["id : int [PK]", "subscription_id : int [FK]", "day_number : int", "plan_date : date", "meal_json : longtext", "is_unlocked : bool", "meal_changes_count : int"] },
    dailyLogs: { x: 1320, y: 1740, w: 520, title: "DAILY_LOGS", fields: ["id : int [PK]", "subscription_id : int [FK]", "day_number : int", "weight_log : decimal", "mood_log : varchar", "notes : text"] },
    pages: { x: 2450, y: 1660, w: 480, title: "PAGES", fields: ["id : int [PK]", "slug : varchar [UK]", "title : varchar", "content : text"] },
    generationTimers: { x: 420, y: 2240, w: 520, title: "GENERATION_TIMERS", fields: ["id : int [PK]", "subscription_id : int", "day_number : int", "unlock_at : datetime"] },
    timers: { x: 1050, y: 2240, w: 460, title: "TIMERS", fields: ["id : int [PK]", "subscription_id : int", "day_number : int", "unlock_at : bigint"] },
    checkins: { x: 1620, y: 2240, w: 480, title: "CHECKINS", fields: ["id : int [PK]", "subscription_id : int", "day_number : int", "weight : decimal", "mood : varchar", "notes : text"] },
  };

  const entities = {};
  Object.entries(definitions).forEach(([key, def]) => {
    let fill = palette.neutral;
    let stroke = palette.neutralStroke;
    if (["users", "profiles", "health", "period", "notificationPreferences", "notificationLogs"].includes(key)) {
      fill = palette.frontend; stroke = palette.frontendStroke;
    } else if (["subscriptions", "dailyPlans", "dailyLogs", "generationTimers", "timers", "checkins"].includes(key)) {
      fill = palette.backend; stroke = palette.backendStroke;
    } else if (["referrals", "withdrawals", "withdrawalRequests", "coupons"].includes(key)) {
      fill = palette.admin; stroke = palette.adminStroke;
    } else {
      fill = palette.data; stroke = palette.dataStroke;
    }
    entities[key] = { ...def, ...entity({ ...def, fill, stroke }) };
  });

  const bottom = (key) => [entities[key].x + entities[key].w / 2, entities[key].y + entities[key].h];
  const top = (key) => [entities[key].x + entities[key].w / 2, entities[key].y];
  const left = (key) => [entities[key].x, entities[key].y + entities[key].h / 2];
  const right = (key) => [entities[key].x + entities[key].w, entities[key].y + entities[key].h / 2];

  elements.push(route([right("notificationPreferences"), [900, right("notificationPreferences")[1]], [900, 300], left("users")], "1 → 0..1", { labelX: 880, labelY: 280 }));
  elements.push(route([right("notificationLogs"), left("users")], "1 → 0..*", { labelY: 410 }));
  elements.push(route([right("users"), left("withdrawals")], "1 → 0..*", { labelY: 300 }));
  elements.push(route([right("users"), [2380, 330], [2380, right("withdrawalRequests")[1]], left("withdrawalRequests")], "logical 1 → 0..*", { dashed: true, labelX: 2380, labelY: 300 }));
  elements.push(route([[1450, 150], [1450, 120], [1780, 120], [1780, 410], [1730, 410]], "self referral", { labelX: 1775, labelY: 105 }));
  elements.push(route([bottom("users"), top("profiles")], "1 → 0..1"));
  elements.push(route([left("profiles"), right("health")], "1 → 0..1"));
  elements.push(route([left("profiles"), [760, 850], [760, 1260], right("period")], "1 → 0..*", { labelX: 760, labelY: 1100 }));
  elements.push(route([[1160, 410], [800, 410], [800, 1040], [335, 1040], top("period")], "User 1 → logs", { labelX: 660, labelY: 1020 }));
  elements.push(route([bottom("profiles"), top("subscriptions")], "Profile 1 → 0..*"));
  elements.push(route([[1550, 470], [1780, 470], [1780, 1040], [1520, 1040], top("subscriptions")], "User 1 → 0..*", { labelX: 1760, labelY: 850 }));
  elements.push(route([right("subscriptions"), left("referrals")], "1 → 0..*"));
  elements.push(route([[1730, 350], [1810, 350], [1810, 1270], left("referrals")], "User / referred user", { labelX: 1810, labelY: 1000 }));
  elements.push(route([[1250, bottom("subscriptions")[1]], [1250, 1660], [970, 1660], top("dailyPlans")], "1 → 0..*", { labelX: 1080, labelY: 1645 }));
  elements.push(route([[1480, bottom("subscriptions")[1]], [1480, 1660], [1580, 1660], top("dailyLogs")], "1 → 0..*", { labelX: 1570, labelY: 1645 }));
  elements.push(route([[1120, bottom("subscriptions")[1]], [1120, 2130], [680, 2130], top("generationTimers")], "logical", { dashed: true, labelX: 800, labelY: 2110 }));
  elements.push(route([[1360, bottom("subscriptions")[1]], [1360, 2240]], "logical", { dashed: true, labelX: 1390, labelY: 2110 }));
  elements.push(route([[1600, bottom("subscriptions")[1]], [1600, 2110], [1860, 2110], top("checkins")], "logical", { dashed: true, labelX: 1780, labelY: 2090 }));

  Object.values(entities).forEach((item) => elements.push(item.svg));
  elements.push(`<g><line x1="2180" y1="2385" x2="2250" y2="2385" stroke="${palette.line}" stroke-width="4"/><text class="edge-label" x="2270" y="2392">Enforced foreign key</text><line x1="2180" y1="2445" x2="2250" y2="2445" stroke="${palette.logical}" stroke-width="4" stroke-dasharray="14 10"/><text class="edge-label" x="2270" y="2452">Logical ID relation; no database FK</text></g>`);
  elements.push(`</svg>`);
  return elements.join("\n");
}

function techStackSvg() {
  const width = 2400;
  const height = 1560;
  const elements = [
    svgStart(width, height, "Mr Diet Plan technology stack"),
    heading("Mr Diet Plan — Technology Stack", "Current production codebase with admin-selectable Gemini provider support", width),
  ];

  elements.push(panel(55, 150, 2290, 330, "Frontend application", palette.frontend, palette.frontendStroke));
  elements.push(panel(55, 535, 2290, 330, "Backend & data", palette.backend, palette.backendStroke));
  elements.push(panel(55, 920, 2290, 330, "AI & external integrations", palette.external, palette.externalStroke));
  elements.push(panel(55, 1305, 2290, 190, "Delivery & supporting tools", palette.data, palette.dataStroke));

  const frontendNodes = [
    { x: 105, y: 245, w: 340, h: 150, title: "React 18.3", lines: ["Component UI", "Single-page app"] },
    { x: 515, y: 245, w: 340, h: 150, title: "TypeScript 5.8", lines: ["Typed frontend", "Shared models"] },
    { x: 925, y: 245, w: 340, h: 150, title: "Vite 5.4", lines: ["Dev server", "Production builds"] },
    { x: 1335, y: 245, w: 420, h: 150, title: "Tailwind + Radix", lines: ["Responsive styling", "shadcn/ui components"] },
    { x: 1825, y: 245, w: 420, h: 150, title: "Router + Query", lines: ["React Router 6.30", "TanStack Query 5.83"] },
  ];

  const backendNodes = [
    { x: 105, y: 630, w: 390, h: 150, title: "PHP 8.x", lines: ["REST-style controllers", "JSON endpoints"] },
    { x: 565, y: 630, w: 390, h: 150, title: "PDO", lines: ["Prepared statements", "Shared DB bootstrap"] },
    { x: 1025, y: 630, w: 390, h: 150, title: "MySQL / MariaDB", lines: ["Relational storage", "InnoDB schema"] },
    { x: 1485, y: 630, w: 350, h: 150, title: "Admin API", lines: ["Settings & users", "Finance & analytics"] },
    { x: 1905, y: 630, w: 340, h: 150, title: "Cron jobs", lines: ["Reminders", "Background triggers"] },
  ];

  const integrationNodes = [
    { x: 105, y: 1015, w: 360, h: 150, title: "OpenAI", lines: ["Current diet-plan AI", "Prompt + JSON response"] },
    { x: 530, y: 1015, w: 360, h: 150, title: "Google Gemini", lines: ["Available provider option", "Admin-selectable"] },
    { x: 955, y: 1015, w: 360, h: 150, title: "Google OAuth", lines: ["User authentication", "ID token verification"] },
    { x: 1380, y: 1015, w: 400, h: 150, title: "Payment gateways", lines: ["Cashfree", "Razorpay"] },
    { x: 1845, y: 1015, w: 400, h: 150, title: "OneSignal", lines: ["Browser push", "Meal & water reminders"] },
  ];

  const supportNodes = [
    { x: 115, y: 1355, w: 400, h: 100, title: "Apache / HTTPS", lines: ["Production delivery"] },
    { x: 585, y: 1355, w: 400, h: 100, title: "AOS", lines: ["UI animations"] },
    { x: 1055, y: 1355, w: 510, h: 100, title: "jsPDF + html2canvas", lines: ["Diet plan PDF export"] },
    { x: 1635, y: 1355, w: 600, h: 100, title: "npm / PHP CLI / Git", lines: ["Build, validation and source control"] },
  ];

  [...frontendNodes, ...backendNodes, ...integrationNodes, ...supportNodes].forEach((node) => elements.push(box(node)));

  elements.push(route([[275, 395], [275, 505], [300, 505], [300, 630]], "HTTP / JSON", { labelX: 405, labelY: 515 }));
  elements.push(route([[760, 780], [760, 835], [1220, 835], [1220, 780]], "SQL", { labelX: 990, labelY: 850 }));
  elements.push(route([[300, 780], [300, 895], [285, 895], [285, 1015]], "AI request", { labelX: 390, labelY: 905 }));
  elements.push(route([[495, 1090], [530, 1090]], "Provider switch", { dashed: true, labelX: 515, labelY: 985 }));
  elements.push(route([[2215, 780], [2215, 895], [2045, 895], [2045, 1015]], "Scheduled push", { labelX: 2140, labelY: 905 }));
  elements.push(`</svg>`);
  return elements.join("\n");
}

async function writeDiagram(name, svg) {
  const svgPath = path.join(outputDir, `${name}.svg`);
  const pngPath = path.join(outputDir, `${name}.png`);
  fs.writeFileSync(svgPath, svg, "utf8");
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngPath);
}

async function main() {
  await writeDiagram("code-architecture", codeArchitectureSvg());
  await writeDiagram("system-architecture", systemArchitectureSvg());
  await writeDiagram("database-er-diagram", databaseErSvg());
  await writeDiagram("tech-stack", techStackSvg());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
