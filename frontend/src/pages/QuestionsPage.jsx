import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext, api } from "../context/AuthContext";
import "../custom-theme.css";
import { IconRocket, IconBarChart, IconStar, IconWarning, IconLock, IconClock } from "../components/Icons";

const QuestionsPage = () => {
  const { user, updateUser, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Load saved test state from localStorage
  const savedState = JSON.parse(localStorage.getItem('testState')) || {};
  // Restore questions from localStorage for instant recovery (before server responds)
  const [questions, setQuestions] = useState(savedState.questions || []);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(savedState.examStarted ? true : false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const syncDataRef = useRef(null);
  // Resilient offline submission queue flush
  const flushPendingSubmissions = useCallback(async () => {
    try {
      const pendingRaw = localStorage.getItem("pending_test_results");
      if (!pendingRaw) return;
      const queue = JSON.parse(pendingRaw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      const remaining = [];
      for (const item of queue) {
        try {
          await api.post("/results", item);
          await api.post("/sessions/complete").catch(() => {});
        } catch (e) {
          remaining.push(item);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem("pending_test_results", JSON.stringify(remaining));
      } else {
        localStorage.removeItem("pending_test_results");
      }
    } catch (e) {
      console.error("Error flushing pending submissions:", e);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushPendingSubmissions();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on load
    if (typeof navigator !== "undefined" && navigator.onLine) {
      flushPendingSubmissions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushPendingSubmissions]);

  // Tools state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState("");
  const [scratchpadText, setScratchpadText] = useState("");

  const handleCalcPress = (val) => {
    if (val === "C") {
      setCalcInput("");
    } else if (val === "DEL") {
      setCalcInput(prev => prev !== "Error" ? prev.slice(0, -1) : "");
    } else if (val === "=") {
      try {
        const sanitized = calcInput.replace(/[^-()\d/*+.]/g, '');
        // eslint-disable-next-line no-new-func
        const result = new Function('return ' + sanitized)();
        let finalResult = result;
        if (typeof result === 'number' && !Number.isInteger(result)) {
          finalResult = Number(result.toFixed(4));
        }
        setCalcInput(String(finalResult));
      } catch (e) {
        setCalcInput("Error");
      }
    } else if (val === ".") {
      // Prevent double decimals in the current number segment
      setCalcInput(prev => {
        if (prev === "Error") return "0.";
        // Get the last number token
        const lastNum = prev.split(/[+\-*/]/).pop();
        if (lastNum.includes(".")) return prev; // already has decimal
        return prev + ".";
      });
    } else {
      // Map display symbols to JS operators
      const opMap = { "÷": "/", "×": "*" };
      const actual = opMap[val] || val;
      setCalcInput(prev => prev === "Error" ? String(actual) : prev + String(actual));
    }
  };
  const [currentIndex, setCurrentIndex] = useState(savedState.currentIndex || 0);
  const [selectedAnswers, setSelectedAnswers] = useState(savedState.selectedAnswers || {}); // { questionId: selectedOption }
  const [timeLeft, setTimeLeft] = useState(savedState.timeLeft || 0); // in seconds
  const [examEndTime, setExamEndTime] = useState(savedState.examEndTime || null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showChillModal, setShowChillModal] = useState(false);
  const [examStarted, setExamStarted] = useState(savedState.examStarted || false);
  const [selectedSubjects, setSelectedSubjects] = useState(savedState.selectedSubjects || []);
  const [selectedExamType, setSelectedExamType] = useState(savedState.selectedExamType || "");
  const [showSubjectSidebar, setShowSubjectSidebar] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // open by default on desktop
    }
    return true;
  });

  const [examStartTime, setExamStartTime] = useState(savedState.examStartTime || null);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState("");

  // Persist test state to localStorage whenever it changes (including questions for instant restore)
  useEffect(() => {
    const state = {
      currentIndex,
      selectedAnswers,
      timeLeft,
      examEndTime,
      examStartTime,
      examStarted,
      selectedSubjects,
      selectedExamType,
      questions, // ← persist so page-switch doesn't lose questions
    };
    localStorage.setItem('testState', JSON.stringify(state));
  }, [currentIndex, selectedAnswers, timeLeft, examEndTime, examStartTime, examStarted, selectedSubjects, selectedExamType, questions]);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Session recovery logic — runs once on mount, sets sessionLoading=false when done
  useEffect(() => {
    if (!user) {
      setSessionLoading(false);
      return;
    }
    const checkActiveSession = async () => {
      try {
        // Look at localStorage first
        const local = JSON.parse(localStorage.getItem('testState')) || {};
        if (local.examStarted && local.questions && local.questions.length > 0 && (!local.examEndTime || local.examEndTime > Date.now())) {
          setQuestions(local.questions);
          setSelectedAnswers(local.selectedAnswers || {});
          setCurrentIndex(local.currentIndex || 0);
          setExamEndTime(local.examEndTime);
          setExamStartTime(local.examStartTime || (local.examEndTime ? (local.examEndTime - (local.selectedExamType === "JAMB" ? 2 * 60 * 60 * 1000 : 90 * 60 * 1000)) : Date.now()));
          setSelectedSubjects(local.selectedSubjects || []);
          setSelectedExamType(local.selectedExamType || "");
          setExamStarted(true);

          try {
            await api.post("/sessions/sync", {
              examType: local.selectedExamType,
              subjects: local.selectedSubjects,
              questions: local.questions,
              selectedAnswers: local.selectedAnswers || {},
              examEndTime: local.examEndTime,
              currentIndex: local.currentIndex || 0
            });
          } catch (syncErr) {
            console.error("Failed to sync local session to server:", syncErr);
          }

          setSessionLoading(false);
          return;
        }

        const res = await api.get("/sessions/active");
        if (res.data) {
          const session = res.data;
          const sessionQuestions = session.questions || [];

          // If the session has no questions or the end time has passed, it's stale — clear it
          if (sessionQuestions.length === 0 || (session.examEndTime && session.examEndTime < Date.now())) {
            try { await api.post("/sessions/complete"); } catch (e) { /* ignore */ }
            localStorage.removeItem('testState');
            setExamStarted(false);
            setSelectedAnswers({});
            setSessionLoading(false);
            return;
          }

          // Restore full session from server (authoritative source)
          setQuestions(sessionQuestions);
          setSelectedAnswers(session.selectedAnswers || {});
          setCurrentIndex(session.currentIndex || 0);
          setExamEndTime(session.examEndTime);
          setSelectedSubjects(session.subjects || []);
          setSelectedExamType(session.examType || "");
          setExamStarted(true);
        } else {
          // No active session on server — clear any stale localStorage
          if (local.examStarted) {
            localStorage.removeItem('testState');
            setExamStarted(false);
            setSelectedAnswers({});
            setQuestions([]);
          }
        }
      } catch (err) {
        console.error("No active session found or error:", err);
        // If localStorage says we were in a test but server disagrees, clear it
        const localState = JSON.parse(localStorage.getItem('testState')) || {};
        if (localState.examStarted) {
          localStorage.removeItem('testState');
          setExamStarted(false);
          setSelectedAnswers({});
          setQuestions([]);
        }
      } finally {
        setSessionLoading(false); // Always unblock the UI
      }
    };
    checkActiveSession();
  }, [user]);


  useEffect(() => {
    syncDataRef.current = {
      examType: selectedExamType,
      subjects: selectedSubjects,
      questions,
      selectedAnswers,
      examEndTime,
      currentIndex
    };
  }, [selectedExamType, selectedSubjects, questions, selectedAnswers, examEndTime, currentIndex]);

  // Background Sync
  useEffect(() => {
    if (!examStarted || !examEndTime) return;

    const interval = setInterval(async () => {
      try {
        if (syncDataRef.current) {
          await api.post("/sessions/sync", syncDataRef.current);
        }
      } catch (err) {
        console.error("Failed to sync session:", err);
      }
    }, 60000);

    // Initial sync
    if (syncDataRef.current && questions.length > 0) {
      api.post("/sessions/sync", syncDataRef.current).catch(err => console.error(err));
    }

    return () => clearInterval(interval);
  }, [examStarted, examEndTime, questions.length]);


  const [subjects, setSubjects] = useState([]);

  // Fetch unique subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get("/questions/subjects");
        setSubjects(res.data || []);
      } catch (err) {
        console.error("Failed to load subjects:", err);
      }
    };
    fetchSubjects();
  }, []);

  const handleExamTypeChange = (e) => {
    const type = e.target.value;
    setSelectedExamType(type);
    if (type === "JAMB") {
      setSelectedSubjects(["English"]);
    } else {
      setSelectedSubjects([]);
    }
  };

  const toggleSubject = (subj) => {
    if (selectedExamType === "JAMB") {
      if (subj === "English") return; // English is mandatory
      setSelectedSubjects(prev => {
        if (prev.includes(subj)) return prev.filter(s => s !== subj);
        if (prev.length >= 4) return prev; // max 3 + English = 4
        const newSubjects = [...prev, subj];
        if (newSubjects.length >= 4) {
          setShowSubjectSidebar(false);
        }
        return newSubjects;
      });
    } else if (selectedExamType === "WAEC_NECO") {
      setSelectedSubjects([subj]);
      setShowSubjectSidebar(false);
    } else {
      setSelectedSubjects([subj]);
      setShowSubjectSidebar(false);
    }
  };

  // Fetch questions with deduplication
  const fetchQuestions = async () => {
    if (selectedSubjects.length === 0 || !selectedExamType) {
      setQuestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const query = new URLSearchParams({
        subjects: selectedSubjects.join(','),
        examType: selectedExamType !== "All" ? selectedExamType : undefined,
      });
      const url = `/questions?${query.toString()}`;
      const res = await api.get(url);
      const data = res.data || [];
      // Remove duplicate questions based on _id
      const unique = Array.from(new Map(data.map(q => [q._id, q])).values());

      // Prevent starting if any selected subject has zero questions in the DB
      const missingSubjects = selectedSubjects.filter(subj => !unique.some(q => q.subject === subj));
      if (missingSubjects.length > 0) {
        setQuestions([]);
        setLoading(false);
        return; // This forces the "empty pool" warning and hides the start button
      }

      let finalQuestions = [];
      if (selectedExamType === "JAMB") {
        // Function to select with ratio: 25% easy, 50% medium, 25% hard
        const selectWithRatio = (subjectQuestions, totalNeeded) => {
          const easy = subjectQuestions.filter(q => q.difficulty === 'easy');
          const medium = subjectQuestions.filter(q => q.difficulty === 'medium');
          const hard = subjectQuestions.filter(q => q.difficulty === 'hard');

          // Fallback pool for any unclassified/other questions
          const other = subjectQuestions.filter(q => !['easy', 'medium', 'hard'].includes(q.difficulty));

          // Helper to shuffle array
          const shuffle = (arr) => {
            const copy = [...arr];
            for (let i = copy.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
          };

          const shuffledEasy = shuffle(easy);
          const shuffledMedium = shuffle(medium);
          const shuffledHard = shuffle(hard);
          const shuffledOther = shuffle(other);

          const numEasy = Math.round(totalNeeded * 0.25);
          const numHard = Math.round(totalNeeded * 0.25);
          const numMedium = totalNeeded - numEasy - numHard;

          let selected = [];

          // Try to get exact amounts
          let e = shuffledEasy.splice(0, numEasy);
          let m = shuffledMedium.splice(0, numMedium);
          let h = shuffledHard.splice(0, numHard);

          selected.push(...e, ...m, ...h);

          // If we didn't get enough (due to shortage of a specific difficulty), fill from remaining
          const remainingNeeded = totalNeeded - selected.length;
          if (remainingNeeded > 0) {
            const allRemaining = shuffle([...shuffledEasy, ...shuffledMedium, ...shuffledHard, ...shuffledOther]);
            selected.push(...allRemaining.slice(0, remainingNeeded));
          }

          // Shuffle the final selection for this subject so difficulties are mixed
          return shuffle(selected);
        };

        const englishQs = unique.filter(q => q.subject === "English");
        const english = selectWithRatio(englishQs, 60);

        const others = selectedSubjects.filter(s => s !== "English").flatMap(subj => {
          const subjQs = unique.filter(q => q.subject === subj);
          return selectWithRatio(subjQs, 40);
        });

        finalQuestions = [...english, ...others];
      } else if (selectedExamType === "WAEC_NECO") {
        // Shuffle uniquely available questions (just random as usual)
        for (let i = unique.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [unique[i], unique[j]] = [unique[j], unique[i]];
        }
        // Max 50 for the selected subject
        finalQuestions = unique.slice(0, 50);
      } else {
        // Shuffle uniquely available questions
        for (let i = unique.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [unique[i], unique[j]] = [unique[j], unique[i]];
        }
        finalQuestions = unique;
      }

      // Final safety dedup: guarantee no question appears more than once
      finalQuestions = Array.from(new Map(finalQuestions.map(q => [q._id, q])).values());

      setQuestions(finalQuestions);
      if (finalQuestions.length > 0) {
        // 45 seconds per question
        setTimeLeft(finalQuestions.length * 45);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!examStarted) {
      fetchQuestions();
    }
  }, [selectedSubjects, selectedExamType, examStarted]);

  // Timer logic - pauses when showPaywallModal is active
  useEffect(() => {
    if (!examStarted || !examEndTime) return;

    const updateTimer = () => {
      // If paywall modal is open, timer is frozen
      if (showPaywallModal) return;

      const now = Date.now();

      // Check 5-minute paywall for unpaid users (300 seconds = 5 mins)
      if (user && !user.isPaid && examStartTime) {
        const elapsedSecs = Math.floor((now - examStartTime) / 1000);
        if (elapsedSecs >= 300) {
          setShowPaywallModal(true);
          return;
        }
      }

      const remainingMs = examEndTime - now;
      if (remainingMs <= 0) {
        setTimeLeft(0);
        handleAutoSubmit();
      } else {
        setTimeLeft(Math.ceil(remainingMs / 1000));
      }
    };

    updateTimer(); // Initial call
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [examStarted, examEndTime, showPaywallModal, examStartTime, user]);

  const startExam = async () => {
    setLoading(true);

    // ===== CRITICAL: Wipe ALL stale state from a previous session =====
    setSelectedAnswers({});
    setCurrentIndex(0);
    setExamEndTime(null);
    setShowPaywallModal(false);
    localStorage.removeItem('testState');
    // ==================================================================

    try {
      // Clear any stuck/zombie sessions on the backend before starting a new one
      await api.post("/sessions/complete");
    } catch (e) {
      console.error("Failed to clear old session", e);
    }

    let durationSecs = 0;
    if (selectedExamType === "JAMB") {
      durationSecs = 2 * 60 * 60; // 2 hours
    } else {
      durationSecs = 90 * 60; // 1.5 hours
    }
    const now = Date.now();
    const endTime = now + durationSecs * 1000;

    // Force immediate sync to backend — saves questions + fresh empty answers right away.
    try {
      await api.post("/sessions/sync", {
        examType: selectedExamType,
        subjects: selectedSubjects,
        questions,
        selectedAnswers: {},
        examEndTime: endTime,
        currentIndex: 0
      });
    } catch (e) {
      console.error("Failed to sync initial session", e);
    }

    setExamStartTime(now);
    setExamEndTime(endTime);
    setExamStarted(true);
    setLoading(false);
  };

  // Cancel test completely with NO TRACE if user refuses/cancels payment
  const handleCancelTestWithoutTrace = async () => {
    try {
      // Clear active session from server so nothing is left behind
      await api.post("/sessions/complete").catch(() => {});
    } catch (err) {
      console.error("Failed to clear session on cancel:", err);
    }

    // Completely wipe all local test state
    localStorage.removeItem('testState');
    setShowPaywallModal(false);
    setExamStarted(false);
    setQuestions([]);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setExamEndTime(null);
    setExamStartTime(null);
    setSelectedSubjects([]);
    setSelectedExamType("");

    // Return to dashboard
    navigate("/dashboard");
  };

  // Helper to ensure Paystack script is loaded in DOM
  const loadPaystackScript = () => {
    return new Promise((resolve) => {
      if (typeof window.PaystackPop !== "undefined") {
        return resolve(true);
      }
      const existing = document.querySelector('script[src*="paystack"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", () => resolve(false));
        setTimeout(() => resolve(typeof window.PaystackPop !== "undefined"), 1500);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Process payment using Paystack Inline
  const handlePayNow = async () => {
    setIsPaying(true);
    setPayError("");

    try {
      // Get config from backend
      const configRes = await api.get("/payment/config");
      const { publicKey, amount, currency } = configRes.data;

      const txRef = `CBT_LIFETIME_${user?._id || "USER"}_${Date.now()}`;
      const amountInKobo = Math.round(Number(amount) * 100);

      await loadPaystackScript();

      // Check if PaystackPop modal is available from script
      if (typeof window.PaystackPop !== "undefined" && publicKey && publicKey.startsWith("pk_")) {
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: user?.email || "student@example.com",
          amount: amountInKobo,
          currency: currency || "NGN",
          ref: txRef,
          metadata: {
            custom_fields: [
              {
                display_name: "Student Name",
                variable_name: "student_name",
                value: user?.name || "Student",
              },
              {
                display_name: "Plan",
                variable_name: "plan",
                value: "CBT Lifetime Access",
              },
            ],
          },
          callback: function (response) {
            setIsPaying(true);
            api.post("/payment/verify", {
              reference: response.reference || txRef,
              trxref: response.trxref || txRef,
            })
              .then((verifyRes) => {
                if (verifyRes.data?.success) {
                  updateUser({ isPaid: true, paidAt: new Date() });
                  setShowPaywallModal(false);
                } else {
                  setPayError(verifyRes.data?.message || "Payment verification failed.");
                }
              })
              .catch((vErr) => {
                setPayError(vErr.response?.data?.message || "Failed to verify transaction.");
              })
              .finally(() => {
                setIsPaying(false);
              });
          },
          onClose: function () {
            setIsPaying(false);
          },
        });

        handler.openIframe();
        setIsPaying(false);
      } else {
        // Direct sandbox / test verification flow
        const verifyRes = await api.post("/payment/verify", {
          reference: txRef,
          trxref: txRef,
        });

        if (verifyRes.data?.success) {
          updateUser({ isPaid: true, paidAt: new Date() });
          setShowPaywallModal(false);
        } else {
          setPayError("Verification could not be processed.");
        }
        setIsPaying(false);
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      setPayError(err.response?.data?.message || err.message || "Could not initiate payment. Please try again.");
      setIsPaying(false);
    }
  };

  const handleSelectOption = (option) => {
    const q = questions[currentIndex];
    setSelectedAnswers((prev) => ({
      ...prev,
      [q._id]: option,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const formatTime = (secs) => {
    if (secs <= 0) return "00:00:00";
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainderSecs = secs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${remainderSecs.toString().padStart(2, "0")}`;
  };

  const submitExamResults = () => {
    // 1. Immediately close submit confirm modal and show Chill Zone popup
    setShowSubmitModal(false);
    setShowChillModal(true);

    // Clear saved local storage state
    localStorage.removeItem('testState');
    setExamStarted(false);

    // Store snapshot of current state for background submission
    const finalQuestions = questions;
    const finalAnswers = selectedAnswers;
    const finalType = selectedExamType;
    const finalSubjects = selectedSubjects;

    // Reset React exam state
    setQuestions([]);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setExamEndTime(null);
    setSelectedSubjects([]);
    setSelectedExamType("");

    // Calculate raw score
    let score = 0;
    const breakdownData = {};
    const correctionsList = [];

    finalQuestions.forEach((q) => {
      const selected = finalAnswers[q._id];
      const isCorrect = selected === q.answer;
      if (isCorrect) score += 1;

      // Subject breakdown
      if (!breakdownData[q.subject]) {
        breakdownData[q.subject] = { total: 0, answered: 0, correct: 0, wrong: 0 };
      }
      breakdownData[q.subject].total += 1;
      if (selected) {
        breakdownData[q.subject].answered += 1;
        if (isCorrect) breakdownData[q.subject].correct += 1;
        else breakdownData[q.subject].wrong += 1;
      }

      // Corrections list
      correctionsList.push({
        questionText: q.question,
        subject: q.subject,
        options: q.options,
        selectedAnswer: selected || "Not Answered",
        correctAnswer: q.answer,
        image: q.image || null,
        isCorrect
      });
    });

    let jambScore = null;
    if (finalType === "JAMB") {
      jambScore = Math.round((score / finalQuestions.length) * 400);
    }

    // 2. Perform API requests asynchronously in the background with offline fallback
    const resultPayload = {
      testName: `${finalSubjects.join(', ')} CBT Evaluation`,
      score,
      totalQuestions: finalQuestions.length,
      examType: finalType,
      jambScore,
      breakdown: breakdownData,
      corrections: correctionsList
    };

    (async () => {
      try {
        await api.post("/results", resultPayload);
        await api.post("/sessions/complete").catch(() => {});
      } catch (err) {
        console.warn("Network issue during submission, saving offline in pending queue:", err);
        try {
          const pending = JSON.parse(localStorage.getItem("pending_test_results") || "[]");
          pending.push(resultPayload);
          localStorage.setItem("pending_test_results", JSON.stringify(pending));
        } catch (storageErr) {
          console.error("Could not write to localStorage fallback:", storageErr);
        }
      }
    })();
  };

  const handleAutoSubmit = () => {
    submitExamResults();
  };

  const handleSubmitClick = () => {
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = () => {
    submitExamResults();
  };

  if (authLoading || sessionLoading) {
    return (
      <div className="loader-container min-h-screen" style={{ flexDirection: "column" }}>
        <div className="loader"></div>
        {sessionLoading && !authLoading && (
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Checking for active session...</p>
        )}
      </div>
    );
  }

  // 🎮 Post-Exam Chill Zone Modal Component (Rendered whenever showChillModal is true)
  const chillZoneModal = showChillModal && (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(5, 5, 16, 0.94)',
      backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0d0d2b 0%, #0a0a1a 100%)',
        border: '1px solid rgba(0, 221, 255, 0.25)',
        borderRadius: '28px',
        padding: '50px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 30px 100px rgba(0, 221, 255, 0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,221,255,0.12), transparent)',
          pointerEvents: 'none',
        }} />

        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎮</div>

        <h2 style={{
          fontSize: '1.8rem', fontWeight: '900', marginBottom: '12px',
          background: 'linear-gradient(90deg, #0df, #a855f7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Great Job!
        </h2>

        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '8px' }}>
          Your exam has been submitted successfully!
        </p>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '36px' }}>
          Would you like to take a 10-minute break and play a game in the Arcade Zone, or head straight to your results?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button
            onClick={() => {
              const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now
              sessionStorage.setItem('arcadeAccessExpiry', expiry.toString());
              navigate('/games');
            }}
            style={{
              background: 'linear-gradient(135deg, #0df, #0055ff)',
              color: '#fff', border: 'none', borderRadius: '50px',
              padding: '16px 32px', fontSize: '1.05rem', fontWeight: '700',
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px',
              boxShadow: '0 0 30px rgba(0,221,255,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <IconRocket size='1em' color='currentColor' style={{ marginRight: '6px' }} /> Play Games & Chill (10 Mins)!
          </button>

          <button
            onClick={() => navigate('/results')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50px', padding: '14px 32px',
              fontSize: '1rem', fontWeight: '600',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <IconBarChart size='1em' color='currentColor' style={{ marginRight: '6px' }} /> View My Results
          </button>
        </div>
      </div>
    </div>
  );

  if (!examStarted) {
    return (
      <div className="exam-intro-wrapper" style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 1.5rem" }}>
        {chillZoneModal}
        <div className="glass-card exam-intro-card" style={{ margin: 0, borderRadius: "16px", padding: "2.5rem" }}>
          <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>Configure Your CBT Evaluation</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "var(--text-main)" }}>1. Select Exam Type</label>
              <select
                value={selectedExamType}
                onChange={handleExamTypeChange}
                className="custom-select"
                style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-tertiary)", color: "var(--text-main)" }}
              >
                <option value="" disabled>Select Exam Type</option>
                <option value="JAMB">JAMB</option>
                <option value="WAEC_NECO">WAEC & NECO</option>
              </select>
            </div>

            {selectedExamType && (
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "var(--text-main)" }}>2. Select Subjects</label>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", marginBottom: "1rem" }}>
                  {selectedSubjects.map(subj => {
                    const isLocked = selectedExamType === "JAMB" && subj === "English";
                    return (
                      <div key={`sel-${subj}`} style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                        color: "#fff",
                        padding: "0.5rem 1rem",
                        borderRadius: "50px",
                        fontWeight: "500",
                        fontSize: "0.95rem",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                      }}>
                        {subj}
                        {!isLocked && (
                          <span
                            onClick={() => toggleSubject(subj)}
                            style={{ cursor: "pointer", marginLeft: "0.3rem", fontWeight: "bold", fontSize: "1.1rem", lineHeight: "1" }}
                          >
                            ×
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div>
                  <button
                    onClick={() => setShowSubjectSidebar(true)}
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border)",
                      padding: "0.6rem 1.2rem",
                      borderRadius: "50px",
                      cursor: "pointer",
                      fontWeight: "500",
                      color: "var(--text-main)"
                    }}
                  >
                    + Select Subject
                  </button>

                  <div className={`bottom-sheet-overlay ${showSubjectSidebar ? "open" : ""}`} onClick={() => setShowSubjectSidebar(false)}>
                    <div className="bottom-sheet-modal" onClick={(e) => e.stopPropagation()}>
                      <div className="bottom-sheet-header">
                        <h3>Select Subjects</h3>
                        <button className="btn-close-modal" onClick={() => setShowSubjectSidebar(false)}>✕</button>
                      </div>
                      <div className="bottom-sheet-body" style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", justifyContent: "center" }}>
                        {subjects.filter(s => !selectedSubjects.includes(s)).map((subj) => (
                          <button
                            key={`avail-${subj}`}
                            onClick={() => {
                              toggleSubject(subj);
                              if (selectedExamType === "WAEC_NECO") setShowSubjectSidebar(false);
                            }}
                            style={{
                              background: "hsl(var(--primary))",
                              color: "#fff",
                              border: "none",
                              padding: "0.6rem 1.2rem",
                              borderRadius: "50px",
                              cursor: "pointer",
                              fontWeight: "500",
                              fontSize: "0.95rem",
                              transition: "transform 0.2s, box-shadow 0.2s",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                            }}
                          >
                            {subj}
                          </button>
                        ))}
                        {subjects.filter(s => !selectedSubjects.includes(s)).length === 0 && (
                          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "1rem 0", width: "100%", textAlign: "center" }}>No more subjects to select.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
            {selectedExamType && (
              <div className="instructions-box">
                <h3>Instructions ({selectedExamType === "JAMB" ? "JAMB" : "WAEC/NECO"}):</h3>
                <ul>
                  <li>Ensure you have a stable internet connection.</li>
                  <li>Once you start, the timer cannot be paused.</li>
                  <li>The test will auto-submit when the timer reaches 00:00.</li>
                </ul>
              </div>
            )}

            {/* Trial Warning for Unpaid Users */}
            {user && !user.isPaid && (
              <div
                style={{
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1.5px solid rgba(245, 158, 11, 0.35)",
                  borderRadius: "12px",
                  padding: "1.2rem 1.4rem",
                  marginBottom: "1.5rem",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#d97706", fontWeight: "700", fontSize: "1.05rem", marginBottom: "0.5rem" }}>
                 Trial Account Warning
                </div>
                <p style={{ color: "var(--text-main)", fontSize: "0.92rem", lineHeight: "1.6", margin: "0 0 0.8rem 0" }}>
                  You are currently on a <strong>Trial Account</strong>. If you begin without unlocking lifetime access:
                </p>
                <ul style={{ margin: "0 0 1rem 1.2rem", padding: 0, fontSize: "0.88rem", color: "hsl(var(--text-muted))", lineHeight: "1.5" }}>
                  <li>Your exam will automatically pause after <strong>5 minutes</strong>.</li>
                  <li>You will not be able to complete or submit the test without paying the unlocking fee.</li>
                  <li>If you cancel the payment prompt, your exam progress will not be saved.</li>
                </ul>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.8rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}>
                    Want uninterrupted testing?
                  </span>
                  <Link
                    to="/payment"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: "#fff",
                      padding: "0.45rem 1rem",
                      borderRadius: "50px",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
                    }}
                  >
                    <IconStar size='1em' color='currentColor' style={{ marginRight: '5px' }} /> Unlock Lifetime Access Now
                  </Link>
                </div>
              </div>
            )}

            {selectedExamType && loading ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "1rem" }}>Loading questions...</div>
            ) : questions.length === 0 && selectedSubjects.length > 0 && !loading ? (
              <div style={{ textAlign: "center", padding: "1rem" }}>
                <p style={{ color: "#e11d48", marginBottom: "1.5rem", fontSize: "1.05rem" }}>
                  Warning: The question pool for this combination is empty.
                </p>
              </div>
            ) : selectedExamType ? (
              <button
                onClick={startExam}
                className="btn-start-exam"
                disabled={(selectedExamType === "JAMB" && selectedSubjects.length !== 4) || (selectedExamType === "WAEC_NECO" && selectedSubjects.length !== 1) || loading}
                style={{ opacity: ((selectedExamType === "JAMB" && selectedSubjects.length !== 4) || (selectedExamType === "WAEC_NECO" && selectedSubjects.length !== 1) || loading) ? 0.5 : 1 }}
              >
                {selectedExamType === "JAMB" && selectedSubjects.length < 4 ? `Select ${4 - selectedSubjects.length} more subject(s)` : "Begin Assessment"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalAnswered = Object.keys(selectedAnswers).length;
  const isTimeCritical = timeLeft < 30;

  if (examStarted && (loading || !questions || questions.length === 0 || !currentQuestion)) {
    if (!loading) {
      if (!questions || questions.length === 0) {
        // Corrupted or empty session, clear state
        localStorage.removeItem('testState');
        setExamStarted(false);
        return null;
      } else if (!currentQuestion) {
        // Index out of bounds but we have questions
        setCurrentIndex(0);
        return null;
      }
    }

    // Add a fallback timeout so we never spin infinitely
    setTimeout(() => {
      if (examStarted && loading) {
        setLoading(false);
        setExamStarted(false);
      }
    }, 5000);

    return (
      <div className="loader-container min-h-screen" style={{ flexDirection: "column" }}>
        <div className="loader"></div>
        <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Restoring exam session...</p>
      </div>
    );
  }

  const questionsBySubject = {};
  questions.forEach((q, idx) => {
    const subj = q.subject || "General";
    if (!questionsBySubject[subj]) {
      questionsBySubject[subj] = [];
    }
    questionsBySubject[subj].push({ ...q, globalIdx: idx });
  });

  const activeSubjectTab = currentQuestion.subject || "General";

  return (
    <div
      className="exam-layout-wrapper"
      style={examStarted ? { userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' } : {}}
      onCopy={examStarted ? (e) => e.preventDefault() : undefined}
      onCut={examStarted ? (e) => e.preventDefault() : undefined}
      onPaste={examStarted ? (e) => e.preventDefault() : undefined}
      onContextMenu={examStarted ? (e) => e.preventDefault() : undefined}
    >
      {!isOnline && examStarted && (
        <div style={{ backgroundColor: '#ef4444', color: 'white', padding: '1rem', textAlign: 'center', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }}>
          <IconWarning size="1em" color="white" style={{ marginRight: "6px" }} /> Internet Error: You have lost your internet connection. Your test cannot be submitted if you don't have an internet connection.
        </div>
      )}
      <div className="exam-grid-container">

        <div className="exam-main-panel">
          <div className="exam-card glass-glow-card">
            <div className="exam-card-header">
              <span className="question-index">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="badge-category">{currentQuestion.subject || "General"}</span>
            </div>

            <div className="exam-progress-bar-container">
              <div
                className="exam-progress-bar"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>

            <h2 className="question-text">{currentQuestion.question}</h2>

            {currentQuestion.image && (
              <div style={{ margin: "1rem 0", textAlign: "center" }}>
                <img
                  src={currentQuestion.image}
                  alt="Question diagram"
                  style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "10px", objectFit: "contain", border: "1px solid var(--border)" }}
                />
              </div>
            )}

            <div className="options-container">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQuestion._id] === option;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    className={`option-btn ${isSelected ? "selected" : ""}`}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="option-val">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Actions & Tools */}
            <div className="exam-card-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem" }}>
              <button
                onClick={handlePrev}
                className="btn-action-prev"
                disabled={currentIndex === 0}
              >
                ← Previous
              </button>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="btn-tool"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-main)", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer" }}
                >
                  Calculator
                </button>
              </div>

              <button
                onClick={handleNext}
                className="btn-action-next"
                disabled={currentIndex === questions.length - 1}
              >
                Next →
              </button>
            </div>

            {/* Calculator Popup */}
            {showCalculator && (
              <div className="calculator-popup">
                <div className="calc-header">
                  <span className="calc-title">Calculator</span>
                  <button className="calc-close-btn" onClick={() => setShowCalculator(false)}>✕</button>
                </div>
                <div className="calc-display">
                  <span className="calc-display-value" style={calcInput.length > 12 ? { fontSize: '1.2rem' } : {}}>{calcInput || "0"}</span>
                </div>
                <div className="calc-grid">
                  {[
                    { label: 'C', type: 'action-clear' },
                    { label: 'DEL', type: 'action-del' },
                    { label: '%', type: 'operator' },
                    { label: '÷', type: 'operator' },
                    { label: '7', type: 'number' },
                    { label: '8', type: 'number' },
                    { label: '9', type: 'number' },
                    { label: '×', type: 'operator' },
                    { label: '4', type: 'number' },
                    { label: '5', type: 'number' },
                    { label: '6', type: 'number' },
                    { label: '-', type: 'operator' },
                    { label: '1', type: 'number' },
                    { label: '2', type: 'number' },
                    { label: '3', type: 'number' },
                    { label: '+', type: 'operator' },
                    { label: '0', type: 'number zero' },
                    { label: '.', type: 'number' },
                    { label: '=', type: 'action-equals' },
                  ].map(btn => (
                    <button
                      key={btn.label}
                      onClick={() => handleCalcPress(btn.label)}
                      className={`calc-btn calc-btn-${btn.type.split(' ')[0]} ${btn.type.includes('zero') ? 'calc-btn-zero' : ''}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Status Widgets */}
        <div className="exam-sidebar-panel">

          {/* Timer Card */}
          <div className={`timer-widget-card glass-card ${isTimeCritical ? "time-critical" : ""}`}>
            <div className="timer-display">
              <span className="time-val">{formatTime(timeLeft)}</span>
              <span className="time-label">Remaining Time</span>
            </div>
          </div>

          {/* Progress Summary Bar */}
          <div className="progress-summary" style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "12px", fontWeight: "bold", textAlign: "center", border: "1px solid var(--border)" }}>
            <span>Answered {totalAnswered} of {questions.length} questions ({Math.round((totalAnswered / questions.length) * 100)}%)</span>
          </div>

          {/* Grid Question Map */}
          <div className="question-grid-card glass-card">
            <h3>Question Map</h3>

            {/* Subject Navigation Tabs */}
            {Object.keys(questionsBySubject).length > 1 && (
              <div className="subject-tabs" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {Object.keys(questionsBySubject).map(subj => {
                  const subjectQuestions = questionsBySubject[subj];
                  const answeredInSubject = subjectQuestions.filter(q => selectedAnswers[q._id]).length;
                  return (
                    <button
                      key={subj}
                      onClick={() => {
                        // Jump to the first question of this subject
                        setCurrentIndex(subjectQuestions[0].globalIdx);
                      }}
                      className={`custom-btn ${activeSubjectTab === subj ? "active" : ""}`}
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", flex: "1 1 auto" }}
                    >
                      {subj} ({answeredInSubject}/{subjectQuestions.length})
                    </button>
                  );
                })}
              </div>
            )}

            <div className="question-numbers-grid" style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "5px", paddingLeft: "10px" }}>
              {(questionsBySubject[activeSubjectTab] || []).map((q, localIdx) => {
                const isCurrent = q.globalIdx === currentIndex;
                const isAnswered = !!selectedAnswers[q._id];
                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentIndex(q.globalIdx)}
                    className={`grid-num-btn ${isCurrent ? "current" : ""} ${isAnswered ? "answered" : ""}`}
                  >
                    {localIdx + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSubmitClick}
              className="btn-sidebar-submit w-full mt-6"
              disabled={!isOnline}
              style={{ opacity: !isOnline ? 0.5 : 1, cursor: !isOnline ? "not-allowed" : "pointer" }}
            >
              Submit Assessment
            </button>
          </div>

        </div>

      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-card glass-glow">
            <h2>Submit Assessment?</h2>
            <p>You have answered <strong>{totalAnswered}</strong> out of <strong>{questions.length}</strong> questions.</p>
            <p className="warning-text">Are you sure you want to finish and submit your score? This action cannot be undone.</p>

            <div className="modal-actions">
              <button onClick={() => setShowSubmitModal(false)} className="btn-modal-cancel">
                Go Back
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="btn-modal-confirm"
                disabled={!isOnline}
                style={{ opacity: !isOnline ? 0.5 : 1, cursor: !isOnline ? "not-allowed" : "pointer" }}
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💳 5-Minute Mid-Test Paywall Banner Modal */}
      {showPaywallModal && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 10000,
            background: "rgba(3, 7, 18, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            className="modal-card"
            style={{
              maxWidth: "520px",
              width: "100%",
              borderRadius: "20px",
              padding: "2.5rem 2rem",
              background: "linear-gradient(135deg, hsl(222, 47%, 11%) 0%, hsl(224, 71%, 4%) 100%)",
              border: "1px solid rgba(0, 221, 255, 0.35)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 40px rgba(0, 221, 255, 0.2)",
              textAlign: "center",
              color: "#fff",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 1.25rem",
                borderRadius: "50%",
                background: "rgba(0, 221, 255, 0.12)",
                border: "1px solid rgba(0, 221, 255, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
              }}
            >
              <IconLock size="2rem" color="#0df" />
            </div>

            <div
              style={{
                display: "inline-block",
                padding: "0.25rem 0.85rem",
                borderRadius: "50px",
                fontSize: "0.75rem",
                fontWeight: "700",
                letterSpacing: "1px",
                textTransform: "uppercase",
                background: "rgba(234, 179, 8, 0.15)",
                color: "#facc15",
                border: "1px solid rgba(234, 179, 8, 0.3)",
                marginBottom: "0.75rem",
              }}
            >
              <IconClock size="0.9em" color="#facc15" style={{ marginRight: "4px" }} /> 5-Minute Free Trial Limit Reached
            </div>

            <h2 style={{ fontSize: "1.6rem", fontWeight: "800", margin: "0 0 0.75rem", color: "#f8fafc" }}>
              Unlock Full Exam Access
            </h2>

            <p style={{ fontSize: "0.95rem", color: "#94a3b8", lineHeight: "1.5", margin: "0 0 1.25rem" }}>
              Your test is currently <strong>paused</strong>. To continue answering questions and complete your CBT evaluation, a one-time lifetime fee is required.
            </p>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "1rem",
                marginBottom: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600" }}>
                  One-Time Lifetime Fee
                </div>
                <div style={{ fontSize: "0.9rem", color: "#e2e8f0", marginTop: "2px" }}>
                  Unlimited Tests Forever
                </div>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#38bdf8" }}>
                ₦2,500 <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "#94a3b8" }}>NGN</span>
              </div>
            </div>

            {payError && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#fca5a5",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                {payError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={handlePayNow}
                disabled={isPaying}
                style={{
                  background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
                  color: "#fff",
                  border: "none",
                  padding: "0.9rem 1.5rem",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: "700",
                  cursor: isPaying ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 18px rgba(37, 99, 235, 0.35)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                {isPaying ? "Processing Checkout..." : "💳 Pay Now & Continue Test"}
              </button>

              <button
                onClick={handleCancelTestWithoutTrace}
                disabled={isPaying}
                style={{
                  background: "transparent",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  cursor: isPaying ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Cancel Test (Abort without saving)
              </button>
            </div>

            <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#64748b" }}>
              <IconLock size="0.85em" color="#64748b" style={{ marginRight: "4px" }} /> Secured with Paystack. Supports Cards, Bank Transfer, USSD, & Mobile Money.
            </div>
          </div>
        </div>
      )}

      {/* 🎮 Post-Exam Chill Zone Modal */}
      {chillZoneModal}

    </div>
  );
};

export default QuestionsPage;
