const ZERO_ADDRESS_SHORTHAND_REGEX = /^0x0$/;
const ZERO_ADDRESS_SHORTHAND_SEARCH_REGEX = /'0x0'/g;
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function extendZeroAddressShorthand(value: string) {
  if (value.match(ZERO_ADDRESS_SHORTHAND_REGEX) !== null) {
    return ZERO_ADDRESS;
  }
  return value;
}

export function replaceZeroAddressShorthand(value: string) {
  return value.replace(ZERO_ADDRESS_SHORTHAND_SEARCH_REGEX, `'${ZERO_ADDRESS}'`);
}
