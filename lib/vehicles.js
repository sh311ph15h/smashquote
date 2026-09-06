// Vehicle makes and models seen in the Australian market, aligned to the
// standard AU registry make list (classics and defunct marques included —
// a smash repairer sees plenty of them).
//
// Free text is always allowed: this is a suggestion list, not a whitelist.
// Makes with an empty model list are ones where the marque is worth offering
// but the model range is too obscure or varied to guess at — the model box
// still accepts anything typed.

export const VEHICLE_MODELS = {
  'Abarth': ['595', '695', '124 Spider'],
  'Alfa Romeo': ['Giulia', 'Giulietta', 'Stelvio', 'Tonale', '4C', 'Spider', 'GTV', '156', '159', 'Brera', 'Mito'],
  'Alpina': ['B3', 'B4', 'B5', 'B7', 'D3', 'XD3'],
  'Armstrong': [],
  'Asia Motors': ['Rocsta', 'Topic'],
  'Aston Martin': ['DB9', 'DB11', 'DB12', 'DBS', 'DBX', 'Vantage', 'Vanquish', 'Rapide', 'Virage'],
  'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'TT', 'R8', 'RS3', 'RS6', 'S3', 'S4', 'SQ5'],
  'Austin': ['A30', 'A40', 'A60', '1800', 'Freeway', 'Lancer', 'Kimberley', 'Tasman', 'Maxi', 'Allegro', 'Mini'],
  'Austin Healey': ['100', '3000', 'Sprite'],
  'Australian Classic Car': [],
  'Bedford': ['CF', 'TK', 'KB', 'Rascal'],
  'Bentley': ['Continental GT', 'Continental Flying Spur', 'Flying Spur', 'Bentayga', 'Mulsanne', 'Arnage', 'Azure', 'Brooklands'],
  'Bertone': [],
  'Blade': [],
  'BMC': ['Mini', '1100', '1800'],
  'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z3', 'Z4', 'i3', 'i4', 'i5', 'i7', 'iX', 'iX3', 'M2', 'M3', 'M4', 'M5', 'M8', 'M6'],
  'Bolwell': ['Nagari', 'Mk VII', 'Ikara'],
  'Bugatti': ['Veyron', 'Chiron'],
  'Buick': ['Regal', 'LeSabre', 'Riviera', 'Skylark', 'Century'],
  'BYD': ['Atto 3', 'Dolphin', 'Seal', 'Sealion 6', 'Sealion 7', 'Shark 6'],
  'Cadillac': ['Escalade', 'CTS', 'ATS', 'SRX', 'Seville', 'DeVille', 'Eldorado'],
  'Caterham': ['Seven'],
  'Chery': ['Omoda 5', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'J1', 'J11', 'J3'],
  'Chevrolet': ['Silverado', 'Corvette', 'Camaro', 'Suburban', 'Tahoe', 'Impala', 'Bel Air'],
  'Chrysler': ['300', '300C', 'Grand Voyager', 'Voyager', 'PT Cruiser', 'Sebring', 'Valiant', 'Neon', 'Crossfire'],
  'Citroen': ['C3', 'C4', 'C5', 'C5 Aircross', 'C3 Aircross', 'Berlingo', 'Dispatch', 'DS3', 'DS4', 'Xsara', 'Picasso', 'C2', 'C4 Cactus', 'C4 Aircross', 'C4 Picasso', 'C4 Grand Picasso', 'DS5'],
  'Commer': [],
  'CSV': [],
  'Cupra': ['Formentor', 'Leon', 'Born', 'Ateca', 'Tavascan'],
  'Daewoo': ['Lanos', 'Nubira', 'Leganza', 'Matiz', 'Kalos', 'Musso', 'Korando', 'Cielo', 'Espero', 'Lacetti', 'Tacuma'],
  'Daihatsu': ['Charade', 'Sirion', 'Terios', 'Move', 'Copen', 'YRV', 'Applause', 'Feroza', 'Rocky', 'Delta', 'Hijet', 'Cuore', 'Mira', 'Pyzar'],
  'Daimler': ['Sovereign', 'Double Six', 'Super Eight', 'DS420'],
  'Datsun': ['120Y', '180B', '200B', '240Z', '260Z', '280Z', '1600', 'Bluebird', 'Sunny', 'Stanza'],
  'De Tomaso': ['Pantera', 'Mangusta', 'Deauville'],
  'Dodge': ['Ram 1500', 'Journey', 'Challenger', 'Charger', 'Caliber', 'Nitro', 'Avenger', 'Phoenix'],
  'Elfin': ['MS8', 'Streamliner', 'Clubman'],
  'Eunos': ['30X', '500', '800', 'Cosmo', 'Roadster'],
  'Ferrari': ['488', 'F8', 'Roma', 'Portofino', 'SF90', '296', '812', 'California', '458', 'Purosangue'],
  'Fiat': ['500', '500X', 'Ducato', 'Doblo', 'Punto', 'Bravo', 'Freemont', 'Abarth 595', '124 Spider', '500C', 'Panda'],
  'Ford': ['Ranger', 'Everest', 'Focus', 'Fiesta', 'Mondeo', 'Mustang', 'Escape', 'Puma', 'Transit', 'Transit Custom', 'Territory', 'Falcon', 'Fairmont', 'Fairlane', 'F-150', 'Courier', 'Laser', 'Telstar', 'Explorer', 'Kuga', 'Ecosport', 'Endura', 'Capri', 'Corsair', 'Cortina', 'Econovan', 'Escort', 'F250', 'Festiva', 'Futura', 'KA', 'Maverick', 'Maxi', 'Meteor', 'Taurus'],
  'Ford Performance Vehicles': ['GT', 'F6', 'Pursuit', 'Super Pursuit', 'Force 6', 'Force 8'],
  'Foton': ['Tunland', 'View', 'Aumark', 'Sauvana'],
  'FSM': ['Niki'],
  'Geely': ['EX5', 'Coolray', 'MK', 'LC'],
  'Genesis': ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'],
  'Giocattolo': ['Group B'],
  'Great Wall': ['V200', 'V240', 'X200', 'X240', 'Steed', 'Wingle', 'SA220'],
  'GWM': ['Cannon', 'Cannon Alpha', 'Tank 300', 'Tank 500', 'Haval H6', 'Haval Jolion', 'Ora'],
  'Haval': ['H2', 'H6', 'H8', 'H9', 'Jolion', 'Big Dog'],
  'HDT': ['VC Commodore', 'VH Commodore', 'VK Commodore', 'VL Commodore', 'Director'],
  'Hillman': ['Hunter', 'Minx', 'Imp', 'Gazelle'],
  'Hino': ['300 Series', '500 Series', '700 Series', 'Dutro', 'Ranger'],
  'Holden': ['Commodore', 'Calais', 'Berlina', 'Astra', 'Cruze', 'Colorado', 'Captiva', 'Barina', 'Trax', 'Equinox', 'Ute', 'Monaro', 'Torana', 'Kingswood', 'Statesman', 'Caprice', 'Rodeo', 'Jackaroo', 'Frontera', 'Vectra', 'Viva', 'Epica', 'Zafira', 'Combo', 'Acadia', 'Trailblazer', 'Adventra', 'Apollo', 'Avalanche', 'Barina Spark', 'Belmont', 'Camira', 'Colorado 7', 'Crewman', 'Drover', 'Gemini', 'Insignia', 'Malibu', 'Nova', 'Premier', 'Sandman', 'Spark', 'Sunbird', 'Volt'],
  'Holden Special Vehicles': ['ClubSport', 'ClubSport R8', 'GTS', 'Maloo', 'Senator', 'Grange', 'Avalanche', 'Coupe 4', 'W427', 'SportsCat'],
  'Honda': ['Civic', 'Accord', 'Accord Euro', 'CR-V', 'HR-V', 'Jazz', 'Odyssey', 'ZR-V', 'City', 'Integra', 'Prelude', 'S2000', 'NSX', 'Legend', 'Insight', 'CR-Z'],
  'Humber': ['Super Snipe', 'Vogue', 'Hawk'],
  'Hummer': ['H1', 'H2', 'H3'],
  'Hyundai': ['i20', 'i30', 'i40', 'Accent', 'Elantra', 'Excel', 'Getz', 'Kona', 'Tucson', 'Santa Fe', 'Venue', 'Palisade', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'Staria', 'iLoad', 'iMax', 'Terracan', 'Sonata', 'Veloster', 'Coupe', 'Genesis', 'Grandeur', 'i30cw', 'i45', 'ix35', 'Lantra', 'S Coupe', 'Tiburon', 'Trajet'],
  'Infiniti': ['Q30', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX70', 'QX80', 'FX'],
  'International': ['Acco', 'Scout', 'Harvester'],
  'ISO': ['Grifo', 'Rivolta'],
  'Isuzu': ['D-Max', 'MU-X', 'N Series', 'F Series', 'Bighorn'],
  'Iveco': ['Daily', 'Eurocargo', 'Stralis'],
  'Jaguar': ['XE', 'XF', 'XJ', 'F-Pace', 'E-Pace', 'I-Pace', 'F-Type', 'X-Type', 'S-Type', 'XK', 'XKR', 'E-Type'],
  'Jeep': ['Grand Cherokee', 'Cherokee', 'Wrangler', 'Compass', 'Gladiator', 'Renegade', 'Patriot', 'Commander', 'Avenger'],
  'Jensen': ['Interceptor', 'FF', 'Healey'],
  'JMC': ['Vigus'],
  'Kia': ['Picanto', 'Rio', 'Cerato', 'K4', 'Stinger', 'Seltos', 'Sportage', 'Sorento', 'Carnival', 'EV6', 'EV5', 'EV9', 'Niro', 'Soul', 'Optima', 'Magentis', 'Carens', 'Pregio', 'Tasman', 'Grand Carnival', 'Mentor', 'Pro Ceed', 'Rondo', 'Stonic'],
  'KTM': ['X-Bow'],
  'Lada': ['Niva', 'Samara', 'Cevaro'],
  'Lamborghini': ['Huracan', 'Aventador', 'Urus', 'Gallardo', 'Murcielago', 'Revuelto'],
  'Lancia': ['Delta', 'Beta', 'Fulvia', 'Stratos'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport', 'Range Rover Evoque', 'Range Rover Velar', 'Freelander', 'Series II', 'Series III'],
  'LDV': ['T60', 'D90', 'G10', 'V80', 'Deliver 9', 'eDeliver 9', 'eT60', 'Terron 9'],
  'Lexus': ['IS', 'ES', 'GS', 'LS', 'NX', 'RX', 'UX', 'LX', 'GX', 'RC', 'LC', 'CT', 'RZ', 'LM', 'SC'],
  'Leyland': ['P76', 'Marina', 'Mini', 'Moke'],
  'Lightburn': ['Zeta'],
  'Lincoln': ['Navigator', 'Continental', 'Town Car', 'MKX'],
  'Lotus': ['Elise', 'Exige', 'Evora', 'Emira', 'Eletre', 'Esprit', 'Europa', 'Elan'],
  'Mahindra': ['Pik-Up', 'XUV700', 'Scorpio', 'Genio'],
  'Maserati': ['Ghibli', 'Levante', 'Grecale', 'Quattroporte', 'GranTurismo', 'MC20', '3200 GT'],
  'Maybach': ['57', '62', 'S-Class'],
  'Mazda': ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-8', 'CX-9', 'CX-80', 'CX-90', 'BT-50', 'MX-5', 'MX-30', 'RX-7', 'RX-8', 'Tribute', 'Premacy', 'E2000', '121', '323', '626', '929', 'Bravo', 'CX-7', 'E1600', 'E2200', 'MPV', 'MX-6'],
  'McLaren': ['570S', '600LT', '650S', '720S', '750S', 'Artura', 'GT', 'P1', 'Senna'],
  'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'CLK', 'SLK', 'SLC', 'SL', 'AMG GT', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'GLK', 'G-Class', 'M-Class', 'R-Class', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'CLC-Class', 'GL-Class', 'EQE SUV'],
  'Mercedes-Benz Commercial': ['Sprinter', 'Vito', 'Valente', 'Actros', 'Atego', 'Unimog', 'Citan', 'MB100', 'Viano'],
  'MG': ['MG3', 'MG4', 'MG5', 'ZS', 'ZST', 'ZS EV', 'HS', 'MGB', 'MGA', 'MGF', 'TF', 'Midget', 'Cyberster', 'U9'],
  'Mini': ['Cooper', 'Cooper S', 'Countryman', 'Clubman', 'Paceman', 'Coupe', 'Moke'],
  'Mitsubishi': ['Triton', 'Pajero', 'Pajero Sport', 'Outlander', 'ASX', 'Eclipse Cross', 'Mirage', 'Lancer', 'Magna', 'Verada', 'Express', 'Challenger', 'Colt', 'Galant', 'Sigma', 'Starion', 'i-MiEV', 'Delica', '380', 'Centura', 'Grandis', 'L300', 'Lancer Evolution', 'Nimbus', 'Starwagon'],
  'Morgan': ['Plus 4', 'Plus 6', '4/4', 'Roadster', '3 Wheeler'],
  'Morris': ['Minor', 'Major', '1100', '1500', 'Oxford', 'Marina', 'Mini'],
  'Nissan': ['Navara', 'X-Trail', 'Qashqai', 'Patrol', 'Pathfinder', 'Juke', 'Micra', 'Pulsar', 'Leaf', 'Ariya', '370Z', 'Z', 'GT-R', 'Skyline', 'Silvia', '180SX', '200SX', 'Maxima', 'Murano', 'Dualis', 'Tiida', 'Almera', 'Elgrand', 'Cube', 'Bluebird', '200B', '350Z', 'Altima', 'Nomad', 'NX', 'Pintara', 'Sunny'],
  'Noble': ['M12', 'M600'],
  'NSU': ['Prinz', 'Ro 80'],
  'Opel': ['Astra', 'Corsa', 'Insignia', 'Zafira', 'Combo', 'Mokka'],
  'Pagani': ['Zonda', 'Huayra'],
  'Peugeot': ['208', '308', '508', '2008', '3008', '5008', 'Partner', 'Expert', 'Boxer', 'Landtrek', '206', '207', '307', '407', '306', '308CC', '4007', '4008', '405', '406', 'RCZ'],
  'Polestar': ['Polestar 2', 'Polestar 3', 'Polestar 4'],
  'Pontiac': ['GTO', 'Firebird', 'Trans Am', 'Grand Prix'],
  'Porsche': ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', 'Boxster', 'Cayman', '718', '924', '928', '944', '968'],
  'Proton': ['Satria', 'Persona', 'Jumbuck', 'Gen-2', 'Savvy', 'Preve', 'Exora', 'S16', 'Wira'],
  'RAM': ['1500', '2500', '3500'],
  'Rambler': ['Classic', 'Rebel', 'Hornet', 'Matador'],
  'Renault': ['Clio', 'Megane', 'Koleos', 'Captur', 'Arkana', 'Trafic', 'Master', 'Kangoo', 'Laguna', 'Scenic', 'Fluence', 'Latitude', 'Zoe'],
  'Robnell': [],
  'Rolls-Royce': ['Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan', 'Spectre', 'Silver Shadow', 'Silver Spirit', 'Silver Spur', 'Corniche'],
  'Rover': ['75', '200', '400', '600', '800', 'SD1', 'P5', 'P6', 'Mini'],
  'Saab': ['900', '9-3', '9-5', '99', '9000', '9-7X'],
  'SEAT': ['Ibiza', 'Leon', 'Cordoba', 'Toledo', 'Alhambra'],
  'Simca': ['Aronde', '1300', '1500'],
  'Skoda': ['Fabia', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Scala', 'Enyaq', 'Yeti', 'Roomster', 'Rapid'],
  'Smart': ['ForTwo', 'ForFour', 'Roadster', '#1', '#3'],
  'Ssangyong': ['Musso', 'Korando', 'Rexton', 'Actyon', 'Stavic', 'Kyron', 'Torres', 'Actyon Sports'],
  'Studebaker': ['Lark', 'Hawk', 'Champion', 'Commander'],
  'Subaru': ['Impreza', 'WRX', 'WRX STI', 'Liberty', 'Outback', 'Forester', 'XV', 'Crosstrek', 'BRZ', 'Levorg', 'Solterra', 'Tribeca', 'Brumby', 'Leone', 'Exiga'],
  'Suzuki': ['Swift', 'Baleno', 'Vitara', 'Grand Vitara', 'S-Cross', 'Jimny', 'Ignis', 'Alto', 'Liana', 'SX4', 'Kizashi', 'Carry', 'APV', 'Celerio', 'Sierra'],
  'Tata': ['Xenon', 'Telcoline', 'Safari'],
  'TD 2000': ['Silverstone'],
  'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  'Toyota': ['HiLux', 'LandCruiser', 'LandCruiser Prado', 'Corolla', 'Camry', 'RAV4', 'Yaris', 'Yaris Cross', 'Kluger', 'Fortuner', 'C-HR', 'HiAce', 'Granvia', 'Supra', '86', 'GR86', 'GR Yaris', 'GR Corolla', 'Aurion', 'Avalon', 'Echo', 'Celica', 'MR2', 'Starlet', 'Tarago', 'Rukus', 'Coaster', 'Dyna', 'Townace', 'Spacia', 'Crown', 'Cressida', 'Corona', 'Lexcen', '4 Runner', 'Avensis', 'Corolla Cross', 'FJ Cruiser', 'Lite Ace', 'Paseo', 'Prius', 'Prius c'],
  'TRD': ['Aurion', 'HiLux'],
  'Triumph': ['TR4', 'TR6', 'TR7', 'TR8', 'Spitfire', 'Stag', 'Herald', '2000', 'Dolomite', 'GT6'],
  'TVR': ['Griffith', 'Chimaera', 'Tuscan', 'Cerbera', 'Sagaris'],
  'Valiant': ['Charger', 'Regal', 'Pacer', 'Safari', 'VIP', 'Ranger', 'CL', 'CM', 'VJ', 'VK'],
  'Vanden Plas': ['Princess', '1500'],
  'Vauxhall': ['Viva', 'Victor', 'Astra', 'Cavalier', 'Vectra'],
  'Volkswagen': ['Polo', 'Golf', 'Passat', 'Jetta', 'Tiguan', 'Touareg', 'T-Cross', 'T-Roc', 'Amarok', 'Transporter', 'Caddy', 'Crafter', 'Multivan', 'ID.4', 'ID.5', 'ID. Buzz', 'Beetle', 'Kombi', 'Bora', 'Eos', 'Scirocco', 'Touran', 'Up!', 'Arteon', 'Caravelle', 'Passat CC', 'Tiguan Allspace', 'Superbug', '1500/1600'],
  'Volvo': ['S40', 'S60', 'S90', 'V40', 'V60', 'V90', 'XC40', 'XC60', 'XC70', 'XC90', 'EX30', 'EX40', 'EX90', 'C40', 'C30', '240', '740', '850', '940'],
  'Wolseley': ['1500', '6/80', '24/80', 'Hornet'],
  'ZX Auto': ['Grand Tiger', 'Admiral'],
  'Range Rover': ['Evoque', 'Sport', 'Vogue', 'Velar'],
  'XPENG': ['G6', 'G9', 'X9'],
};

export const VEHICLE_MAKES = Object.keys(VEHICLE_MODELS).sort((a, b) => a.localeCompare(b));

// Models for a make, tolerant of case, punctuation and stray whitespace — so
// registry-style values ("MERCEDES-BENZ", "M.G.") still resolve to our entry.
const normalise = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const BY_KEY = new Map(VEHICLE_MAKES.map(m => [normalise(m), m]));

// Registry spellings that should land on an existing entry rather than a
// near-duplicate row in the dropdown.
const ALIASES = {
  'mg': 'MG',                                  // "M.G."
  'rollsroyce': 'Rolls-Royce',                 // "ROLLS ROYCE" / "ROLLS-ROYCE"
  'greatwallmotors': 'GWM',
  'mercedesbenzcommercial': 'Mercedes-Benz Commercial',
  'mercedesbenz': 'Mercedes-Benz',
  'mercedesbenzcommercial': 'Mercedes-Benz Commercial',
  'rangerover': 'Range Rover',
  'greatwall': 'Great Wall',
  'xpeng': 'XPENG',
};

export function canonicalMake(make) {
  if (!make) return '';
  const k = normalise(make);
  return ALIASES[k] || BY_KEY.get(k) || String(make).trim();
}

export function modelsForMake(make) {
  if (!make) return [];
  const k = normalise(make);
  const key = ALIASES[k] || BY_KEY.get(k);
  return key ? (VEHICLE_MODELS[key] || []) : [];
}
