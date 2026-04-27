const loadImage = (url) => {
  const img = new Image();
  const result = new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = (event) => reject(event);
  });
  img.src = url;
  return result;
}
const processImage = async (url) => {
  const img = await loadImage(url);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0);
  const data = context.getImageData(0, 0, img.width, img.height);
  const unique = {};
  const order = [];
  for (let i = 0; i < data.data.byteLength; i += 4) {
    const input = `#${data.data[i].toString(16).padStart(2, 0)}${data.data[i + 1].toString(16).padStart(2, 0)}${data.data[i + 2].toString(16).padStart(2, 0)}`;
    const color = (
      ((data.data[i] >> 3) & 0x1F)
      | (((data.data[i + 1] >> 3) & 0x1F) << 5)
      | (((data.data[i + 2] >> 3) & 0x1F) << 10)
    ).toString(16).padStart(4, 0);
    const x = (i >> 2) % img.width;
    const y = ((i >> 2) / img.width)|0;
    
    if (!unique[color]) {
      unique[color] = [1, [[x, y]]];
      order.push(color);
    } else {
      unique[color][0]++;
      unique[color][1].push([x, y]);
    }
  }
  let output = [];
  let topLine = [];
  for (const snesColor of order) {
    const chars = [...snesColor];
    topLine.push(chars[2], chars[3], chars[0], chars[1]);
  }
  output.push(`<li>${topLine.join('')}</li>`);
  for (const snesColor of order) {
    const c555 = parseInt(snesColor, 16);
    const C85 = 255/31;
    const cHex = '#' + 
    (((c555 & 0x1F) * C85)|0).toString(16).padStart(2, 0) + 
    ((((c555 >> 5) & 0x1F) * C85)|0).toString(16).padStart(2, 0) +
    ((((c555 >> 10) & 0x1F) * C85)|0).toString(16).padStart(2, 0);
    
    output.push(
      `<li><span style="background-color: ${cHex}" class="swatch"></span>&nbsp;${snesColor}</li>`
    );
    document.querySelector('.results').innerHTML = '<ul>' + output.join('\n') + '</ul>';
  }
};

const onPaste = (event) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  for (const item of items) {
    if (item.type.startsWith('image/') && item.kind === 'file') {
      const blob = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (event) => {
        processImage(event.target.result);
      };
      reader.readAsDataURL(blob);
    }
  }
};

document.addEventListener('paste', onPaste);
