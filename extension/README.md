# Request Add Headers Extension

This Chrome extension allows users to add custom HTTP headers to outgoing requests.

## Icons

The extension includes an SVG source file (`images/icon.svg`) and placeholder PNG files in various sizes required by Chrome:
- 16x16 pixels (`images/icon16.png`)
- 48x48 pixels (`images/icon48.png`)
- 128x128 pixels (`images/icon128.png`)

### Converting SVG to PNG

Before loading the extension in Chrome, you need to convert the SVG to PNG files in the appropriate sizes. You can use tools like:

1. **Online converters**: 
   - [SVG to PNG Converter](https://svgtopng.com/)
   - [Cloudconvert](https://cloudconvert.com/svg-to-png)

2. **Command line tools**:
   - Using Inkscape: `inkscape icon.svg -w 16 -h 16 -o icon16.png`
   - Using ImageMagick: `convert -background none -resize 16x16 icon.svg icon16.png`

3. **Graphics software**:
   - Adobe Illustrator
   - Affinity Designer
   - GIMP with SVG import

Replace the placeholder PNG files with actual converted images to ensure the extension displays properly in Chrome.

## Features

- Add custom HTTP headers to all outgoing requests
- Specify which websites receive headers using regex patterns
- Edit and delete headers
- Visual indicator shows which headers are active on the current page
