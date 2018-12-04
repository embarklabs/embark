const CONTRACT_ID_FACTOR = 100000000;
const INJECTION_POINT_ID_FACTOR = 10000;

/**
 * Convert the 3 params as uint32 where the first 2 digits are for contractsId,
 * the next 3 digit are for injectionPoint id and the rest if for the locationIds
 *
 * @export
 * @param {number} contractId
 * @param {number} injectionPointId
 * @param {number} [locationIdx]
 * @returns a number representing the 3 params as uint32
 */
export function encrypt(contractId: number, injectionPointId: number, locationIdx?: number) {
  return contractId * CONTRACT_ID_FACTOR + injectionPointId * INJECTION_POINT_ID_FACTOR + (locationIdx || 0);
}

/**
 * Explore the uint32 into contractId, injectionPointId and locationIds where
 * the first 2 digits are for contractsId,
 * the next 3 digit are for injectionPoint id and the rest if for the locationIds
 *
 * @export
 * @param {number} value
 * @returns
 */
export function decrypt(value: number) {
  const contractId = Math.floor(value / CONTRACT_ID_FACTOR);
  const injectionPointId = Math.floor(value / INJECTION_POINT_ID_FACTOR) - contractId * INJECTION_POINT_ID_FACTOR;
  const locationIdx = value - contractId * CONTRACT_ID_FACTOR - injectionPointId * INJECTION_POINT_ID_FACTOR;

  return {contractId, injectionPointId, locationIdx};
}
