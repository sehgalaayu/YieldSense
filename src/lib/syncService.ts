import { supabase } from './supabase';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';

// Save FD booking to Supabase
export const saveFDBooking = async (booking: any) => {
  const user = useAuthStore.getState().user;
  if (!user) return; // Not logged in, Zustand persist handles it locally
  
  const { error } = await supabase.from('fd_bookings').insert({
    user_id: user.id,
    fd_id: booking.fdId,
    bank_name: booking.bankName,
    bank_type: booking.bankType,
    amount: booking.amount,
    gross_rate: booking.grossRate,
    tenor_months: booking.tenorMonths,
    booking_date: new Date().toISOString().split('T')[0],
    maturity_date: booking.maturityDate || new Date(Date.now() + booking.tenorMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maturity_amount: booking.maturityAmount || booking.amount * (1 + (booking.grossRate * booking.tenorMonths) / 1200),
    net_maturity_amount: booking.netMaturityAmount || booking.amount * (1 + (booking.grossRate * booking.tenorMonths) / 1200),
    dicgc_insured: booking.dicgcInsured || true,
  });
  
  if (error) console.error('Failed to save FD booking:', error);
};

// Load user's FD bookings from Supabase on login
export const loadFDBookings = async () => {
  const user = useAuthStore.getState().user;
  if (!user) return;
  
  const { data, error } = await supabase
    .from('fd_bookings')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });
  
  if (data && !error) {
    // Map db format to store format
    const bookings = data.map((b: any) => ({
      fdId: b.fd_id,
      bankName: b.bank_name,
      amount: b.amount,
      tenor: b.tenor_months,
      grossRate: b.gross_rate,
      date: b.booking_date,
    }));
    useUserStore.setState({ bookedFDs: bookings });
  }
};

// Save MF holdings to Supabase
export const saveMFHolding = async (holding: any) => {
  const user = useAuthStore.getState().user;
  if (!user) return;
  
  await supabase.from('mf_holdings').insert({
    user_id: user.id,
    fund_id: holding.fundId,
    fund_name: holding.schemeName || holding.shortName || holding.fundId,
    invested_amount: holding.investedAmount,
    holding_period_months: holding.holdingPeriodMonths || 12,
    expense_ratio: holding.expenseRatio,
    annual_saving: holding.annualSaving || null,
    saving_10y: holding.saving10y || null,
  });
};

// Load MF holdings from Supabase on login
export const loadMFHoldings = async () => {
  const user = useAuthStore.getState().user;
  if (!user) return;
  
  const { data } = await supabase
    .from('mf_holdings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (data) {
    const holdings = data.map((h: any) => ({
      fundId: h.fund_id,
      investedAmount: h.invested_amount,
      expenseRatio: h.expense_ratio,
    }));
    // Note: this just restores the basic inputs, we might need to re-run analysis
    // For now we set them to store, then user can hit 'Analyze'
    useUserStore.setState({ mfHoldings: holdings });
  }
};

// Sync profile preferences
export const saveUserProfile = async () => {
  const user = useAuthStore.getState().user;
  const store = useUserStore.getState();
  if (!user) return;
  
  await supabase.from('profiles').upsert({
    id: user.id,
    principal: store.principal,
    tax_slab: store.taxSlab,
    language: store.language,
    goal: store.goal,
    updated_at: new Date().toISOString(),
  });
};
