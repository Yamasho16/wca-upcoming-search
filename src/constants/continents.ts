const AFRICA = [
  "DZ","AO","BJ","BW","BF","BI","CM","CV","CF","TD","KM","CG","CD","CI","DJ","EG","GQ","ER","SZ","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG","MW","ML","MR","MU","YT","MA","MZ","NA","NE","NG","RE","RW","SH","ST","SN","SC","SL","SO","ZA","SS","SD","TZ","TG","TN","UG","EH","ZM","ZW",
];

const ASIA = [
  "AF","AM","AZ","BH","BD","BT","BN","KH","CN","CX","CC","CY","GE","HK","IN","ID","IR","IQ","IL","JP","JO","KZ","KW","KG","LA","LB","MO","MY","MV","MN","MM","NP","KP","OM","PK","PS","PH","QA","SA","SG","KR","LK","SY","TW","TJ","TH","TL","TR","TM","AE","UZ","VN","YE",
];

const EUROPE = [
  "AX","AL","AD","AT","BY","BE","BA","BG","HR","CZ","DK","EE","FO","FI","FR","DE","GI","GR","GG","VA","HU","IS","IE","IM","IT","JE","XK","LV","LI","LT","LU","MT","MD","MC","ME","NL","MK","NO","PL","PT","RO","RU","SM","RS","SK","SI","ES","SJ","SE","CH","UA","GB",
];

const NORTH_AMERICA = [
  "AI","AG","AW","BS","BB","BZ","BM","BQ","VG","CA","KY","CR","CU","CW","DM","DO","SV","GL","GD","GP","GT","HT","HN","JM","MQ","MX","MS","NI","PA","PR","BL","KN","LC","MF","PM","VC","SX","TT","TC","VI","US",
];

const OCEANIA = [
  "AS","AU","CK","FJ","PF","GU","KI","MH","FM","NR","NC","NZ","NU","NF","MP","PW","PG","PN","WS","SB","TK","TO","TV","UM","VU","WF",
];

const SOUTH_AMERICA = [
  "AR","BO","BV","BR","CL","CO","EC","FK","GF","GY","PY","PE","GS","SR","UY","VE",
];

const CONTINENT_BY_ISO2 = new Map<string, string>();

for (const iso2 of AFRICA) CONTINENT_BY_ISO2.set(iso2, "Africa");
for (const iso2 of ASIA) CONTINENT_BY_ISO2.set(iso2, "Asia");
for (const iso2 of EUROPE) CONTINENT_BY_ISO2.set(iso2, "Europe");
for (const iso2 of NORTH_AMERICA) CONTINENT_BY_ISO2.set(iso2, "North America");
for (const iso2 of OCEANIA) CONTINENT_BY_ISO2.set(iso2, "Oceania");
for (const iso2 of SOUTH_AMERICA) CONTINENT_BY_ISO2.set(iso2, "South America");

export function getContinentFromCountryIso2(countryIso2: string): string {
  return CONTINENT_BY_ISO2.get(countryIso2.toUpperCase()) || "Unknown";
}
