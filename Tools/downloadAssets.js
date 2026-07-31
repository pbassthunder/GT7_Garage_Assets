

const fs = require('fs');
const path = require('path');

function countPngFiles(dir) {
  if (!fs.existsSync(dir)) return 0;

  return fs.readdirSync(dir)
    .filter(file => file.toLowerCase().endsWith('.png'))
    .length;
}

async function downloadFile(id, url, outputDir) {
  const outputFile = path.join(outputDir, `${id}.png`);

  if (fs.existsSync(outputFile)) {
    console.log(`${id}.png already exists.`);
    return;
  }

  console.log(`Downloading ${id}.png...`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputFile, Buffer.from(arrayBuffer));

  console.log(`Saved ${outputFile}`);
}

async function downloadUniqueLogos(catalog, logosDir) {
  const logos = new Map();

  for (const car of catalog) {
    if (!logos.has(car.logoID)) {
      logos.set(car.logoID, car.logoURL);
    }
  }

  console.log(`\nDownloading ${logos.size} unique logos...\n`);

  let index = 1;

  for (const [logoID, logoURL] of logos) {
    console.log(`[${index}/${logos.size}] ${logoID}`);
    await downloadFile(logoID, logoURL, logosDir);
    index++;
  }
}

async function downloadCars(catalog, carsDir) {
  console.log(`\nDownloading ${catalog.length} car thumbnails...\n`);

  let index = 1;

  for (const car of catalog) {
    console.log(`[${index}/${catalog.length}] ${car.gtID}`);
    await downloadFile(
      car.gtID,
      car.imageURL,
      carsDir
    );
    index++;
  }
}

console.log('GT7 Asset Downloader v0.1\n');
console.log('Reading catalog...');

const catalogDir = path.join(__dirname, '..', 'Catalog');

const candidates = [
  'GTCatalog.json',
  'GTCatalog (3).json'
];

const catalogPath = candidates
  .map(name => path.join(catalogDir, name))
  .find(fs.existsSync);

if (!catalogPath) {
  throw new Error(`No GTCatalog JSON found in ${catalogDir}`);
}

(async () => {
try {
  const json = fs.readFileSync(catalogPath, 'utf8');
  const catalog = JSON.parse(json);

  const carCount = catalog.length;
  const logoCount = new Set(catalog.map(car => car.logoID)).size;

  const carsDir = path.join(__dirname, '..', 'Cars');
  const logosDir = path.join(__dirname, '..', 'Logos');

  const downloadedCars = countPngFiles(carsDir);
  const downloadedLogos = countPngFiles(logosDir);

  console.log('Catalog loaded.\n');

  console.log(`Cars in catalog : ${carCount}`);
  console.log(`Cars on disk    : ${downloadedCars}`);
  console.log(`Missing cars    : ${carCount - downloadedCars}`);

  console.log('');

  console.log(`Logos in catalog: ${logoCount}`);
  console.log(`Logos on disk   : ${downloadedLogos}`);
  console.log(`Missing logos   : ${logoCount - downloadedLogos}`);

  console.log('\nReady.');

  await downloadUniqueLogos(catalog, logosDir);
  await downloadCars(catalog, carsDir);
} catch (err) {
  console.error('Failed to load catalog.');
  console.error(err.message);
  process.exit(1);
}
})();