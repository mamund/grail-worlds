// This is domain/application state. It is deliberately separate from GRAIL worldstate.
// The published CLI starts a fresh process for each run.
const db = { onboarding: null, customer: null };

function required(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required`);
  return value.trim();
}
function currentOnboarding(id) {
  if (!db.onboarding || db.onboarding.id !== id) throw new Error('Unknown onboarding');
  return db.onboarding;
}
function currentCustomer(id) {
  if (!db.customer || db.customer.id !== id) throw new Error('Unknown customer');
  return db.customer;
}

export async function startOnboarding({ name }) {
  const cleanName = required(name, 'name');
  db.onboarding = { id: 'ONB-100', name: cleanName, complete: false };
  return { onboardingId: db.onboarding.id };
}

export async function createCustomerProfile({ onboardingId }) {
  const onboarding = currentOnboarding(onboardingId);
  db.customer = {
    id: 'CUS-100', name: onboarding.name, email: null, phone: null,
    address: null, emailVerified: false, phoneVerified: false,
    termsVersion: null
  };
  return { customerId: db.customer.id };
}

// One capability establishes three declared effects. The returned identifiers
// are domain data captured in observations for downstream verification.
export async function setCustomerDetails({ customerId, email, phone, address }) {
  const customer = currentCustomer(customerId);
  const nextEmail = required(email, 'email');
  const nextPhone = required(phone, 'phone');
  const nextAddress = required(address, 'address');
  if (customer.email !== nextEmail) customer.emailVerified = false;
  if (customer.phone !== nextPhone) customer.phoneVerified = false;
  customer.email = nextEmail;
  customer.phone = nextPhone;
  customer.address = nextAddress;
  return { emailVerificationId: 'EMAIL-100', phoneVerificationId: 'PHONE-100' };
}

export async function verifyCustomerEmail({ customerId, emailVerificationId }) {
  const customer = currentCustomer(customerId);
  if (!customer.email || emailVerificationId !== 'EMAIL-100') throw new Error('Email verification unavailable');
  customer.emailVerified = true;
  return { verifiedEmail: customer.email };
}

export async function verifyCustomerPhone({ customerId, phoneVerificationId }) {
  const customer = currentCustomer(customerId);
  if (!customer.phone || phoneVerificationId !== 'PHONE-100') throw new Error('Phone verification unavailable');
  customer.phoneVerified = true;
  return { verifiedPhone: customer.phone };
}

export async function acceptTerms({ customerId, termsVersion }) {
  const customer = currentCustomer(customerId);
  customer.termsVersion = required(termsVersion, 'termsVersion');
  return { acceptedTermsVersion: customer.termsVersion };
}

export async function onboardCustomer({ onboardingId, customerId }) {
  const onboarding = currentOnboarding(onboardingId);
  const customer = currentCustomer(customerId);
  if (!customer.emailVerified || !customer.phoneVerified || !customer.address || !customer.termsVersion) {
    throw new Error('Onboarding responsibilities remain incomplete');
  }
  onboarding.complete = true;
  return { customerId, onboardingId, status: 'onboarded', customerName: customer.name };
}

// These providers are intentionally unavailable. A FAIL excludes this
// affordance for the current pursuit; another producer may still succeed.
export async function verifyEmailUnavailable() {
  throw new Error('Email verification provider is unavailable');
}

export async function onboardCustomerUnavailable() {
  throw new Error('Primary onboarding provider is unavailable');
}
