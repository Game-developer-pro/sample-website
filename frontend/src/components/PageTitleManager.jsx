import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_TITLES = {
  "/": "Login | Exam Quest",
  "/register": "Create Account | Exam Quest",
  "/dashboard": "Dashboard | Exam Quest",
  "/questions": "Start CBT Test | Exam Quest",
  "/results": "Results History | Exam Quest",
  "/profile": "My Profile | Exam Quest",
  "/news-feed": "News Feed & Updates | Exam Quest",
  "/create-post": "Create Post | Exam Quest",
  "/practicals": "Video Practicals | Exam Quest",
  "/games": "Brain Games & Breaks | Exam Quest",
  "/payment": "Subscription & Pricing | Exam Quest",
  "/leaderboard": "Leaderboard | Exam Quest",
  "/feedback": "Student Feedback | Exam Quest",
  "/admin": "Admin Dashboard | Exam Quest",
  "/admin/feedback": "Feedback Inbox | Admin | Exam Quest",
  "/add-question": "Add Question | Admin | Exam Quest",
};

export default function PageTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    let matchedTitle = ROUTE_TITLES[path];

    if (!matchedTitle) {
      if (path.startsWith("/corrections/")) {
        matchedTitle = "Test Corrections & Review | Exam Quest";
      } else {
        matchedTitle = "Exam Quest | CBT & WAEC Practice Platform";
      }
    }

    document.title = matchedTitle;
  }, [location.pathname]);

  return null;
}
