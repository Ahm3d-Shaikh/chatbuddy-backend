export const calculateDiscountedPrice = (price: any, percent: any) =>
  (price - (percent / 100) * price).toFixed(2);

export const getPriceIdToUpdate = (mode: any, percent: any, priceId: any) => {
  if (mode === 'month' && (!percent || percent === 0)) {
    return { monthly_plan_price_id: priceId };
  } else if (mode === 'month' && percent) {
    return { discounted_price_id: priceId };
  } else if (mode === 'year' && (!percent || percent === 0)) {
    return { yearly_plan_price_id: priceId };
  } else if (mode === 'year' && percent) {
    return { yearly_discounted_price_id: priceId };
  }
  return {};
};
export const getSpecificPrice = (mode: any, percent: any, plan_data: any) => {
  let checkPriceId;
  if (mode === 'month' && (!percent || percent === 0)) {
    return (checkPriceId = plan_data.monthly_plan_price_id);
  } else if (mode === 'month' && percent) {
    return (checkPriceId = plan_data.discounted_price_id);
  } else if (mode === 'year' && (!percent || percent === 0)) {
    return (checkPriceId = plan_data.yearly_plan_price_id);
  } else if (mode === 'year' && percent) {
    return (checkPriceId = plan_data.yearly_discounted_price_id);
  }
  return {};
};
