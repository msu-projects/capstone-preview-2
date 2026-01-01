import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface CSVRow {
	no: string;
	coding: string;
	municipality: string;
	barangay: string;
	sitio: string;
	latitude: string;
	longitude: string;
	male: string;
	female: string;
	total: string;
	age_0_14: string;
	age_15_64: string;
	age_65_above: string;
	households: string;
	registered_voters: string;
	philhealth: string;
	fourps: string;
	employment1: string;
	employment2: string;
	employment3: string;
	income1: string;
	income2: string;
	income3: string;
	farmers: string;
	farmer_assoc: string;
	farm_area: string;
	crop1: string;
	crop2: string;
	crop3: string;
	crop4: string;
	crop5: string;
	water_systems: string;
	water_source1: string;
	water_condition1: string;
	water_source2: string;
	water_condition2: string;
	water_source3: string;
	water_condition3: string;
	no_toilet: string;
	toilet_open_pit: string;
	toilet_closed_pit: string;
	toilet_overhang: string;
	toilet_water_sealed: string;
	waste_segregation: string;
	pig: string;
	cow: string;
	kalabaw: string;
	horse: string;
	goat: string;
	chicken: string;
	ducks: string;
	backyard_garden: string;
	garden_veg: string;
	garden_root: string;
	garden_fruit: string;
	house_concrete: string;
	house_wood: string;
	house_half_conc: string;
	house_makeshift: string;
	house_others: string;
	house_owned: string;
	house_rented: string;
	house_prot_land: string;
	house_informal: string;
	house_owner_consent: string;
	dogs: string;
	cats: string;
	dogs_vaccinated: string;
	cats_vaccinated: string;
	sectoral_orgs: string;
	info_radio: string;
	info_signages: string;
	info_person_auth: string;
	info_assembly: string;
	info_newspaper: string;
	info_tv: string;
	info_internet: string;
	transport_bike: string;
	transport_motor: string;
	transport_tricycle: string;
	transport_4wheels: string;
	transport_boat: string;
	electricity: string;
	alt_generator: string;
	alt_solar: string;
	alt_battery: string;
}

