const logic = window.module.exports;
const formatCurrency = window.SubscriptionUI.formatWon;
const drawCategories = window.SubscriptionUI.renderCategories;
const drawSubscriptions = window.SubscriptionUI.renderSubscriptions;
const storageKey = "subscription-tracker-subscriptions";
const form = document.querySelector("#subscription-editor");
const nameInput = document.querySelector("#name");
const amountInput = document.querySelector("#amount");
const cycleInput = document.querySelector("#cycle");
const paymentDateInput = document.querySelector("#next-payment-date");
const categoryInput = document.querySelector("#category");
const formTitle = document.querySelector("#form-title");
const submitButton = document.querySelector("#submit-button");
const cancelEditButton = document.querySelector("#cancel-edit");
const formError = document.querySelector("#form-error");
const appMessage = document.querySelector("#app-message");

let subscriptions = loadSubscriptions();
let editingId = null;

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysUntilPayment(dateString) {
  return logic.getDaysUntilPayment(getTodayString(), dateString);
}

function isValidSubscription(subscription) {
  return subscription
    && typeof subscription.id === "string"
    && typeof subscription.name === "string"
    && Number.isFinite(subscription.amount)
    && subscription.amount > 0
    && (subscription.cycle === "monthly" || subscription.cycle === "yearly")
    && /^\d{4}-\d{2}-\d{2}$/.test(subscription.nextPaymentDate)
    && typeof subscription.category === "string";
}

function loadSubscriptions() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === null) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isValidSubscription)) {
      throw new Error("저장된 구독 데이터의 형식이 올바르지 않습니다.");
    }
    return parsed;
  } catch (error) {
    showAppMessage(`저장된 데이터를 불러오지 못했어요: ${error.message}`);
    return [];
  }
}

function saveSubscriptions(nextSubscriptions) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextSubscriptions));
    subscriptions = nextSubscriptions;
    appMessage.textContent = "";
    return true;
  } catch (error) {
    showAppMessage(`데이터를 저장하지 못했어요: ${error.message}`);
    return false;
  }
}

function showAppMessage(message) {
  appMessage.textContent = message;
}

function render() {
  const today = getTodayString();
  const monthlyTotal = logic.getMonthlyTotal(subscriptions);
  const upcoming = logic.getUpcomingSubscriptions(subscriptions, today, 7);
  const upcomingTotal = upcoming.reduce(
    (total, subscription) => total + subscription.amount,
    0
  );
  const todayDate = new Date(`${today}T00:00:00`);

  document.querySelector("#today-label").textContent =
    new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(todayDate);
  document.querySelector("#monthly-total").textContent = formatCurrency(monthlyTotal);
  document.querySelector("#annual-total").textContent =
    formatCurrency(logic.getAnnualTotal(subscriptions));
  document.querySelector("#upcoming-count").textContent = `${upcoming.length}건`;
  document.querySelector("#upcoming-total").textContent =
    `결제 예정 금액 ${formatCurrency(upcomingTotal)}`;

  drawSubscriptions(subscriptions, daysUntilPayment);
  drawCategories(logic.getMonthlyTotalsByCategory(subscriptions), monthlyTotal);
}

function resetForm() {
  editingId = null;
  form.reset();
  paymentDateInput.min = getTodayString();
  formTitle.textContent = "새 구독 추가";
  submitButton.textContent = "구독 추가";
  cancelEditButton.hidden = true;
  formError.textContent = "";
}

function startEditing(id) {
  const subscription = subscriptions.find((item) => item.id === id);
  if (!subscription) {
    showAppMessage("수정할 구독을 찾을 수 없습니다. 목록을 새로고침해 주세요.");
    return;
  }

  editingId = id;
  nameInput.value = subscription.name;
  amountInput.value = String(subscription.amount);
  cycleInput.value = subscription.cycle;
  paymentDateInput.value = subscription.nextPaymentDate;
  paymentDateInput.min = getTodayString();
  categoryInput.value = subscription.category;
  formTitle.textContent = "구독 수정";
  submitButton.textContent = "변경 저장";
  cancelEditButton.hidden = false;
  formError.textContent = "";
  document.querySelector("#subscription-form").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
  nameInput.focus({ preventScroll: true });
}

document.querySelector("#today-label").textContent = "";
paymentDateInput.min = getTodayString();
render();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";

  const amount = Number(amountInput.value);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    formError.textContent = "금액은 1원 이상의 정수로 입력해 주세요.";
    amountInput.focus();
    return;
  }

  const existing = subscriptions.find((item) => item.id === editingId);
  const subscription = {
    id: existing ? existing.id : crypto.randomUUID(),
    name: nameInput.value.trim(),
    amount,
    cycle: cycleInput.value,
    nextPaymentDate: paymentDateInput.value,
    category: categoryInput.value
  };

  if (!subscription.name || !subscription.nextPaymentDate) {
    formError.textContent = "이름과 다음 결제일을 입력해 주세요.";
    return;
  }

  const nextSubscriptions = existing
    ? subscriptions.map((item) => item.id === editingId ? subscription : item)
    : [...subscriptions, subscription];

  if (saveSubscriptions(nextSubscriptions)) {
    resetForm();
    render();
  }
});

cancelEditButton.addEventListener("click", resetForm);

document.querySelector("#subscription-list").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const subscription = subscriptions.find((item) => item.id === id);
  if (!subscription) {
    showAppMessage("선택한 구독을 찾을 수 없습니다. 목록을 새로고침해 주세요.");
    return;
  }

  if (action === "edit") {
    startEditing(id);
  } else if (action === "delete") {
    if (!window.confirm(`"${subscription.name}" 구독을 삭제할까요?`)) return;
    const nextSubscriptions = subscriptions.filter((item) => item.id !== id);
    if (saveSubscriptions(nextSubscriptions)) {
      if (editingId === id) resetForm();
      render();
    }
  }
});
