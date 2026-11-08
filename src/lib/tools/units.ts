export interface Unit { id: string; label: string; name: string; f: number }
export interface Category { id: string; label: string; units: Unit[]; temperature?: boolean }

const u = (id: string, label: string, name: string, f: number): Unit => ({ id, label, name, f });

export const categories: Category[] = [
  { id: 'length', label: 'Length', units: [
    u('mm', 'mm', 'Millimeters', 0.001), u('cm', 'cm', 'Centimeters', 0.01), u('m', 'm', 'Meters', 1), u('km', 'km', 'Kilometers', 1000),
    u('in', 'in', 'Inches', 0.0254), u('ft', 'ft', 'Feet', 0.3048), u('yd', 'yd', 'Yards', 0.9144), u('mi', 'mi', 'Miles', 1609.344), u('nmi', 'nmi', 'Nautical miles', 1852),
  ] },
  { id: 'mass', label: 'Weight', units: [
    u('mg', 'mg', 'Milligrams', 1e-6), u('g', 'g', 'Grams', 0.001), u('kg', 'kg', 'Kilograms', 1), u('t', 't', 'Metric tonnes', 1000),
    u('oz', 'oz', 'Ounces', 0.028349523125), u('lb', 'lb', 'Pounds', 0.45359237), u('st', 'st', 'Stone', 6.35029318),
  ] },
  { id: 'volume', label: 'Volume', units: [
    u('ml', 'mL', 'Milliliters', 0.001), u('l', 'L', 'Liters', 1), u('m3', 'm³', 'Cubic meters', 1000),
    u('tsp', 'tsp', 'Teaspoons (US)', 0.00492892159375), u('tbsp', 'tbsp', 'Tablespoons (US)', 0.01478676478125),
    u('floz', 'fl oz', 'Fluid ounces (US)', 0.0295735295625), u('cup', 'cup', 'Cups (US)', 0.2365882365), u('pt', 'pt', 'Pints (US)', 0.473176473),
    u('qt', 'qt', 'Quarts (US)', 0.946352946), u('gal', 'gal', 'Gallons (US)', 3.785411784), u('galuk', 'gal UK', 'Gallons (UK)', 4.54609),
  ] },
  { id: 'area', label: 'Area', units: [
    u('mm2', 'mm²', 'Square millimeters', 1e-6), u('cm2', 'cm²', 'Square centimeters', 1e-4), u('m2', 'm²', 'Square meters', 1), u('ha', 'ha', 'Hectares', 1e4),
    u('km2', 'km²', 'Square kilometers', 1e6), u('in2', 'in²', 'Square inches', 0.00064516), u('ft2', 'ft²', 'Square feet', 0.09290304),
    u('yd2', 'yd²', 'Square yards', 0.83612736), u('ac', 'ac', 'Acres', 4046.8564224), u('mi2', 'mi²', 'Square miles', 2589988.110336),
  ] },
  { id: 'temp', label: 'Temperature', temperature: true, units: [u('c', '°C', 'Celsius', 1), u('f', '°F', 'Fahrenheit', 1), u('k', 'K', 'Kelvin', 1)] },
  { id: 'speed', label: 'Speed', units: [
    u('ms', 'm/s', 'Meters per second', 1), u('kmh', 'km/h', 'Kilometers per hour', 1 / 3.6), u('mph', 'mph', 'Miles per hour', 0.44704),
    u('kn', 'kn', 'Knots', 1852 / 3600), u('fts', 'ft/s', 'Feet per second', 0.3048),
  ] },
  { id: 'time', label: 'Time', units: [
    u('ms', 'ms', 'Milliseconds', 0.001), u('s', 's', 'Seconds', 1), u('min', 'min', 'Minutes', 60), u('h', 'h', 'Hours', 3600),
    u('d', 'd', 'Days', 86400), u('wk', 'wk', 'Weeks', 604800), u('mo', 'mo', 'Months (avg)', 2629800), u('yr', 'yr', 'Years (365.25 d)', 31557600),
  ] },
  { id: 'data', label: 'Data', units: [
    u('bit', 'bit', 'Bits', 0.125), u('B', 'B', 'Bytes', 1), u('KB', 'KB', 'Kilobytes (1000)', 1e3), u('MB', 'MB', 'Megabytes (1000²)', 1e6),
    u('GB', 'GB', 'Gigabytes (1000³)', 1e9), u('TB', 'TB', 'Terabytes (1000⁴)', 1e12),
    u('KiB', 'KiB', 'Kibibytes (1024)', 1024), u('MiB', 'MiB', 'Mebibytes (1024²)', 1024 ** 2), u('GiB', 'GiB', 'Gibibytes (1024³)', 1024 ** 3), u('TiB', 'TiB', 'Tebibytes (1024⁴)', 1024 ** 4),
  ] },
  { id: 'pressure', label: 'Pressure', units: [
    u('Pa', 'Pa', 'Pascals', 1), u('kPa', 'kPa', 'Kilopascals', 1e3), u('bar', 'bar', 'Bar', 1e5), u('atm', 'atm', 'Atmospheres', 101325),
    u('psi', 'psi', 'PSI', 6894.757293168), u('mmHg', 'mmHg', 'mmHg', 133.322387415),
  ] },
  { id: 'energy', label: 'Energy', units: [
    u('J', 'J', 'Joules', 1), u('kJ', 'kJ', 'Kilojoules', 1e3), u('cal', 'cal', 'Calories', 4.184), u('kcal', 'kcal', 'Kilocalories', 4184),
    u('Wh', 'Wh', 'Watt-hours', 3600), u('kWh', 'kWh', 'Kilowatt-hours', 3.6e6), u('BTU', 'BTU', 'BTU', 1055.05585262),
  ] },
];

function tempToC(v: number, id: string) { return id === 'f' ? (v - 32) * 5 / 9 : id === 'k' ? v - 273.15 : v; }
function cToTemp(c: number, id: string) { return id === 'f' ? c * 9 / 5 + 32 : id === 'k' ? c + 273.15 : c; }

export function convert(value: number, from: string, to: string, cat: Category): number {
  if (cat.temperature) return cToTemp(tempToC(value, from), to);
  const a = cat.units.find((x) => x.id === from)!, b = cat.units.find((x) => x.id === to)!;
  return (value * a.f) / b.f;
}

/** 10 significant digits, no trailing zeros, exponent only for very large or small values. */
export function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-6) return n.toExponential(6).replace(/\.?0+e/, 'e');
  const s = Number(n.toPrecision(10)).toString();
  const [i, d] = s.split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : '');
}
