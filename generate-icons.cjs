const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SPLASH_SIZES = [
  { width: 640, height: 1136 },
  { width: 750, height: 1334 },
  { width: 1125, height: 2436 },
  { width: 1242, height: 2208 },
  { width: 1536, height: 2048 },
  { width: 1668, height: 2224 },
  { width: 2048, height: 2732 },
];

async function generateAppIcon() {
  const iconDir = path.join(__dirname, 'client/public/icons');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }
  
  // Generate a basic SVG icon with the app's primary color
  const svgIcon = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="128" fill="#1A73E8" />
    <circle cx="256" cy="256" r="150" fill="white" />
    <text x="256" y="256" font-family="Arial, sans-serif" font-size="180" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#1A73E8">₹</text>
  </svg>`;
  
  // Save the SVG as a temporary file
  const tempSvgPath = path.join(iconDir, 'temp-icon.svg');
  fs.writeFileSync(tempSvgPath, svgIcon);
  
  // Generate all icon sizes
  for (const size of ICON_SIZES) {
    await sharp(tempSvgPath)
      .resize(size, size)
      .png()
      .toFile(path.join(iconDir, `icon-${size}x${size}.png`));
    
    console.log(`Generated ${size}x${size} icon`);
  }
  
  // Generate app icon shortcuts
  // Create simplified shortcut icons
  const addIconSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="128" fill="#1A73E8" />
    <circle cx="256" cy="256" r="150" fill="white" />
    <text x="256" y="275" font-family="Arial, sans-serif" font-size="220" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#1A73E8">+</text>
  </svg>`;

  const analyticsIconSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="128" fill="#1A73E8" />
    <circle cx="256" cy="256" r="150" fill="white" />
    <path d="M180 330V230h40v100h-40zm60 0V180h40v150h-40zm60 0V280h40v50h-40z" fill="#1A73E8" stroke="#1A73E8" stroke-width="8"/>
  </svg>`;
  
  const addIconPath = path.join(iconDir, 'temp-add-icon.svg');
  const analyticsIconPath = path.join(iconDir, 'temp-analytics-icon.svg');
  
  fs.writeFileSync(addIconPath, addIconSvg);
  fs.writeFileSync(analyticsIconPath, analyticsIconSvg);
  
  await sharp(addIconPath)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconDir, 'add-transaction.png'));
  
  await sharp(analyticsIconPath)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconDir, 'analytics.png'));
    
  // Delete temporary files
  fs.unlinkSync(addIconPath);
  fs.unlinkSync(analyticsIconPath);
  
  // Generate splash screens for iOS
  for (const { width, height } of SPLASH_SIZES) {
    // Create a new splash screen with center icon
    const splashSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#1A73E8" />
      <svg x="${width/2 - 128}" y="${height/2 - 128}" width="256" height="256">
        <circle cx="128" cy="128" r="120" fill="white" />
        <text x="128" y="128" font-family="Arial, sans-serif" font-size="140" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#1A73E8">₹</text>
      </svg>
    </svg>`;
    
    const splashPath = path.join(iconDir, `temp-splash-${width}x${height}.svg`);
    fs.writeFileSync(splashPath, splashSvg);
    
    await sharp(splashPath)
      .png()
      .toFile(path.join(iconDir, `splash-${width}x${height}.png`));
    
    // Delete temporary file
    fs.unlinkSync(splashPath);
    
    console.log(`Generated ${width}x${height} splash screen`);
  }
  
  // Delete the temporary SVG file
  fs.unlinkSync(tempSvgPath);
  
  console.log('All icons generated successfully!');
}

generateAppIcon().catch(console.error);