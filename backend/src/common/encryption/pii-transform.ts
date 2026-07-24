export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar || aadhaar.length < 4) return aadhaar;
  return `XXXX XXXX ${aadhaar.slice(-4)}`;
}

export function maskPan(pan: string): string {
  if (!pan || pan.length < 4) return pan;
  return `XXXXX${pan.slice(-5)}`;
}

export function maskBankAccount(account: string): string {
  if (!account || account.length < 4) return account;
  return `XXXXXX${account.slice(-4)}`;
}

export function maskUpi(upi: string): string {
  if (!upi) return upi;
  const [name, provider] = upi.split('@');
  if (!name) return upi;
  const masked =
    name.length <= 2
      ? name[0] + '*'
      : name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  return `${masked}@${provider || ''}`;
}
