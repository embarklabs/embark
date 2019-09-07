const CONTRACT_ID_FACTOR = 1000000;

/**
 * Convert the 2 params as uint32 where the first 4 digits are for contractsId,
 * the followings one are for injectionPoint id
 *
 * @export
 * @param {number} contractId
 * @param {number} injectionPointId
 * @returns a number representing the 2 params as uint32
 */
export function encrypt(contractId: number, injectionPointId: number) {
  return contractId * CONTRACT_ID_FACTOR + injectionPointId;
}

/**
 * Explore the uint32 into contractId, injectionPointId and locationIds where
 * the first 4 digits are for contractsId,
 * the rest are for injectionPoint id
 *
 * @export
 * @param {number} value
 * @returns
 */
export function decrypt(value: number) {
  const contractId = Math.floor(value / CONTRACT_ID_FACTOR);
  const injectionPointId = value - contractId * CONTRACT_ID_FACTOR;

  return {contractId, injectionPointId};
}
