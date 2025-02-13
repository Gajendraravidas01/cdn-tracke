(function () {
  console.log("Session tracking script started...");

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || "unknown_project";
  }

  const projectId = getQueryParam("project_id");

  const sessionData = {
    projectId: projectId, // Replace with the actual project ID
    ipAddress: "",
    device: getDeviceType(),
    browserUsed: getBrowserName(),
    location: "",
    startTime: new Date().toISOString(),
    referrer: document.referrer || "Direct",
    userAgent: navigator.userAgent,
    actions: [],
  };

  const BACKEND_URL = "http://localhost:8000/api/session/track-session"; // Change to your actual backend URL

  // Detect user's device type
  function getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/Mobi|Android/i.test(userAgent)) return "Mobile";
    if (/Tablet|iPad/i.test(userAgent)) return "Tablet";
    return "Desktop";
  }

  // Get browser name
  function getBrowserName() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Other";
  }

  console.log("Device:", sessionData.device, "Browser:", sessionData.browserUsed);

  // Get user's location using ipapi
  fetch("https://ipapi.co/json/")
    .then((res) => res.json())
    .then((data) => {
      sessionData.ipAddress = data.ip;
      sessionData.location = `${data.city}, ${data.country}`;
      console.log("IP Address:", sessionData.ipAddress, "Location:", sessionData.location);
    })
    .catch((err) => console.error("Error fetching location", err));

  // Track page views
  function trackAction(actionType, details = {}) {
    const action = {
      action: actionType,
      ...details,
      timestamp: new Date().toISOString(),
    };
    sessionData.actions.push(action);
    console.log("Tracked action:", action);
  }

  trackAction("page_view", { page: window.location.pathname });

  // Track clicks on buttons and links
  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, a");
    if (target) {
      trackAction("click", { element: target.innerText || target.href });
    }
  });

  // Track form submissions
  document.addEventListener("submit", (event) => {
    const form = event.target;
    trackAction("form_submit", { formId: form.id || "unknown_form" });
  });

  // Send session data when user leaves
  window.addEventListener("beforeunload", async () => {
    sessionData.endTime = new Date().toISOString();
    sessionData.duration = Math.floor((new Date() - new Date(sessionData.startTime)) / 1000);

    console.log("Session ended. Data to send:", sessionData);

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        console.error("Server response not OK:", response.status, response.statusText);
      } else {
        console.log("Session data successfully sent!");
      }
    } catch (err) {
      console.error("Error sending data", err);
    }
  });
})();