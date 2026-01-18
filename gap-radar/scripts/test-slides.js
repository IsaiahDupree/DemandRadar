/**
 * Manual test script for slide generation
 * Run with: node scripts/test-slides.js
 */

const PptxGenJS = require('pptxgenjs');

async function testSlideGeneration() {
  console.log('Testing slide deck generation...');

  try {
    const pptx = new PptxGenJS();

    // Set metadata
    pptx.author = 'GapRadar';
    pptx.title = 'Test Presentation';

    // Add a simple test slide
    const slide = pptx.addSlide();
    slide.addText('Test Slide', {
      x: 1,
      y: 1,
      w: 8,
      h: 1,
      fontSize: 32,
      bold: true,
    });

    // Generate buffer
    const buffer = await pptx.write({ outputType: 'nodebuffer' });

    // Verify
    if (!buffer || buffer.length === 0) {
      throw new Error('Generated buffer is empty');
    }

    const signature = buffer.toString('hex', 0, 4);
    if (signature !== '504b0304') {
      throw new Error(`Invalid PPTX signature: ${signature}`);
    }

    console.log('✅ Slide deck generated successfully');
    console.log(`   Buffer size: ${buffer.length} bytes`);
    console.log(`   Signature: ${signature} (valid ZIP/PPTX)`);

    return true;
  } catch (error) {
    console.error('❌ Slide generation failed:', error);
    return false;
  }
}

testSlideGeneration()
  .then((success) => process.exit(success ? 0 : 1))
  .catch(() => process.exit(1));
