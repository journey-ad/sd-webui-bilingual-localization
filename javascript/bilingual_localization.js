(function () {
  const customCSS = `
    .bilingual__trans_wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 12px;
      line-height: 1;
    }
    
    .bilingual__trans_wrapper em {
      font-size: 12px;
      font-style: normal;
    }
    
    .custom_ui__prompt_trans {
      font-size: 12px;
    }
    
    #settings .bilingual__trans_wrapper,
    label>span>.bilingual__trans_wrapper,
    .w-full>span>.bilingual__trans_wrapper {
      align-items: flex-start;
    }
    
    textarea::placeholder {
      font-size: 12px;
      line-height: 1;
      padding: 5px 0;
    }
    
    label>span {
      line-height: 1;
    }
    
    div[data-testid="image"]>div>div.touch-none>div {
      background-color: rgba(255, 255, 255, .6);
      color: #222;
    }`

  let i18n = null, config = null;

  function setup() {
    config = {
      enabled: opts["bilingual_localization_enabled"],
      file: opts["bilingual_localization_file"],
      dirs: opts["bilingual_localization_dirs"],
      order: opts["bilingual_localization_order"]
    }

    let { enabled, file, dirs } = config

    if (!enabled || file === "None" || dirs === "None") return

    dirs = JSON.parse(dirs)

    // Load localization file
    i18n = JSON.parse(readFile(dirs[file]))
  }

  // Translate page
  function translatePage() {
    if (!i18n) return

    querySelectorAll(`
      label span, fieldset span, thead th, th span, button, 
      textarea[placeholder], select[title], option,
      .transition > div > span:not([class]),
      .tabitem .pointer-events-none,
      .output-html, #lightboxModal span
    `)
      .forEach(el => translateEl(el))

    querySelectorAll(`
      .output-html:not(#footer) p,
      .output-html tabel:not(#extensions),
      div[data-testid="image"] > div > div,
      #extras_image_batch > div,
      .extension-tag
    `)
      .forEach(el => translateEl(el, true))
  }

  // Translate element
  function translateEl(el, deep) {
    if (el.className === 'bilingual__trans_wrapper') return

    if (deep) {
      Array.from(el.childNodes).forEach(node => {
        if (node.nodeName === '#text') {
          doTranslate(node, node.textContent, 'node')
        } else if (node.childNodes.length > 0) {
          translateEl(node, true)
        }
      })
      return
    }

    if (el.textContent && el.tagName !== 'SELECT') {
      if (el.tagName === 'OPTION') {
        doTranslate(el, el.textContent, 'option')
      } else {
        doTranslate(el, el.textContent, 'element')
      }
    }

    if (el.title) {
      doTranslate(el, el.title, 'title')
    }

    if (el.placeholder) {
      doTranslate(el, el.placeholder, 'placeholder')
    }
  }

  function doTranslate(el, source, type) {
    source = source.trim()
    if (!source) return

    let translation = i18n[source]
    if (!translation) return
    if (source === translation) return

    if (config.order === "Original First") {
      [source, translation] = [translation, source]
    }

    switch (type) {
      case 'node':
        el.textContent = translation
        break;

      case 'element':
        if (el.childNodes.length === 1 || !el.classList.contains('pointer-events-none')) {
          el.innerHTML = `<div class="bilingual__trans_wrapper"><em>${translation}</em>${source}</div>`
        } else {
          const textNode = Array.from(el.childNodes).find(node => node.nodeName === '#text' && node.textContent.trim() === source)

          textNode && (textNode.textContent = `${translation} (${source})`)
        }
        break;

      case 'option':
        el.textContent = `${translation} (${source})`
        break;

      case 'title':
        el.title = `${translation}\n${source}`
        break;

      case 'placeholder':
        el.placeholder = `${translation}\n\n${source}`
        break;
    }
  }

  function querySelector(...args) {
    return gradioApp()?.querySelector(...args)
  }

  function querySelectorAll(...args) {
    return gradioApp()?.querySelectorAll(...args)
  }

  // Load file
  function readFile(filePath) {
    let request = new XMLHttpRequest();
    request.open("GET", `file=${filePath}`, false);
    request.send(null);
    return request.responseText;
  }

  function init() {
    // Add style to dom
    let $styleEL = document.createElement('style');

    if ($styleEL.styleSheet) {
      $styleEL.styleSheet.cssText = customCSS;
    } else {
      $styleEL.appendChild(document.createTextNode(customCSS));
    }
    gradioApp().appendChild($styleEL);

    let loaded = false
    onUiUpdate(() => {
      translatePage()

      if (loaded) return
      if (Object.keys(localization).length) return
      if (Object.keys(opts).length === 0) return;
      if (i18n) return;

      loaded = true
      setup()
    })
  }

  // Init after page loaded
  document.addEventListener('DOMContentLoaded', init)
})();
