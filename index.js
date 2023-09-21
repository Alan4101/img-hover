const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    view: document.getElementById("canvas"),
    backgroundColor: "transparent", // Задайте бажаний колір фону
  });

  // Створення текстури для шейдера (замість iChannel0)
  const texture = PIXI.Texture.from("https://source.unsplash.com/random/500x500"); // Замініть шлях на свій
  texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
  // Створення спрайта з текстурою
  const sprite = new PIXI.Sprite(texture);
  const canvas = document.getElementById("canvas")

  sprite.width = canvas.width;
  sprite.height = canvas.height;
  app.stage.addChild(sprite);
  // Створення shader
  const shaderCode = `
  #ifdef GL_ES
  precision mediump float;
  #endif
  // Uniforms from Javascript
  uniform vec2 uResolution;
  uniform float uPointerDown;
  // The texture is defined by PixiJS
  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  uniform float iTime; 
  // Function used to get the distortion effect
  vec2 computeUV (vec2 uv, float k, float kcube) {
    vec2 t = uv - 0.5;
    float r2 = t.x * t.x + t.y * t.y;
    float f = 0.0;
    if (kcube == 0.0) {
      f = 1.0 + r2 * k;
    } else {
      f = 1.0 + r2 * (k + kcube * sqrt(r2));
    }
    vec2 nUv = f * t + 0.5;
    nUv.y = 1.0 - nUv.y;
    return nUv;
  }
  void main () {
    // Normalized coordinates
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    
    float k = -1.0 * sin(uPointerDown * 0.9);
    float kcube = 0.5 * sin(uPointerDown);
    float offset = 0.02 * sin(uPointerDown * 0.5);
    
    float red = texture2D( uSampler, computeUV( uv, k + offset, kcube ) ).r; 
    float green = texture2D( uSampler, computeUV( uv, k, kcube ) ).g; 
    float blue = texture2D( uSampler, computeUV( uv, k - offset, kcube ) ).b; 
    
    gl_FragColor = vec4( red, green,blue, 1.0 );
  }
  `;

  // Set dimensions
  function initDimensions() {
    width = window.innerWidth;
    height = window.innerHeight;
    diffX = 0;
    diffY = 0;
  }
  let pointerDownTarget = 0;
  let pointerStart = new PIXI.Point();
  let pointerDiffStart = new PIXI.Point();
  let diffY, diffX, widthRest, heightRest, container;

  const uniforms = {
    uResolution: new PIXI.Point(app.screen.width, app.screen.height),
    uPointerDiff: new PIXI.Point(),
    uPointerDown: pointerDownTarget,
  };
  const shader = new PIXI.Filter(null, shaderCode, uniforms);
  app.stage.filters = [shader];

  // Додавання обробників подій для ефекту hover
  sprite.interactive = true;
  const onPointerOver = () => {
    // Зміна параметрів шейдера при наведенні курсору
    shader.uniforms.iTime = 0.0; // Скидаємо час до початкового значення
  };
  const onPointerpointerMove = (event) => {
    // Оновлення часу шейдера при русі курсору
    console.log("herre");
    shader.uniforms.iTime += 0.01 * event.data.deltaX; // Зміна швидкості може бути налаштована
  };
  // On pointer down, save coordinates and set pointerDownTarget
  function onPointerDown(e) {
    console.log("onPointerDown");
    const { x, y } = e.data.global;
    pointerDownTarget = 1;
    pointerStart.set(x, y);
    pointerDiffStart = uniforms.uPointerDiff.clone();
  }
  // On pointer up, set pointerDownTarget
  function onPointerUp() {
    console.log("onPointerUp");
    pointerDownTarget = 0;
  }
  // On pointer move, calculate coordinates diff
  function onPointerMove(e) {
    console.log("onPointerMove");
    const { x, y } = e.data.global;
    if (pointerDownTarget) {
      diffX = pointerDiffStart.x + (x - pointerStart.x);
      diffY = pointerDiffStart.y + (y - pointerStart.y);
      diffX = diffX > 0 ? diffX : diffX;
      diffY = diffY > 0 ? diffY : diffY;
    }
  }
  function initEvents() {
    // Make stage interactive, so it can listen to events
    app.stage.interactive = true;
    // Pointer & touch events are normalized into
    // the `pointer*` events for handling different events
    app.stage
      // .on("pointerdown", onPointerDown)
      .on("pointerenter", onPointerDown)
      .on("pointerup", onPointerUp)
      .on("pointerupoutside", onPointerUp)
      .on("pointerleave", onPointerUp)
      .on("pointermove", onPointerMove);
  }
  function initContainer() {
    container = new PIXI.Container();
    app.stage.addChild(container);
  }
  initDimensions();
  initEvents();
  initContainer();
  // Запуск анімації
  app.ticker.add(() => {
    // Оновлення PixiJS
    uniforms.uPointerDown += (pointerDownTarget - uniforms.uPointerDown) * 0.075;
    uniforms.uPointerDiff.x += (diffX - uniforms.uPointerDiff.x) * 0.2;
    uniforms.uPointerDiff.y += (diffY - uniforms.uPointerDiff.y) * 0.2;
  });

  // Clean the current Application
  function clean() {
    // Stop the current animation
    app.ticker.stop();
    // Remove event listeners
    app.stage
      .off("pointerdown", onPointerDown)
      .off("pointerup", onPointerUp)
      .off("pointerupoutside", onPointerUp)
      .off("pointermove", onPointerMove);
  } 
  