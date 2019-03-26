import Units from 'ethereumjs-units';

const UNITS = [
  { key: 'wei', name: 'Wei' },
  { key: 'kwei', name: 'KWei' },
  { key: 'mwei', name: 'MWei' },
  { key: 'gwei', name: 'Gwei / Szabo' },
  { key: 'finney', name: 'PWei / Finney' },
  { key: 'ether', name: 'Ether' },
  { key: 'kether', name: 'KEther' },
  { key: 'mether', name: 'MEther' },
  { key: 'gether', name: 'GEther' },
  { key: 'tether', name: 'TEther' }
];

const safeConvert = (value, from, to) => {
  try {
    value = Units.convert(value, from, to);
  } catch (e) {
    value = '';
  }
  return value;
};


export const calculateUnits = (value, from) => {
  return UNITS.map((unit) => {
    unit.value = safeConvert(value, from, unit.key);
    return unit;
  });
};
