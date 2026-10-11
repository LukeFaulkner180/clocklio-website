const pricing = [
  {
    name: 'Starter',
    band: 'Up to 5 employees',
    summary: 'A complete workforce workspace for small teams.',
    employeeLimit: 5,
    annualPrice: 299.99,
  },
  {
    name: 'Team',
    band: 'Up to 15 employees',
    summary: 'Room for a growing team and a busier rota.',
    employeeLimit: 15,
    annualPrice: 649.99,
  },
  {
    name: 'Business',
    band: 'Up to 30 employees',
    summary: 'More headroom for established teams.',
    employeeLimit: 30,
    annualPrice: 1149.99,
  },
  {
    name: 'Scale',
    band: 'Up to 50 employees',
    summary: 'Support for larger, multi-role teams.',
    employeeLimit: 50,
    annualPrice: 1899.99,
  },
]

const formatPrice = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
})

const pricingGrid = document.querySelector('[data-pricing-grid]')
if (pricingGrid) {
  pricingGrid.innerHTML = pricing.map((plan) => `
    <article class="pricing-card">
      <span class="pricing-card-kicker">${plan.name.toUpperCase()}</span>
      <h3>${plan.band}</h3>
      <p class="pricing-card-summary">${plan.summary}</p>
      <div class="pricing-amount"><strong>${formatPrice.format(plan.annualPrice)}</strong><span>per year</span></div>
      <div class="pricing-card-rule"></div>
      <ul>
        <li><span>✓</span> All ClockLio workforce features</li>
        <li><span>✓</span> Up to ${plan.employeeLimit} active employees</li>
        <li><span>✓</span> Manager accounts included</li>
      </ul>
    </article>
  `).join('')
}

const appUrl = document.querySelector('meta[name="clocklio-app-url"]')?.content?.trim()
if (appUrl) {
  document.querySelectorAll('a[href="https://clocklio.pages.dev/"]').forEach((link) => {
    link.href = appUrl
  })
}

const toggle = document.querySelector('.menu-toggle')
const nav = document.querySelector('.site-nav')
toggle?.addEventListener('click', () => {
  const isOpen = toggle.getAttribute('aria-expanded') === 'true'
  toggle.setAttribute('aria-expanded', String(!isOpen))
  toggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation')
  nav?.classList.toggle('is-open', !isOpen)
})

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    toggle?.setAttribute('aria-expanded', 'false')
    toggle?.setAttribute('aria-label', 'Open navigation')
    nav.classList.remove('is-open')
  })
})
