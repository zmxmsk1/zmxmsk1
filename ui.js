const currencyFormatter = new Intl.NumberFormat("ko-KR");

function formatWon(amount) {
  return `₩${currencyFormatter.format(amount)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[character];
  });
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric"
  }).format(new Date(year, month - 1, day));
}

function getDayLabel(daysUntilPayment) {
  if (daysUntilPayment === 0) return "오늘 결제";
  if (daysUntilPayment > 0) return `D-${daysUntilPayment}`;
  return `D+${Math.abs(daysUntilPayment)}`;
}

function getServiceIcon(name) {
  return escapeHtml(name.trim().charAt(0) || "?");
}

function renderSubscriptions(subscriptions, daysUntilPaymentFor) {
  const list = document.querySelector("#subscription-list");
  const count = document.querySelector("#subscription-count");
  count.textContent = String(subscriptions.length);

  if (subscriptions.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon" aria-hidden="true">＋</span>
        아직 등록된 구독이 없어요.<br>오른쪽 폼에서 첫 구독을 추가해 보세요.
      </div>`;
    return;
  }

  const sortedSubscriptions = [...subscriptions].sort((first, second) =>
    first.nextPaymentDate.localeCompare(second.nextPaymentDate)
  );

  list.innerHTML = sortedSubscriptions.map((subscription) => {
    const days = daysUntilPaymentFor(subscription.nextPaymentDate);
    const paymentLabel = getDayLabel(days);
    const cycleLabel = subscription.cycle === "yearly" ? "연간 결제" : "월간 결제";
    const monthlyAmount = subscription.cycle === "yearly"
      ? Math.round(subscription.amount / 12)
      : subscription.amount;

    return `
      <article class="subscription-card">
        <div class="subscription-main">
          <span class="service-icon" aria-hidden="true">${getServiceIcon(subscription.name)}</span>
          <div class="service-copy">
            <h3 class="service-name">${escapeHtml(subscription.name)}</h3>
            <div class="service-meta">
              <span class="category-chip">${escapeHtml(subscription.category)}</span>
              <span>${cycleLabel}</span>
              <span>${formatDate(subscription.nextPaymentDate)}</span>
            </div>
          </div>
        </div>
        <div class="subscription-details">
          <div class="service-price">
            <strong>${formatWon(subscription.amount)}</strong>
            <span>월 ${formatWon(monthlyAmount)} 환산</span>
          </div>
          <span class="payment-day${days >= 0 && days <= 7 ? " is-soon" : ""}">${paymentLabel}</span>
          <div class="card-actions">
            <button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(subscription.id)}" aria-label="${escapeHtml(subscription.name)} 수정">수정</button>
            <button class="icon-button delete-button" type="button" data-action="delete" data-id="${escapeHtml(subscription.id)}" aria-label="${escapeHtml(subscription.name)} 삭제">삭제</button>
          </div>
        </div>
      </article>`;
  }).join("");
}

function renderCategories(categoryTotals, monthlyTotal) {
  const list = document.querySelector("#category-list");
  const categories = Object.entries(categoryTotals)
    .sort(([, firstAmount], [, secondAmount]) => secondAmount - firstAmount);

  if (categories.length === 0 || monthlyTotal <= 0) {
    list.innerHTML = '<p class="category-empty">구독을 추가하면 비중을 확인할 수 있어요.</p>';
    return;
  }

  list.innerHTML = categories.map(([category, amount]) => {
    const percentage = Math.round((amount / monthlyTotal) * 100);
    return `
      <div class="category-row">
        <div class="category-heading">
          <span class="category-name">${escapeHtml(category)}</span>
          <span class="category-amount">${formatWon(amount)}</span>
        </div>
        <div class="progress-track" role="progressbar" aria-label="${escapeHtml(category)} 비중" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentage}">
          <div class="progress-bar" style="width: ${percentage}%"></div>
        </div>
        <span class="category-percent">${percentage}%</span>
      </div>`;
  }).join("");
}

window.SubscriptionUI = {
  formatWon,
  renderCategories,
  renderSubscriptions
};
