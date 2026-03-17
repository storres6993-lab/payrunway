import React, { useEffect, useMemo, useState } from "react";
import { Bell, Home, Receipt, Repeat, Target } from "lucide-react";

const STORAGE_KEY = "payrunway-web-mvp";
const LEGACY_STORAGE_KEY = "todaycash-web-mvp";

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toDateInputValue(date) {
  const copy = new Date(date);
  const year = copy.getFullYear();
  const month = String(copy.getMonth() + 1).padStart(2, "0");
  const day = String(copy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatCurrencyExact(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDateLabel(dateString) {
  if (!dateString) return "No date";
  const parsed = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isDueBeforePayday(dateString, paydayDate) {
  if (!dateString) return false;
  const due = startOfDay(new Date(`${dateString}T12:00:00`));
  if (Number.isNaN(due.getTime())) return false;
  return due <= paydayDate;
}

function getDefaultData() {
  const today = startOfDay(new Date());
  const nextPaydayDate = toDateInputValue(addDays(today, 7));

  return {
    activeTab: "home",
    balance: 842,
    nextPaydayDate,
    paycheckAmount: 950,
    goalName: "Vegas Trip",
    goalTarget: 1000,
    goalSaved: 125,
    todaySpent: "",
    dailyHistory: {},
    upcomingBills: [
      { id: 1, name: "Phone Bill", dueDate: toDateInputValue(addDays(today, 2)), amount: 65 },
      { id: 2, name: "Internet", dueDate: toDateInputValue(addDays(today, 5)), amount: 80 },
      { id: 3, name: "Car Insurance", dueDate: toDateInputValue(addDays(today, 12)), amount: 120 },
    ],
    subscriptions: [
      { id: 1, name: "Netflix", amount: 15.49, status: "Keep" },
      { id: 2, name: "Spotify", amount: 10.99, status: "Keep" },
      { id: 3, name: "Gym", amount: 29.99, status: "Review" },
    ],
  };
}

function TabButton({ id, label, icon: Icon, activeTab, setActiveTab }) {
  const isActive = activeTab === id;

  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition ${
        isActive ? "bg-slate-900 text-white" : "text-slate-500"
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

export default function PayRunwayApp() {
  const defaultData = useMemo(() => getDefaultData(), []);

  const [activeTab, setActiveTab] = useState(defaultData.activeTab);
  const [balance, setBalance] = useState(defaultData.balance);
  const [nextPaydayDate, setNextPaydayDate] = useState(defaultData.nextPaydayDate);
  const [paycheckAmount, setPaycheckAmount] = useState(defaultData.paycheckAmount);

  const [goalName, setGoalName] = useState(defaultData.goalName);
  const [goalTarget, setGoalTarget] = useState(defaultData.goalTarget);
  const [goalSaved, setGoalSaved] = useState(defaultData.goalSaved);

  const [todaySpent, setTodaySpent] = useState(defaultData.todaySpent);
  const [dailyHistory, setDailyHistory] = useState(defaultData.dailyHistory);

  const [upcomingBills, setUpcomingBills] = useState(defaultData.upcomingBills);
  const [subscriptions, setSubscriptions] = useState(defaultData.subscriptions);

  const [hasLoaded, setHasLoaded] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Not saved yet");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [rewardNotice, setRewardNotice] = useState(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = useMemo(() => toDateInputValue(today), [today]);
  const yesterdayKey = useMemo(() => toDateInputValue(addDays(today, -1)), [today]);

  const paydayDate = useMemo(() => {
    const parsed = new Date(`${nextPaydayDate}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? today : startOfDay(parsed);
  }, [nextPaydayDate, today]);

  const daysUntilPayday = useMemo(() => {
    return Math.max(0, Math.ceil((paydayDate - today) / 86400000));
  }, [paydayDate, today]);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        const restoredNextPaydayDate =
          parsed.nextPaydayDate ??
          toDateInputValue(addDays(new Date(), Number(parsed.daysUntilPayday ?? 7)));

        setActiveTab(parsed.activeTab ?? defaultData.activeTab);
        setBalance(parsed.balance ?? defaultData.balance);
        setNextPaydayDate(restoredNextPaydayDate);
        setPaycheckAmount(parsed.paycheckAmount ?? defaultData.paycheckAmount);

        setGoalName(parsed.goalName ?? defaultData.goalName);
        setGoalTarget(parsed.goalTarget ?? defaultData.goalTarget);
        setGoalSaved(parsed.goalSaved ?? defaultData.goalSaved);

        setTodaySpent(parsed.todaySpent ?? defaultData.todaySpent);
        setDailyHistory(parsed.dailyHistory ?? defaultData.dailyHistory);

        setUpcomingBills(parsed.upcomingBills ?? defaultData.upcomingBills);
        setSubscriptions(parsed.subscriptions ?? defaultData.subscriptions);

        setShowOnboarding(false);
        setSaveMessage("Saved data restored");
      } else {
        setShowOnboarding(true);
        setSaveMessage("Complete setup to personalize");
      }
    } catch {
      setShowOnboarding(true);
      setSaveMessage("Could not restore saved data");
    }

    setHasLoaded(true);
  }, [defaultData]);

  useEffect(() => {
    if (!hasLoaded) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeTab,
          balance,
          nextPaydayDate,
          paycheckAmount,
          goalName,
          goalTarget,
          goalSaved,
          todaySpent,
          dailyHistory,
          upcomingBills,
          subscriptions,
        })
      );
      setSaveMessage("Saved on this device");
    } catch {
      setSaveMessage("Save failed on this device");
    }
  }, [
    activeTab,
    balance,
    nextPaydayDate,
    paycheckAmount,
    goalName,
    goalTarget,
    goalSaved,
    todaySpent,
    dailyHistory,
    upcomingBills,
    subscriptions,
    hasLoaded,
  ]);

  useEffect(() => {
    if (!rewardNotice) return;

    const timer = window.setTimeout(() => {
      setRewardNotice(null);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [rewardNotice]);

  const billsDueBeforePayday = useMemo(
    () => upcomingBills.filter((bill) => isDueBeforePayday(bill.dueDate, paydayDate)),
    [upcomingBills, paydayDate]
  );

  const billsDueLater = useMemo(
    () => upcomingBills.filter((bill) => !isDueBeforePayday(bill.dueDate, paydayDate)),
    [upcomingBills, paydayDate]
  );

  const protectedBillsTotal = useMemo(
    () => billsDueBeforePayday.reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [billsDueBeforePayday]
  );

  const totalSubscriptions = useMemo(
    () => subscriptions.reduce((sum, sub) => sum + Number(sub.amount || 0), 0),
    [subscriptions]
  );

  const sortedUpcomingBills = useMemo(
    () =>
      [...upcomingBills].sort(
        (a, b) =>
          new Date(`${a.dueDate}T12:00:00`) - new Date(`${b.dueDate}T12:00:00`)
      ),
    [upcomingBills]
  );

  const laterBillsTotal = useMemo(
    () => billsDueLater.reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
    [billsDueLater]
  );

  const reserveBuffer = 100;
  const availableBeforePayday = balance - protectedBillsTotal - reserveBuffer;
  const safeToSpend = Math.max(
    0,
    Math.floor(availableBeforePayday / Math.max(daysUntilPayday || 1, 1))
  );
  const projectedAfterPayday =
    balance - protectedBillsTotal - totalSubscriptions + paycheckAmount;

  const goalProgressPercent = Math.min(
    100,
    Math.round((Number(goalSaved || 0) / Math.max(Number(goalTarget || 1), 1)) * 100)
  );
  const goalRemaining = Math.max(0, Number(goalTarget || 0) - Number(goalSaved || 0));

  const status = safeToSpend >= 40 ? "green" : safeToSpend >= 15 ? "yellow" : "red";
  const statusLabel =
    status === "green" ? "Comfortable" : status === "yellow" ? "Watch spending" : "Tight";
  const statusClasses =
    status === "green"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : status === "yellow"
      ? "bg-amber-50 border-amber-200 text-amber-900"
      : "bg-rose-50 border-rose-200 text-rose-900";

  const numericTodaySpent = Number(todaySpent || 0);
  const todayProjectedSaved = Math.max(0, safeToSpend - numericTodaySpent);
  const todayProjectedOver = Math.max(0, numericTodaySpent - safeToSpend);

  const yesterdayWin = dailyHistory[yesterdayKey];
  const yesterdayProgressPercent = yesterdayWin
    ? Math.min(
        100,
        Math.round(
          (Number(yesterdayWin.saved || 0) / Math.max(Number(yesterdayWin.safeToSpend || 1), 1)) * 100
        )
      )
    : 0;

  const pushRewardNotice = (amount, source) => {
    if (amount <= 0) return;
    setRewardNotice({
      amount,
      source,
      goalName,
    });
  };

  const replayYesterdayReward = () => {
    if (!yesterdayWin?.saved) return;
    pushRewardNotice(Number(yesterdayWin.saved), "replay");
  };

  const logTodaySpending = () => {
    if (todaySpent === "") return;

    const spent = Number(todaySpent || 0);
    const saved = Math.max(0, Number((safeToSpend - spent).toFixed(2)));
    const previousSaved = Number(dailyHistory[todayKey]?.saved || 0);
    const delta = Number((saved - previousSaved).toFixed(2));

    setDailyHistory((current) => ({
      ...current,
      [todayKey]: {
        date: todayKey,
        safeToSpend,
        spent,
        saved,
      },
    }));

    if (delta !== 0) {
      setGoalSaved((current) => Number((current + delta).toFixed(2)));
    }

    if (delta > 0) {
      pushRewardNotice(delta, "today");
      setSaveMessage("Today logged and reward applied");
    } else {
      setSaveMessage("Today logged");
    }
  };

  const demoYesterdayReward = () => {
    const demoSafe = Math.max(safeToSpend, 35);
    const demoSaved = Math.max(12, Math.min(25, Math.floor(demoSafe * 0.3)));
    const demoSpent = Math.max(0, demoSafe - demoSaved);

    const previousSaved = Number(dailyHistory[yesterdayKey]?.saved || 0);
    const delta = Number((demoSaved - previousSaved).toFixed(2));

    setDailyHistory((current) => ({
      ...current,
      [yesterdayKey]: {
        date: yesterdayKey,
        safeToSpend: demoSafe,
        spent: demoSpent,
        saved: demoSaved,
      },
    }));

    if (delta !== 0) {
      setGoalSaved((current) => Number((current + delta).toFixed(2)));
    }

    pushRewardNotice(Math.max(delta, 0), "yesterday demo");
    setSaveMessage("Demo reward added");
  };

  const updateBill = (id, field, value) => {
    setUpcomingBills((current) =>
      current.map((bill) =>
        bill.id === id
          ? {
              ...bill,
              [field]: field === "amount" ? Number(value) : value,
            }
          : bill
      )
    );
  };

  const addBill = () => {
    setUpcomingBills((current) => [
      ...current,
      {
        id: Date.now(),
        name: "New Bill",
        dueDate: nextPaydayDate,
        amount: 25,
      },
    ]);
  };

  const deleteBill = (id) => {
    setUpcomingBills((current) => current.filter((bill) => bill.id !== id));
  };

  const updateSubscription = (id, field, value) => {
    setSubscriptions((current) =>
      current.map((sub) =>
        sub.id === id
          ? {
              ...sub,
              [field]: field === "amount" ? Number(value) : value,
            }
          : sub
      )
    );
  };

  const addSubscription = () => {
    setSubscriptions((current) => [
      ...current,
      { id: Date.now(), name: "New Subscription", amount: 9.99, status: "Keep" },
    ]);
  };

  const deleteSubscription = (id) => {
    setSubscriptions((current) => current.filter((sub) => sub.id !== id));
  };

  const resetAllData = () => {
    const fresh = getDefaultData();

    setActiveTab(fresh.activeTab);
    setBalance(fresh.balance);
    setNextPaydayDate(fresh.nextPaydayDate);
    setPaycheckAmount(fresh.paycheckAmount);

    setGoalName(fresh.goalName);
    setGoalTarget(fresh.goalTarget);
    setGoalSaved(fresh.goalSaved);

    setTodaySpent(fresh.todaySpent);
    setDailyHistory(fresh.dailyHistory);

    setUpcomingBills(fresh.upcomingBills);
    setSubscriptions(fresh.subscriptions);

    setRewardNotice(null);
    setOnboardingStep(1);
    setShowOnboarding(true);

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setSaveMessage("Reset to starter data");
    } catch {
      setSaveMessage("Reset locally, but could not clear storage");
    }
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setActiveTab("home");
    setSaveMessage("Setup complete and saved");
  };

  const summaryCard = (
    <div className="rounded-[1.75rem] bg-slate-900 p-6 text-white shadow-lg">
      <p className="text-sm text-slate-300">Today’s safe number</p>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-6xl font-bold leading-none">{formatCurrency(safeToSpend)}</span>
        <span className="pb-1 text-slate-300">/day</span>
      </div>
      <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${statusClasses}`}>
        <span className="font-semibold">{statusLabel}.</span> Bills due before{" "}
        {formatDateLabel(nextPaydayDate)} are protected first.
      </div>
    </div>
  );

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-slate-200 p-4 md:flex md:items-center md:justify-center md:p-8">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-300 bg-slate-50 p-6 shadow-2xl md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white shadow-sm">
                $
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                  PayRunway
                </p>
                <h1 className="mt-1 text-3xl font-bold text-slate-900">
                  Let’s set up your daily number
                </h1>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-900 px-3 py-2 text-sm text-white">
              {onboardingStep}/4
            </div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${(onboardingStep / 4) * 100}%` }}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-900">How PayRunway works</p>
            <p className="mt-1 text-sm text-slate-500">
              We protect bills due before payday first, then turn the money left into one safe daily number.
            </p>
          </div>

          <div className="mt-8 space-y-5">
            {onboardingStep === 1 && (
              <div>
                <h2 className="text-xl font-semibold">How much is in checking right now?</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Start with the account you actually spend from day to day.
                </p>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-lg"
                />
              </div>
            )}

            {onboardingStep === 2 && (
              <div>
                <h2 className="text-xl font-semibold">When does your next paycheck hit?</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bills due on or before this date get protected before we show your daily number.
                </p>
                <input
                  type="date"
                  value={nextPaydayDate}
                  onChange={(e) => setNextPaydayDate(e.target.value)}
                  className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-lg"
                />
              </div>
            )}

            {onboardingStep === 3 && (
              <div>
                <h2 className="text-xl font-semibold">About how much will your next paycheck be?</h2>
                <p className="mt-1 text-sm text-slate-500">
                  A close estimate is fine. You can always change it later.
                </p>
                <input
                  type="number"
                  value={paycheckAmount}
                  onChange={(e) => setPaycheckAmount(Number(e.target.value))}
                  className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-lg"
                />
              </div>
            )}

            {onboardingStep === 4 && (
              <div>
                <h2 className="text-xl font-semibold">Which bills are due before payday?</h2>
                <p className="mt-1 text-sm text-slate-500">
                  These are the bills PayRunway protects first before showing what is safe to spend.
                </p>
                <div className="mt-4 space-y-3">
                  {upcomingBills.slice(0, 3).map((bill) => (
                    <div
                      key={bill.id}
                      className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <input
                        value={bill.name}
                        onChange={(e) => updateBill(bill.id, "name", e.target.value)}
                        className="rounded-2xl border border-slate-300 px-4 py-3"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={bill.dueDate}
                          onChange={(e) => updateBill(bill.id, "dueDate", e.target.value)}
                          className="rounded-2xl border border-slate-300 px-4 py-3"
                        />
                        <input
                          type="number"
                          value={bill.amount}
                          onChange={(e) => updateBill(bill.id, "amount", e.target.value)}
                          className="rounded-2xl border border-slate-300 px-4 py-3"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={() => setOnboardingStep((step) => Math.max(1, step - 1))}
              className="rounded-2xl border border-slate-300 px-5 py-3 font-medium text-slate-700"
            >
              Back
            </button>

            {onboardingStep < 4 ? (
              <button
                onClick={() => setOnboardingStep((step) => Math.min(4, step + 1))}
                className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white"
              >
                Next
              </button>
            ) : (
              <button
                onClick={completeOnboarding}
                className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white"
              >
                See my number
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 p-4 md:p-8">
      <div className="mx-auto max-w-sm md:max-w-6xl">
        <div className="min-h-[860px] overflow-hidden rounded-[2rem] border border-slate-300 bg-slate-50 shadow-2xl md:grid md:grid-cols-[320px_1fr]">
          <div className="hidden flex-col bg-slate-900 p-6 text-white md:flex">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-900 shadow-sm">
                  $
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    PayRunway
                  </p>
                  <h1 className="mt-1 text-3xl font-bold">Know what’s safe before payday.</h1>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-300">
                A simple daily money app that protects near-term bills first, then
                tells you what is safe to spend.
              </p>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-slate-300">Today’s number</p>
              <p className="mt-2 text-5xl font-bold">{formatCurrency(safeToSpend)}</p>
              <p className="mt-2 text-sm text-slate-300">{statusLabel}</p>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => setActiveTab("home")}
                className={`w-full rounded-2xl px-4 py-3 text-left ${
                  activeTab === "home" ? "bg-white/15" : "bg-white/5"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveTab("bills")}
                className={`w-full rounded-2xl px-4 py-3 text-left ${
                  activeTab === "bills" ? "bg-white/15" : "bg-white/5"
                }`}
              >
                Bills
              </button>
              <button
                onClick={() => setActiveTab("subs")}
                className={`w-full rounded-2xl px-4 py-3 text-left ${
                  activeTab === "subs" ? "bg-white/15" : "bg-white/5"
                }`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => setActiveTab("goal")}
                className={`w-full rounded-2xl px-4 py-3 text-left ${
                  activeTab === "goal" ? "bg-white/15" : "bg-white/5"
                }`}
              >
                Goal
              </button>
            </div>

            <div className="mt-auto rounded-3xl bg-white p-5 text-slate-900">
              <p className="text-sm text-slate-500">Expected after payday</p>
              <p className="mt-2 text-3xl font-bold">{formatCurrency(projectedAfterPayday)}</p>
              <p className="mt-2 text-sm text-slate-500">
                Using only the bills due before {formatDateLabel(nextPaydayDate)}.
              </p>

              <button
                onClick={resetAllData}
                className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset demo
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 md:px-8 md:pt-8">
              <div>
                <p className="text-sm text-slate-500">PayRunway daily check-in</p>
                <h2 className="text-2xl font-bold text-slate-900">Good afternoon</h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm sm:block">
                  {saveMessage}
                </div>

                <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm">
                  <Bell size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 px-4 pb-24 md:px-8 md:pb-8">
              {activeTab === "home" && (
                <>
                  {summaryCard}

                  {rewardNotice && (
                    <div className="rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-5 shadow-sm ring-2 ring-emerald-200">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                            <Target size={22} />
                          </div>

                          <div>
                            <p className="text-sm font-medium text-emerald-900">Reward unlocked</p>
                            <h3 className="mt-1 text-xl font-bold text-emerald-950">
                              You moved {formatCurrencyExact(rewardNotice.amount)} closer to {goalName}
                            </h3>
                            <p className="mt-2 text-sm text-emerald-800">
                              {rewardNotice.source === "today"
                                ? "Nice. You stayed under today, and that money rolled into your goal."
                                : rewardNotice.source === "replay"
                                ? "This is the return-user moment that keeps the app feeling rewarding."
                                : "Demo mode: this shows the kind of reward a returning user would see."}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setRewardNotice(null)}
                          className="rounded-xl border border-emerald-300 bg-white px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                        >
                          Hide
                        </button>
                      </div>

                      <div className="mt-4 h-4 overflow-hidden rounded-full bg-emerald-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                          style={{ width: `${goalProgressPercent}%` }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm text-emerald-900">
                        <span>{formatCurrencyExact(goalSaved)} saved</span>
                        <span>{formatCurrencyExact(goalTarget)} target</span>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-500">Yesterday’s win</p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-900">
                            {yesterdayWin
                              ? `Stayed under by ${formatCurrencyExact(yesterdayWin.saved)}`
                              : "No win logged yet"}
                          </h3>
                        </div>

                        {yesterdayWin && (
                          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900">
                            {yesterdayProgressPercent}%
                          </div>
                        )}
                      </div>

                      {yesterdayWin ? (
                        <>
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${yesterdayProgressPercent}%` }}
                            />
                          </div>
                          <p className="mt-3 text-sm text-slate-600">
                            You spent {formatCurrencyExact(yesterdayWin.spent)} against a safe number of{" "}
                            {formatCurrencyExact(yesterdayWin.safeToSpend)}.
                          </p>
                          <p className="mt-2 text-sm font-medium text-emerald-700">
                            That money did not disappear. It moved you closer to {goalName}.
                          </p>
                        </>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">
                          Log today or use the demo button to preview the return-user reward loop.
                        </p>
                      )}

                      <button
                        onClick={yesterdayWin ? replayYesterdayReward : demoYesterdayReward}
                        className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {yesterdayWin ? "Replay reward" : "Demo reward"}
                      </button>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">Your goal</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">{goalName}</h3>

                      <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-slate-900 transition-all"
                          style={{ width: `${goalProgressPercent}%` }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                        <span>{formatCurrencyExact(goalSaved)} saved</span>
                        <span>{formatCurrencyExact(goalTarget)} target</span>
                      </div>

                      <p className="mt-3 text-sm text-slate-500">
                        {goalRemaining > 0
                          ? `${formatCurrencyExact(goalRemaining)} left to reach your goal.`
                          : "You reached your goal. Set the next one."}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">Log today’s spending</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        If you stay under today, tomorrow shows the win
                      </h3>

                      <label className="mt-4 block">
                        <span className="text-sm text-slate-600">Spent today so far</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={todaySpent}
                          onChange={(e) => setTodaySpent(e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                        />
                      </label>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm">
                        {todaySpent === "" ? (
                          <p className="text-slate-500">
                            Enter what you spent today to preview your win.
                          </p>
                        ) : todayProjectedOver > 0 ? (
                          <p className="text-rose-700">
                            You are {formatCurrencyExact(todayProjectedOver)} over today’s safe number.
                          </p>
                        ) : (
                          <p className="text-emerald-700">
                            If today ended now, you would keep {formatCurrencyExact(todayProjectedSaved)}.
                          </p>
                        )}
                      </div>

                      <button
                        onClick={logTodaySpending}
                        disabled={todaySpent === ""}
                        className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Save today
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">Checking</p>
                      <p className="mt-2 text-3xl font-bold">{formatCurrency(balance)}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">Bills before payday</p>
                      <p className="mt-2 text-3xl font-bold">
                        {formatCurrency(protectedBillsTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">Your numbers</h3>
                        <p className="text-sm text-slate-500">
                          This setup powers your daily number
                        </p>
                      </div>
                      <button
                        onClick={resetAllData}
                        className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <label className="block">
                        <span className="text-sm text-slate-600">Checking balance</span>
                        <input
                          type="number"
                          value={balance}
                          onChange={(e) => setBalance(Number(e.target.value))}
                          className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm text-slate-600">Next payday</span>
                        <input
                          type="date"
                          value={nextPaydayDate}
                          onChange={(e) => setNextPaydayDate(e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm text-slate-600">Expected paycheck</span>
                        <input
                          type="number"
                          value={paycheckAmount}
                          onChange={(e) => setPaycheckAmount(Number(e.target.value))}
                          className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "bills" && (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">Bills due soon</h3>
                        <p className="text-sm text-slate-500">
                          Only bills due on or before payday count toward your safe number
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={resetAllData}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 md:hidden"
                        >
                          Reset demo
                        </button>

                        <button
                          onClick={addBill}
                          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white"
                        >
                          Add bill
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Payday cutoff</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {formatDateLabel(nextPaydayDate)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {daysUntilPayday} day{daysUntilPayday === 1 ? "" : "s"} away
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-sm text-emerald-800">Protected before payday</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-950">
                          {billsDueBeforePayday.length}
                        </p>
                        <p className="mt-1 text-sm text-emerald-900">
                          {formatCurrencyExact(protectedBillsTotal)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Later bills</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {billsDueLater.length}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatCurrencyExact(laterBillsTotal)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {sortedUpcomingBills.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                      <h4 className="text-lg font-semibold text-slate-900">No bills yet</h4>
                      <p className="mt-2 text-sm text-slate-500">
                        Add a bill to see whether it lands before or after payday.
                      </p>
                      <button
                        onClick={addBill}
                        className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white"
                      >
                        Add your first bill
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedUpcomingBills.map((bill) => {
                        const counted = isDueBeforePayday(bill.dueDate, paydayDate);

                        return (
                          <div
                            key={bill.id}
                            className={`rounded-3xl border p-5 shadow-sm ${
                              counted
                                ? "border-emerald-200 bg-emerald-50/70"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    counted
                                      ? "bg-emerald-100 text-emerald-900"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {counted ? "Counted before payday" : "After payday"}
                                </span>

                                <span className="text-xs text-slate-500">
                                  Cutoff: {formatDateLabel(nextPaydayDate)}
                                </span>
                              </div>

                              <button
                                onClick={() => deleteBill(bill.id)}
                                className="rounded-xl border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Delete
                              </button>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <label className="block">
                                <span className="text-sm text-slate-600">Bill name</span>
                                <input
                                  value={bill.name}
                                  onChange={(e) => updateBill(bill.id, "name", e.target.value)}
                                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                                />
                              </label>

                              <label className="block">
                                <span className="text-sm text-slate-600">Due date</span>
                                <input
                                  type="date"
                                  value={bill.dueDate}
                                  onChange={(e) => updateBill(bill.id, "dueDate", e.target.value)}
                                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                                />
                              </label>

                              <label className="block">
                                <span className="text-sm text-slate-600">Amount</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={bill.amount}
                                  onChange={(e) => updateBill(bill.id, "amount", e.target.value)}
                                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                                />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="text-right text-sm text-slate-600">
                    Protected before payday: {formatCurrencyExact(protectedBillsTotal)}
                  </div>
                </div>
              )}

              {activeTab === "subs" && (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">Subscriptions</h3>
                        <p className="text-sm text-slate-500">
                          Track recurring charges that quietly eat into your safe-to-spend number
                        </p>
                      </div>

                      <button
                        onClick={addSubscription}
                        className="rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white"
                      >
                        Add subscription
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Monthly recurring total</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {formatCurrencyExact(totalSubscriptions)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Based on all active entries below
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Subscriptions tracked</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {subscriptions.length}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Review anything you do not use often
                        </p>
                      </div>
                    </div>
                  </div>

                  {subscriptions.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                      <h4 className="text-lg font-semibold text-slate-900">No subscriptions yet</h4>
                      <p className="mt-2 text-sm text-slate-500">
                        Add recurring charges so people testing the app can see how they stack up.
                      </p>
                      <button
                        onClick={addSubscription}
                        className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white"
                      >
                        Add your first subscription
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subscriptions.map((sub) => {
                        const statusTone =
                          sub.status === "Keep"
                            ? "bg-emerald-100 text-emerald-900"
                            : sub.status === "Review"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-rose-100 text-rose-900";

                        return (
                          <div
                            key={sub.id}
                            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone}`}>
                                  {sub.status || "Keep"}
                                </span>
                                <span className="text-xs text-slate-500">
                                  Monthly recurring charge
                                </span>
                              </div>

                              <button
                                onClick={() => deleteSubscription(sub.id)}
                                className="rounded-xl border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Delete
                              </button>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <label className="block">
                                <span className="text-sm text-slate-600">Name</span>
                                <input
                                  value={sub.name}
                                  onChange={(e) => updateSubscription(sub.id, "name", e.target.value)}
                                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                                />
                              </label>

                              <label className="block">
                                <span className="text-sm text-slate-600">Monthly amount</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={sub.amount}
                                  onChange={(e) => updateSubscription(sub.id, "amount", e.target.value)}
                                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                                />
                              </label>

                              <label className="block">
                                <span className="text-sm text-slate-600">Status</span>
                                <select
                                  value={sub.status}
                                  onChange={(e) => updateSubscription(sub.id, "status", e.target.value)}
                                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                                >
                                  <option value="Keep">Keep</option>
                                  <option value="Review">Review</option>
                                  <option value="Cancel">Cancel</option>
                                </select>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="text-right text-sm text-slate-600">
                    Monthly subscriptions: {formatCurrencyExact(totalSubscriptions)}
                  </div>
                </div>
              )}

              {activeTab === "goal" && (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Special savings goal</p>
                    <h3 className="mt-1 text-2xl font-bold text-slate-900">{goalName}</h3>

                    <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all"
                        style={{ width: `${goalProgressPercent}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span>{formatCurrencyExact(goalSaved)} saved</span>
                      <span>{formatCurrencyExact(goalTarget)} target</span>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      {goalRemaining > 0
                        ? `${formatCurrencyExact(goalRemaining)} left to go.`
                        : "You reached your goal. Set the next one."}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold">Edit your goal</h3>
                    <p className="text-sm text-slate-500">
                      Daily wins roll into this goal automatically.
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <label className="block">
                        <span className="text-sm text-slate-600">Goal name</span>
                        <input
                          value={goalName}
                          onChange={(e) => setGoalName(e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm text-slate-600">Target amount</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={goalTarget}
                          onChange={(e) => setGoalTarget(Number(e.target.value))}
                          className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm text-slate-600">Already saved</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={goalSaved}
                          onChange={(e) => setGoalSaved(Number(e.target.value))}
                          className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                        />
                      </label>
                    </div>

                    <button
                      onClick={demoYesterdayReward}
                      className="mt-4 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Demo reward on this goal
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pointer-events-none fixed bottom-20 left-4 right-4 md:hidden">
              <div className="pointer-events-auto mx-auto max-w-sm rounded-2xl bg-slate-900 px-4 py-2 text-center text-xs text-white shadow-lg">
                {saveMessage}
              </div>
            </div>

            <div className="fixed bottom-4 left-4 right-4 md:hidden">
              <div className="mx-auto max-w-sm rounded-[1.75rem] border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur">
                <div className="grid grid-cols-4 gap-1">
                  <TabButton
                    id="home"
                    label="Home"
                    icon={Home}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                  <TabButton
                    id="bills"
                    label="Bills"
                    icon={Receipt}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                  <TabButton
                    id="subs"
                    label="Subs"
                    icon={Repeat}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                  <TabButton
                    id="goal"
                    label="Goal"
                    icon={Target}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}