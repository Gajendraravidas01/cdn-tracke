(function () {
  console.log("Session tracking script started...");

  function getQueryParam(name) {
    const scripts = document.getElementsByTagName("script");
    for (let script of scripts) {
      const src = script.src;
      if (src.includes("tracker.js")) {
        const params = new URLSearchParams(src.split("?")[1]);
        return params.get(name) || "unknown_project";
      }
    }
    return "unknown_project";
  } 

  // Check localStorage for visitor ID, if not found, generate and store it
  function getOrCreateVisitorId() {
    let storedVisitorId = localStorage.getItem("visitorId");
    if (!storedVisitorId) {
      storedVisitorId = generateUUID();
      localStorage.setItem("visitorId", storedVisitorId);
    }
    return storedVisitorId;
  }

  const projectId = getQueryParam("project_id");
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  const visitorId = getOrCreateVisitorId();;

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

  const ANALYTICS_URL = "http://localhost:8000/api/analytics";

  const LEAD_API_URL = "http://localhost:8000/api/leads";


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
  document.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission
  
    const form = event.target;
    const formData = new FormData(form);
    const formObject = Object.fromEntries(formData.entries()); // Convert FormData to an object

    console.log("Form submitted:", formObject);
  
    trackAction("form_submit", { formId: form.id || "unknown_form" });
  
    try {
      const response = await fetch(LEAD_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId,
          userId: null, // Update if user authentication is added
          ipAddress: sessionData.ipAddress, // From session tracking
          location: sessionData.location, // From session tracking
          device: sessionData.device, // Device type
          browserUsed: sessionData.browserUsed, // Browser type
          name: formObject.name || "Unknown", // Ensure required field
          phoneNo: formObject.mobile || null,
          description: formObject.description || null,
          email: formObject.email || null,
          timestamp: new Date().toISOString(), // Auto-generated
        }),
      });
  
      if (!response.ok) {
        console.error("Error sending lead data:", response.status, response.statusText);
      } else {
        console.log("Lead data successfully sent!");
      }
    } catch (err) {
      console.error("Error sending lead data:", err);
    }
  
    form.submit(); // Allow form submission after tracking
  });
  

  // Send session data when user leaves
  window.addEventListener("beforeunload", async () => {
    sessionData.endTime = new Date().toISOString();
    sessionData.duration = Math.floor((new Date() - new Date(sessionData.startTime)) / 1000);

    console.log("Session ended. Data to send:", sessionData);

    try {
      await fetch(ANALYTICS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, visitorId }),
      });
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