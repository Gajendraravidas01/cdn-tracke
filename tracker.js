(function () {
    const sessionData = {
      projectId: "your_project_id", // Replace with the actual project ID
      ipAddress: "",
      device: getDeviceType(),
      browserUsed: getBrowserName(),
      location: "",
      startTime: new Date().toISOString(),
      referrer: document.referrer || "Direct",
      userAgent: navigator.userAgent,
      actions: [],
    };
  
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
  
    // Get user's location (using a free API like ipapi)
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        sessionData.ipAddress = data.ip;
        sessionData.location = `${data.city}, ${data.country}`;
      })
      .catch((err) => console.error("Error fetching location", err));
  
    // Capture user actions (clicks, form submissions, page views)
    function trackAction(actionType, details = {}) {
      sessionData.actions.push({
        action: actionType,
        ...details,
        timestamp: new Date().toISOString(),
      });
    }
  
    // Track page views
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
  
      navigator.sendBeacon("/api/session/track-session", JSON.stringify(sessionData));
    });
  })();
  