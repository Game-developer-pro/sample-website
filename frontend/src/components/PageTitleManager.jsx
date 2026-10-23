import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_TITLES = {
  "/": "Login | CBT Nexus",
  "/register": "Create Account | CBT Nexus",
  "/dashboard": "Dashboard | CBT Nexus",
  "/questions": "Start CBT Test | CBT Nexus",
  "/results": "Results History | CBT Nexus",
  "/profile": "My Profile | CBT Nexus",
  "/news-feed": "News Feed & Updates | CBT Nexus",
  "/create-post": "Create Post | CBT Nexus",
  "/practicals": "Video Practicals | CBT Nexus",
  "/games": "Brain Games & Breaks | CBT Nexus",
  "/payment": "Subscription & Pricing | CBT Nexus",
  "/leaderboard": "Leaderboard | CBT Nexus",
  "/feedback": "Student Feedback | CBT Nexus",
  "/admin": "Admin Dashboard | CBT Nexus",
  "/admin/feedback": "Feedback Inbox | Admin | CBT Nexus",
  "/add-question": "Add Question | Admin | CBT Nexus",
};

export default function PageTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    let matchedTitle = ROUTE_TITLES[path];

    if (!matchedTitle) {
      if (path.startsWith("/corrections/")) {
        matchedTitle = "Test Corrections & Review | CBT Nexus";
      } else {
        matchedTitle = "CBT Nexus | CBT & WAEC Practice Platform";
      }
    }

    document.title = matchedTitle;
  }, [location.pathname]);

  return null;
}
