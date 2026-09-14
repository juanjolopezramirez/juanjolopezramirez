/* Donde esta, mas o menos, quien elige «Segun el sol».

   No se pide la ubicacion: un permiso de ubicacion para cambiar un color
   seria desproporcionado, y quien lo niega se queda sin el modo. El
   navegador ya sabe la zona horaria —«America/Bogota»— y eso basta para
   saber a que hora se pone el sol con unos minutos de margen.

   Cada zona lleva la latitud y la longitud de su ciudad, en grados
   enteros: un grado de longitud son cuatro minutos de sol. Solo las zonas
   de quien lee en estos cinco idiomas y las grandes de fuera; si la zona no
   esta, la cabecera se apaña con el desfase horario (Base.astro).

   Este archivo se baja SOLO la primera vez que alguien elige el modo: el
   resultado se guarda en el navegador y no vuelve a hacer falta. */
const ZONAS = {
  // America hispana
  'America/Bogota': [5, -74], 'America/Mexico_City': [19, -99], 'America/Cancun': [21, -87],
  'America/Merida': [21, -90], 'America/Monterrey': [26, -100], 'America/Chihuahua': [29, -106],
  'America/Mazatlan': [23, -106], 'America/Hermosillo': [29, -111], 'America/Tijuana': [33, -117],
  'America/Guatemala': [15, -91], 'America/El_Salvador': [14, -89], 'America/Tegucigalpa': [14, -87],
  'America/Managua': [12, -86], 'America/Costa_Rica': [10, -84], 'America/Panama': [9, -80],
  'America/Havana': [23, -82], 'America/Santo_Domingo': [18, -70], 'America/Puerto_Rico': [18, -66],
  'America/Caracas': [10, -67], 'America/Guayaquil': [-2, -80], 'America/Lima': [-12, -77],
  'America/La_Paz': [-17, -68], 'America/Santiago': [-33, -71], 'America/Asuncion': [-25, -58],
  'America/Montevideo': [-35, -56], 'America/Argentina/Buenos_Aires': [-35, -58],
  'America/Buenos_Aires': [-35, -58], 'America/Argentina/Cordoba': [-31, -64],
  'America/Argentina/Mendoza': [-33, -69],
  // Brasil
  'America/Sao_Paulo': [-24, -47], 'America/Bahia': [-13, -38], 'America/Recife': [-8, -35],
  'America/Fortaleza': [-4, -39], 'America/Belem': [-1, -48], 'America/Manaus': [-3, -60],
  'America/Cuiaba': [-16, -56], 'America/Campo_Grande': [-20, -55], 'America/Porto_Velho': [-9, -64],
  'America/Rio_Branco': [-10, -68],
  // Norteamerica y el Caribe frances
  'America/New_York': [41, -74], 'America/Detroit': [42, -83], 'America/Chicago': [42, -88],
  'America/Denver': [40, -105], 'America/Phoenix': [33, -112], 'America/Los_Angeles': [34, -118],
  'America/Anchorage': [61, -150], 'Pacific/Honolulu': [21, -158], 'America/Toronto': [44, -79],
  'America/Montreal': [46, -74], 'America/Vancouver': [49, -123], 'America/Edmonton': [54, -113],
  'America/Winnipeg': [50, -97], 'America/Halifax': [45, -64], 'America/Martinique': [15, -61],
  'America/Guadeloupe': [16, -62], 'America/Cayenne': [5, -52],
  // Europa
  'Europe/Madrid': [40, -4], 'Atlantic/Canary': [28, -15], 'Europe/Lisbon': [39, -9],
  'Atlantic/Madeira': [33, -17], 'Atlantic/Azores': [38, -26], 'Europe/London': [52, 0],
  'Europe/Dublin': [53, -6], 'Europe/Paris': [49, 2], 'Europe/Brussels': [51, 4],
  'Europe/Luxembourg': [50, 6], 'Europe/Monaco': [44, 7], 'Europe/Zurich': [47, 9],
  'Europe/Rome': [42, 12], 'Europe/Amsterdam': [52, 5], 'Europe/Berlin': [53, 13],
  'Europe/Vienna': [48, 16], 'Europe/Prague': [50, 14], 'Europe/Warsaw': [52, 21],
  'Europe/Copenhagen': [56, 13], 'Europe/Oslo': [60, 11], 'Europe/Stockholm': [59, 18],
  'Europe/Helsinki': [60, 25], 'Europe/Athens': [38, 24], 'Europe/Bucharest': [44, 26],
  'Europe/Istanbul': [41, 29], 'Europe/Moscow': [56, 38],
  // Africa lusofona y francofona, y las grandes de fuera
  'Africa/Luanda': [-9, 13], 'Africa/Maputo': [-26, 33], 'Africa/Malabo': [4, 9],
  'Africa/Casablanca': [34, -7], 'Africa/Algiers': [37, 3], 'Africa/Tunis': [37, 10],
  'Africa/Dakar': [15, -17], 'Africa/Abidjan': [5, -4], 'Africa/Kinshasa': [-4, 15],
  'Africa/Lagos': [6, 3], 'Africa/Cairo': [30, 31], 'Africa/Nairobi': [-1, 37],
  'Africa/Johannesburg': [-26, 28], 'Indian/Reunion': [-21, 55],
  'Asia/Dubai': [25, 55], 'Asia/Kolkata': [23, 78], 'Asia/Calcutta': [23, 78],
  'Asia/Bangkok': [14, 100], 'Asia/Singapore': [1, 104], 'Asia/Jakarta': [-6, 107],
  'Asia/Shanghai': [31, 121], 'Asia/Hong_Kong': [22, 114], 'Asia/Macau': [22, 114],
  'Asia/Manila': [15, 121], 'Asia/Seoul': [38, 127], 'Asia/Tokyo': [36, 140], 'Asia/Dili': [-9, 126],
  'Australia/Perth': [-32, 116], 'Australia/Melbourne': [-38, 145], 'Australia/Sydney': [-34, 151],
  'Pacific/Auckland': [-37, 175], 'Pacific/Tahiti': [-18, -150]
};

/* «lat,lon» de la zona de este navegador, o null si no esta en la lista. */
export function lugar() {
  try {
    const c = ZONAS[Intl.DateTimeFormat().resolvedOptions().timeZone];
    return c ? c.join(',') : null;
  } catch (e) {
    return null;
  }
}