function parseCoordinate(coord: string): number | null {
	if (!coord || coord.trim() === '') return null;

	// Handle DMS format like: 6°24'4.94"N or 124°49'56.79"E
	const dmsMatch = coord.match(/(\d+)°(\d+)'([\d.]+)"([NSEW])/);
	if (dmsMatch) {
		const degrees = parseFloat(dmsMatch[1]);
		const minutes = parseFloat(dmsMatch[2]);
		const seconds = parseFloat(dmsMatch[3]);
		const direction = dmsMatch[4];

		let decimal = degrees + minutes / 60 + seconds / 3600;
		if (direction === 'S' || direction === 'W') {
			decimal = -decimal;
		}
		return decimal;
	}

	// Try parsing as decimal
	const num = parseFloat(coord);
	return isNaN(num) ? null : num;
}

function parseNumber(value: string): number {
	if (!value || value.trim() === '' || value === 'None' || value === 'NONE') return 0;
	const num = parseFloat(value.replace(/,/g, ''));
	return isNaN(num) ? 0 : num;
}

function parseBoolean(value: string): boolean | null {
	if (!value || value.trim() === '') return null;
	const v = value.toLowerCase().trim();
	if (v === 'yes' || v === 'true' || v === '✔️') return true;
	if (v === 'no' || v === 'false') return false;
	return null;
}

function parseArray(values: string[]): string[] {
	return values
		.filter((v) => v && v.trim() !== '' && v.trim() !== 'None' && v.trim() !== 'NONE')
		.map((v) => v.trim());
}

function parseCSV(csvPath: string): CSVRow[] {
	const content = readFileSync(csvPath, 'utf-8');
	const lines = content.split('\n');

	// Skip first 4 header rows, get actual data starting from row 5 (index 4)
	const dataRows = lines.slice(4).filter((line) => line.trim() !== '');

	const rows: CSVRow[] = [];

	for (const line of dataRows) {
		// Use a more sophisticated CSV parser that handles commas in fields
		const cols: string[] = [];
		let current = '';
		let inQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			const nextChar = line[i + 1];

			if (char === '"' && nextChar === '"') {
				// Escaped quote
				current += '"';
				i++; // Skip next quote
			} else if (char === '"') {
				// Toggle quote mode
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				// Field separator
				cols.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		cols.push(current.trim()); // Add last field

		// Skip empty rows or rows without sitio name or municipality
		if (cols.length < 5 || !cols[4] || cols[4].trim() === '' || !cols[2] || cols[2].trim() === '') {
			continue;
		}

		// Skip rows where total population is 0 (incomplete data)
		const total = parseFloat(cols[9]);
		if (isNaN(total) || total === 0) {
			continue;
		}

		rows.push({
			no: cols[0] || '',
			coding: cols[1] || '',
			municipality: cols[2] || '',
			barangay: cols[3] || '',
			sitio: cols[4] || '',
			latitude: cols[5] || '',
			longitude: cols[6] || '',
			male: cols[7] || '',
			female: cols[8] || '',
			total: cols[9] || '',
			age_0_14: cols[10] || '',
			age_15_64: cols[11] || '',
			age_65_above: cols[12] || '',
			households: cols[13] || '',
			registered_voters: cols[14] || '',
			philhealth: cols[15] || '',
			fourps: cols[16] || '',
			employment1: cols[17] || '',
			employment2: cols[18] || '',
			employment3: cols[19] || '',
			income1: cols[20] || '',
			income2: cols[21] || '',
			income3: cols[22] || '',
			farmers: cols[23] || '',
			farmer_assoc: cols[24] || '',
			farm_area: cols[25] || '',
			crop1: cols[26] || '',
			crop2: cols[27] || '',
			crop3: cols[28] || '',
			crop4: cols[29] || '',
			crop5: cols[30] || '',
			water_systems: cols[31] || '',
			water_source1: cols[32] || '',
			water_condition1: cols[33] || '',
			water_source2: cols[34] || '',
			water_condition2: cols[35] || '',
			water_source3: cols[36] || '',
			water_condition3: cols[37] || '',
			no_toilet: cols[38] || '',
			toilet_open_pit: cols[39] || '',
			toilet_closed_pit: cols[40] || '',
			toilet_overhang: cols[41] || '',
			toilet_water_sealed: cols[42] || '',
			waste_segregation: cols[43] || '',
			pig: cols[44] || '',
			cow: cols[45] || '',
			kalabaw: cols[46] || '',
			horse: cols[47] || '',
			goat: cols[48] || '',
			chicken: cols[49] || '',
			ducks: cols[50] || '',
			backyard_garden: cols[51] || '',
			garden_veg: cols[52] || '',
			garden_root: cols[53] || '',
			garden_fruit: cols[54] || '',
			house_concrete: cols[55] || '',
			house_wood: cols[56] || '',
			house_half_conc: cols[57] || '',
			house_makeshift: cols[58] || '',
			house_others: cols[59] || '',
			house_owned: cols[60] || '',
			house_rented: cols[61] || '',
			house_prot_land: cols[62] || '',
			house_informal: cols[63] || '',
			house_owner_consent: cols[64] || '',
			dogs: cols[65] || '',
			cats: cols[66] || '',
			dogs_vaccinated: cols[67] || '',
			cats_vaccinated: cols[68] || '',
			sectoral_orgs: cols[69] || '',
			info_radio: cols[70] || '',
			info_signages: cols[71] || '',
			info_person_auth: cols[72] || '',
			info_assembly: cols[73] || '',
			info_newspaper: cols[74] || '',
			info_tv: cols[75] || '',
			info_internet: cols[76] || '',
			transport_bike: cols[77] || '',
			transport_motor: cols[78] || '',
			transport_tricycle: cols[79] || '',
			transport_4wheels: cols[80] || '',
			transport_boat: cols[81] || '',
			electricity: cols[82] || '',
			alt_generator: cols[83] || '',
			alt_solar: cols[84] || '',
			alt_battery: cols[85] || ''
		});
	}

	return rows;
}

function generateSitiosCode(rows: CSVRow[]): string {
	let code = `import type { Sitio } from '$lib/types';\n\n`;
	code += `// Auto-generated from SC CATCH-UP 2025 DATABANK - MSU - MASTER.csv\n`;
	code += `// Generated on: ${new Date().toISOString()}\n\n`;
	code += `export const csvSitiosData: Sitio[] = [\n`;

	let id = 1;
	for (const row of rows) {
		const lat = parseCoordinate(row.latitude);
		const lng = parseCoordinate(row.longitude);

		// Use default coordinates if not available (center of South Cotabato)
		const coordinates = {
			lat: lat || 6.3 + Math.random() * 0.3,
			lng: lng || 124.8 + Math.random() * 0.3
		};

		const male = parseNumber(row.male);
		const female = parseNumber(row.female);
		const total = parseNumber(row.total) || male + female;
		const age_0_14 = parseNumber(row.age_0_14);
		const age_15_64 = parseNumber(row.age_15_64);
		const age_65_above = parseNumber(row.age_65_above);
		const households = parseNumber(row.households);

		// Build water sources array
		const waterSources: string[] = [];
		if (row.water_source1) {
			const source = row.water_source1.trim();
			const condition = row.water_condition1 ? `, Condition: ${row.water_condition1.trim()}` : '';
			waterSources.push(`${source}${condition}`);
		}
		if (row.water_source2) {
			const source = row.water_source2.trim();
			const condition = row.water_condition2 ? `, Condition: ${row.water_condition2.trim()}` : '';
			waterSources.push(`${source}${condition}`);
		}
		if (row.water_source3) {
			const source = row.water_source3.trim();
			const condition = row.water_condition3 ? `, Condition: ${row.water_condition3.trim()}` : '';
			waterSources.push(`${source}${condition}`);
		}

		// Build toilet facility types
		const toiletTypes: string[] = [];
		if (parseBoolean(row.toilet_open_pit)) toiletTypes.push('Open Pit');
		if (parseBoolean(row.toilet_closed_pit)) toiletTypes.push('Closed Pit');
		if (parseBoolean(row.toilet_overhang)) toiletTypes.push('Overhang/Drop Type');
		if (parseBoolean(row.toilet_water_sealed)) toiletTypes.push('Water Sealed');

		// Build housing quality types
		const housingQuality: string[] = [];
		if (parseBoolean(row.house_concrete)) housingQuality.push('Concrete');
		if (parseBoolean(row.house_wood)) housingQuality.push('Wood');
		if (parseBoolean(row.house_half_conc)) housingQuality.push('Half-Concrete');
		if (parseBoolean(row.house_makeshift)) housingQuality.push('Makeshift');
		if (parseBoolean(row.house_others)) housingQuality.push('Others');

		// Build ownership types
		const ownershipTypes: string[] = [];
		if (parseBoolean(row.house_owned)) ownershipTypes.push('Owned');
		if (parseBoolean(row.house_rented)) ownershipTypes.push('Rented');
		if (parseBoolean(row.house_prot_land)) ownershipTypes.push('Protected Land');
		if (parseBoolean(row.house_informal)) ownershipTypes.push('Informal Settler');
		if (parseBoolean(row.house_owner_consent)) ownershipTypes.push('Owner Consent');

		// Build info dissemination methods
		const infoMethods: string[] = [];
		if (parseBoolean(row.info_radio)) infoMethods.push('Radio');
		if (parseBoolean(row.info_signages)) infoMethods.push('Signages');
		if (parseBoolean(row.info_person_auth)) infoMethods.push('Person in Authority');
		if (parseBoolean(row.info_assembly)) infoMethods.push('Assembly');
		if (parseBoolean(row.info_newspaper)) infoMethods.push('Newspaper');
		if (parseBoolean(row.info_tv)) infoMethods.push('TV');
		if (parseBoolean(row.info_internet)) infoMethods.push('Internet/Social Media');

		// Build transportation methods
		const transportMethods: string[] = [];
		if (parseBoolean(row.transport_bike)) transportMethods.push('Bike');
		if (parseBoolean(row.transport_motor)) transportMethods.push('Motorcycle');
		if (parseBoolean(row.transport_tricycle)) transportMethods.push('Tricycle');
		if (parseBoolean(row.transport_4wheels)) transportMethods.push('4-Wheels');
		if (parseBoolean(row.transport_boat)) transportMethods.push('Boat');

		// Build alternative electricity sources
		const altElectricity: string[] = [];
		if (parseBoolean(row.alt_generator)) altElectricity.push('Generator');
		if (parseBoolean(row.alt_solar)) altElectricity.push('Solar');
		if (parseBoolean(row.alt_battery)) altElectricity.push('Battery');

		// Build garden commodities
		const gardenCommodities: string[] = [];
		if (parseBoolean(row.garden_veg)) gardenCommodities.push('Vegetables');
		if (parseBoolean(row.garden_root)) gardenCommodities.push('Root Crops');
		if (parseBoolean(row.garden_fruit)) gardenCommodities.push('Fruits');

		code += `\t{\n`;
		code += `\t\tid: ${id},\n`;
		code += `\t\tname: ${JSON.stringify(row.sitio)},\n`;
		code += `\t\tmunicipality: ${JSON.stringify(row.municipality)},\n`;
		code += `\t\tbarangay: ${JSON.stringify(row.barangay)},\n`;
		code += `\t\tprovince: 'South Cotabato',\n`;
		code += `\t\tpopulation: ${total},\n`;
		code += `\t\thouseholds: ${households},\n`;
		code += `\t\tcoordinates: {\n`;
		code += `\t\t\tlat: ${coordinates.lat},\n`;
		code += `\t\t\tlng: ${coordinates.lng}\n`;
		code += `\t\t},\n`;

		if (row.coding) {
			code += `\t\tcoding: {\n`;
			code += `\t\t\tnumber: ${JSON.stringify(row.no)},\n`;
			code += `\t\t\tcode: ${JSON.stringify(row.coding)}\n`;
			code += `\t\t},\n`;
		}

		code += `\t\tdemographics: {\n`;
		code += `\t\t\tmale: ${male},\n`;
		code += `\t\t\tfemale: ${female},\n`;
		code += `\t\t\ttotal: ${total},\n`;
		code += `\t\t\tage_0_14: ${age_0_14},\n`;
		code += `\t\t\tage_15_64: ${age_15_64},\n`;
		code += `\t\t\tage_65_above: ${age_65_above}\n`;
		code += `\t\t},\n`;

		// Social services
		if (row.registered_voters || row.philhealth || row.fourps) {
			code += `\t\tsocial_services: {\n`;
			code += `\t\t\tregistered_voters: ${parseNumber(row.registered_voters)},\n`;
			code += `\t\t\tphilhealth_beneficiaries: ${parseNumber(row.philhealth)},\n`;
			code += `\t\t\tfourps_beneficiaries: ${parseNumber(row.fourps)}\n`;
			code += `\t\t},\n`;
		}

		// Economic condition
		const employments = parseArray([row.employment1, row.employment2, row.employment3]);
		const incomes = parseArray([row.income1, row.income2, row.income3]);
		if (employments.length > 0 || incomes.length > 0) {
			code += `\t\teconomic_condition: {\n`;
			code += `\t\t\ttop_employments: ${JSON.stringify(employments)},\n`;
			code += `\t\t\ttop_income_brackets: ${JSON.stringify(incomes)}\n`;
			code += `\t\t},\n`;
		}

		// Agriculture
		const crops = parseArray([row.crop1, row.crop2, row.crop3, row.crop4, row.crop5]);
		if (row.farmers || row.farmer_assoc || row.farm_area || crops.length > 0) {
			code += `\t\tagriculture: {\n`;
			code += `\t\t\tfarmers_count: ${parseNumber(row.farmers)},\n`;
			code += `\t\t\tfarmer_associations: ${parseNumber(row.farmer_assoc)},\n`;
			code += `\t\t\tfarm_area_hectares: ${parseNumber(row.farm_area)},\n`;
			code += `\t\t\ttop_crops: ${JSON.stringify(crops)}\n`;
			code += `\t\t},\n`;
		}

		// Water and sanitation
		if (
			waterSources.length > 0 ||
			row.no_toilet ||
			toiletTypes.length > 0 ||
			row.waste_segregation
		) {
			code += `\t\twater_sanitation: {\n`;
			code += `\t\t\twater_systems_count: ${parseNumber(row.water_systems)},\n`;
			code += `\t\t\twater_sources: ${JSON.stringify(waterSources.map((s) => ({ source: s })))},\n`;
			code += `\t\t\thouseholds_without_toilet: ${parseNumber(row.no_toilet)},\n`;
			code += `\t\t\ttoilet_facility_types: ${JSON.stringify(toiletTypes)},\n`;
			code += `\t\t\twaste_segregation_practice: ${parseBoolean(row.waste_segregation)}\n`;
			code += `\t\t},\n`;
		}

		// Livestock and poultry (now as string array)
		const livestockTypes: string[] = [];
		if (parseNumber(row.pig) > 0) livestockTypes.push('Pigs');
		if (parseNumber(row.cow) > 0) livestockTypes.push('Cows');
		if (parseNumber(row.kalabaw) > 0) livestockTypes.push('Carabaos');
		if (parseNumber(row.horse) > 0) livestockTypes.push('Horses');
		if (parseNumber(row.goat) > 0) livestockTypes.push('Goats');
		if (parseNumber(row.chicken) > 0) livestockTypes.push('Chickens');
		if (parseNumber(row.ducks) > 0) livestockTypes.push('Ducks');

		if (livestockTypes.length > 0) {
			code += `\t\tlivestock_poultry: ${JSON.stringify(livestockTypes)},\n`;
		}

		// Food security
		if (row.backyard_garden || gardenCommodities.length > 0) {
			code += `\t\tfood_security: {\n`;
			code += `\t\t\thouseholds_with_backyard_garden: ${parseNumber(row.backyard_garden)},\n`;
			code += `\t\t\tcommon_garden_commodities: ${JSON.stringify(gardenCommodities)}\n`;
			code += `\t\t},\n`;
		}

		// Housing
		if (housingQuality.length > 0 || ownershipTypes.length > 0) {
			code += `\t\thousing: {\n`;
			code += `\t\t\tquality_types: ${JSON.stringify(housingQuality)},\n`;
			code += `\t\t\townership_types: ${JSON.stringify(ownershipTypes)}\n`;
			code += `\t\t},\n`;
		}

		// Domestic animals
		const dogs = parseNumber(row.dogs);
		const cats = parseNumber(row.cats);
		const dogsVaccinated = parseNumber(row.dogs_vaccinated);
		const catsVaccinated = parseNumber(row.cats_vaccinated);
		if (dogs > 0 || cats > 0) {
			code += `\t\tdomestic_animals: {\n`;
			code += `\t\t\ttotal_count: ${dogs + cats},\n`;
			code += `\t\t\tdogs: ${dogs},\n`;
			code += `\t\t\tcats: ${cats},\n`;
			code += `\t\t\tdogs_vaccinated: ${dogsVaccinated},\n`;
			code += `\t\t\tcats_vaccinated: ${catsVaccinated}\n`;
			code += `\t\t},\n`;
		}

		// Community empowerment
		if (row.sectoral_orgs || infoMethods.length > 0 || transportMethods.length > 0) {
			code += `\t\tcommunity_empowerment: {\n`;
			code += `\t\t\tsectoral_organizations: ${parseNumber(row.sectoral_orgs)},\n`;
			code += `\t\t\tinfo_dissemination_methods: ${JSON.stringify(infoMethods)},\n`;
			code += `\t\t\ttransportation_methods: ${JSON.stringify(transportMethods)}\n`;
			code += `\t\t},\n`;
		}

		// Utilities
		if (row.electricity || altElectricity.length > 0) {
			code += `\t\tutilities: {\n`;
			code += `\t\t\thouseholds_with_electricity: ${parseNumber(row.electricity)},\n`;
			code += `\t\t\talternative_electricity_sources: ${JSON.stringify(altElectricity)}\n`;
			code += `\t\t},\n`;
		}

		code += `\t\tcreated_at: '2025-01-01',\n`;
		code += `\t\tupdated_at: '2025-01-01'\n`;
		code += `\t}${id < rows.length ? ',' : ''}\n`;

		id++;
	}

	code += `];\n`;

	return code;
}

// Main execution
const csvPath = join(process.cwd(), 'docs', 'SC CATCH-UP 2025 DATABANK - MSU - MASTER.csv');
const outputPath = join(process.cwd(), 'src', 'lib', 'mock-data', 'csv-sitios.ts');

console.log('Parsing CSV from:', csvPath);
const rows = parseCSV(csvPath);
console.log(`Found ${rows.length} sitios with data`);

const code = generateSitiosCode(rows);
writeFileSync(outputPath, code, 'utf-8');
console.log('Generated sitios data at:', outputPath);
console.log('Done!');
