
function getMonthlyAmount(subscription) {
    return subscription.cycle === "yearly"
        ? Math.round(subscription.amount / 12)
        : subscription.amount;
}

function getMonthlyTotal(subscriptions) {
    return subscriptions.reduce(
        (total, subscription) => total + getMonthlyAmount(subscription),
        0
    );
}

function getAnnualTotal(subscriptions) {
    return getMonthlyTotal(subscriptions) * 12;
}

function getDaysUntilPayment(today, paymentDate) {
    const todayUtc = Date.parse(`${today}T00:00:00Z`);
    const paymentUtc = Date.parse(`${paymentDate}T00:00:00Z`);
    return Math.round((paymentUtc - todayUtc) / 86400000);
}

function getUpcomingSubscriptions(subscriptions, today, days) {
    return subscriptions.filter((subscription) => {
        const daysUntilPayment = getDaysUntilPayment(
            today,
            subscription.nextPaymentDate
        );
        return daysUntilPayment >= 0 && daysUntilPayment <= days;
    });
}

function getMonthlyTotalsByCategory(subscriptions) {
    return subscriptions.reduce((totals, subscription) => {
        const category = subscription.category;
        totals[category] =
            (totals[category] ?? 0) + getMonthlyAmount(subscription);
        return totals;
    }, {});
}

// 테스트 데이터
const testData = [
 {name:"넷플릭스",  amount:13500, cycle:"monthly",
  nextPaymentDate:"2026-08-16", category:"영상"},
 {name:"스포티파이",amount:10900, cycle:"monthly",
  nextPaymentDate:"2026-08-20", category:"음악"},
 {name:"헬스장",    amount:45000, cycle:"monthly",
  nextPaymentDate:"2026-09-01", category:"운동"},
 {name:"클라우드",  amount:120000,cycle:"yearly",
  nextPaymentDate:"2027-02-01", category:"생산성"}
];

// 콘솔 출력
console.log("월 합계:", getMonthlyTotal(testData));
console.log("연 합계:", getAnnualTotal(testData));
console.log("카테고리별(월):", getMonthlyTotalsByCategory(testData));

// 다른 파일에서도 사용할 수 있도록 내보내기
module.exports = {
    getMonthlyAmount,
    getMonthlyTotal,
    getAnnualTotal,
    getDaysUntilPayment,
    getUpcomingSubscriptions,
    getMonthlyTotalsByCategory
};
