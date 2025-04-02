const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Define icon sizes for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Input SVG file path
const inputSvg = path.join(__dirname, 'client/public/icons/icon-512x512.svg');

// Create maskable icon for PWA (with padding)
async function generateMaskableIcon() {
  try {
    // Create a square background image with padding for maskable icon
    const buffer = await sharp(inputSvg)
      .resize(192, 192)
      .toBuffer();
    
    await sharp(buffer)
      .toFile(path.join(__dirname, 'client/public/icons/maskable-icon.png'));
    
    console.log('Generated maskable icon');
  } catch (err) {
    console.error('Error generating maskable icon:', err);
  }
}

// Generate all the different size icons for PWA
async function generateIcons() {
  try {
    if (!fs.existsSync(inputSvg)) {
      console.error('SVG file not found:', inputSvg);
      return;
    }

    // Make sure the output directory exists
    const outputDir = path.join(__dirname, 'client/public/icons');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate each size
    for (const size of sizes) {
      await sharp(inputSvg)
        .resize(size, size)
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      
      console.log(`Generated ${size}x${size} icon`);
    }

    // Also generate the maskable icon
    await generateMaskableIcon();
    
    console.log('All icons generated!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

// Run the icon generation
generateIcons();