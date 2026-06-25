function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.style.display = 'none');
  document.querySelector(`#tab-${name}`).style.display = 'block';

  document.querySelectorAll('.admin-tabs button')
    .forEach(b => b.classList.remove('active'));

  const activeBtn = Array.from(document.querySelectorAll('.admin-tabs button'))
    .find(b => b.dataset.tab === name);

  if (activeBtn) activeBtn.classList.add('active');

  // Auto-load tab data
  switch (name) {
    case 'analytics': Admin.loadAnalytics(); break;
    case 'profiles': Admin.loadProfiles(); break;
    case 'products': Admin.loadProducts(); break;
    case 'orders': Admin.loadOrders(); break;
    case 'payouts': Admin.loadPayouts(); break;
  }
}

document.addEventListener('DOMContentLoaded', () => showTab('analytics'));
