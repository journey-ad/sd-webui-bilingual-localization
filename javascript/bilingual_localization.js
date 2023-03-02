(function () {
  const customCSS = `
    .bilingual__trans_wrapper {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      font-size: 13px;
      line-height: 1;
    }
    
    .bilingual__trans_wrapper em {
      font-style: normal;
    }

    fieldset span.text-gray-500:has(.bilingual__trans_wrapper),
    .gr-block.gr-box span.text-gray-500:has(.bilingual__trans_wrapper),
    label.block span:has(.bilingual__trans_wrapper) {
      top: -0.8em;
      line-height: 1;
    }

    #txtimg_hr_finalres .bilingual__trans_wrapper em,
    #tab_ti .output-html .bilingual__trans_wrapper em,
    #available_extensions .extension-tag .bilingual__trans_wrapper em {
      display: none;
    }
    
    #settings .bilingual__trans_wrapper:not(#settings .tabitem .bilingual__trans_wrapper),
    label>span>.bilingual__trans_wrapper,
    .w-full>span>.bilingual__trans_wrapper,
    .output-html .bilingual__trans_wrapper:not(th .bilingual__trans_wrapper) {
      font-size: 12px;
      align-items: flex-start;
    }

    #extensions label .bilingual__trans_wrapper,
    #available_extensions td .bilingual__trans_wrapper {
      font-size: inherit;
      line-height: inherit;
    }
    
    textarea::placeholder {
      line-height: 1;
      padding: 4px 0;
    }
    
    label>span {
      line-height: 1;
    }
    
    div[data-testid="image"]>div>div.touch-none>div {
      background-color: rgba(255, 255, 255, .6);
      color: #222;
    }`

  let i18n = null, config = null;

  // First load
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

    translatePage()
  }

  // Translate page
  function translatePage() {
    if (!i18n) return

    querySelectorAll([
      "label span, fieldset span, button", // major label and button description text
      "textarea[placeholder], select[title], option", // text box placeholder and select element
      ".transition > div > span:not([class])", // collapse panel added by extension
      ".tabitem .pointer-events-none", // upper left corner of image upload panel
      ".output-html:not(#footer)", // output html exclude footer
      "#lightboxModal span" // image preview lightbox
    ])
      .forEach(el => translateEl(el, { deep: true }))

    querySelectorAll([
      'div[data-testid="image"] > div > div', // description of image upload panel
      '#extras_image_batch > div', //  description of extras image batch file upload panel
    ])
      .forEach(el => translateEl(el, { rich: true }))
  }

  // Translate element
  function translateEl(el, { deep = false, rich = false } = {}) {
    if (!i18n) return
    if (el.className === 'bilingual__trans_wrapper') return

    if (el.tagName === 'OPTION') {
      doTranslate(el, el.textContent, 'option')
    } else {
      doTranslate(el, el.textContent, 'element')
    }

    Array.from(el.childNodes).forEach(node => {
      if (node.nodeName === '#text') {
        if (rich) {
          doTranslate(node, node.textContent, 'text')
          return
        }

        if (deep) {
          doTranslate(node, node.textContent, 'element')
        }
      } else if (node.childNodes.length > 0) {
        translateEl(node, { deep, rich })
      }
    })

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
      case 'text':
        el.textContent = translation
        break;

      case 'element':
        const htmlStr = `<div class="bilingual__trans_wrapper">${htmlEncode(translation)}<em>${htmlEncode(source)}</em></div>`
        const htmlEl = parseHtmlStringToElement(htmlStr)
        if (el.hasChildNodes()) {
          const textNode = Array.from(el.childNodes).find(node => node.nodeName === '#text' && node.textContent.trim() === source)

          textNode && textNode.replaceWith(htmlEl)
        } else {
          el.replaceWith(htmlEl)
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

  function parseHtmlStringToElement(htmlStr) {
    const template = document.createElement('template')
    template.insertAdjacentHTML('afterbegin', htmlStr)
    return template.firstElementChild
  }

  function htmlEncode(htmlStr) {
    return htmlStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
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
    onUiUpdate((m) => {
      if (Object.keys(localization).length) return; // disabled if original translation enabled
      if (Object.keys(opts).length === 0) return; // does nothing if opts is not loaded

      m.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.className === 'output-html') {
            translateEl(node, { rich: true })
          } else {
            translateEl(node, { deep: true })
          }
        })
      })

      if (loaded) return;
      if (i18n) return;

      loaded = true
      setup()
    })
  }

  // Init after page loaded
  document.addEventListener('DOMContentLoaded', init)
})();
